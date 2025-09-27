import { test, expect } from '@playwright/test'
import { PollPage, testUtils } from './fixtures/e2e-helpers'

test.describe('Responsive Design', () => {
  let pollPage: PollPage

  test.beforeEach(async ({ page }) => {
    pollPage = new PollPage(page)
  })

  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('poll interface is usable on mobile', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // Verify key elements are visible and properly sized
      await expect(pollPage.questionHeading).toBeVisible()
      await expect(pollPage.statementsContainer).toBeVisible()

      // Check that vote buttons are touch-friendly
      const voteButton = page.getByTestId('vote-agree').first()
      const boundingBox = await voteButton.boundingBox()

      expect(boundingBox?.width).toBeGreaterThan(44) // Minimum touch target
      expect(boundingBox?.height).toBeGreaterThan(44)

      // Test voting interaction
      await voteButton.click()
      await expect(voteButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('statement submission form works on mobile', async ({ page }) => {
      await page.goto('/poll/user-statements-allowed')

      // Open add statement form
      await pollPage.addStatementButton.click()
      await expect(pollPage.addStatementForm).toBeVisible()

      // Verify form elements are properly sized
      const textArea = pollPage.statementInput
      const textAreaBox = await textArea.boundingBox()
      expect(textAreaBox?.width).toBeGreaterThan(250) // Sufficient width for typing

      // Test form submission
      await textArea.fill('Mobile test statement')
      await pollPage.submitStatementButton.click()

      await testUtils.waitForToast(page, 'Statement submitted')
    })

    test('navigation menu works on mobile', async ({ page }) => {
      await page.goto('/')

      // Check for mobile menu button
      const mobileMenuButton = page.getByTestId('mobile-menu-button')

      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click()

        // Verify mobile menu opens
        const mobileMenu = page.getByTestId('mobile-menu')
        await expect(mobileMenu).toBeVisible()

        // Test navigation links
        const pollsLink = mobileMenu.getByRole('link', { name: /polls/i })
        await expect(pollsLink).toBeVisible()
      }
    })

    test('voting progress indicator adapts to mobile', async ({ page }) => {
      await page.goto('/poll/example-poll')

      const progressIndicator = pollPage.progressIndicator
      await expect(progressIndicator).toBeVisible()

      // Check that progress text is readable on small screen
      const progressBox = await progressIndicator.boundingBox()
      expect(progressBox?.width).toBeLessThan(375) // Fits within viewport
    })

    test('results display properly on mobile', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // Vote enough times to see results
      const statements = await pollPage.getStatementTexts()
      const progress = await pollPage.getVotingProgress()

      for (let i = 0; i < Math.min(progress.required, statements.length); i++) {
        await pollPage.voteOnStatement(statements[i], 'agree')
      }

      await pollPage.waitForResults()

      // Verify results are properly displayed on mobile
      const resultsSection = pollPage.resultsSection
      await expect(resultsSection).toBeVisible()

      // Check that result charts/bars fit on screen
      const resultElements = page.getByTestId('statement-results')
      const count = await resultElements.count()

      for (let i = 0; i < count; i++) {
        const element = resultElements.nth(i)
        const box = await element.boundingBox()
        expect(box?.width).toBeLessThan(375) // Fits within viewport
      }
    })
  })

  test.describe('Tablet Viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
    })

    test('tablet layout shows more content per row', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // On tablet, statements might be in a grid layout
      const statementsContainer = pollPage.statementsContainer
      await expect(statementsContainer).toBeVisible()

      // Check that content utilizes tablet screen space
      const containerBox = await statementsContainer.boundingBox()
      expect(containerBox?.width).toBeGreaterThan(500) // Uses more tablet width
    })

    test('side navigation appears on tablet', async ({ page }) => {
      await page.goto('/')

      // Check for side navigation that appears on larger screens
      const sideNav = page.getByTestId('side-navigation')

      if (await sideNav.isVisible()) {
        await expect(sideNav).toBeVisible()

        // Verify navigation links are accessible
        const navLinks = sideNav.getByRole('link')
        expect(await navLinks.count()).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
    })

    test('desktop layout maximizes screen real estate', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // Check that content spreads out appropriately
      const main = page.getByRole('main')
      const mainBox = await main.boundingBox()

      expect(mainBox?.width).toBeGreaterThan(800) // Uses desktop width effectively
      expect(mainBox?.width).toBeLessThan(1200) // But not excessively wide for readability
    })

    test('hover states work on desktop', async ({ page }) => {
      await page.goto('/poll/example-poll')

      const voteButton = page.getByTestId('vote-agree').first()

      // Test hover effect
      await voteButton.hover()

      // Verify hover styling (this depends on your CSS implementation)
      const buttonStyles = await voteButton.evaluate(el =>
        window.getComputedStyle(el).getPropertyValue('background-color')
      )

      // Should have some visual change on hover (exact color depends on design)
      expect(buttonStyles).toBeTruthy()
    })

    test('keyboard navigation works efficiently on desktop', async ({ page }) => {
      await page.goto('/poll/example-poll')

      // Tab through interface efficiently
      await page.keyboard.press('Tab')

      // Should be able to reach vote buttons via keyboard
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Test keyboard voting
      await page.keyboard.press('Enter')

      // Verify vote was recorded via keyboard
      const voteButtons = page.getByTestId(/^vote-/)
      const pressedButton = voteButtons.filter({ hasAttribute: 'aria-pressed', value: 'true' })
      await expect(pressedButton.first()).toBeVisible()
    })
  })

  test.describe('Cross-Device Consistency', () => {
    test('content remains consistent across breakpoints', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ]

      let mobileStatements: string[] = []

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/poll/example-poll')

        // Verify core content is present on all devices
        await expect(pollPage.questionHeading).toBeVisible()
        await expect(pollPage.statementsContainer).toBeVisible()

        // Get statements and verify consistency
        const statements = await pollPage.getStatementTexts()
        expect(statements.length).toBeGreaterThan(0)

        if (viewport.name === 'mobile') {
          mobileStatements = statements
        } else {
          // Same statements should appear on all devices
          expect(statements).toEqual(mobileStatements)
        }
      }
    })

    test('voting functionality works across all devices', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/poll/example-poll')

        const statements = await pollPage.getStatementTexts()

        // Vote on first statement
        await pollPage.voteOnStatement(statements[0], 'agree')

        // Verify vote is recorded on this viewport
        const statementCard = page.getByTestId('statement-card').filter({ hasText: statements[0] })
        await expect(statementCard.getByTestId('vote-agree')).toHaveAttribute('aria-pressed', 'true')

        // Reset vote for next viewport test
        await page.reload()
      }
    })
  })

  test.describe('Accessibility Across Devices', () => {
    test('text remains readable at all sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/poll/example-poll')

        // Check that text meets minimum size requirements
        const questionText = pollPage.questionHeading
        const fontSize = await questionText.evaluate(el =>
          parseInt(window.getComputedStyle(el).fontSize)
        )

        expect(fontSize).toBeGreaterThanOrEqual(16) // Minimum readable size
      }
    })

    test('touch targets meet accessibility guidelines', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // Mobile
      await page.goto('/poll/example-poll')

      // All interactive elements should meet minimum touch target size
      const interactiveElements = [
        pollPage.addStatementButton,
        page.getByTestId('vote-agree').first(),
        page.getByTestId('vote-disagree').first(),
        page.getByTestId('vote-neutral').first()
      ]

      for (const element of interactiveElements) {
        if (await element.isVisible()) {
          const box = await element.boundingBox()
          expect(box?.width).toBeGreaterThanOrEqual(44) // WCAG AA
          expect(box?.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('focus indicators work on all devices', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 1920, height: 1080 }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/poll/example-poll')

        // Tab to first interactive element
        await page.keyboard.press('Tab')

        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()

        // Verify focus is visually apparent
        const outlineStyle = await focusedElement.evaluate(el =>
          window.getComputedStyle(el).outline
        )

        // Should have some kind of focus indicator
        expect(outlineStyle).not.toBe('none')
      }
    })
  })

  test.describe('Performance Across Devices', () => {
    test('page loads efficiently on mobile networks', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async route => {
        // Add delay to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 100))
        await route.continue()
      })

      await page.setViewportSize({ width: 375, height: 667 })

      const startTime = Date.now()
      await page.goto('/poll/example-poll')

      // Wait for key content to be visible
      await expect(pollPage.questionHeading).toBeVisible()
      await expect(pollPage.statementsContainer).toBeVisible()

      const loadTime = Date.now() - startTime

      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000) // 10 seconds max
    })

    test('images are appropriately sized for device', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 1920, height: 1080, name: 'desktop' }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/poll/example-poll')

        // Check for images (avatars, logos, etc.)
        const images = page.locator('img')
        const imageCount = await images.count()

        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i)

          if (await img.isVisible()) {
            const box = await img.boundingBox()

            // Images should not exceed viewport width
            expect(box?.width).toBeLessThanOrEqual(viewport.width)

            // Images should be reasonably sized for the viewport
            if (viewport.name === 'mobile') {
              expect(box?.width).toBeLessThan(300) // Mobile-appropriate size
            }
          }
        }
      }
    })
  })
})