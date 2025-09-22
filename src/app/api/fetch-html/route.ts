import { NextRequest, NextResponse } from 'next/server'
import { fetchRenderedHtml } from '@/lib/fetchRenderedHtml'

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const maxCharsParam = searchParams.get('maxChars')
  const maxChars = maxCharsParam ? Math.max(1000, Math.min(100000, Number(maxCharsParam) || 20000)) : 20000

  if (!url) return jsonError('Missing url param')
  try {
    const html = await fetchRenderedHtml(url, maxChars)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  } catch (err: any) {
    return jsonError('Failed to fetch rendered HTML', 500, { detail: err?.message || String(err) })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { url?: string; maxChars?: number }
    const url = body.url
    const maxChars = body.maxChars ? Math.max(1000, Math.min(100000, Number(body.maxChars) || 20000)) : 20000
    if (!url) return jsonError('Missing url in JSON body')

    const html = await fetchRenderedHtml(url, maxChars)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  } catch (err: any) {
    return jsonError('Failed to fetch rendered HTML', 500, { detail: err?.message || String(err) })
  }
}


