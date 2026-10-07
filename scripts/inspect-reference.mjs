import { chromium, devices } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [rawUrl, label = 'reference'] = process.argv.slice(2)
if (!rawUrl) {
  console.error('Usage: npm run inspect -- https://example.com component-name')
  process.exit(1)
}
const url = new URL(rawUrl)
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP or HTTPS reference URL.')
const slug = label.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'reference'
const folder = path.resolve('artifacts', 'references', `${slug}-${Date.now()}`)
await mkdir(folder, { recursive: true })
const browser = await chromium.launch({ channel: process.env.LAB_BROWSER_CHANNEL ?? 'chrome' })
try {
  for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 1000 } }],
    ['mobile', devices['Pixel 7']],
  ]) {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(folder, `${name}.png`), fullPage: true })
    const details = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      headings: [...document.querySelectorAll('h1,h2,h3')].map((element) => ({ text: element.textContent?.trim(), tag: element.tagName })),
      elements: [...document.querySelectorAll('h1,h2,h3,button,a,canvas')].slice(0, 150).map((element) => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return { tag: element.tagName, text: element.textContent?.trim().slice(0, 160), fontFamily: style.fontFamily, fontSize: style.fontSize, color: style.color, background: style.backgroundColor, transform: style.transform, box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }
      }),
    }))
    await writeFile(path.join(folder, `${name}.json`), JSON.stringify({ ...details, errors, capturedAt: new Date().toISOString() }, null, 2))
    await context.close()
  }
  console.log(`Reference captures saved to ${folder}`)
} finally {
  await browser.close()
}
