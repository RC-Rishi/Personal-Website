import { test, expect, type Page } from '@playwright/test'

const url = '/?component=sharingan-preloader'
const loader = (page: Page) => page.locator('.sharing-preloader')
const ready = (page: Page) => expect(loader(page)).toHaveAttribute('data-phase', 'ready', { timeout: 15000 })

test('real assets prepare behind an inert overlay and keyboard entry restores focus', async ({ page }, info) => {
  const errors: string[] = [], external: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().startsWith('http') && !request.url().includes('127.0.0.1')) external.push(request.url()) })
  await page.goto(url)
  await expect(page.locator('.preloader-destination')).toHaveAttribute('inert', '')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
  await ready(page)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  await page.screenshot({ path: `artifacts/references/sharingan-preloader/ready-${info.project.name}.png` })
  await page.getByRole('button', { name: 'Continue' }).focus()
  await page.keyboard.press('Enter')
  await expect(loader(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page.locator('.preloader-destination')).not.toHaveAttribute('inert')
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `artifacts/references/sharingan-preloader/entered-${info.project.name}.png` })
  expect(errors).toEqual([]); expect(external).toEqual([])
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('early scroll is discarded, slow loading waits, and deliberate scroll enters', async ({ page, isMobile }, info) => {
  await page.goto(`${url}&load=slow`)
  await expect(loader(page)).toHaveAttribute('data-phase', 'loading', { timeout: 7000 })
  await page.mouse.move(150, 220); await page.mouse.wheel(0, 700)
  await expect(loader(page)).toHaveAttribute('data-phase', 'loading')
  const progress = Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))
  expect(progress).toBeLessThan(100)
  await page.screenshot({ path: `artifacts/references/sharingan-preloader/loading-${info.project.name}.png` })
  await ready(page)
  await page.waitForTimeout(250)
  await expect(loader(page)).toHaveAttribute('data-phase', 'ready')
  if (isMobile) {
    const session = await page.context().newCDPSession(page)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: 450 }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 160, y: 360 }] })
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await session.detach()
  } else {
    await page.mouse.wheel(0, 5)
    await expect(loader(page)).toHaveAttribute('data-phase', 'ready')
    await page.mouse.wheel(0, 100)
  }
  await expect(loader(page)).toHaveCount(0)
})

