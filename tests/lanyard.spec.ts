import { test, expect, type Page } from '@playwright/test'

// Full 3D load, physics, and artwork updates need extra time on software GPUs.
test.setTimeout(60000)

test('gallery loads the 3D assets only after selecting the lanyard', async ({ page }) => {
  const assets: string[] = []
  page.on('request', request => { if (request.url().includes('/assets/lanyard/')) assets.push(request.url()) })
  await page.goto('/')
  await expect(page.frameLocator('iframe').getByRole('button', { name: 'Cream', exact: true })).toBeVisible()
  expect(assets).toEqual([])
  await page.getByRole('button', { name: 'Interactive Lanyard' }).click()
  await page.locator('iframe').scrollIntoViewIfNeeded()
  await expect(page.frameLocator('iframe').locator('.lanyard-hit')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  expect(assets.some(url => url.endsWith('card.glb'))).toBe(true)
  await page.getByRole('button', { name: 'Leather Background' }).click()
  await expect(page.frameLocator('iframe').getByRole('button', { name: 'Cream', exact: true })).toBeVisible()
})

async function cardCenter(page: Page) {
  return page.locator('.lanyard-hit').evaluate(button => {
    const coordinates = button.style.clipPath.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    const rect = button.getBoundingClientRect()
    // Average the four card corners, excluding the clip extension.
    return { x: rect.x + (coordinates[0] + coordinates[2]) / 2,
      y: rect.y + (coordinates[1] + coordinates[3] + coordinates[5] + coordinates[15]) / 4 }
  })
}

async function loadCard(page: Page) {
  await page.goto('/?component=lanyard')
  await expect(page.locator('.lanyard-hit')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  await page.getByRole('button', { name: 'Reset position' }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
}

test('lanyard renders locally, supports keyboard movement, and resets', async ({ page }, testInfo) => {
  const errors: string[] = [], external: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().startsWith('http') && !request.url().includes('127.0.0.1')) external.push(request.url()) })
  await loadCard(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const center = await cardCenter(page)
  const card = page.locator('.lanyard-hit')
  await card.focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(async () => Math.abs((await cardCenter(page)).x - center.x)).toBeGreaterThan(5)
  await page.keyboard.press('Home')
  await expect.poll(async () => Math.abs((await cardCenter(page)).x - center.x)).toBeLessThan(2)
  await page.keyboard.press('Space')
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'moving')
  await page.keyboard.press('Home')
  await page.getByRole('button', { name: 'Reset position' }).focus()
  await page.screenshot({ path: `artifacts/references/lanyard/verified-${testInfo.project.name}.png` })
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('pointer drag follows the card and cancels cleanly', async ({ page, isMobile }) => {
  await loadCard(page)
  const start = await cardCenter(page)
  const card = page.locator('.lanyard-hit')
  const initialStyle = await card.getAttribute('style')
  if (isMobile) {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
    await expect(card).toHaveAttribute('data-dragging', 'true')
    for (let i = 1; i <= 10; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + i * 7, y: start.y - i * 4 }] })
    await expect.poll(async () => Math.abs((await cardCenter(page)).x - start.x)).toBeGreaterThan(10)
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
    await expect(card).toHaveAttribute('data-dragging', 'false')
    await session.detach()
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down()
    await expect(card).toHaveAttribute('data-dragging', 'true')
    await page.mouse.move(start.x + 110, start.y - 70, { steps: 20 })
    await expect.poll(() => card.getAttribute('style')).not.toBe(initialStyle)
    await page.mouse.up()
    await expect(card).toHaveAttribute('data-dragging', 'false')
    // Capture must also end if the window loses focus while holding the card.
    await page.getByRole('button', { name: 'Reset position' }).click()
    const reset = await cardCenter(page)
    await page.mouse.move(reset.x, reset.y); await page.mouse.down()
    await expect(card).toHaveAttribute('data-dragging', 'true')
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    await expect(card).toHaveAttribute('data-dragging', 'false')
    await page.mouse.up()
  }
  await page.getByRole('button', { name: 'Reset position' }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
})

test('custom colors and uploaded front/back images update without resetting controls', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await loadCard(page)
  await page.getByText('Customize', { exact: false }).click()
  await page.getByLabel('Card color').fill('#75322f')
  await page.getByLabel('Clip color').fill('#b4a16a')
  await page.getByLabel('Strap color').fill('#48386d')
  await expect(page.getByLabel('Printed strap')).not.toBeChecked()
  await page.getByLabel('Gravity', { exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByLabel('Gravity', { exact: true })).toHaveValue('61')
  await page.getByLabel('Front artwork').setInputFiles('public/assets/lanyard/front.png')
  await page.getByLabel('Back artwork').setInputFiles('public/assets/lanyard/front.png')
  await page.getByText('Customize', { exact: false }).click()
  await page.getByRole('button', { name: 'Reset position' }).click()
  await page.screenshot({ path: `artifacts/references/lanyard/custom-${testInfo.project.name}.png` })
  await page.getByText('Customize', { exact: false }).click()
  await expect(page.getByLabel('Card color')).toHaveValue('#75322f')
  await expect(page.getByLabel('Strap color')).toHaveValue('#48386d')
  expect(errors).toEqual([])
})

test('WebGL unavailable gives a readable static card', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2' || type === 'webgl') return null
      return Reflect.apply(getContext, this, [type, ...args])
    } as typeof getContext
  })
  await page.goto('/?component=lanyard')
  await expect(page.getByText('Static preview', { exact: false })).toBeVisible()
  await expect(page.getByTestId('lanyard-fallback').getByRole('img')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('rendering stops at rest and offscreen, then interaction resumes', async ({ page }) => {
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      const canvas = this.canvas as HTMLCanvasElement
      if (canvas.dataset) canvas.dataset.drawCount = String(Number(canvas.dataset.drawCount ?? 0) + 1)
      return Reflect.apply(draw, this, args)
    }
  })
  await loadCard(page)
  const canvas = page.locator('.lanyard canvas')
  // Wait for the finite warmup/asset frames to flush on software GPUs as well.
  await expect.poll(async () => {
    const before = await canvas.getAttribute('data-draw-count')
    await page.waitForTimeout(200)
    return await canvas.getAttribute('data-draw-count') === before
  }, { timeout: 5000 }).toBe(true)
  const count = await canvas.getAttribute('data-draw-count')
  expect(Number(count)).toBeGreaterThan(0)
  await page.waitForTimeout(350)
  expect(await canvas.getAttribute('data-draw-count')).toBe(count)
  await page.locator('.lanyard').evaluate(el => { el.style.marginTop = '2000px' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-active', 'false')
  await page.waitForTimeout(150)
  const hiddenCount = await canvas.getAttribute('data-draw-count')
  await page.waitForTimeout(350)
  expect(await canvas.getAttribute('data-draw-count')).toBe(hiddenCount)
  await page.locator('.lanyard').evaluate(el => { el.style.marginTop = '' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-active', 'true')
  await page.locator('.lanyard-hit').focus(); await page.keyboard.press('ArrowLeft')
  await expect.poll(async () => Number(await canvas.getAttribute('data-draw-count'))).toBeGreaterThan(Number(hiddenCount))
})

test('reduced motion starts hanging without an entrance drop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?component=lanyard')
  await expect(page.locator('.lanyard-hit')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-reduced-motion', 'true')
  const initial = await cardCenter(page)
  await page.waitForTimeout(400)
  const next = await cardCenter(page)
  expect(Math.abs(next.x - initial.x)).toBeLessThan(2)
  expect(Math.abs(next.y - initial.y)).toBeLessThan(2)
})
