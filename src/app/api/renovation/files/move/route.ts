import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { dropboxMovePath } from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'

/**
 * POST /api/renovation/files/move
 *
 * Body (JSON): `{ fromPath: string, toPath: string }`
 * Moves a file or folder within Dropbox.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: { fromPath?: string; toPath?: string }
  try {
    body = (await request.json()) as { fromPath?: string; toPath?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fromPath = body.fromPath?.trim()
  const toPath = body.toPath?.trim()
  if (!fromPath || !toPath) return NextResponse.json({ error: 'Missing fromPath or toPath' }, { status: 400 })

  try {
    const result = await dropboxMovePath(fromPath, toPath)
    return NextResponse.json({ ok: true, path_lower: result.path_lower })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Move failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
