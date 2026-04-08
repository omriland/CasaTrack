'use client'

/**
 * Client-only: uses `isomorphic-dompurify` (jsdom on SSR paths). Marking this module
 * as a client boundary avoids Turbopack/Next occasionally pulling it into server chunks
 * after HMR, which can crash the dev server with an internal error until restart.
 */
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

const SANITIZE = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: [] as string[],
}

/**
 * Sanitize HTML before saving to DB or feeding TipTap.
 */
export function sanitizeNotesHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE) as string
}

function looksLikeStoredHtml(s: string): boolean {
  const t = s.trim()
  if (!t.startsWith('<')) return false
  return /^<\s*(\/)?(p|div|ul|ol|span|strong|b|em|i|u|br)\b/i.test(t)
}

/**
 * Turn DB value (HTML from TipTap, legacy markdown, or plain text) into HTML TipTap can load.
 */
export function notesToEditorHtml(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  if (looksLikeStoredHtml(raw)) {
    return sanitizeNotesHtml(raw)
  }
  const parsed = marked.parse(raw, { breaks: true, gfm: true }) as string
  return sanitizeNotesHtml(parsed)
}

/** True if two DB / editor values represent the same notes (handles legacy markdown vs stored HTML). */
export function notesContentEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  return notesToEditorHtml(a ?? '').trim() === notesToEditorHtml(b ?? '').trim()
}
