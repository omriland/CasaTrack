'use client'

import type { Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, List, Underline as UnderlineIcon } from 'lucide-react'
import { notesToEditorHtml, sanitizeNotesHtml } from '@/lib/room-notes-html'

const VARELA_STACK = 'var(--font-varela-round), "Varela Round", sans-serif'

function serializeEditorHtml(editor: Editor): string {
  const text = editor.getText().trim()
  if (!text) return ''
  return sanitizeNotesHtml(editor.getHTML())
}

export type RoomNotesMarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  /** Shorter field — e.g. add-room row in Settings */
  variant?: 'default' | 'compact'
  /** Remount editor when this changes (e.g. selected room id). Keeps WYSIWYG in sync. */
  instanceKey: string
}

export function RoomNotesMarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  variant = 'default',
  instanceKey,
}: RoomNotesMarkdownEditorProps) {
  const minH = variant === 'compact' ? '5.5rem' : '8.5rem'

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
          code: false,
        }),
        Underline,
        Placeholder.configure({
          placeholder: placeholder ?? '',
        }),
      ],
      content: notesToEditorHtml(value),
      editorProps: {
        attributes: {
          class: 'room-notes-prosemirror focus:outline-none',
          style: `font-family: ${VARELA_STACK}; min-height: ${minH}`,
          spellcheck: 'true',
          dir: 'auto',
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(serializeEditorHtml(ed))
      },
    },
    [instanceKey],
  )

  if (!editor) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-slate-50/60 ${className ?? ''}`}
        style={{ minHeight: minH }}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={className}
      onBlur={(e) => {
        const next = e.relatedTarget
        if (next instanceof Node && e.currentTarget.contains(next)) return
        onBlur?.()
      }}
    >
      <div
        className="flex gap-0.5 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50/90 px-1.5 py-1"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 active:scale-95"
          aria-label="Bold"
          title="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 active:scale-95"
          aria-label="Underline"
          title="Underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 active:scale-95"
          aria-label="Bullet list"
          title="Bullet list"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="room-notes-editor rounded-b-xl border border-t-0 border-slate-200 bg-slate-50/60 px-0 transition-[border-color,box-shadow,background-color] focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100"
      />
    </div>
  )
}
