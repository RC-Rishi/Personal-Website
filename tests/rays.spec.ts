import { test, expect } from '@playwright/test'

async function loadRays(page: import('@playwright/test').Page) {
  await page.goto('/?component=rays')
  await expect(page.locator('.rays')).toHaveAttribute('data-renderer', 'webgl')
}

test('rays render locally and controls change the light on desktop and touch', async ({ page }, testInfo) => {
  const errors: string[] = [], external: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().startsWith('http') && !request.url().includes('127.0.0.1')) external.push(request.url()) })
  await loadRays(page)
  await page.getByText('Shape the light', { exact: false }).click()
  await page.getByLabel('Animate', { exact: true }).uncheck()
  await expect(page.locator('.rays')).toHaveAttribute('data-animating', 'false')
  const before = await page.locator('.rays > canvas').screenshot()
  await page.getByLabel('First color', { exact: true }).fill('#ff8040')
  await page.getByLabel('Second color', { exact: true }).fill('#40cfff')
  await page.getByRole('slider', { name: 'Intensity', exact: true }).fill('65')
  await page.getByRole('slider', { name: 'Position', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('slider', { name: 'Position', exact: true })).toHaveValue('51')
  const after = await page.locator('.rays > canvas').screenshot()
  expect(after.equals(before)).toBe(false)
  await page.screenshot({ path: `artifacts/handoff-review/rays-custom-${testInfo.project.name}.png` })
  await page.getByRole('button', { name: 'Source defaults' }).click()
  await expect(page.getByLabel('First color')).toHaveValue('#ffffff')
  await expect(page.getByRole('slider', { name: 'Position', exact: true })).toHaveValue('80')
  await page.getByRole('button', { name: 'Live reference preset' }).click()
  await expect(page.getByLabel('First color')).toHaveValue('#639aff')
  await expect(page.getByRole('slider', { name: 'Intensity', exact: true })).toHaveValue('13')
  await page.getByText('Shape the light', { exact: false }).click()
  await page.getByRole('button', { name: 'Hide text' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('rays suspend actual draws when paused, reduced, zero speed, or offscreen', async ({ page }) => {
  await page.addInitScript(() => {
    const draw = WebGLRenderingContext.prototype.drawArrays
    WebGLRenderingContext.prototype.drawArrays = function (...args) {
      const canvas = this.canvas as HTMLCanvasElement
      canvas.dataset.drawCount = String(Number(canvas.dataset.drawCount ?? 0) + 1)
      return Reflect.apply(draw, this, args)
    }
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await loadRays(page)
  const host = page.locator('.rays'), canvas = page.locator('.rays > canvas')
  const stationary = async () => {
    await expect(host).toHaveAttribute('data-animating', 'false')
    await page.waitForTimeout(100)
    const count = await canvas.getAttribute('data-draw-count')
    await page.waitForTimeout(200)
    expect(await canvas.getAttribute('data-draw-count')).toBe(count)
  }
  await expect(host).toHaveAttribute('data-animating', 'true')
  const first = Number(await canvas.getAttribute('data-draw-count'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-draw-count'))).toBeGreaterThan(first)
  await page.getByText('Shape the light', { exact: false }).click()
  await page.getByLabel('Animate', { exact: true }).uncheck()
  await stationary()
  await page.getByLabel('Animate', { exact: true }).check()
  await page.getByRole('slider', { name: 'Speed', exact: true }).fill('0')
  await stationary()
  await page.getByRole('slider', { name: 'Speed', exact: true }).fill('10')
  await page.getByRole('slider', { name: 'Rays', exact: true }).fill('0')
  await stationary()
  await page.getByRole('slider', { name: 'Rays', exact: true }).fill('32')
  await expect(host).toHaveAttribute('data-animating', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stationary()
  await page.getByRole('slider', { name: 'Reach', exact: true }).fill('55')
  await stationary()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await stationary()
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')) })
  await host.evaluate(el => { el.style.marginTop = '2000px' })
  await expect(host).toHaveAttribute('data-active', 'false')
  await stationary()
  await host.evaluate(el => { el.style.marginTop = '' })
  await expect(host).toHaveAttribute('data-animating', 'true')
  const resumed = Number(await canvas.getAttribute('data-draw-count'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-draw-count'))).toBeGreaterThan(resumed)
})

test('rays use a fallback without WebGL and recover from context loss', async ({ page }) => {
  await loadRays(page)
  const host = page.locator('.rays')
  await page.locator('.rays > canvas').evaluate(canvas => {
    const extension = (canvas as HTMLCanvasElement).getContext('webgl')!.getExtension('WEBGL_lose_context')!
    ;(canvas as HTMLCanvasElement & { restoreContext: () => void }).restoreContext = () => extension.restoreContext()
    extension.loseContext()
  })
  await expect(host).toHaveAttribute('data-renderer', 'fallback')
  await expect(host).toHaveAttribute('data-animating', 'false')
  await page.locator('.rays > canvas').evaluate(canvas => {
    ;(canvas as HTMLCanvasElement & { restoreContext: () => void }).restoreContext()
  })
  await expect(host).toHaveAttribute('data-renderer', 'webgl')
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2') return null
      return Reflect.apply(getContext, this, [type, ...args])
    } as typeof getContext
  })
  await page.reload()
  await expect(host).toHaveAttribute('data-renderer', 'fallback')
  await page.getByText('Shape the light', { exact: false }).click()
  await page.getByLabel('First color').fill('#dc7040')
  await expect(page.locator('.rays-fallback')).toHaveCSS('--rays-first', '#dc7040')
})

test('gallery loads rays renderer only when selected and resizes its canvas', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => { if (request.url().includes('/rays/renderer')) requests.push(request.url()) })
  await page.goto('/')
  await expect(page.frameLocator('iframe').getByRole('button', { name: 'Cream', exact: true })).toBeVisible()
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Light Rays' }).click()
  // The collection now extends below a phone viewport. Rendering intentionally
  // stays asleep until the selected preview is actually scrolled into view.
  await page.locator('iframe').scrollIntoViewIfNeeded()
  const canvas = page.frameLocator('iframe').locator('.rays > canvas')
  await expect(page.frameLocator('iframe').locator('.rays')).toHaveAttribute('data-renderer', 'webgl')
  expect(requests.length).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Mobile', exact: true }).click()
  await expect.poll(() => canvas.evaluate(el => (el as HTMLCanvasElement).width === Math.round(el.getBoundingClientRect().width))).toBe(true)
  expect(await canvas.evaluate(el => (el as HTMLCanvasElement).width)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Tablet', exact: true }).click()
  // Narrow lab shells constrain the preview to their available width.
  await expect.poll(() => canvas.evaluate(el => (el as HTMLCanvasElement).width === Math.round(el.getBoundingClientRect().width))).toBe(true)
})
