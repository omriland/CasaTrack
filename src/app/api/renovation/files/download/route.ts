import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { dropboxGetTemporaryLink } from '@/lib/dropbox-renovation-files.server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (cookieStore.get('casa-track-auth')?.value !== 'true') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('renovation_files').select('storage_path').eq('id', id).maybeSingle()

  if (error || !data?.storage_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const link = await dropboxGetTemporaryLink(data.storage_path)
    return NextResponse.redirect(link, 302)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : 'Could not create link'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
