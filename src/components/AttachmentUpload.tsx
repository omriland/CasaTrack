'use client'

import { useState, useRef } from 'react'
import { Attachment } from '@/types/property'
import { uploadAttachment, deleteAttachment, getAttachmentUrl } from '@/lib/attachments'
import imageCompression from 'browser-image-compression'

interface AttachmentUploadProps {
  propertyId: string
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
}

export default function AttachmentUpload({ propertyId, attachments, onAttachmentsChange }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2, // Maximum size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: file.type,
    }
    
    try {
      const compressedFile = await imageCompression(file, options)
      console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      return compressedFile
    } catch (error) {
      console.error('Error compressing image:', error)
      // Return original file if compression fails
      return file
    }
  }

  const compressVideo = async (file: File): Promise<File> => {
    // Video compression in the browser is complex and resource-intensive
    // For now, we'll return the original file
    // Full video compression would require ffmpeg.wasm or server-side processing
    // Images are compressed, videos are uploaded as-is (within the 1GB limit)
    return file
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setCompressing(true)
    
    try {
      const processedFiles: File[] = []
      
      // Process each file (compress if needed)
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file)
          processedFiles.push(compressed)
        } else if (file.type.startsWith('video/')) {
          // For videos, compress if they're large
          const compressed = await compressVideo(file)
          processedFiles.push(compressed)
        } else {
          processedFiles.push(file)
        }
      }
      
      setCompressing(false)
      
      // Upload processed files with progress tracking
      const uploadPromises = processedFiles.map((file, index) => {
        const fileId = `${file.name}-${index}-${Date.now()}`
        return uploadAttachment(
          propertyId, 
          file,
          (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
          }
        ).finally(() => {
          // Clean up progress tracking after upload completes
          setUploadProgress(prev => {
            const updated = { ...prev }
            delete updated[fileId]
            return updated
          })
        })
      })
      const newAttachments = await Promise.all(uploadPromises)
      onAttachmentsChange([...attachments, ...newAttachments])
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setUploading(false)
      setCompressing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    setDeleting(attachmentId)
    try {
      await deleteAttachment(attachmentId)
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId))
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete attachment')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Attachments (Photos/Videos)
        </label>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="attachment-upload"
          />
          <label
            htmlFor="attachment-upload"
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              {compressing ? 'Compressing...' : uploading ? (
                <span className="flex items-center space-x-2">
                  <span>Uploading...</span>
                  {Object.keys(uploadProgress).length > 0 && (
                    <span className="text-xs text-primary">
                      {Math.round(
                        Object.values(uploadProgress).reduce((sum, p) => sum + p, 0) / Object.keys(uploadProgress).length
                      )}%
                    </span>
                  )}
                </span>
              ) : 'Add Files'}
            </span>
          </label>
          <span className="text-xs text-slate-500">Max 1GB per file (supports videos up to 4 minutes)</span>
        </div>
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">Upload Progress</span>
              <span className="text-xs font-medium text-primary">
                {Math.round(
                  Object.values(uploadProgress).reduce((sum, p) => sum + p, 0) / Object.keys(uploadProgress).length
                )}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.round(
                    Object.values(uploadProgress).reduce((sum, p) => sum + p, 0) / Object.keys(uploadProgress).length
                  )}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {attachments.map((attachment) => {
            const url = getAttachmentUrl(attachment.file_path)
            const isDeleting = deleting === attachment.id

            return (
              <div
                key={attachment.id}
                className={`relative group bg-slate-50 rounded-lg overflow-hidden border border-slate-200 ${
                  isDeleting ? 'opacity-50' : ''
                }`}
              >
                {attachment.file_type === 'image' ? (
                  <img
                    src={url}
                    alt={attachment.file_name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <video
                    src={url}
                    className="w-full h-32 object-cover"
                    controls={false}
                  >
                    <source src={url} type={attachment.mime_type} />
                  </video>
                )}
                
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-700 truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(attachment.file_size)}</p>
                </div>

                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={isDeleting}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  title="Delete attachment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


