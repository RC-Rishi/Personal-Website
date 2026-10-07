import { test, expect, type Page } from '@playwright/test'

// Software WebGL in CI takes longer to settle the physics than a hardware GPU.
test.setTimeout(60000)

async function loadTilt(page: Page) {
  await page.goto('/?component=lanyard')
  await expect(page.locator('.lanyard-hit')).toHaveAttribute('data-ready', 'true', { timeout: 20000 })
  await page.getByRole('button', { name: 'Reset position' }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
  await page.getByText('Customize', { exact: false }).click()
}

async function sensor(page: Page, beta: number | null, gamma: number | null) {
  await page.evaluate(({ beta, gamma }) => {
    ;(window as typeof window & { tiltReading?: { beta: number | null; gamma: number | null } }).tiltReading = { beta, gamma }
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma }))
  }, { beta, gamma })
}

async function tiltX(page: Page) {
  return page.locator('.lanyard').evaluate(el => Number((el as HTMLElement).dataset.tiltX ?? 0))
}

test('tilt is opt-in, calibrates, moves real physics, is bounded, and settles', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    const state = window as typeof window & { tiltRequests: number }
    state.tiltRequests = 0
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: async () => { state.tiltRequests++; return 'granted' } })
    const draw = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      const canvas = this.canvas as HTMLCanvasElement
      if (canvas.dataset) canvas.dataset.drawCount = String(Number(canvas.dataset.drawCount ?? 0) + 1)
      return Reflect.apply(draw, this, args)
    }
  })
  await loadTilt(page)
  await sensor(page, 60, 25)
  expect(await page.evaluate(() => (window as typeof window & { tiltRequests: number }).tiltRequests)).toBe(0)
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'off')
  const original = await page.locator('.lanyard-hit').getAttribute('style')
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'waiting')
  expect(await page.evaluate(() => (window as typeof window & { tiltRequests: number }).tiltRequests)).toBe(1)
  // Chromium's sensor override delivers actual browser orientation events.
  const session = await page.context().newCDPSession(page)
  await session.send('DeviceOrientation.setDeviceOrientationOverride', { alpha: 0, beta: 60, gamma: 0 })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'active')
  await expect.poll(() => tiltX(page)).toBe(0)
  await session.send('DeviceOrientation.setDeviceOrientationOverride', { alpha: 0, beta: 60, gamma: 30 })
  await expect.poll(() => tiltX(page)).toBeGreaterThan(.12)
  await expect.poll(() => page.locator('.lanyard-hit').getAttribute('style')).not.toBe(original)
  await page.getByRole('slider', { name: 'Tilt strength' }).fill('100')
  await session.send('DeviceOrientation.setDeviceOrientationOverride', { alpha: 0, beta: 60, gamma: 89 })
  await expect.poll(() => tiltX(page)).toBeGreaterThan(.44)
  expect(await tiltX(page)).toBeLessThanOrEqual(.45)
  await expect.poll(() => page.locator('.lanyard-hit').evaluate(button => {
    const points = button.style.clipPath.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    return points.every((value, index) => value >= 0 && value <= (index % 2 ? button.clientHeight : button.clientWidth))
  })).toBe(true)
  await page.getByRole('button', { name: 'Calibrate', exact: true }).click()
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
  const canvas = page.locator('.lanyard canvas')
  await page.waitForTimeout(150)
  const count = await canvas.getAttribute('data-draw-count')
  await session.send('DeviceOrientation.setDeviceOrientationOverride', { alpha: 0, beta: 60, gamma: 89.5 }) // A sub-degree change must not wake the scene.
  await page.waitForTimeout(250)
  expect(await canvas.getAttribute('data-draw-count')).toBe(count)
  await page.screenshot({ path: `artifacts/handoff-review/lanyard-tilt-${testInfo.project.name}.png` })
  await page.getByRole('button', { name: 'Disable tilt', exact: true }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'off')
  await sensor(page, 60, -60)
  await expect.poll(() => tiltX(page)).toBe(0)
  await session.send('DeviceOrientation.clearDeviceOrientationOverride')
  await session.detach()
})

test('tilt pauses offscreen/reduced motion and reorients without jumps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    // A real sensor streams readings; keep them flowing during slow GPU frames.
    setInterval(() => {
      const reading = (window as typeof window & { tiltReading?: { beta: number | null; gamma: number | null } }).tiltReading
      if (reading) window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, ...reading }))
    }, 100)
  })
  await loadTilt(page)
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await sensor(page, 45, 0)
  await sensor(page, 45, 25)
  await expect.poll(() => tiltX(page)).toBeGreaterThan(.1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'paused')
  await sensor(page, 45, -25)
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await sensor(page, 45, -25)
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'active')
  await expect.poll(() => tiltX(page)).toBe(0)
  await page.locator('.lanyard').evaluate(el => { el.style.marginTop = '2000px' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-active', 'false')
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'paused')
  await sensor(page, 45, 80)
  await page.locator('.lanyard').evaluate(el => { el.style.marginTop = '' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'active')
  await sensor(page, 45, 80)
  await expect.poll(() => tiltX(page)).toBe(0)
  await page.evaluate(() => {
    Object.defineProperty(screen.orientation, 'angle', { configurable: true, value: 90 })
    screen.orientation.dispatchEvent(new Event('change'))
    ;(window as typeof window & { tiltReading?: { beta: number; gamma: number } }).tiltReading = { beta: 45, gamma: 0 }
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: 45, gamma: 0 }))
  })
  await sensor(page, 45, 0)
  await sensor(page, 75, 0)
  await expect.poll(() => tiltX(page)).toBeGreaterThan(.12)
  await sensor(page, null, null)
  expect(await tiltX(page)).toBeGreaterThan(.1)
  await page.getByRole('button', { name: 'Disable tilt', exact: true }).click()
})

