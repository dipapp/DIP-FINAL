/**
 * Utility functions for provider management
 */

/**
 * Generates a unique 6-digit provider ID
 * @returns A 6-digit string (e.g., "123456")
 */
export function generateProviderId(): string {
  // Generate a random 6-digit number
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return randomNum.toString();
}

/**
 * Validates if a string is a valid 6-digit provider ID
 * @param id - The ID to validate
 * @returns True if valid 6-digit ID, false otherwise
 */
export function isValidProviderId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

/**
 * Formats a provider ID for display (ensures it's 6 digits with leading zeros if needed)
 * @param id - The provider ID to format
 * @returns Formatted 6-digit provider ID
 */
export function formatProviderId(id: string): string {
  if (!id) return '';
  
  // If it's already 6 digits, return as is
  if (isValidProviderId(id)) {
    return id;
  }
  
  // If it's a number, pad with leading zeros to make it 6 digits
  const num = parseInt(id, 10);
  if (!isNaN(num)) {
    return num.toString().padStart(6, '0');
  }
  
  // If it's not a valid format, return empty string
  return '';
}

