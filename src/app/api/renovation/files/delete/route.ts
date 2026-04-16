import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { dropboxDeletePath } from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'

/**
 * POST /api/renovation/files/delete
 *
 * Body (JSON): `{ path: string }` — Dropbox path_lower of the file or folder to delete.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: { path?: string }
  try {
    body = (await request.json()) as { path?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const path = body.path?.trim()
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  try {
    await dropboxDeletePath(path)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
