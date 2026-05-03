/**
 * Normalizes phone numbers to a canonical format (+880...)
 * Supports Bangladesh numbers starting with 01, 880, +880
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle Bangladesh specific normalization
  // If starts with 01..., add +88
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+88' + cleaned;
  }
  
  // If starts with 8801..., add +
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    cleaned = '+' + cleaned;
  }

  // Ensure it starts with +
  if (cleaned.startsWith('01') && cleaned.length === 11) {
     cleaned = '+88' + cleaned;
  }

  return cleaned;
};
