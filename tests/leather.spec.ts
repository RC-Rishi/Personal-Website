import { test, expect } from '@playwright/test'

test('both finishes load locally and controls remain usable', async ({ page }) => {
  const errors: string[] = []
  const external: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => { if (request.url().includes('jjettas.com')) external.push(request.url()) })
  await page.goto('/?component=leather-background')
  await expect(page.locator('.leather-background')).toHaveAttribute('data-finish', 'cream')
  for (const finish of ['Dark', 'Cream']) {
    await page.getByRole('button', { name: finish, exact: true }).click()
    await expect(page.getByRole('button', { name: finish, exact: true })).toHaveAttribute('aria-pressed', 'true')
    const loaded = await page.locator('.leather-background__grain').evaluate(async (element) => {
      const url = getComputedStyle(element).backgroundImage.slice(5, -2)
      const image = new Image()
      image.src = url
      await image.decode()
      return image.naturalWidth > 0
    })
    expect(loaded).toBe(true)
  }
  await page.getByRole('button', { name: 'Hide labels' }).click()
  await expect(page.getByRole('heading')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show labels' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('dark light follows desktop pointer and respects reduced motion and mobile', async ({ page }, testInfo) => {
  await page.goto('/?component=leather-background&finish=dark&view=texture')
  const light = page.locator('.leather-background__light')
  await expect(page.locator('.leather-background')).toBeVisible()
  const translation = () => light.evaluate((element) => {
    const transform = getComputedStyle(element).transform
    return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m41
  })
  const size = page.viewportSize()!
  await page.mouse.move(size.width - 10, size.height / 2)
  if (testInfo.project.name === 'desktop') {
    await expect.poll(translation).toBeGreaterThan(size.width * 0.02)
    await page.mouse.move(10, size.height / 2)
    await expect.poll(translation).toBeLessThan(-size.width * 0.02)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(translation).toBe(0)
  } else {
    expect(await translation()).toBe(0)
    if (testInfo.project.name === 'mobile') await expect(light).toBeHidden()
  }
})

test('texture-only preview stays decorative and has responsive grain', async ({ page }, testInfo) => {
  await page.goto('/?component=leather-background&view=texture')
  await expect(page.locator('.leather-background__material')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('button')).toHaveCount(0)
  const size = await page.locator('.leather-background__grain').evaluate(e => getComputedStyle(e).backgroundSize)
  expect(size).toBe(testInfo.project.name === 'mobile' ? '340px 340px' : '480px 480px')
  await expect(page.locator('canvas')).toHaveCount(0)
})
