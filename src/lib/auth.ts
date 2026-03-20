export function checkPassword(password: string): boolean {
  const correctPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'casa-track-2024'
  return password === correctPassword
}

export function setAuthCookie() {
  if (typeof window !== 'undefined') {
    document.cookie = 'casa-track-auth=true; path=/; max-age=86400' // 24 hours
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return document.cookie.includes('casa-track-auth=true')
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    document.cookie = 'casa-track-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

/**
 * Validates `next` query after login. Only same-origin relative paths under /renovation.
 */
export function getSafeRenovationRedirectPath(nextParam: string | null): string | null {
  if (nextParam == null || nextParam === '') return null
  let decoded: string
  try {
    decoded = decodeURIComponent(nextParam)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (!decoded.startsWith('/renovation')) return null
  if (decoded.includes('\\') || decoded.includes('\0')) return null
  return decoded
}