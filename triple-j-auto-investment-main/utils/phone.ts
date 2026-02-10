/**
 * Phone Number Utilities
 * Handles normalization to E.164 format and display formatting.
 * Required for Twilio SMS delivery and Supabase phone auth matching.
 *
 * Phase 04-03: Customer Portal - Notifications & Login
 */

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 * Required for Twilio SMS and Supabase phone auth matching.
 */
export function normalizePhone(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, '');
  // US: 10 digits -> +1 prefix
  if (digits.length === 10) return `+1${digits}`;
  // US: 11 digits starting with 1 -> + prefix
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Already has country code or unknown format -> + prefix
  if (digits.length > 10) return `+${digits}`;
  // Too short -- return as-is with + (caller should validate)
  return `+${digits}`;
}

/**
 * Format phone for display: (XXX) XXX-XXXX
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('1') && digits.length === 11
    ? digits.slice(1)
    : digits;
  if (national.length === 10) {
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }
  return phone; // Return original if can't format
}
