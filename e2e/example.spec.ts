import { test, expect } from '@playwright/test'

test('homepage loads', async ({ page }) => {
  await page.goto('/')
  
  // Check if login form is displayed (since user is not authenticated)
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('can login with correct password', async ({ page }) => {
  await page.goto('/')
  
  // Fill in password (replace with actual password from env)
  const password = process.env.TEST_PASSWORD || 'test-password'
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  
  // Should redirect to main app (check for property management UI)
  await expect(page.locator('text=CasaTrack')).toBeVisible()
})
