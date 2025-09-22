import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchRenderedHtml } from '@/lib/fetchRenderedHtml'

// ------------------ Types & Validation ------------------
const PropertySchema = z.object({
  address: z.string().min(1),
  rooms: z.number().nullable().transform(n => (n ?? 0)),
  square_meters: z.number().nullable().transform(n => (n ?? 0)),
  asked_price: z.number().nullable().transform(n => (n ?? 0)),
  contact_name: z.string().nullable().default(null),
  contact_phone: z.string().nullable().default(null),
  property_type: z.enum(['New', 'Existing apartment']),
  description: z.string().nullable().default(null),
  apartment_broker: z.boolean().nullable().transform(v => v ?? false)
})

type PropertyData = z.infer<typeof PropertySchema>

// ------------------ Utilities ------------------
function sanitizeHtml(html: string, maxChars = 28000) {
  // First, try to extract text content from HTML
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ') // Remove ALL HTML tags to get pure text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (textContent.length <= maxChars) return textContent

  // keep head + tail to preserve important areas and reduce token use
  const head = textContent.slice(0, Math.floor(maxChars * 0.6))
  const tail = textContent.slice(-Math.floor(maxChars * 0.4))
  return `${head}\n...TRUNCATED...\n${tail}`
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 12000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 600) {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const delay = baseDelayMs * Math.pow(2, i) + Math.random() * 100
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// ------------------ Prompt ------------------
function buildMessages(url: string, pageText: string) {
  return [
    {
      role: "system",
      content: "You are a precise web data extractor. Always return ONLY a valid JSON object that matches the schema exactly. Do not include markdown, explanations, or extra keys. Use null when data is missing."
    },
    {
      role: "user" as const,
      content: `
Extract property data from this Yad2 real-estate listing page.

Return exactly this JSON schema:
{
  "address": string,
  "rooms": number,
  "square_meters": number,
  "asked_price": number,
  "contact_name": string | null,
  "contact_phone": string | null,
  "property_type": "New" | "Existing apartment",
  "description": string | null,
  "apartment_broker": boolean | null
}

Rules:
- rooms: numeric (allow decimals like 3.5).
- square_meters: numeric (strip units, prefer "מ"ר בנוי" if available).
- asked_price: numeric (strip ₪/NIS and separators).
- contact_phone: null if not visible.
- property_type: "New" if project/off-plan, else "Existing apartment".
- apartment_broker: true if clearly agency/broker, false if clearly private, null if impossible to tell.
- description: short text summary, plain text, null if none.

PAGE CONTENT:
${pageText.slice(0, 15000)}
`
    }
  ]
}

// ------------------ Handler ------------------
export async function POST(request: NextRequest) {
  try {
    // Debug: Check if API key is loaded
    console.log('Environment check:')
    console.log('- API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('- API Key length:', process.env.OPENAI_API_KEY?.length)
    console.log('- API Key format check:', process.env.OPENAI_API_KEY?.startsWith('sk-') ? 'Valid format' : 'Invalid format')
    
    const { url } = await request.json()

    if (!url || !/^https?:\/\/(www\.)?yad2\.co\.il\/realestate\/item\//.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Yad2 listing URL' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key missing from environment')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 1) Fetch Yad2 page using Playwright (renders JavaScript)
    let pageText: string
    try {
      pageText = await retry(() => fetchRenderedHtml(url, 20000))
    } catch (error) {
      console.error('Failed to fetch page with Playwright:', error)
      return NextResponse.json({ 
        error: 'Failed to load the Yad2 page. Please check the URL and try again.',
        debug: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }
    
    // Debug: Log content indicators
    console.log(`Page content length: ${pageText.length} chars`)
    
    // Check for CAPTCHA
    if (pageText.includes('ShieldSquare') || pageText.includes('Captcha') || pageText.length < 500) {
      console.error('CAPTCHA detected or insufficient content')
      return NextResponse.json({ 
        error: 'Yad2 is blocking automated access with CAPTCHA. Please try copying the property details manually.',
        tip: 'This is a security measure by Yad2. Consider using their API if available, or manually copying the key details.'
      }, { status: 403 })
    }
    
    // Log first 1000 chars to see what we're getting
    console.log('Page content preview:', pageText.substring(0, 1000).replace(/\s+/g, ' '))
    
    // Also extract pure text content for pattern matching
    const textContent = pageText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Try different pattern variations on text content
    const priceMatch = textContent.match(/₪\s*[\d,]+/) || textContent.match(/[\d,]+\s*₪/) || textContent.match(/מחיר[:\s]*[\d,]+/)
    const roomsMatch = textContent.match(/(\d+(?:\.\d+)?)\s*חדרים/) || textContent.match(/חדרים[:\s]*(\d+(?:\.\d+)?)/)
    const sizeMatch = textContent.match(/(\d+)\s*מ[״"״]ר/) || textContent.match(/מ[״"״]ר[:\s]*(\d+)/)
    
    console.log('Found patterns:', {
      price: priceMatch?.[0] || 'not found',
      rooms: roomsMatch?.[0] || 'not found',
      size: sizeMatch?.[0] || 'not found'
    })

    // 2) Send to OpenAI (with retry)
    const body = {
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 900,
      messages: buildMessages(url, pageText)
    }

    const openaiRes = await retry(async () => {
      const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }, 15000)
      if (!r.ok) {
        const t = await r.text()
      console.error(`OpenAI API Error - Status: ${r.status}`)
      console.error(`OpenAI API Error - Status Text: ${r.statusText}`)
      console.error(`OpenAI API Error - Headers:`, Object.fromEntries(r.headers.entries()))
      console.error(`OpenAI API Error - Response: ${t.slice(0, 800)}`)
      console.error(`OpenAI API Key (first 20 chars): ${process.env.OPENAI_API_KEY?.slice(0, 20)}...`)
      console.error(`OpenAI API Key (last 10 chars): ...${process.env.OPENAI_API_KEY?.slice(-10)}`)
      
      // Try to parse as JSON to get error details
      try {
        const errorJson = JSON.parse(t)
        console.error('OpenAI API Error JSON:', errorJson)
      } catch {
        console.error('Response is not JSON, likely an HTML error page')
      }
      
      throw new Error(`OpenAI ${r.status}: ${t.slice(0, 400)}`)
      }
      return r
    })

    const openaiJson = await openaiRes.json()
    const extracted = openaiJson?.choices?.[0]?.message?.content

    if (!extracted) {
      return NextResponse.json({ error: 'No data extracted from OpenAI' }, { status: 502 })
    }

    // 3) Parse + validate strictly
    let candidate: unknown
    try {
      candidate = JSON.parse(extracted)
    } catch {
      return NextResponse.json(
        { error: 'OpenAI returned non-JSON content', debug: extracted.slice(0, 500) },
        { status: 502 }
      )
    }

    console.log('Raw extracted data from OpenAI:', candidate)
    
    const parsed = PropertySchema.safeParse(candidate)
    if (!parsed.success) {
      console.error('Validation failed. Received data:', candidate)
      console.error('Validation errors:', JSON.stringify(parsed.error.errors, null, 2))
      return NextResponse.json(
        { error: 'Extracted JSON failed validation', issues: parsed.error.format(), debug: extracted.slice(0, 500), receivedData: candidate },
        { status: 422 }
      )
    }

    const data: PropertyData = parsed.data

    // 4) Minimal sanity checks (address must exist)
    if (!data.address || data.address.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract property address from the listing' }, { status: 400 })
    }

    // 5) Return
    return NextResponse.json({
      success: true,
      data,
      debug: {
        model: body.model,
        used_chars: pageText.length
      }
    })
  } catch (err: any) {
    console.error('Property extraction error:', err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
