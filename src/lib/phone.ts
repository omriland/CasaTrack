/**
 * Formats an Israeli phone number for WhatsApp
 * Assumes the number is Israeli and adds the 972 country code
 * Removes leading 0 if present
 * 
 * @param phone - The phone number (e.g., "050-1234567" or "0501234567")
 * @returns Formatted number for WhatsApp (e.g., "972501234567")
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If starts with 0, remove it
  const withoutLeadingZero = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly
  
  // If already starts with 972, return as is (remove any extra 972)
  if (withoutLeadingZero.startsWith('972')) {
    return withoutLeadingZero
  }
  
  // Add 972 prefix
  return `972${withoutLeadingZero}`
}

/**
 * Formats a phone number for tel: link
 * Keeps the original format but ensures it's clickable
 * 
 * @param phone - The phone number
 * @returns Formatted number for tel: link
 */
export function formatPhoneForTel(phone: string): string {
  if (!phone) return ''
  // Remove all non-digit characters except + for tel: links
  return phone.replace(/[^\d+]/g, '')
}
