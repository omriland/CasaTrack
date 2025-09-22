import { chromium } from 'playwright'
import fs from 'node:fs/promises'

function sanitizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchRenderedHtml(url, maxChars = 20000, { raw = false } = {}) {
  const browser = await chromium.launch({ headless: true })
  try {
    const ctx = await browser.newContext({
      locale: 'he-IL',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1500)
    const html = await page.content()
    if (raw) return html
    const sanitized = sanitizeHtml(html)
    return sanitized.slice(0, maxChars)
  } finally {
    await browser.close()
  }
}

async function main() {
  const url = process.argv[2]
  const outPath = process.argv[3] || './page.html'
  const maxChars = Number(process.argv[4]) || 20000
  const mode = (process.argv[5] || '').toLowerCase()
  const raw = mode === 'raw' || process.env.RAW_HTML === '1'
  if (!url) {
    console.error('Usage: node scripts/fetch-html.mjs <url> [outPath] [maxChars] [raw]')
    process.exit(1)
  }
  const html = await fetchRenderedHtml(url, maxChars, { raw })
  await fs.writeFile(outPath, html, 'utf8')
  console.log(`Saved ${html.length} chars to ${outPath} ${raw ? '(raw)' : ''}`)
}

main().catch(err => {
  console.error('Failed:', err?.message || err)
  process.exit(1)
})


