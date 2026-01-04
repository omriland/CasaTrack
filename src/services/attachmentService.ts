/**
 * Attachment service - API layer for attachment operations
 */

import { supabase } from '@/lib/supabase'
import { Attachment, AttachmentInsert } from '@/types/property'
import { NotFoundError, ValidationError } from '@/lib/errors'

const BUCKET_NAME = 'property-attachments'
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Get all attachments for a property
 */
export async function getPropertyAttachments(propertyId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`)
  }

  return data || []
}

/**
 * Get a single attachment by ID
 */
export async function getAttachment(id: string): Promise<Attachment> {
  const { data, error } = await supabase.from('attachments').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Attachment', id)
    }
    throw new Error(`Failed to fetch attachment: ${error.message}`)
  }

  if (!data) {
    throw new NotFoundError('Attachment', id)
  }

  return data
}

/**
 * Upload an attachment file
 */
export async function uploadAttachment(
  propertyId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Attachment> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Validate file type
  const fileType = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : file.type === 'application/pdf'
        ? 'pdf'
        : null

  if (!fileType) {
    throw new ValidationError('File must be an image, video, or PDF')
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${propertyId}/${fileName}`

  // Upload file using XMLHttpRequest for progress tracking
  const uploadPromise = new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100)
        onProgress(percentComplete)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })

    xhr.open('POST', uploadUrl)
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`)
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', '3600')
    xhr.send(file)
  })

  await uploadPromise

  // Note: Public URL is available via getAttachmentUrl() function
  // We don't need to store it here since we have the file_path

  // Insert attachment record
  const attachmentData: AttachmentInsert = {
    property_id: propertyId,
    file_name: file.name,
    file_path: filePath,
    file_type: fileType,
    file_size: file.size,
    mime_type: file.type,
  }

  const { data, error } = await supabase
    .from('attachments')
    .insert(attachmentData)
    .select()
    .single()

  if (error) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    throw new ValidationError(`Failed to save attachment record: ${error.message}`)
  }

  if (!data) {
    throw new Error('Attachment creation returned no data')
  }

  return data
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(id: string): Promise<void> {
  // Get attachment record first
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('file_path')
    .eq('id', id)
    .single()

  if (fetchError || !attachment) {
    if (fetchError?.code === 'PGRST116') {
      throw new NotFoundError('Attachment', id)
    }
    throw new Error(`Failed to find attachment: ${fetchError?.message}`)
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([attachment.file_path])

  if (storageError) {
    // Log but continue with database deletion
    console.error('Failed to delete file from storage:', storageError)
  }

  // Delete from database
  const { error: deleteError } = await supabase.from('attachments').delete().eq('id', id)

  if (deleteError) {
    throw new Error(`Failed to delete attachment: ${deleteError.message}`)
  }
}

/**
 * Get the public URL for an attachment
 */
export function getAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  return data.publicUrl
}
