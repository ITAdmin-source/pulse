import { Page, Locator } from '@playwright/test'

/**
 * Page Object Models and utilities for E2E tests
 */

export class PollPage {
  constructor(private page: Page) {}

  // Locators
  get questionHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 })
  }

  get descriptionText(): Locator {
    return this.page.getByTestId('poll-description')
  }

  get statementsContainer(): Locator {
    return this.page.getByTestId('statements-container')
  }

  get statementCards(): Locator {
    return this.page.getByTestId('statement-card')
  }

  get addStatementButton(): Locator {
    return this.page.getByRole('button', { name: /add statement/i })
  }

  get addStatementForm(): Locator {
    return this.page.getByTestId('add-statement-form')
  }

  get statementInput(): Locator {
    return this.page.getByPlaceholder(/enter your statement/i)
  }

  get submitStatementButton(): Locator {
    return this.page.getByRole('button', { name: /submit statement/i })
  }

  get progressIndicator(): Locator {
    return this.page.getByTestId('voting-progress')
  }

  get resultsSection(): Locator {
    return this.page.getByTestId('poll-results')
  }

  // Actions
  async voteOnStatement(statementText: string, voteValue: 'agree' | 'disagree' | 'neutral'): Promise<void> {
    const statementCard = this.page.getByTestId('statement-card').filter({ hasText: statementText })
    const voteButton = statementCard.getByTestId(`vote-${voteValue}`)
    await voteButton.click()

    // Wait for vote to be registered
    await this.page.waitForSelector(`[data-testid="vote-${voteValue}"][aria-pressed="true"]`)
  }

  async addStatement(text: string): Promise<void> {
    await this.addStatementButton.click()
    await this.statementInput.fill(text)
    await this.submitStatementButton.click()

    // Wait for form to close or success message
    await this.page.waitForSelector('[data-testid="add-statement-form"]', { state: 'hidden' })
  }

  async getStatementTexts(): Promise<string[]> {
    await this.statementCards.first().waitFor()
    const texts = await this.statementCards.allTextContents()
    return texts.map(text => text.trim())
  }

  async getVotingProgress(): Promise<{ current: number; required: number }> {
    const progressText = await this.progressIndicator.textContent()
    const match = progressText?.match(/(\d+)\s*\/\s*(\d+)/)

    if (!match) throw new Error('Could not parse voting progress')

    return {
      current: parseInt(match[1]),
      required: parseInt(match[2])
    }
  }

  async waitForResults(): Promise<void> {
    await this.resultsSection.waitFor({ state: 'visible' })
  }

  async getStatementResult(statementText: string): Promise<{
    agree: number
    disagree: number
    neutral: number
  }> {
    const statementCard = this.page.getByTestId('statement-card').filter({ hasText: statementText })
    const resultsContainer = statementCard.getByTestId('statement-results')

    const agreeText = await resultsContainer.getByTestId('agree-count').textContent()
    const disagreeText = await resultsContainer.getByTestId('disagree-count').textContent()
    const neutralText = await resultsContainer.getByTestId('neutral-count').textContent()

    return {
      agree: parseInt(agreeText?.match(/\d+/)?.[0] || '0'),
      disagree: parseInt(disagreeText?.match(/\d+/)?.[0] || '0'),
      neutral: parseInt(neutralText?.match(/\d+/)?.[0] || '0')
    }
  }
}

export class AuthPage {
  constructor(private page: Page) {}

  // Locators
  get signInButton(): Locator {
    return this.page.getByRole('button', { name: /sign in/i })
  }

  get signUpButton(): Locator {
    return this.page.getByRole('button', { name: /sign up/i })
  }

  get userMenu(): Locator {
    return this.page.getByTestId('user-menu')
  }

  get signOutButton(): Locator {
    return this.page.getByRole('button', { name: /sign out/i })
  }

  // Actions
  async signIn(email: string, password: string): Promise<void> {
    await this.signInButton.click()

    // Clerk sign-in form
    await this.page.getByLabel(/email/i).fill(email)
    await this.page.getByLabel(/password/i).fill(password)
    await this.page.getByRole('button', { name: /continue/i }).click()

    // Wait for redirect back to app
    await this.page.waitForURL(/\//)
    await this.userMenu.waitFor({ state: 'visible' })
  }

  async signOut(): Promise<void> {
    await this.userMenu.click()
    await this.signOutButton.click()

    // Wait for sign-out to complete
    await this.signInButton.waitFor({ state: 'visible' })
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await this.userMenu.waitFor({ state: 'visible', timeout: 1000 })
      return true
    } catch {
      return false
    }
  }
}

export class AdminPage {
  constructor(private page: Page) {}

