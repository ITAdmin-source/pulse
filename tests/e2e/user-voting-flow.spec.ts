import { test, expect } from '@playwright/test'
import { PollPage, AuthPage, testData, testUtils } from './fixtures/e2e-helpers'

test.describe('User Voting Flow', () => {
  let pollPage: PollPage
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    pollPage = new PollPage(page)
    authPage = new AuthPage(page)
  })

  test('anonymous user can vote on published poll', async ({ page }) => {
    // Navigate to a published poll
    await page.goto('/poll/example-poll')

    // Verify poll content is visible
    await expect(pollPage.questionHeading).toBeVisible()
    await expect(pollPage.statementsContainer).toBeVisible()

    // Get initial statement count
    const statements = await pollPage.getStatementTexts()
    expect(statements.length).toBeGreaterThan(0)

    // Vote on first statement
    const firstStatement = statements[0]
    await pollPage.voteOnStatement(firstStatement, 'agree')

    // Verify vote was recorded
    const statementCard = page.getByTestId('statement-card').filter({ hasText: firstStatement })
    await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')

    // Check voting progress
    const progress = await pollPage.getVotingProgress()
    expect(progress.current).toBe(1)
    expect(progress.required).toBeGreaterThan(0)
  })

  test('user cannot change their vote - votes are immutable', async ({ page }) => {
    await page.goto('/poll/example-poll')

    const statements = await pollPage.getStatementTexts()
    const firstStatement = statements[0]

    // Vote agree first
    await pollPage.voteOnStatement(firstStatement, 'agree')
    const statementCard = page.getByTestId('statement-card').filter({ hasText: firstStatement })
    await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')

    // Attempt to change vote to disagree should either:
    // 1. Show error message
    // 2. Buttons become disabled
    // 3. Vote remains unchanged

    // Try to click disagree button
    const disagreeButton = statementCard.getByTestId('vote-disagree')

    // The button should either be disabled or clicking should show an error
    const isDisabled = await disagreeButton.isDisabled()

    if (!isDisabled) {
      // If not disabled, clicking should show error
      await disagreeButton.click()

      // Look for error message (toast or inline error)
      const hasError = await page.getByText(/already voted|cannot change|immutable|final/i).isVisible().catch(() => false)
      expect(hasError).toBeTruthy()
    }

    // Original vote should remain unchanged
    await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
    await expect(statementCard.getByTestId('vote-disagree')).toHaveAttribute('aria-pressed', 'false')

    // Verify voting progress stayed at 1 (no duplicate vote counted)
    const progress = await pollPage.getVotingProgress()
    expect(progress.current).toBe(1)
  })

  test('user must meet voting threshold to see results', async ({ page }) => {
    await page.goto('/poll/example-poll')

    const statements = await pollPage.getStatementTexts()
    const progress = await pollPage.getVotingProgress()

    // Vote on statements but not enough to meet threshold
    for (let i = 0; i < Math.min(progress.required - 1, statements.length); i++) {
      await pollPage.voteOnStatement(statements[i], 'agree')
    }

    // Results should not be visible yet
    await expect(pollPage.resultsSection).not.toBeVisible()

    // Vote on one more statement to meet threshold
    if (statements.length >= progress.required) {
      await pollPage.voteOnStatement(statements[progress.required - 1], 'neutral')

      // Results should now be visible
      await pollPage.waitForResults()
      await expect(pollPage.resultsSection).toBeVisible()
    }
  })

  test('authenticated user voting flow', async ({ page }) => {
    // Sign in first
    await page.goto('/')
    await authPage.signIn(testData.users.user1.email, testData.users.user1.password)

    // Navigate to poll
    await page.goto('/poll/example-poll')

    // Verify authenticated user can vote
    const statements = await pollPage.getStatementTexts()
    await pollPage.voteOnStatement(statements[0], 'agree')

    // Check that user identity is preserved
    const userMenu = page.getByTestId('user-menu')
    await expect(userMenu).toBeVisible()

    // Verify vote persists after page reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
    await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')
  })

  test('user can add statement when allowed', async ({ page }) => {
    await page.goto('/poll/user-statements-allowed')

    // Verify add statement button is visible
    await expect(pollPage.addStatementButton).toBeVisible()

    // Add a new statement
    const newStatementText = 'This is my suggested statement'
    await pollPage.addStatement(newStatementText)

    // Wait for toast notification
    await testUtils.waitForToast(page, 'Statement submitted')

    // For auto-approve polls, statement should appear immediately
    // For manual approval, statement should be pending
    const isAutoApprove = await page.getByText('auto-approve').isVisible().catch(() => false)

    if (isAutoApprove) {
      // Statement should be visible and votable
      await expect(page.getByText(newStatementText)).toBeVisible()
    } else {
      // Statement should be pending approval
      await testUtils.waitForToast(page, 'pending approval')
    }
  })

  test('voting progress updates correctly', async ({ page }) => {
    await page.goto('/poll/example-poll')

    const initialProgress = await pollPage.getVotingProgress()
    const statements = await pollPage.getStatementTexts()

    // Vote on statements one by one and check progress
    for (let i = 0; i < Math.min(3, statements.length); i++) {
      await pollPage.voteOnStatement(statements[i], 'agree')

      const currentProgress = await pollPage.getVotingProgress()
      expect(currentProgress.current).toBe(i + 1)
      expect(currentProgress.required).toBe(initialProgress.required)
    }
  })

  test('user can see vote distribution after meeting threshold', async ({ page }) => {
    await page.goto('/poll/example-poll')

    const statements = await pollPage.getStatementTexts()
    const progress = await pollPage.getVotingProgress()

    // Vote on enough statements to meet threshold
    for (let i = 0; i < Math.min(progress.required, statements.length); i++) {
      const voteType = i % 3 === 0 ? 'agree' : i % 3 === 1 ? 'disagree' : 'neutral'
      await pollPage.voteOnStatement(statements[i], voteType as any)
    }

    // Wait for results to become visible
    await pollPage.waitForResults()

    // Check that vote distributions are shown
    for (let i = 0; i < Math.min(progress.required, statements.length); i++) {
      const result = await pollPage.getStatementResult(statements[i])

      // Verify that each vote count is a non-negative number
      expect(result.agree).toBeGreaterThanOrEqual(0)
      expect(result.disagree).toBeGreaterThanOrEqual(0)
      expect(result.neutral).toBeGreaterThanOrEqual(0)

      // At least one vote should be recorded (the user's own vote)
      expect(result.agree + result.disagree + result.neutral).toBeGreaterThanOrEqual(1)
    }
  })

  test('error handling for network issues', async ({ page }) => {
    await page.goto('/poll/example-poll')

    // Enable slow network to test loading states
    await testUtils.enableSlowNetwork(page)

    const statements = await pollPage.getStatementTexts()

    // Try to vote while network is slow
    await pollPage.voteOnStatement(statements[0], 'agree')

    // Verify loading state is shown
    const loadingIndicator = page.getByTestId('voting-loader')
    await expect(loadingIndicator).toBeVisible()

    // Vote should eventually succeed
    const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
    await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true', {
      timeout: 10000
    })
  })

  test('mobile responsive voting interface', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/poll/example-poll')

    // Verify mobile layout
    await expect(pollPage.questionHeading).toBeVisible()
    await expect(pollPage.statementsContainer).toBeVisible()

    // Test voting on mobile
    const statements = await pollPage.getStatementTexts()
    await pollPage.voteOnStatement(statements[0], 'agree')

    // Verify vote buttons are appropriately sized for touch
    const voteButton = page.getByTestId('vote-agree').first()
    const boundingBox = await voteButton.boundingBox()
    expect(boundingBox?.width).toBeGreaterThan(44) // Minimum touch target size
    expect(boundingBox?.height).toBeGreaterThan(44)
  })

  test('keyboard navigation for accessibility', async ({ page }) => {
    await page.goto('/poll/example-poll')

    // Tab through voting interface
    await page.keyboard.press('Tab') // Focus first element
    await page.keyboard.press('Tab') // Navigate through interface

    // Find first vote button and activate with keyboard
    const voteButton = page.getByTestId('vote-agree').first()
    await voteButton.focus()
    await page.keyboard.press('Enter')

    // Verify vote was recorded
    await expect(voteButton).toHaveAttribute('aria-pressed', 'true')

    // Test keyboard navigation to statement submission
    if (await pollPage.addStatementButton.isVisible()) {
      await pollPage.addStatementButton.focus()
      await page.keyboard.press('Enter')

      // Form should open and be focusable
      await expect(pollPage.statementInput).toBeFocused()
    }
  })
})