test('sensor denial, missing readings, and late permission grants remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    const state = window as typeof window & { tiltPermission: string; resolveTilt?: (permission: string) => void }
    state.tiltPermission = 'denied'
    Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { value: () => state.tiltPermission === 'deferred'
      ? new Promise(resolve => { state.resolveTilt = resolve }) : Promise.resolve(state.tiltPermission) })
  })
  await loadTilt(page)
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'denied')
  await expect(page.getByRole('button', { name: 'Calibrate', exact: true })).toBeDisabled()
  await page.evaluate(() => { (window as typeof window & { tiltPermission: string }).tiltPermission = 'granted' })
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'unavailable', { timeout: 6000 })
  // A pending permission request must not block normal card interaction.
  await page.evaluate(() => { (window as typeof window & { tiltPermission: string }).tiltPermission = 'deferred' })
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'requesting')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.locator('.lanyard-hit').focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'moving')
  // Resolve while hidden: permission is retained, but sensing must remain paused.
  await page.locator('.lanyard').evaluate(el => { el.style.marginTop = '2000px' })
  await expect(page.locator('.lanyard')).toHaveAttribute('data-active', 'false')
  await page.evaluate(() => (window as typeof window & { resolveTilt?: (permission: string) => void }).resolveTilt?.('granted'))
  await expect(page.locator('.lanyard')).toHaveAttribute('data-tilt', 'paused')
})

test('dragging takes priority over tilt and sensor movement resumes on release', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await loadTilt(page)
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  await sensor(page, 60, 0)
  await sensor(page, 60, 30)
  await expect.poll(() => tiltX(page)).toBeGreaterThan(.12)
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
  await page.getByText('Customize', { exact: false }).click()
  const card = page.locator('.lanyard-hit')
  const center = await card.evaluate(button => {
    const coordinates = button.style.clipPath.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    const rect = button.getBoundingClientRect()
    return { x: rect.x + (coordinates[0] + coordinates[2]) / 2,
      y: rect.y + (coordinates[1] + coordinates[3] + coordinates[5] + coordinates[15]) / 4 }
  })
  const session = isMobile ? await page.context().newCDPSession(page) : undefined
  if (session) await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] })
  else { await page.mouse.move(center.x, center.y); await page.mouse.down() }
  await expect(card).toHaveAttribute('data-dragging', 'true')
  await sensor(page, 60, -30)
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  if (session) await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  else await page.mouse.up()
  await expect(card).toHaveAttribute('data-dragging', 'false')
  await expect.poll(() => tiltX(page)).toBeLessThan(-.12)
  await page.getByText('Customize', { exact: false }).click()
  await page.getByRole('button', { name: 'Disable tilt', exact: true }).click()
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  await session?.detach()
})

test('tilt follows screen gravity past upright and across equivalent Euler poses', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await loadTilt(page)
  await page.getByRole('button', { name: 'Enable tilt', exact: true }).click()
  // Past upright, positive gamma tips gravity left. Raw angle subtraction
  // previously sent the badge right instead.
  await sensor(page, 120, 0)
  await sensor(page, 120, 30)
  await expect.poll(() => tiltX(page)).toBeLessThan(-.12)
  await page.getByText('Customize', { exact: false }).click()
  await expect(page.locator('.lanyard')).toHaveAttribute('data-motion', 'resting', { timeout: 15000 })
  await page.screenshot({ path: `artifacts/handoff-review/lanyard-corrected-direction-${info.project.name}.png` })
  await page.getByText('Customize', { exact: false }).click()
  await sensor(page, 80, 89)
  await page.getByRole('button', { name: 'Calibrate', exact: true }).click()
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  // This large change in reported Euler angles describes a tiny physical
  // change near the representation seam, and must not kick the lanyard.
  await sensor(page, 100, -89)
  await expect.poll(async () => Math.abs(await tiltX(page))).toBeLessThan(.001)
  await expect.poll(() => page.locator('.lanyard').evaluate(el => Math.abs(Number(el.dataset.tiltY)))).toBeLessThan(.001)
  await page.getByRole('button', { name: 'Disable tilt', exact: true }).click()
})
