'use client'

import { useState, useRef } from 'react'
import { Attachment } from '@/types/property'
import { uploadAttachment, deleteAttachment, getAttachmentUrl } from '@/lib/attachments'

interface AttachmentUploadProps {
  propertyId: string
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
}

export default function AttachmentUpload({ propertyId, attachments, onAttachmentsChange }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadAttachment(propertyId, file))
      const newAttachments = await Promise.all(uploadPromises)
      onAttachmentsChange([...attachments, ...newAttachments])
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setUploading(false)
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
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              {uploading ? 'Uploading...' : 'Add Files'}
            </span>
          </label>
          <span className="text-xs text-slate-500">Max 50MB per file</span>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {attachments.map((attachment) => {
            const url = getAttachmentUrl(attachment.file_path)
            const isDeleting = deleting === attachment.id

            return (
              <div
                key={attachment.id}
                className={`relative group bg-slate-50 rounded-xl overflow-hidden border border-slate-200 ${
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

