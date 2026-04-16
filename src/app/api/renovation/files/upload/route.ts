import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  dropboxUploadFile,
  getDropboxRenovationRootPath,
} from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/renovation/files/upload
 *
 * FormData fields:
 * - `file`         — the File blob
 * - `targetPath`   — (optional) Dropbox folder path to upload into.
 *                    Falls back to `{root}/{projectId}/files/` when not set.
 * - `projectId`    — (optional, legacy) used only when targetPath is absent.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const targetPathRaw = form.get('targetPath')
  const projectId = form.get('projectId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^\w.\-()\s\u0590-\u05FF]+/g, '_').trim() || 'file'
  const ext = safeName.includes('.') ? safeName.split('.').pop() || 'bin' : 'bin'
  const objectKey = `${crypto.randomUUID()}.${ext}`

  let folderPath: string
  if (typeof targetPathRaw === 'string' && targetPathRaw.trim()) {
    folderPath = targetPathRaw.trim().replace(/\/+$/, '')
  } else if (typeof projectId === 'string' && projectId.trim()) {
    folderPath = `${getDropboxRenovationRootPath()}/${projectId.trim()}/files`
  } else {
    return NextResponse.json({ error: 'Provide targetPath or projectId' }, { status: 400 })
  }

  const fullPath = `${folderPath}/${objectKey}`

  try {
    const buf = await file.arrayBuffer()
    const { path_lower } = await dropboxUploadFile(fullPath, buf)
    return NextResponse.json({
      path_lower,
      display_name: safeName,
      original_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
