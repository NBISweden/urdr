// Takes one full-page screenshot of every page in the running dev
// stack and writes them to the shots/ directory under stable names,
// so that successive runs are comparable.
//
// Run it through the compose service:
//
//     docker compose --profile screenshots run --rm screenshots
//
// It logs in with the mock Redmine's default credentials; override
// URDR_USER / URDR_PASSWORD when running against something else.

const { chromium } = require('playwright')
const fs = require('fs')

const baseUrl = process.env.BASE_URL ?? 'http://localhost:4567'
const outDir = process.env.SHOTS_DIR ?? 'shots'

const pages = [
  { name: 'report', path: '/report' },
  { name: 'absence', path: '/absence' },
  { name: 'vacation', path: '/vacation' },
  { name: 'help', path: '/help' }
]

// The stack may still be starting up; Vite's first page load after a
// cold start is also slow, so be patient.
const waitForApp = async () => {
  const deadline = Date.now() + 120_000
  for (;;) {
    try {
      const response = await fetch(`${baseUrl}/login`)
      if (response.ok) return
    } catch {
      // Not up yet.
    }
    if (Date.now() > deadline) {
      throw new Error(`Gave up waiting for ${baseUrl}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

// A page is ready to shoot when the network has gone quiet and no
// loading overlay is left in the DOM.
const settle = async (page) => {
  await page.waitForLoadState('networkidle')
  await page
    .locator('.loading-overlay')
    .waitFor({ state: 'detached', timeout: 30_000 })
    .catch(() => {})
}

(async () => {
  await waitForApp()
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  })

  await page.goto(`${baseUrl}/login`)
  await settle(page)
  await page.screenshot({ path: `${outDir}/login.png`, fullPage: true })
  console.log('login.png')

  // Log in once; the session cookie then carries every other page.
  await page.fill('#username', process.env.URDR_USER ?? 'dev')
  await page.fill('#password', process.env.URDR_PASSWORD ?? 'dev')
  await page.click('.login-button')
  await page.waitForURL('**/report/**')

  for (const target of pages) {
    await page.goto(baseUrl + target.path)
    await settle(page)
    await page.screenshot({
      path: `${outDir}/${target.name}.png`,
      fullPage: true
    })
    console.log(`${target.name}.png`)
  }

  await browser.close()
})()
