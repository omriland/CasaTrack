import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { dropboxGetTemporaryLink } from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'

/** GET /api/renovation/files/open?path=/…  → 302 to Dropbox 4h temp link */
export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')?.trim()
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  try {
    const link = await dropboxGetTemporaryLink(path)
    return NextResponse.redirect(link, 302)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not create link'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