  // Locators
  get pollsList(): Locator {
    return this.page.getByTestId('admin-polls-list')
  }

  get createPollButton(): Locator {
    return this.page.getByRole('button', { name: /create poll/i })
  }

  get pendingStatements(): Locator {
    return this.page.getByTestId('pending-statements')
  }

  // Actions
  async goToAdminDashboard(): Promise<void> {
    await this.page.goto('/admin')
    await this.pollsList.waitFor({ state: 'visible' })
  }

  async createPoll(data: {
    question: string
    description?: string
    allowUserStatements?: boolean
    autoApprove?: boolean
  }): Promise<void> {
    await this.createPollButton.click()

    await this.page.getByLabel(/question/i).fill(data.question)

    if (data.description) {
      await this.page.getByLabel(/description/i).fill(data.description)
    }

    if (data.allowUserStatements) {
      await this.page.getByLabel(/allow user statements/i).check()
    }

    if (data.autoApprove) {
      await this.page.getByLabel(/auto approve statements/i).check()
    }

    await this.page.getByRole('button', { name: /create/i }).click()

    // Wait for redirect to poll or admin dashboard
    await this.page.waitForURL(/\/(poll|admin)/)
  }

  async approveStatement(statementText: string): Promise<void> {
    const statementRow = this.page.getByTestId('pending-statement').filter({ hasText: statementText })
    const approveButton = statementRow.getByRole('button', { name: /approve/i })
    await approveButton.click()

    // Wait for statement to be removed from pending list
    await this.page.waitForTimeout(500) // Brief wait for UI update
  }

  async rejectStatement(statementText: string): Promise<void> {
    const statementRow = this.page.getByTestId('pending-statement').filter({ hasText: statementText })
    const rejectButton = statementRow.getByRole('button', { name: /reject/i })
    await rejectButton.click()

    // Wait for confirmation if needed
    const confirmButton = this.page.getByRole('button', { name: /confirm/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // Wait for statement to be removed
    await this.page.waitForTimeout(500)
  }
}

/**
 * Test data factories for E2E tests
 */
export const testData = {
  polls: {
    basic: {
      question: 'What should we have for lunch?',
      description: 'Help us decide on today\'s lunch options',
      allowUserStatements: true,
      autoApprove: false,
    },
    autoApprove: {
      question: 'How can we improve our workspace?',
      description: 'Share your ideas for workspace improvements',
      allowUserStatements: true,
      autoApprove: true,
    },
    adminOnly: {
      question: 'Which policy proposal do you support?',
      description: 'Official policy proposal voting',
      allowUserStatements: false,
      autoApprove: false,
    },
  },

  statements: {
    lunch: [
      'Pizza from Tony\'s',
      'Healthy salad bar',
      'Sandwich platters',
      'Thai food delivery',
    ],
    workspace: [
      'Add more plants to the office',
      'Upgrade to standing desks',
      'Create a quiet work zone',
      'Improve the coffee station',
    ],
    controversial: [
      'This is a very controversial statement',
      'Everyone should agree with this obviously',
      'This statement is intentionally neutral',
    ],
  },

  users: {
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
    },
    user1: {
      email: 'user1@example.com',
      password: 'user123',
    },
    user2: {
      email: 'user2@example.com',
      password: 'user456',
    },
  },
}

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for network idle (useful after form submissions)
   */
  async waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout })
  },

  /**
   * Take a screenshot with timestamp for debugging
   */
  async takeDebugScreenshot(page: Page, name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await page.screenshot({
      path: `test-results/debug-${name}-${timestamp}.png`,
      fullPage: true
    })
  },

  /**
   * Wait for toast notification
   */
  async waitForToast(page: Page, expectedText?: string): Promise<void> {
    const toast = page.getByTestId('toast-notification')
    await toast.waitFor({ state: 'visible' })

    if (expectedText) {
      await page.getByText(expectedText).waitFor({ state: 'visible' })
    }

    // Wait for toast to disappear
    await toast.waitFor({ state: 'hidden' })
  },

  /**
   * Clear all cookies and local storage
   */
  async clearSession(page: Page): Promise<void> {
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  },

  /**
   * Simulate slow network for testing loading states
   */
  async enableSlowNetwork(page: Page): Promise<void> {
    await page.route('**/*', route => {
      // Delay all requests by 1 second
      setTimeout(() => route.continue(), 1000)
    })
  },

  /**
   * Mock API responses for testing error states
   */
  async mockApiError(page: Page, endpoint: string, statusCode = 500): Promise<void> {
    await page.route(`**${endpoint}**`, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mocked API error' })
      })
    })
  },
}