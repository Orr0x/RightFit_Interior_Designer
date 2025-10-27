/**
 * E2E Smoke Tests for RightFit Interior Designer
 *
 * Story 1.12: Test Infrastructure Setup
 *
 * These tests verify critical application paths without requiring full authentication:
 * 1. Application loads successfully
 * 2. Public pages are accessible
 * 3. Auth-protected pages redirect correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Application Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page).toHaveTitle(/RightFit/i);

    // Verify key navigation elements exist (header is always visible)
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Verify no JavaScript errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');

    // Allow some expected errors (e.g., auth checks)
    const criticalErrors = errors.filter(err =>
      !err.includes('auth') &&
      !err.includes('session') &&
      !err.includes('401')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('designer page requires authentication', async ({ page }) => {
    await page.goto('/designer');

    // Should redirect to login or show auth prompt
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const isAuthPage = url.includes('login') ||
                       url.includes('auth') ||
                       url.includes('sign');

    const hasAuthModal = await page.locator('[role="dialog"]').count() > 0;
    const hasAuthForm = await page.locator('form').count() > 0;

    // Verify auth is required (redirected OR modal/form shown)
    expect(isAuthPage || hasAuthModal || hasAuthForm).toBe(true);
  });

  test('static assets load correctly', async ({ page }) => {
    await page.goto('/');

    // Check for failed network requests
    const failedRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400 && response.status() < 600) {
        // Ignore expected auth failures
        if (!response.url().includes('auth') &&
            !response.url().includes('session')) {
          failedRequests.push(`${response.status()} ${response.url()}`);
        }
      }
    });

    await page.waitForLoadState('networkidle');

    // Verify no critical asset loading failures
    expect(failedRequests.length).toBe(0);

    // Verify React app mounted
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
