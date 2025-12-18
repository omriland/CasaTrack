'use client'

import { useState, useEffect } from 'react'
import { Property, Note } from '@/types/property'
import { getPropertyNotes, createNote, deleteNote } from '@/lib/properties'

interface NotesModalProps {
  property: Property
  onClose: () => void
}

export default function NotesModal({ property, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [property.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await getPropertyNotes(property.id)
      setNotes(data)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      setSubmitting(true)
      const note = await createNote(property.id, newNote.trim())
      setNotes(prev => [note, ...prev])
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNoteDate = (dateString: string) => {
    const now = new Date()
    const noteDate = new Date(dateString)
    const diffMs = now.getTime() - noteDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Less than a minute ago
    if (diffMinutes < 1) {
      return 'Just now'
    }

    // Less than an hour ago - show minutes
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`
    }

    // Less than 24 hours ago - show hours
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }

    // Yesterday
    if (diffDays === 1) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `Yesterday, ${timeStr}`
    }

    // Today (more than 24 hours but same calendar day)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate())
    if (today.getTime() === noteDay.getTime()) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `Today, ${timeStr}`
    }

    // Within a couple of days (2-3 days)
    if (diffDays <= 3) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `${diffDays} days ago, ${timeStr}`
    }

    // Older than a couple of days - use full date format
    return formatDate(dateString)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Property Notes</h2>
              <p className="text-gray-600">{property.address}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add Note Form */}
        <div className="p-6 border-b border-gray-200">
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Note
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Note'}
            </button>
          </form>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading notes...</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No notes yet</div>
              <div className="text-sm text-gray-400">Add your first note above</div>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {formatNoteDate(note.created_at)}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-gray-400 hover:text-red-600 ml-2"
                      title="Delete note"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}