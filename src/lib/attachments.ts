import { supabase } from './supabase'
import { Attachment, AttachmentInsert } from '@/types/property'

const BUCKET_NAME = 'property-attachments'
const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB (supports videos up to 4 minutes)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function uploadAttachment(
  propertyId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Attachment> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Validate file type
  const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null
  if (!fileType) {
    throw new Error('File must be an image or video')
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${propertyId}/${fileName}`

  // Get upload URL from Supabase
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

    // Use XMLHttpRequest for progress tracking
    const uploadPromise = new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Get the upload URL
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`
    
    xhr.upload.addEventListener('progress', (e) => {
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
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('apikey', session.access_token)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', '3600')
    xhr.send(file)
  })

  await uploadPromise

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Insert attachment record
  const attachmentData: AttachmentInsert = {
    property_id: propertyId,
    file_name: file.name,
    file_path: filePath,
    file_type: fileType,
    file_size: file.size,
    mime_type: file.type
  }

  const { data, error } = await supabase
    .from('attachments')
    .insert(attachmentData)
    .select()
    .single()

  if (error) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
    throw new Error(`Failed to save attachment record: ${error.message}`)
  }

  return data
}

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

export async function deleteAttachment(attachmentId: string): Promise<void> {
  // Get attachment record first
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('file_path')
    .eq('id', attachmentId)
    .single()

  if (fetchError || !attachment) {
    throw new Error(`Failed to find attachment: ${fetchError?.message}`)
  }

  // Delete from storage
  // RLS policies will control whether this deletion is allowed
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([attachment.file_path])

  if (storageError) {
    // Check if it's an RLS/policy error
    if (storageError.message.includes('policy') || storageError.message.includes('permission') || storageError.message.includes('RLS')) {
      throw new Error(`Delete denied by security policy. Please ensure RLS policies are set up correctly. Error: ${storageError.message}`)
    }
    console.error('Failed to delete file from storage:', storageError)
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) {
    throw new Error(`Failed to delete attachment: ${deleteError.message}`)
  }
}

/**
 * Get the URL for an attachment file
 * 
 * Note: This uses public URLs. RLS policies control access at the storage level.
 * If you set the bucket to private, you'll need to use signed URLs instead.
 * 
 * For private buckets, you would need to:
 * 1. Change this function to async
 * 2. Use: const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, 3600)
 * 3. Update all call sites to handle async URLs
 */
export function getAttachmentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)
  return data.publicUrl
}

