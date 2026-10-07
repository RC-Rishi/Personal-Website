import { test, expect } from '@playwright/test'

test('lab loads without runtime errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Great websites start')
  await expect(page.frameLocator('iframe').getByRole('button', { name: 'Cream', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('preview controls select mobile and desktop widths', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Mobile', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Mobile', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.preview-frame')).toHaveAttribute('data-viewport', 'Mobile')
  await page.getByRole('button', { name: 'Desktop', exact: true }).click()
  await expect(page.locator('.preview-frame')).toHaveAttribute('data-viewport', 'Desktop')
})

test('unknown standalone component offers a return link', async ({ page }) => {
  await page.goto('/?component=missing')
  await expect(page.getByRole('heading', { name: 'Component not found' })).toBeVisible()
  await page.getByRole('link', { name: 'Return to the lab' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Great websites start')
})
