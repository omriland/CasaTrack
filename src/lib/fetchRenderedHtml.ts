import { chromium } from 'playwright'

export async function fetchRenderedHtml(url: string, maxChars = 20000, options?: { raw?: boolean }) {
  const browser = await chromium.launch({ headless: true })
  try {
    const ctx = await browser.newContext({
      locale: 'he-IL',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    const page = await ctx.newPage()
    
    // Yad2 sometimes needs a bit to load the listing content
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // Extra wait for dynamic content
    await page.waitForTimeout(1500)

    const html = await page.content()
    if (options?.raw) {
      return html
    }
    const sanitized = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return sanitized.slice(0, maxChars)
  } finally {
    await browser.close()
  }
}
