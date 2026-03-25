/**
 * Broad palette so names map to clearly different families: red, orange, yellow,
 * greens, teals, blues, purples, magentas, pinks. FNV-1a picks a bucket per name.
 */
export const AVATAR_DISTINCT_HUES = [
  356, // red
  18, // orange-red
  38, // orange
  52, // gold / amber
  62, // yellow
  82, // lime
  120, // green
  155, // spring
  175, // teal
  195, // cyan
  215, // sky blue
  235, // blue
  255, // indigo
  275, // violet
  295, // purple
  312, // magenta / fuchsia
  328, // pink
  346, // rose
] as const

function fnv1a32(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** Stable hue (degrees) from any string — same for providers and team members. */
export function stringAvatarHue(input: string): number {
  const s = input.trim().toLowerCase()
  if (!s) return AVATAR_DISTINCT_HUES[0]
  const hash = fnv1a32(s)
  return AVATAR_DISTINCT_HUES[hash % AVATAR_DISTINCT_HUES.length]!
}
