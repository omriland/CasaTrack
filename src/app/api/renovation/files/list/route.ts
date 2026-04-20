import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAccessToken, getDropboxRenovationRootPath } from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'

export type DropboxFileEntry = {
  tag: 'file'
  name: string
  pathLower: string
  pathDisplay: string
  size: number
  modified: string
}
export type DropboxFolderEntry = {
  tag: 'folder'
  name: string
  pathLower: string
  pathDisplay: string
}
export type DropboxEntry = DropboxFileEntry | DropboxFolderEntry
export type ListResponse = { entries: DropboxEntry[]; cursor: string | null; hasMore: boolean }

export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const requestedPath = searchParams.get('path')?.trim() || ''
  const cursor = searchParams.get('cursor')?.trim() || ''

  const root = getDropboxRenovationRootPath()
  const folderPath = requestedPath ? requestedPath : root

  try {
    const token = await getAccessToken()

    let raw: { entries?: unknown[]; cursor?: string; has_more?: boolean }
    if (cursor) {
      const r = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursor }),
      })
      if (!r.ok) {
        const t = await r.text()
        return NextResponse.json({ error: `Dropbox error: ${t}` }, { status: 502 })
      }
      raw = (await r.json()) as typeof raw
    } else {
      const r = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath, recursive: false }),
      })
      if (!r.ok) {
        const t = await r.text()
        if (r.status === 409 && t.includes('not_found')) {
          return NextResponse.json({ entries: [], cursor: null, hasMore: false } satisfies ListResponse)
        }
        return NextResponse.json({ error: `Dropbox error: ${t}` }, { status: 502 })
      }
      raw = (await r.json()) as typeof raw
    }

    const entries: DropboxEntry[] = ((raw.entries ?? []) as Record<string, unknown>[])
      .map((e) => {
        if (e['.tag'] === 'folder') {
          return {
            tag: 'folder' as const,
            name: String(e.name ?? ''),
            pathLower: String(e.path_lower ?? ''),
            pathDisplay: String(e.path_display ?? e.name ?? ''),
          }
        }
        if (e['.tag'] === 'file') {
          return {
            tag: 'file' as const,
            name: String(e.name ?? ''),
            pathLower: String(e.path_lower ?? ''),
            pathDisplay: String(e.path_display ?? e.name ?? ''),
            size: typeof e.size === 'number' ? e.size : 0,
            modified: String(e.client_modified ?? e.server_modified ?? ''),
          }
        }
        return null
      })
      .filter((x): x is DropboxEntry => x !== null)

    // Sort: folders first, then files alphabetically
    entries.sort((a, b) => {
      if (a.tag !== b.tag) return a.tag === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      entries,
      cursor: raw.has_more ? (raw.cursor ?? null) : null,
      hasMore: raw.has_more ?? false,
    } satisfies ListResponse)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

