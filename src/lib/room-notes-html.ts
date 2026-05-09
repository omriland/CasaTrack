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
 * Empty TipTap/ProseMirror paragraphs (`<p></p>` or `<p><br></p>`) become consistent `<p><br></p>`
 * so blank lines stay visible as real row breaks between text blocks.
 */
function normalizeEmptyParagraphs(html: string): string {
  return html.replace(/<p>(?:\s|&nbsp;|<br\s[^>]*\/?>)*<\/p>/gi, '<p><br></p>')
}

/**
 * Sanitize HTML before saving to DB or feeding TipTap.
 */
export function sanitizeNotesHtml(html: string): string {
  const normalized = normalizeEmptyParagraphs(html)
  return DOMPurify.sanitize(normalized, SANITIZE) as string
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

/** True if notes contain visible text after parsing legacy markdown / HTML (for icons & empty states). */
export function notesHasVisibleContent(raw: string | null | undefined): boolean {
  const html = notesToEditorHtml(raw ?? '')
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0
}
