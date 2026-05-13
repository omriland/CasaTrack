/**
 * Physical-key layout flip between US QWERTY (unshifted letters) and Windows
 * **Hebrew (Standard)** (`kbdhebl3`) — same positions as macOS “Hebrew” for letter keys.
 * Used so search still matches when the wrong input language was active while typing.
 */

const EN_LOWER_TO_HE: Readonly<Record<string, string>> = {
  q: '/',
  w: "'",
  e: 'ק',
  r: 'ר',
  t: 'א',
  y: 'ט',
  u: 'ו',
  i: 'ן',
  o: 'ם',
  p: 'פ',
  a: 'ש',
  s: 'ד',
  d: 'ג',
  f: 'כ',
  g: 'ע',
  h: 'י',
  j: 'ח',
  k: 'ל',
  l: 'ך',
  z: 'ז',
  x: 'ס',
  c: 'ב',
  v: 'ה',
  b: 'נ',
  n: 'מ',
  m: 'צ',
}

const HE_TO_EN_LOWER: Readonly<Record<string, string>> = (() => {
  const m: Record<string, string> = {}
  for (const [en, he] of Object.entries(EN_LOWER_TO_HE)) {
    if (!(he in m)) m[he] = en
  }
  return m
})()

function fold(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase('und')
}

/** Latin typed with US layout while muscle memory was Hebrew — map each letter to Hebrew. */
export function flipLatinKeyboardToHebrew(s: string): string {
  let out = ''
  for (const ch of s) {
    const lower = ch.toLocaleLowerCase('und')
    const mapped = EN_LOWER_TO_HE[lower]
    out += mapped !== undefined ? mapped : ch
  }
  return out
}

/** Hebrew (or punctuation from Hebrew layout) typed while English was intended — map to US letters. */
export function flipHebrewKeyboardToLatin(s: string): string {
  let out = ''
  for (const ch of s) {
    out += HE_TO_EN_LOWER[ch] !== undefined ? HE_TO_EN_LOWER[ch] : ch
  }
  return out
}

/** Substring match allowing wrong keyboard layout for the needle vs the haystack. */
export function matchesLayoutFlexibleSearch(haystack: string, rawNeedle: string): boolean {
  const needle = rawNeedle.trim()
  if (!needle) return true
  const h = fold(haystack)
  const n0 = fold(needle)
  if (h.includes(n0)) return true

  const needleAsHebrewKeys = fold(flipLatinKeyboardToHebrew(needle))
  if (needleAsHebrewKeys !== n0 && h.includes(needleAsHebrewKeys)) return true

  const needleAsLatinKeys = fold(flipHebrewKeyboardToLatin(needle))
  if (needleAsLatinKeys !== n0 && h.includes(needleAsLatinKeys)) return true

  return false
}
