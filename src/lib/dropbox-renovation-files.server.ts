import 'server-only'

/**
 * Server-only Dropbox helpers for the renovation **Files** tab.
 *
 * Required env (when `NEXT_PUBLIC_RENOVATION_FILES_STORAGE=dropbox`):
 * - `DROPBOX_APP_KEY` — Dropbox app key
 * - `DROPBOX_APP_SECRET` — Dropbox app secret
 * - `DROPBOX_REFRESH_TOKEN` — long-lived refresh token for your Dropbox account
 * - `DROPBOX_RENOVATION_FILES_PATH` — folder path in Dropbox (e.g. `/CasaTrack/Reno` or under app folder).
 *   Create this folder in Dropbox before uploading; parent folders for each project are created on demand.
 */

let cachedAccessToken: { token: string; expiresAtMs: number } | null = null

export async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedAccessToken && cachedAccessToken.expiresAtMs > now + 60_000) {
    return cachedAccessToken.token
  }
  const clientId = process.env.DROPBOX_APP_KEY
  const clientSecret = process.env.DROPBOX_APP_SECRET
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Dropbox is not configured (DROPBOX_APP_KEY / DROPBOX_APP_SECRET / DROPBOX_REFRESH_TOKEN).')
  }
  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }
  if (!res.ok || !body.access_token) {
    throw new Error(body.error || `Dropbox token error (${res.status})`)
  }
  const ttlSec = typeof body.expires_in === 'number' ? body.expires_in : 14_400
  cachedAccessToken = {
    token: body.access_token,
    expiresAtMs: now + ttlSec * 1000,
  }
  return body.access_token
}

export function getDropboxRenovationRootPath(): string {
  const raw = process.env.DROPBOX_RENOVATION_FILES_PATH?.trim() || '/CasaTrackRenovationFiles'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash.replace(/\/+$/, '')
}

async function createFolderIfNeeded(token: string, folderPath: string): Promise<void> {
  const res = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: folderPath, autorename: false }),
  })
  if (res.ok) return
  if (res.status === 409) return /* folder already exists */
  const t = await res.text()
  throw new Error(`Dropbox create_folder failed: ${res.status} ${t}`)
}

/** Ensures each path segment exists under `root` (e.g. root/projId/files). */
async function ensureFolderChain(token: string, fullFilePath: string): Promise<void> {
  const parts = fullFilePath.split('/').filter(Boolean)
  if (parts.length <= 1) return
  let accum = ''
  for (let i = 0; i < parts.length - 1; i++) {
    accum += `/${parts[i]}`
    await createFolderIfNeeded(token, accum)
  }
}

export async function dropboxUploadFile(fullPath: string, bytes: ArrayBuffer): Promise<{ path_lower: string }> {
  const token = await getAccessToken()
  await ensureFolderChain(token, fullPath)
  const arg = {
    path: fullPath,
    mode: 'add' as const,
    autorename: true,
    mute: false,
    strict_conflict: false,
  }
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify(arg),
    },
    body: bytes,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Dropbox upload failed: ${res.status} ${t}`)
  }
  const json = (await res.json()) as { path_lower?: string; path_display?: string }
  const path_lower = json.path_lower || json.path_display || fullPath
  return { path_lower }
}

export async function dropboxDeletePath(path: string): Promise<void> {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  })
  if (res.ok) return
  const t = await res.text()
  /* Idempotent: path already gone */
  if (res.status === 409 && /not_found|path_lookup/i.test(t)) return
  throw new Error(`Dropbox delete failed: ${res.status} ${t}`)
}

export async function dropboxMovePath(
  fromPath: string,
  toPath: string,
): Promise<{ path_lower: string }> {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/move_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_path: fromPath,
      to_path: toPath,
      autorename: true,
      allow_ownership_transfer: false,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Dropbox move failed: ${res.status} ${t}`)
  }
  const json = (await res.json()) as { metadata?: { path_lower?: string } }
  return { path_lower: json.metadata?.path_lower || toPath }
}

export async function dropboxGetTemporaryLink(path: string): Promise<string> {
  const token = await getAccessToken()
  const res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Dropbox temporary link failed: ${res.status} ${t}`)
  }
  const json = (await res.json()) as { link?: string }
  if (!json.link) throw new Error('Dropbox did not return a link')
  return json.link
}
