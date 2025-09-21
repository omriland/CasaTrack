import { NextRequest, NextResponse } from 'next/server'

interface PropertyData {
  address: string
  rooms: number
  square_meters: number
  asked_price: number
  contact_name?: string
  contact_phone?: string
  property_type: 'New' | 'Existing apartment'
  description?: string
  apartment_broker?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || !url.includes('yad2.co.il')) {
      return NextResponse.json(
        { error: 'Please provide a valid Yad2 URL' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Fetch the Yad2 page content
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Yad2 page' },
        { status: 400 }
      )
    }

    const htmlContent = await pageResponse.text()

    // Send to ChatGPT for extraction
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured data from Israeli real estate listings (Yad2.co.il). 

TASK: Extract property information and return ONLY a valid JSON object with NO additional text, explanations, or markdown formatting.

JSON SCHEMA (REQUIRED):
{
  "address": string,
  "rooms": number,
  "square_meters": number, 
  "asked_price": number,
  "contact_name": string | null,
  "contact_phone": string | null,
  "property_type": "New" | "Existing apartment",
  "description": string | null,
  "apartment_broker": boolean
}

EXTRACTION STRATEGY (Priority Order):

1. PRICE (asked_price) - HIGHEST PRIORITY:
   - EXACT PATTERN: Number with AT LEAST 6 digits + shekel sign (₪)
   - SEARCH FOR: [6+ digit number] + "₪" OR "₪" + [6+ digit number]
   - EXAMPLES: "₪ 3,390,000", "2,850,000₪", "₪1,500,000"
   - VALIDATION: Must be 6+ digits (minimum 1,000,000)
   - CONVERSION: Remove ₪, commas, spaces → pure integer
   - OUTPUT: Pure integer (e.g., 3390000, 2850000, 1500000)

2. ROOMS (rooms) - HIGH PRIORITY:
   - EXACT PATTERN: [number] + " חדרים" (space + full word חדרים)
   - SEARCH FOR: "[digit].[digit] חדרים" OR "[digit] חדרים"
   - EXAMPLES: "4 חדרים", "3.5 חדרים", "5 חדרים"
   - VALIDATION: Number must be followed by exactly " חדרים"
   - OUTPUT: Number with decimals (e.g., 3.5, 4, 4.5)

3. SQUARE METERS (square_meters) - HIGH PRIORITY:
   - EXACT PATTERN: [2-3 digit number] + " מ״ר"
   - SEARCH FOR: "[2-3 digits] מ״ר"
   - EXAMPLES: "85 מ״ר", "120 מ״ר", "95 מ״ר"
   - VALIDATION: Must be 2-3 digit number + " מ״ר"
   - OUTPUT: Integer only (e.g., 85, 120, 95)

4. ADDRESS (address):
   - SEARCH PATTERNS: Street names, city names, "רחוב", "שדרות"
   - INCLUDE: Full address with city (e.g., "רחוב הרצל 15, תל אביב")

5. CONTACT INFO:
   - PHONE: Israeli formats (050-xxx-xxxx, 03-xxx-xxxx, 052-xxx-xxxx)
   - NAME: Look near phone number for contact person

6. PROPERTY TYPE:
   - "חדש", "פרויקט חדש", "new" = "New"
   - Everything else = "Existing apartment"

7. BROKER:
   - SEARCH: "תיווך", "מתווך", "דמי תיווך", "broker"
   - OUTPUT: true if found, false otherwise

8. DESCRIPTION:
   - Hebrew property description text
   - FORMAT: Use <b> for emphasis, <br> for line breaks
   - CLEAN: Remove promotional text, keep property details

CRITICAL EXTRACTION RULES:
- Return ONLY valid JSON, no explanations
- Focus on price, square_meters, rooms first (most important)
- Use null for missing strings, 0 for missing numbers
- Convert all Hebrew numbers to digits
- Remove formatting from numbers (commas, symbols)

EXAMPLE INPUT/OUTPUT:
Input: Yad2 page with "₪ 2,850,000" and "4 חדרים" and "95 מ״ר"
Output:
{
  "address": "רחוב בן יהודה 45, תל אביב",
  "rooms": 4,
  "square_meters": 95,
  "asked_price": 2850000,
  "contact_name": "משה כהן",
  "contact_phone": "050-1234567",
  "property_type": "Existing apartment",
  "description": "<b>דירת 4 חדרים</b> משופצת<br>קומה שנייה<br>מעלית ומרפסת",
  "apartment_broker": false
}`
          },
          {
            role: 'user',
            content: `Extract property data from this Yad2 listing HTML:\n\n${htmlContent.slice(0, 15000)}` // Limit content size
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to extract property data' },
        { status: 500 }
      )
    }

    const openaiData = await openaiResponse.json()
    const extractedText = openaiData.choices[0]?.message?.content

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No data extracted from ChatGPT' },
        { status: 500 }
      )
    }

    // Parse the JSON response from ChatGPT
    try {
      console.log('ChatGPT raw response:', extractedText)
      
      const propertyData: PropertyData = JSON.parse(extractedText)
      console.log('Parsed property data:', propertyData)
      
      // More flexible validation - only require address as absolutely essential
      if (!propertyData.address) {
        console.log('Missing required field: address')
        return NextResponse.json(
          { error: 'Could not extract property address from the listing' },
          { status: 400 }
        )
      }

      // Provide defaults for missing data
      const cleanedData = {
        address: propertyData.address,
        rooms: propertyData.rooms || 0,
        square_meters: propertyData.square_meters || 0,
        asked_price: propertyData.asked_price || 0,
        contact_name: propertyData.contact_name || null,
        contact_phone: propertyData.contact_phone || null,
        property_type: propertyData.property_type || 'Existing apartment',
        description: propertyData.description || null,
        apartment_broker: propertyData.apartment_broker || false
      }

      console.log('Cleaned property data:', cleanedData)

      return NextResponse.json({ 
        success: true, 
        data: cleanedData,
        extracted_fields: Object.keys(propertyData).length,
        debug: {
          raw_response: extractedText.slice(0, 500) // First 500 chars for debugging
        }
      })

    } catch (parseError) {
      console.error('Failed to parse ChatGPT response:', extractedText)
      return NextResponse.json(
        { 
          error: 'Invalid data format from extraction',
          debug: {
            raw_response: extractedText,
            parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Property extraction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
