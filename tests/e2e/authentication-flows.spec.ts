import { test, expect } from '@playwright/test'
import { AuthPage, PollPage, testData, testUtils } from './fixtures/e2e-helpers'

test.describe('Authentication Flows', () => {
  let authPage: AuthPage
  let pollPage: PollPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    pollPage = new PollPage(page)
  })

  test.describe('Anonymous User Flow', () => {
    test('anonymous user can participate in polls', async ({ page }) => {
      // Navigate to poll as anonymous user
      await page.goto('/poll/example-poll')

      // Verify poll is accessible
      await expect(pollPage.questionHeading).toBeVisible()
      await expect(pollPage.statementsContainer).toBeVisible()

      // Vote on statements
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')

      // Verify vote is recorded
      const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
      await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')

      // Check that voting progress updates
      const progress = await pollPage.getVotingProgress()
      expect(progress.current).toBe(1)
    })

    test('anonymous user session persists across page reloads', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // Vote as anonymous user
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')
      await pollPage.voteOnStatement(statements[1], 'disagree')

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Verify votes are still recorded
      const card1 = page.getByTestId('statement-card').filter({ hasText: statements[0] })
      const card2 = page.getByTestId('statement-card').filter({ hasText: statements[1] })

      await expect(card1.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
      await expect(card2.getByTestId('vote-disagree')).toHaveAttribute('aria-pressed', 'true')

      // Check progress is maintained
      const progress = await pollPage.getVotingProgress()
      expect(progress.current).toBe(2)
    })

    test('anonymous user can add statements when allowed', async ({ page }) => {
      await page.goto('/poll/user-statements-allowed')

      // Verify add statement is available
      await expect(pollPage.addStatementButton).toBeVisible()

      // Add a statement
      await pollPage.addStatement('Anonymous user suggestion')

      // Verify statement submission
      await testUtils.waitForToast(page, 'Statement submitted')

      // For auto-approve polls, should see statement immediately
      const isAutoApprove = page.url().includes('auto-approve')
      if (isAutoApprove) {
        await expect(page.getByText('Anonymous user suggestion')).toBeVisible()
      }
    })

    test('anonymous user upgrade flow', async ({ page }) => {
      // Start as anonymous user and vote
      await page.goto('/poll/example-poll')
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')

      // Click sign up to upgrade account
      await authPage.signInButton.click()

      // Go through Clerk sign-up flow
      await page.getByRole('link', { name: /sign up/i }).click()
      await page.getByLabel(/email/i).fill(testData.users.user2.email)
      await page.getByLabel(/password/i).fill(testData.users.user2.password)
      await page.getByRole('button', { name: /continue/i }).click()

      // Complete sign-up process (may need verification steps)
      // Wait for redirect back to poll
      await page.waitForURL(/\/poll\//)

      // Verify user is now authenticated
      await expect(authPage.userMenu).toBeVisible()

      // Verify votes were preserved during upgrade
      const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
      await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('Authenticated User Flow', () => {
    test('user can sign in and sign out', async ({ page }) => {
      await page.goto('/')

      // Sign in
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      // Verify signed in state
      await expect(authPage.userMenu).toBeVisible()
      expect(await authPage.isSignedIn()).toBe(true)

      // Sign out
      await authPage.signOut()

      // Verify signed out state
      await expect(authPage.signInButton).toBeVisible()
      expect(await authPage.isSignedIn()).toBe(false)
    })

    test('authenticated user voting persists across sessions', async ({ page }) => {
      // Sign in and vote
      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      await page.goto('/poll/example-poll')
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')
      await pollPage.voteOnStatement(statements[1], 'neutral')

      // Sign out and clear session
      await authPage.signOut()
      await testUtils.clearSession(page)

      // Sign back in
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)
      await page.goto('/poll/example-poll')

      // Verify votes are still recorded
      const card1 = page.getByTestId('statement-card').filter({ hasText: statements[0] })
      const card2 = page.getByTestId('statement-card').filter({ hasText: statements[1] })

      await expect(card1.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
      await expect(card2.getByTestId('vote-neutral')).toHaveAttribute('aria-pressed', 'true')
    })

    test('user profile and preferences', async ({ page }) => {
      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      // Navigate to user profile
      await authPage.userMenu.click()
      await page.getByRole('link', { name: /profile/i }).click()

      // Verify profile page
      await expect(page).toHaveURL(/\/profile/)
      await expect(page.getByTestId('user-profile')).toBeVisible()

      // Update profile information
      const displayNameInput = page.getByLabel(/display name/i)
      await displayNameInput.fill('Test User Updated')

      const saveButton = page.getByRole('button', { name: /save/i })
      await saveButton.click()

      // Verify profile was updated
      await testUtils.waitForToast(page, 'Profile updated')

      // Verify change persists
      await page.reload()
      await expect(displayNameInput).toHaveValue('Test User Updated')
    })

    test('user can view their voting history', async ({ page }) => {
      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      // Vote on some statements first
      await page.goto('/poll/example-poll')
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')
      await pollPage.voteOnStatement(statements[1], 'disagree')

      // Navigate to voting history
      await authPage.userMenu.click()
      await page.getByRole('link', { name: /voting history/i }).click()

      // Verify voting history page
      await expect(page).toHaveURL(/\/profile\/votes/)
      await expect(page.getByTestId('voting-history')).toBeVisible()

      // Verify votes are shown
      await expect(page.getByText(statements[0])).toBeVisible()
      await expect(page.getByText(statements[1])).toBeVisible()

      // Check vote indicators
      const vote1Row = page.getByTestId('vote-row').filter({ hasText: statements[0] })
      const vote2Row = page.getByTestId('vote-row').filter({ hasText: statements[1] })

      await expect(vote1Row.getByTestId('vote-indicator-agree')).toBeVisible()
      await expect(vote2Row.getByTestId('vote-indicator-disagree')).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('draft polls require authentication to access', async ({ page }) => {
      // Try to access draft poll as anonymous user
      await page.goto('/poll/draft-poll-slug')

      // Should be redirected to sign in or see access denied
      const currentUrl = page.url()
      const isBlocked = currentUrl.includes('sign-in') ||
                       currentUrl.includes('unauthorized') ||
                       !currentUrl.includes('/poll/draft-poll-slug')

      expect(isBlocked).toBe(true)
    })

    test('closed polls show read-only results', async ({ page }) => {
      await page.goto('/poll/closed-poll-slug')

      // Poll should be visible but voting disabled
      await expect(pollPage.questionHeading).toBeVisible()
      await expect(pollPage.statementsContainer).toBeVisible()

      // Vote buttons should be disabled
      const voteButtons = page.getByTestId(/^vote-/)
      const firstVoteButton = voteButtons.first()

      if (await firstVoteButton.isVisible()) {
        await expect(firstVoteButton).toBeDisabled()
      }

      // Results should be visible if user meets threshold
      await expect(pollPage.resultsSection).toBeVisible()
    })

    test('admin areas require admin permissions', async ({ page }) => {
      // Try to access admin as regular user
      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      await page.goto('/admin')

      // Should not be able to access admin dashboard
      await expect(page).not.toHaveURL(/\/admin/)

      // Should see unauthorized message or be redirected
      const hasUnauthorizedMessage = await page.getByText(/unauthorized|access denied/i).isVisible()
      const wasRedirected = !page.url().includes('/admin')

      expect(hasUnauthorizedMessage || wasRedirected).toBe(true)
    })

    test('poll owner can access their draft polls', async ({ page }) => {
      await page.goto('/')
      await authPage.signIn(testData.users.admin.email, testData.users.admin.password)

      // Navigate to a draft poll owned by this user
      await page.goto('/poll/owned-draft-poll')

      // Should be able to access and view poll
      await expect(pollPage.questionHeading).toBeVisible()

      // Should see admin controls
      const adminControls = page.getByTestId('poll-admin-controls')
      await expect(adminControls).toBeVisible()
    })
  })

  test.describe('Session Management', () => {
    test('session timeout handling', async ({ page }) => {
      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      // Mock session expiration
      await page.evaluate(() => {
        // Clear auth tokens to simulate session expiration
        localStorage.removeItem('clerk-auth-token')
        sessionStorage.clear()
      })

      // Try to perform authenticated action
      await page.goto('/poll/example-poll')
      await page.reload() // Force session check

      // Should be prompted to sign in again
      await expect(authPage.signInButton).toBeVisible()
    })

    test('concurrent session handling', async ({ browser }) => {
      // Create two contexts to simulate multiple tabs/windows
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      const auth1 = new AuthPage(page1)
      const auth2 = new AuthPage(page2)

      // Sign in on first tab
      await page1.goto('/')
      await auth1.signIn(testData.users.user1.email, testData.users.user1.password)

      // Sign in same user on second tab
      await page2.goto('/')
      await auth2.signIn(testData.users.user1.email, testData.users.user1.password)

      // Both should be signed in
      await expect(auth1.userMenu).toBeVisible()
      await expect(auth2.userMenu).toBeVisible()

      // Sign out on first tab
      await auth1.signOut()

      // Second tab should also detect sign out (if session sync is implemented)
      await page2.reload()
      // Note: This behavior depends on your session management implementation
    })

    test('cross-device session persistence', async ({ page }) => {
      // This test simulates user accessing from different devices
      // by clearing and restoring session data

      await page.goto('/')
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

      // Vote on some statements
      await page.goto('/poll/example-poll')
      const statements = await pollPage.getStatementTexts()
      await pollPage.voteOnStatement(statements[0], 'agree')

      // Simulate accessing from different device (new session)
      await testUtils.clearSession(page)
      await page.reload()

      // Sign in again (simulating new device)
      await authPage.signIn(testData.users.user1.email, testData.users.user1.password)
      await page.goto('/poll/example-poll')

      // Votes should still be associated with user account
      const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
      await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('Error Handling', () => {
    test('handles authentication errors gracefully', async ({ page }) => {
      await page.goto('/')

      // Mock authentication failure
      await testUtils.mockApiError(page, '/api/auth', 500)

      // Attempt to sign in
      await authPage.signInButton.click()

      // Should show error message
      await expect(page.getByText(/authentication error|sign.*in.*failed/i)).toBeVisible()

      // User should be able to retry
      await expect(authPage.signInButton).toBeVisible()
    })

    test('handles network errors during authentication', async ({ page }) => {
      await page.goto('/')

      // Enable slow network
      await testUtils.enableSlowNetwork(page)

      // Attempt to sign in
      await authPage.signInButton.click()

      // Should show loading state
      const loadingIndicator = page.getByTestId('auth-loading')
      await expect(loadingIndicator).toBeVisible()

      // Should eventually succeed or show timeout error
      await expect(authPage.userMenu.or(page.getByText(/timeout|error/i))).toBeVisible({
        timeout: 15000
      })
    })
  })
})