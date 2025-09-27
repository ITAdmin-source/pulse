import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('has title', async ({ page }) => {
    await page.goto('/')

    // Expects page to have a title containing "Pulse"
    await expect(page).toHaveTitle(/Pulse/)
  })

  test('has main navigation', async ({ page }) => {
    await page.goto('/')

    // Check for main elements
    const mainHeading = page.getByRole('heading', { level: 1 })
    await expect(mainHeading).toBeVisible()
  })
})

test.describe('Poll Creation Flow', () => {
  test.skip('can create a new poll', async ({ page }) => {
    // This test is skipped until auth is mocked
    await page.goto('/polls/new')

    // Fill in poll details
    await page.fill('input[name="title"]', 'Test Poll')
    await page.fill('textarea[name="description"]', 'This is a test poll description')

    // Submit the form
    await page.click('button[type="submit"]')

    // Should redirect to the poll page
    await expect(page).toHaveURL(/\/polls\/[a-z0-9-]+/)
  })
})

test.describe('Voting Flow', () => {
  test.skip('can vote on statements', async ({ page }) => {
    // This test is skipped until we have a test poll setup
    await page.goto('/polls/test-poll')

    // Find the first statement
    const firstStatement = page.locator('[data-testid="statement"]').first()
    await expect(firstStatement).toBeVisible()

    // Vote agree
    await firstStatement.locator('button[data-vote="agree"]').click()

    // Check that vote was recorded
    await expect(firstStatement.locator('button[data-vote="agree"]')).toHaveAttribute('data-selected', 'true')
  })
})