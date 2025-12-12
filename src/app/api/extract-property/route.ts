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
// (Removed unused helpers: sanitizeHtml, compressHtml, headTail)

// Extract concise evidence from raw HTML using user-provided selectors/patterns
function buildEvidenceFromHtml(html: string) {
  const pick = (re: RegExp) => {
    const m = html.match(re)
    return m ? m[1].trim() : null
  }

  // Address
  const address = pick(/<span[^>]*data-testid=["']address-line["'][^>]*>([^<]+)<\/span>/)

  // Price
  const asked_price_raw = pick(/data-testid=["']price["'][^>]*>([\d.,\s]+₪)<\/span>/)

  // Details line with rooms and meters
  const detailsLine = pick(/property-ad-card_PropertyDetailsBox__[a-zA-Z0-9_\-]+[\s\S]*?<span>([^<]+)<\/span>/)
  let rooms_from_details: string | null = null
  let meters_from_details: string | null = null
  if (detailsLine) {
    const rm = detailsLine.match(/(\d+(?:\.\d+)?)\s*חדרים/)
    rooms_from_details = rm ? rm[1] : null
    const sm = detailsLine.match(/(\d+)\s*מ["״']?ר/)
    meters_from_details = sm ? sm[1] : null
  }

  // Built meters override
  const builtMeters = pick(/<dd[^>]*class=["'][^"']*item-detail_label__FnhAu[^"']*["'][^>]*>\s*מ״ר\s*בנוי\s*<\/dd>\s*<dt[^>]*data-testid=["']item-detail["'][^>]*>\s*(\d+)\s*מ/)
  const square_meters_source = builtMeters || meters_from_details

  // Contact
  const contact_name = pick(/agency-ad-contact-info_name__[a-zA-Z0-9_\-]+[^>]*>([^<]+)<\/span>/)
  const contact_phone = pick(/href=["']tel:([^"']+)["']/)

  // Description (fallback from og:description)
  const description = pick(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/)

  // Broker: presence of agency container implies broker true
  const broker = /agency-ad-contact-info_details__/i.test(html) || /broker|agency|תיווך/i.test(html)

  return {
    address,
    asked_price_raw,
    details_line: detailsLine,
    rooms_from_details,
    square_meters_source,
    built_meters: builtMeters,
    contact_name,
    contact_phone,
    description,
    apartment_broker_inferred: broker ? 'true' : 'false'
  }
}

function extractFirstJsonObject(text: string): string | null {
  if (!text) return null
  // Strip code fences if present
  const unfenced = text.replace(/^```[a-zA-Z]*\n|```$/g, '')
  // Find first balanced { ... }
  const start = unfenced.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        return unfenced.slice(start, i + 1)
      }
    }
  }
  return null
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 60000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 800) {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastErr = err
      const delay = baseDelayMs * Math.pow(2, i) + Math.random() * 100
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

// ------------------ Prompt ------------------
function buildImageMessages() {
  return [
    {
      role: "system",
      content: `Extract structured property data from a Yad2 real estate listing screenshot/image.

Identify key property details as accurately as possible—including price, address, number of rooms, area in square meters, contact information, property type, description, and apartment broker status—following the mapping and logic specified in the target schema below.

**Before outputting any conclusions or final data, think step-by-step about where each detail is found, how ambiguous or missing information is interpreted, and how inconsistent formatting is handled. Record your reasoning process first, then produce only the resulting structured JSON.**

If data is incomplete or not present, handle nullable fields according to the schema (i.e., set as \`null\` or, after transformation, to the proper default); never fill in information beyond what is provided or confidently inferred from the input. For numeric fields, strip any units or currency symbols found in the source.

For the description field specifically:
- If the image contains a property description in Hebrew (עברית), extract it COMPLETELY and PRESERVE IT AS-IS. Do not summarize, edit, or shorten Hebrew descriptions.
- Preserve all Hebrew text exactly as it appears in the image, including all details, features, and information.
- Only if there is no Hebrew description present, you may set description to null.

- Do not summarize or comment—output only the structured data.
- Provide output in JSON format matching this exact schema (with these precise property names and value types):

{ "address": "[string, required, never empty]", "rooms": [number, nullable, \`null\` becomes 0], "square_meters": [number, nullable, \`null\` becomes 0], "asked_price": [number, nullable, \`null\` becomes 0], "contact_name": [string, nullable, default null], "contact_phone": [string, nullable, default null], "property_type": ["New" | "Existing apartment"], "description": [string, nullable, default null], "apartment_broker": [boolean, nullable, \`null\` becomes false] }

Field mapping:
- address: The full location string, must not be empty.
- rooms: The number of rooms; input \`null\` transforms to \`0\`.
- square_meters: The area in square meters as a number; input \`null\` transforms to \`0\`.
- asked_price: Numeric asking price; input \`null\` transforms to \`0\`.
- contact_name: Name of contact person; default is \`null\` if not present.
- contact_phone: Phone number for contact; default is \`null\` if not present.
- property_type: Must be exactly "New" or "Existing apartment" (classify based on provided cues; if unclear, choose "Existing apartment").
- description: Textual description; default is \`null\` if not present.
  - For images: If Hebrew description exists, preserve it completely as-is. Do not summarize Hebrew text.
  - For HTML: Keep it concise and high-signal (1-2 sentences summary of key selling points).
- apartment_broker: Boolean indicating if a broker is involved; nullable input transforms to \`false\` (use explicit cues such as broker/company names/labels if possible).

When writing JSON, replace any missing or null values with the schema's default transformation where appropriate (e.g., \`null\` for contact fields, \`0\` for numbers, \`false\` for booleans).

# Steps

1. Analyze the HTML/text to find relevant values for each schema field, noting how you dealt with any ambiguities or missing data.
2. Map each discovered value into the schema, handling required value transformations or defaults as described.
3. Produce the final output as a single, minified JSON object conforming to the schema above.

# Output Format

First provide step-by-step reasoning as a bulleted list. 
Then output only the final JSON object, matching the schema above, in a single block and **without extra commentary or formatting**. (Do not include extra whitespace. Do not output Markdown or code blocks.)

# Notes
- Never output Markdown or commentary—output must be only valid JSON after reasoning.
- Always provide reasoning before the JSON, never after.
- Always match the exact field names and types; only values from the schema.
- If you cannot infer a value, use the schema's default/null/false settings as instructed.
- Persist and chain your reasoning to ensure fully complete and accurate extractions, including for complex or nested inputs.

Your objective is: Extract property details from a Yad2 listing screenshot/image, following step-by-step reasoning before outputting only the final JSON structure according to the PropertySchema as shown.`
    }
  ]
}

function buildMessages(url: string, pageText: string) {
  return [
    {
      role: "system",
      content: `Extract structured property data from a real estate webpage (yad2), given its HTML or raw content.

Identify key property details as accurately as possible—including price, address, number of rooms, area in square meters, contact information, property type, description, and apartment broker status—following the mapping and logic specified in the target schema below.

**Before outputting any conclusions or final data, think step-by-step about where each detail is found, how ambiguous or missing information is interpreted, and how inconsistent formatting is handled. Record your reasoning process first, then produce only the resulting structured JSON.**

If data is incomplete or not present, handle nullable fields according to the schema (i.e., set as \`null\` or, after transformation, to the proper default); never fill in information beyond what is provided or confidently inferred from the input. For numeric fields, strip any units or currency symbols found in the source.

For the description field specifically, DO NOT copy the entire Yad2 description verbatim. Instead, produce a brief (1–2 sentences) agent-curated summary of only the most relevant selling points of the property (e.g., rooms, floor, size, standout features, location highlights). Omit boilerplate marketing language and generic fluff.

- Do not summarize or comment—output only the structured data.
- Provide output in JSON format matching this exact schema (with these precise property names and value types):

{ "address": "[string, required, never empty]", "rooms": [number, nullable, \`null\` becomes 0], "square_meters": [number, nullable, \`null\` becomes 0], "asked_price": [number, nullable, \`null\` becomes 0], "contact_name": [string, nullable, default null], "contact_phone": [string, nullable, default null], "property_type": ["New" | "Existing apartment"], "description": [string, nullable, default null], "apartment_broker": [boolean, nullable, \`null\` becomes false] }

Field mapping:
- address: The full location string, must not be empty.
- rooms: The number of rooms; input \`null\` transforms to \`0\`.
- square_meters: The area in square meters as a number; input \`null\` transforms to \`0\`.
- asked_price: Numeric asking price; input \`null\` transforms to \`0\`.
- contact_name: Name of contact person; default is \`null\` if not present.
- contact_phone: Phone number for contact; default is \`null\` if not present.
- property_type: Must be exactly "New" or "Existing apartment" (classify based on provided cues; if unclear, choose "Existing apartment").
- description: Textual description; default is \`null\` if not present.
  - For images: If Hebrew description exists, preserve it completely as-is. Do not summarize Hebrew text.
  - For HTML: Keep it concise and high-signal (1-2 sentences summary of key selling points).
- apartment_broker: Boolean indicating if a broker is involved; nullable input transforms to \`false\` (use explicit cues such as broker/company names/labels if possible).

When writing JSON, replace any missing or null values with the schema's default transformation where appropriate (e.g., \`null\` for contact fields, \`0\` for numbers, \`false\` for booleans).

# Steps

1. Analyze the HTML/text to find relevant values for each schema field, noting how you dealt with any ambiguities or missing data.
2. Map each discovered value into the schema, handling required value transformations or defaults as described.
3. Produce the final output as a single, minified JSON object conforming to the schema above.

# Output Format

First provide step-by-step reasoning as a bulleted list. 
Then output only the final JSON object, matching the schema above, in a single block and **without extra commentary or formatting**. (Do not include extra whitespace. Do not output Markdown or code blocks.)

# Notes
- Never output Markdown or commentary—output must be only valid JSON after reasoning.
- Always provide reasoning before the JSON, never after.
- Always match the exact field names and types; only values from the schema.
- If you cannot infer a value, use the schema's default/null/false settings as instructed.
- Persist and chain your reasoning to ensure fully complete and accurate extractions, including for complex or nested inputs.

Your objective is: Extract property details from yad2 HTML or textual content, following step-by-step reasoning before outputting only the final JSON structure according to the PropertySchema as shown.`
    },
    {
      role: "user" as const,
      content: `
Extract property data from this Yad2 real-estate listing page and return a JSON object.

Find these fields if they exist in the page:
- address: full property address
- rooms: number of rooms (חדרים)
- square_meters: property size in square meters (מ״ר)
- asked_price: listing price in Israeli Shekels (₪) - convert to number
- contact_name: seller/agent name
- contact_phone: phone number
- property_type: "New" or "Existing apartment"
- description: brief property description
- apartment_broker: true if broker/agency, false if private, null if unclear

Return JSON:
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

PAGE CONTENT:
${pageText}
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
    
    const { url, html, image } = await request.json()

    if (!url && !image && !html) {
      return NextResponse.json({ error: 'Provide one of: url, html, or image' }, { status: 400 })
    }
    if (url && !/^https?:\/\/(www\.)?yad2\.co\.il\/realestate\/item\//.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid Yad2 listing URL' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key missing from environment')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // 1) If image provided, skip page fetch and go straight to vision extraction
    if (typeof image === 'string' && image.startsWith('data:image')) {
      const visionSystem = buildImageMessages()[0]
      const visionUser = {
        role: 'user' as const,
        content: [
          { 
            type: 'text', 
            text: `Extract property data from this Yad2 listing screenshot and return a JSON object.

Find these fields if they exist in the image:
- address: full property address
- rooms: number of rooms (חדרים)
- square_meters: property size in square meters (מ״ר)
- asked_price: listing price in Israeli Shekels (₪) - convert to number
- contact_name: seller/agent name
- contact_phone: phone number
- property_type: "New" or "Existing apartment"
- description: If there is a Hebrew description (תיאור), extract it COMPLETELY and preserve it as-is. Do not summarize or shorten Hebrew text.
- apartment_broker: true if broker/agency, false if private, null if unclear

Return JSON matching the schema. Remember: preserve Hebrew descriptions completely as they appear in the image.` 
          },
          { type: 'image_url', image_url: { url: image } }
        ]
      }
      // Try GPT-5.2 first, fallback to GPT-4o if model not available
      let body = {
        model: 'gpt-5.2', // Using GPT-5.2 for improved image extraction and larger output capacity
        max_tokens: 15000, // Increased for very long Hebrew descriptions (can go up to 128,000 if needed)
        messages: [visionSystem, visionUser]
      }
      
      let openaiRes
      try {
        openaiRes = await retry(async () => {
          const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          }, 90000)
          if (!r.ok) {
            const t = await r.text()
            console.error(`OpenAI API Error - Status: ${r.status}`)
            console.error(`OpenAI API Error - Response: ${t.slice(0, 800)}`)
            throw new Error(`OpenAI ${r.status}: ${t.slice(0, 400)}`)
          }
          return r
        })
      } catch (error) {
        // Check if error is due to model not found, then try fallback
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('model_not_found') || errorMessage.includes('model')) {
          console.log('GPT-5.2 not available, falling back to GPT-4o')
          body.model = 'gpt-4o'
          body.max_tokens = 8000 // GPT-4o has lower max tokens
          try {
            openaiRes = await retry(async () => {
              const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
              }, 90000)
              if (!r.ok) {
                const t = await r.text()
                throw new Error(`OpenAI ${r.status}: ${t.slice(0, 400)}`)
              }
              return r
            })
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            console.error('Image extraction API error (fallback also failed):', fallbackMessage)
            return NextResponse.json({ 
              error: 'Failed to extract property data from image',
              details: fallbackMessage
            }, { status: 500 })
          }
        } else {
          console.error('Image extraction API error:', errorMessage)
          return NextResponse.json({ 
            error: 'Failed to extract property data from image',
            details: errorMessage
          }, { status: 500 })
        }
      }
      const openaiJson = await openaiRes.json()
      let extracted = openaiJson?.choices?.[0]?.message?.content
      if (!extracted) {
        return NextResponse.json({ error: 'No data extracted from OpenAI' }, { status: 502 })
      }
      const jsonStr = extractFirstJsonObject(extracted)
      if (jsonStr) extracted = jsonStr
      let candidate: unknown
      try {
        candidate = JSON.parse(extracted)
      } catch {
        return NextResponse.json({ error: 'OpenAI returned non-JSON content', debug: extracted.slice(0, 500) }, { status: 502 })
      }
      const parsed = PropertySchema.safeParse(candidate)
      if (!parsed.success) {
        console.error('Validation failed. Received data:', candidate)
        console.error('Validation errors:', JSON.stringify(parsed.error.issues, null, 2))
        return NextResponse.json({ error: 'Extracted JSON failed validation', issues: parsed.error.format(), receivedData: candidate }, { status: 422 })
      }
      const data: PropertyData = parsed.data
      if (!data.address || data.address.trim().length === 0) {
        return NextResponse.json({ error: 'Could not extract property address from the listing' }, { status: 400 })
      }
      return NextResponse.json({ success: true, data, debug: { mode: 'vision' } })
    }

    // 1) Obtain page HTML: prefer provided raw HTML, otherwise fetch via Playwright
    let pageText: string
    if (typeof html === 'string' && html.trim().length > 0) {
      pageText = html
    } else {
      try {
        // Always send FULL HTML (raw, untruncated)
        pageText = await retry(() => fetchRenderedHtml(url, 1_000_000, { raw: true }))
      } catch (error) {
        console.error('Failed to fetch page with Playwright:', error)
        return NextResponse.json({ 
          error: 'Failed to load the Yad2 page. Please check the URL and try again.',
          debug: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    }
    
    // Debug: Log content indicators
    console.log(`Page content length: ${pageText.length} chars`)
    
    // Check for CAPTCHA
    if (!html && (pageText.includes('ShieldSquare') || pageText.includes('Captcha') || pageText.length < 500)) {
      console.error('CAPTCHA detected or insufficient content')
      return NextResponse.json({ 
        error: 'Yad2 is blocking automated access with CAPTCHA. Please try the request again by providing raw HTML instead of a URL.',
        tip: 'Pass { html: "<full page html>" } in the request body to bypass CAPTCHA in our extractor.'
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

    // 2) Build concise evidence only and send to OpenAI
    const evidence = buildEvidenceFromHtml(pageText)
    const sendText = JSON.stringify({ url, evidence }, null, 2)
    const body = {
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: buildMessages(url, sendText)
    }

  const openaiRes = await retry(async () => {
      const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }, 90000)
      if (!r.ok) {
        const t = await r.text()
      console.error(`OpenAI API Error - Status: ${r.status}`)
      console.error(`OpenAI API Error - Status Text: ${r.statusText}`)
      console.error('OpenAI API Error - Headers:', Object.fromEntries(r.headers.entries()))
      console.error(`OpenAI API Error - Response: ${t.slice(0, 800)}`)
      
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
    let extracted = openaiJson?.choices?.[0]?.message?.content

    if (!extracted) {
      return NextResponse.json({ error: 'No data extracted from OpenAI' }, { status: 502 })
    }

    // The model now returns reasoning + JSON. Extract the JSON object.
    // Find first JSON object substring.
    const jsonMatch = extracted.match(/\{[\s\S]*\}$/)
    if (jsonMatch) {
      extracted = jsonMatch[0]
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
      console.error('Validation errors:', JSON.stringify(parsed.error.issues, null, 2))
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Property extraction error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