test('pacing presets and replay restart a complete entrance', async ({ page }, info) => {
  await page.goto(url)
  await ready(page)
  await page.getByText('Preview settings', { exact: false }).click()
  await page.getByLabel('Pacing', { exact: true }).selectOption('cinematic')
  const start = Date.now()
  await ready(page)
  const elapsed = Date.now() - start
  if (info.project.name !== 'reduced-motion') {
    expect(elapsed).toBeGreaterThan(2500)
    expect(elapsed).toBeLessThan(4200)
  }
  else expect(elapsed).toBeLessThan(2500)
  await page.getByLabel('Pacing', { exact: true }).selectOption('compact')
  const compactStart = Date.now()
  await ready(page)
  if (info.project.name !== 'reduced-motion') {
    expect(Date.now() - compactStart).toBeGreaterThan(1550)
    expect(Date.now() - compactStart).toBeLessThan(3300)
  }
  await page.getByText('Preview settings', { exact: false }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(loader(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Replay' }).click()
  await ready(page)
  await expect(page.locator('.preloader-destination')).toHaveAttribute('data-entered', 'false')
})

test('failed destination assets resolve to a usable fallback', async ({ page }) => {
  await page.route('**/assets/leather-background/leather.webp', route => route.abort())
  await page.goto(url)
  await ready(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.locator('.preloader-destination')).toHaveAttribute('data-fallback', 'true')
  await expect(page.getByText('A simplified background is ready.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore the collection' })).toBeVisible()
})

test('progress stays monotonic and reaching 100 alone cannot authorize entry', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/tests/fixtures/preloader.html')
  await page.getByRole('button', { name: '80 percent' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80')
  await expect(page.locator('.sharing-percent')).toHaveText('80%')
  await expect.poll(() => page.locator('.sharing-progress-arc').evaluate(el => Number.parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(20, 1)
  await page.getByRole('button', { name: '30 percent' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80')
  await expect(page.locator('.sharing-percent')).toHaveText('80%')
  await page.getByRole('button', { name: '100 percent' }).click()
  await expect(loader(page)).toHaveAttribute('data-phase', 'loading', { timeout: 5000 })
  await page.waitForTimeout(350)
  await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirm ready' }).click()
  await ready(page)
  // Prop changes after the ready state must rebuild without retaining old nodes/timelines.
  await page.getByRole('button', { name: 'Change pacing' }).click()
  await ready(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.mouse.move(150, 250); await page.mouse.wheel(0, 300); await page.keyboard.press('PageDown')
  await expect(page.getByLabel('Exit calls')).toHaveText('1')
  await page.waitForTimeout(300)
  await expect(page.getByLabel('Exit calls')).toHaveText('1')
  expect(errors).toEqual([])
})

test('hidden animations pause and resizing keeps the portal covering the viewport', async ({ page }, info) => {
  await page.goto(url)
  await ready(page)
  await loader(page).evaluate(el => { el.style.transform = 'translateY(200vh)' })
  await expect(loader(page)).toHaveAttribute('data-paused', 'true')
  const rotor = page.locator('.sharing-rotor')
  const transform = await rotor.evaluate(el => getComputedStyle(el).transform)
  await page.waitForTimeout(200)
  expect(await rotor.evaluate(el => getComputedStyle(el).transform)).toBe(transform)
  await loader(page).evaluate(el => { el.style.transform = '' })
  await expect(loader(page)).toHaveAttribute('data-paused', 'false')
  await page.setViewportSize({ width: 780, height: 390 })
  await expect(page.getByRole('button', { name: 'Continue' })).toBeInViewport()
  if (info.project.name !== 'reduced-motion') {
    // Sample every frame: the fully opaque portal exists for less than a
    // default assertion polling interval before the prepared screen is revealed.
    await page.evaluate(() => {
      const state = { covered: false }
      Object.assign(window, { portalReview: state })
      const sample = () => {
        const root = document.querySelector<HTMLElement>('.sharing-preloader')
        const portal = document.querySelector<HTMLElement>('.sharing-portal')
        if (!root || !portal) return
        const rect = portal.getBoundingClientRect()
        const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2
        const distance = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
        if (rect.width / 2 >= distance && Number(getComputedStyle(root).opacity) > .98) state.covered = true
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(loader(page)).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { portalReview: { covered: boolean } }).portalReview.covered)).toBe(true)
  } else await page.getByRole('button', { name: 'Continue' }).click()
  await expect(loader(page)).toHaveCount(0)
})

test('reduced motion is static while loading and uses a short fade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${url}&load=slow`)
  await expect(loader(page)).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.locator('.sharing-rotor')).toHaveCSS('animation-name', 'none')
  const path = await page.locator('.sharing-arm').first().getAttribute('transform')
  await page.waitForTimeout(300)
  expect(await page.locator('.sharing-arm').first().getAttribute('transform')).toBe(path)
  await ready(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(loader(page)).toHaveCount(0, { timeout: 1800 })
})

test('scenario changes cancel pending loading and animation before replay', async ({ page }) => {
  await page.goto(`${url}&load=slow`)
  await page.getByText('Preview settings', { exact: false }).click()
  await page.getByLabel('Loading', { exact: true }).selectOption('failure')
  await expect(page.getByText('SIMULATING AN ASSET FAILURE', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Replay' }).click()
  await ready(page)
  await page.getByText('Preview settings', { exact: false }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.locator('.preloader-destination')).toHaveAttribute('data-fallback', 'true')
  await page.waitForTimeout(2000)
  await expect(loader(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
})

test('awakening bursts the commas and brings in an oversized edge-bleeding vortex', async ({ page }, info) => {
  test.skip(info.project.name === 'reduced-motion', 'Decorative motion is intentionally absent.')
  await page.goto('/tests/fixtures/preloader.html')
  await expect(loader(page)).toHaveAttribute('data-phase', 'loading')
  await page.getByRole('button', { name: '100 percent' }).click()
  await page.locator('.sharing-preloader').evaluate(root => {
    const review = { shock: false, burst: false, incoming: false }
    Object.assign(window, { awakeningReview: review })
    const sample = () => {
      if (!root.isConnected || root.getAttribute('data-phase') === 'ready') return
      const shock = root.querySelector<SVGCircleElement>('.sharing-shock')!
      const arm = root.querySelector<SVGPathElement>('.sharing-arm')!
      const aura = root.querySelector<HTMLElement>('.sharing-tempest')!
      review.shock ||= Number(getComputedStyle(shock).opacity) > .15
      review.burst ||= Number(getComputedStyle(arm).opacity) < .6 && arm.getAttribute('d') !== null
      review.incoming ||= Number(getComputedStyle(aura).opacity) > .3 && aura.getBoundingClientRect().width > innerWidth * 1.5
      requestAnimationFrame(sample)
    }
    sample()
  })
  await page.getByRole('button', { name: 'Confirm ready' }).click()
  await ready(page)
  expect(await page.evaluate(() => (window as unknown as { awakeningReview: unknown }).awakeningReview)).toEqual({ shock: true, burst: true, incoming: true })
  const aura = await page.locator('.sharing-tempest').boundingBox()
  const viewport = page.viewportSize()!
  expect(aura!.width).toBeGreaterThan(viewport.width)
  expect(aura!.height).toBeGreaterThan(viewport.height)
  await expect(page.locator('.sharing-ring')).toHaveCSS('opacity', '0')
  await expect(page.locator('.sharing-arm').first()).toHaveCSS('opacity', '0')
})

test('paper, ink and matte controls apply live and persist through replay', async ({ page }) => {
  await page.goto(url)
  await ready(page)
  await page.getByText('Preview settings', { exact: false }).click()
  await page.getByRole('textbox', { name: 'Paper hex' }).fill('#d4c1a2')
  await page.getByRole('textbox', { name: 'Ink hex' }).fill('#3b1823')
  await page.getByRole('slider', { name: 'Matte strength' }).fill('0')
  await expect(loader(page)).toHaveCSS('background-color', 'rgb(212, 193, 162)')
  await expect(loader(page)).toHaveCSS('color', 'rgb(59, 24, 35)')
  await expect(page.locator('.sharing-paper')).toHaveCSS('opacity', '0')
  await expect(loader(page)).toHaveAttribute('data-phase', 'ready')
  await page.getByRole('slider', { name: 'Matte strength' }).fill('99')
  await page.getByRole('slider', { name: 'Matte strength' }).press('ArrowRight')
  await expect(page.locator('.sharing-paper')).toHaveCSS('opacity', '1')
  await page.getByRole('textbox', { name: 'Paper hex' }).fill('#oops')
  await expect(page.getByRole('textbox', { name: 'Paper hex' })).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Replay', exact: false }).click()
  await ready(page)
  await expect(loader(page)).toHaveCSS('background-color', 'rgb(212, 193, 162)')
  await expect(page.locator('.sharing-paper')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Reset appearance' }).click()
  await expect(page.locator('.sharing-paper')).toHaveCSS('opacity', '0.68')
  await expect(page.getByRole('textbox', { name: 'Paper hex' })).toHaveValue('#8bbdb8')
})
