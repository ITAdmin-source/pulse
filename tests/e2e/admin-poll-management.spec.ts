import { test, expect } from '@playwright/test'
import { AdminPage, AuthPage, PollPage, testData, testUtils } from './fixtures/e2e-helpers'

test.describe('Admin Poll Management', () => {
  let adminPage: AdminPage
  let authPage: AuthPage
  let pollPage: PollPage

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminPage(page)
    authPage = new AuthPage(page)
    pollPage = new PollPage(page)

    // Sign in as admin
    await page.goto('/')
    await authPage.signIn(testData.users.admin.email, testData.users.admin.password)
  })

  test('admin can create a new poll', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Create a new poll
    await adminPage.createPoll(testData.polls.basic)

    // Verify poll was created and is accessible
    await expect(page).toHaveURL(/\/poll\//)
    await expect(pollPage.questionHeading).toHaveText(testData.polls.basic.question)
    await expect(pollPage.descriptionText).toHaveText(testData.polls.basic.description!)
  })

  test('admin can create poll with auto-approve enabled', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Create auto-approve poll
    await adminPage.createPoll(testData.polls.autoApprove)

    // Navigate to the poll and add a statement
    await expect(page).toHaveURL(/\/poll\//)
    await pollPage.addStatement('This should be auto-approved')

    // Statement should appear immediately without approval needed
    await expect(page.getByText('This should be auto-approved')).toBeVisible()
    await testUtils.waitForToast(page, 'Statement added')
  })

  test('admin can create admin-only poll', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Create admin-only poll
    await adminPage.createPoll(testData.polls.adminOnly)

    // Verify that add statement button is not visible
    await expect(page).toHaveURL(/\/poll\//)
    await expect(pollPage.addStatementButton).not.toBeVisible()

    // Admin should still be able to add statements via admin interface
    await page.goto('/admin')
    await expect(adminPage.pollsList).toBeVisible()
  })

  test('admin can approve pending statements', async ({ page }) => {
    // First, create a poll that requires approval
    await adminPage.goToAdminDashboard()
    await adminPage.createPoll(testData.polls.basic)

    const pollUrl = page.url()

    // Sign out and add statement as regular user
    await authPage.signOut()
    await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

    await page.goto(pollUrl)
    await pollPage.addStatement('This needs approval')
    await testUtils.waitForToast(page, 'pending approval')

    // Sign back in as admin
    await authPage.signOut()
    await authPage.signIn(testData.users.admin.email, testData.users.admin.password)

    // Go to admin dashboard and approve the statement
    await adminPage.goToAdminDashboard()
    await expect(adminPage.pendingStatements).toBeVisible()

    await adminPage.approveStatement('This needs approval')

    // Verify statement is now visible on the poll
    await page.goto(pollUrl)
    await expect(page.getByText('This needs approval')).toBeVisible()
  })

  test('admin can reject pending statements', async ({ page }) => {
    // Create poll and add statement as user (similar setup to approve test)
    await adminPage.goToAdminDashboard()
    await adminPage.createPoll(testData.polls.basic)

    const pollUrl = page.url()

    // Add statement as regular user
    await authPage.signOut()
    await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

    await page.goto(pollUrl)
    await pollPage.addStatement('This will be rejected')
    await testUtils.waitForToast(page, 'pending approval')

    // Sign back in as admin and reject
    await authPage.signOut()
    await authPage.signIn(testData.users.admin.email, testData.users.admin.password)

    await adminPage.goToAdminDashboard()
    await adminPage.rejectStatement('This will be rejected')

    // Verify statement does not appear on poll
    await page.goto(pollUrl)
    await expect(page.getByText('This will be rejected')).not.toBeVisible()
  })

  test('admin can view poll analytics', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Find an existing poll with votes
    const pollRow = page.getByTestId('poll-row').first()
    const analyticsButton = pollRow.getByRole('button', { name: /analytics/i })

    await analyticsButton.click()

    // Verify analytics page loads
    await expect(page).toHaveURL(/\/admin\/polls\/.*\/analytics/)

    // Check for key analytics elements
    await expect(page.getByTestId('total-votes')).toBeVisible()
    await expect(page.getByTestId('total-participants')).toBeVisible()
    await expect(page.getByTestId('participation-rate')).toBeVisible()

    // Verify vote distribution charts
    await expect(page.getByTestId('vote-distribution-chart')).toBeVisible()
  })

  test('admin can change poll status', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Create a draft poll
    await adminPage.createPoll(testData.polls.basic)
    const pollUrl = page.url()

    // Navigate back to admin to publish the poll
    await page.goto('/admin')

    const pollRow = page.getByTestId('poll-row').filter({ hasText: testData.polls.basic.question })
    const publishButton = pollRow.getByRole('button', { name: /publish/i })

    await publishButton.click()

    // Confirm publication if confirmation dialog appears
    const confirmButton = page.getByRole('button', { name: /confirm/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // Verify poll status changed
    await expect(pollRow.getByText(/published/i)).toBeVisible()

    // Verify poll is now accessible to public
    await authPage.signOut()
    await page.goto(pollUrl)
    await expect(pollPage.questionHeading).toBeVisible()
  })

  test('admin can manage poll settings', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Find existing poll and go to settings
    const pollRow = page.getByTestId('poll-row').first()
    const settingsButton = pollRow.getByRole('button', { name: /settings/i })

    await settingsButton.click()

    // Verify settings page loads
    await expect(page).toHaveURL(/\/admin\/polls\/.*\/settings/)

    // Test changing voting threshold
    const thresholdInput = page.getByLabel(/minimum statements/i)
    await thresholdInput.fill('7')

    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.click()

    // Verify settings were saved
    await testUtils.waitForToast(page, 'Settings saved')

    // Verify the change persists
    await page.reload()
    await expect(thresholdInput).toHaveValue('7')
  })

  test('admin can bulk approve statements', async ({ page }) => {
    // Set up multiple pending statements
    await adminPage.goToAdminDashboard()
    await adminPage.createPoll(testData.polls.basic)
    const pollUrl = page.url()

    // Add multiple statements as different users
    const statements = ['Statement 1', 'Statement 2', 'Statement 3']

    for (const statement of statements) {
      // Sign out and add statement as regular user
      await authPage.signOut()
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      await page.goto(pollUrl)
      await pollPage.addStatement(statement)
      await testUtils.waitForToast(page, 'pending approval')

      // Sign back in as admin
      await authPage.signOut()
      await authPage.signIn(testData.users.admin.email, testData.users.admin.password)
    }

    // Go to admin dashboard
    await adminPage.goToAdminDashboard()

    // Select all pending statements
    const selectAllCheckbox = page.getByTestId('select-all-statements')
    await selectAllCheckbox.check()

    // Bulk approve
    const bulkApproveButton = page.getByRole('button', { name: /approve selected/i })
    await bulkApproveButton.click()

    // Verify all statements are now approved
    await page.goto(pollUrl)
    for (const statement of statements) {
      await expect(page.getByText(statement)).toBeVisible()
    }
  })

  test('admin can view detailed user activity', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Navigate to user activity section
    await page.getByRole('link', { name: /user activity/i }).click()

    // Verify user activity page
    await expect(page).toHaveURL(/\/admin\/users/)
    await expect(page.getByTestId('user-activity-table')).toBeVisible()

    // Check activity filters
    const dateFilter = page.getByTestId('date-filter')
    await dateFilter.selectOption('last-week')

    const activityFilter = page.getByTestId('activity-filter')
    await activityFilter.selectOption('votes')

    // Verify filtered results
    await expect(page.getByTestId('activity-row')).toBeVisible()
  })

  test('admin can export poll data', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Find poll and export data
    const pollRow = page.getByTestId('poll-row').first()
    const exportButton = pollRow.getByRole('button', { name: /export/i })

    // Set up download handler
    const downloadPromise = page.waitForEvent('download')
    await exportButton.click()

    // Verify download starts
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/poll-data.*\.csv/)
  })

  test('admin permissions are enforced', async ({ page }) => {
    // Test that regular user cannot access admin features
    await authPage.signOut()
    await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

    // Try to access admin dashboard
    await page.goto('/admin')

    // Should be redirected or see access denied
    await expect(page).not.toHaveURL(/\/admin/)
    // Either redirected to home or shows access denied
    const isRedirected = page.url() === '/' || page.url().includes('unauthorized')
    expect(isRedirected).toBe(true)
  })

  test('admin can moderate reported content', async ({ page }) => {
    await adminPage.goToAdminDashboard()

    // Navigate to content moderation
    await page.getByRole('link', { name: /moderation/i }).click()

    // Verify moderation interface
    await expect(page).toHaveURL(/\/admin\/moderation/)

    // Check for reported content queue
    const reportedContent = page.getByTestId('reported-content')
    if (await reportedContent.isVisible()) {
      // Test moderation actions
      const firstReport = reportedContent.getByTestId('report-item').first()
      const removeButton = firstReport.getByRole('button', { name: /remove/i })

      await removeButton.click()

      // Confirm removal
      const confirmButton = page.getByRole('button', { name: /confirm removal/i })
      await confirmButton.click()

      // Verify content was handled
      await testUtils.waitForToast(page, 'Content removed')
    }
  })
})