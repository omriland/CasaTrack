import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAccessToken, getDropboxRenovationRootPath } from '@/lib/dropbox-renovation-files.server'
import type { DropboxEntry } from '../list/route'

export const runtime = 'nodejs'

export type SearchResponse = { entries: DropboxEntry[] }

/**
 * GET /api/renovation/files/search?q=term&path=/optional/scope
 *
 * Recursively lists all files/folders under the scope path and filters
 * by substring match on the name — supports partial/middle-of-word matches
 * that Dropbox's native search_v2 does not.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim().toLowerCase() || ''
  if (!query) return NextResponse.json({ entries: [] } satisfies SearchResponse)

  const scopePath = searchParams.get('path')?.trim() || getDropboxRenovationRootPath()

  try {
    const token = await getAccessToken()

    const allEntries: DropboxEntry[] = []
    let cursor: string | null = null
    let hasMore = true

    while (hasMore) {
      const res = cursor
        ? await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cursor }),
          })
        : await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: scopePath, recursive: true }),
          })

      if (!res.ok) {
        const t = await res.text()
        if (res.status === 409 && t.includes('not_found')) break
        return NextResponse.json({ error: `Dropbox error: ${t}` }, { status: 502 })
      }

      const raw = (await res.json()) as {
        entries?: Record<string, unknown>[]
        cursor?: string
        has_more?: boolean
      }

      for (const e of raw.entries ?? []) {
        const name = String(e.name ?? '')
        if (!name.toLowerCase().includes(query)) continue

        if (e['.tag'] === 'folder') {
          allEntries.push({
            tag: 'folder',
            name,
            pathLower: String(e.path_lower ?? ''),
            pathDisplay: String(e.path_display ?? name),
          })
        } else if (e['.tag'] === 'file') {
          allEntries.push({
            tag: 'file',
            name,
            pathLower: String(e.path_lower ?? ''),
            pathDisplay: String(e.path_display ?? name),
            size: typeof e.size === 'number' ? e.size : 0,
            modified: String(e.client_modified ?? e.server_modified ?? ''),
          })
        }
      }

      cursor = raw.cursor ?? null
      hasMore = raw.has_more === true && cursor !== null
    }

    allEntries.sort((a, b) => {
      if (a.tag !== b.tag) return a.tag === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ entries: allEntries } satisfies SearchResponse)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Search failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
