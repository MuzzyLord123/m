/**
 * Client-side utilities for handling encrypted/masked data
 * Note: Actual encryption happens server-side via database triggers
 */

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('ENC:');
}

/**
 * Mask an email address for display (client-side fallback)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // If already encrypted, return masked placeholder
  if (isEncrypted(email)) {
    return '***@***.***';
  }
  
  const atPos = email.indexOf('@');
  if (atPos === -1) return '***';
  
  const username = email.substring(0, atPos);
  const domain = email.substring(atPos);
  
  if (username.length <= 2) {
    return '***' + domain;
  }
  
  return username.substring(0, 2) + '***' + domain;
}

/**
 * Mask a phone number for display (client-side fallback)
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // If already encrypted, return masked placeholder
  if (isEncrypted(phone)) {
    return '***-****';
  }
  
  if (phone.length <= 4) {
    return '****';
  }
  
  return '***' + phone.substring(phone.length - 4);
}

/**
 * Mask a name for display (client-side fallback)
 */
export function maskName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  
  // If already encrypted, return masked placeholder
  if (isEncrypted(fullName)) {
    return '*** ***';
  }
  
  const parts = fullName.trim().split(' ');
  
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first.charAt(0)}*** ${last.charAt(0)}***`;
  }
  
  return fullName.charAt(0) + '***';
}

/**
 * Mask an IP address for display (client-side fallback)
 */
export function maskIP(ipAddress: string | null | undefined): string {
  if (!ipAddress) return '';
  
  // If already encrypted, return masked placeholder
  if (isEncrypted(ipAddress)) {
    return 'xxx.xxx.xxx.xxx';
  }
  
  // IPv4 check
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress)) {
    const parts = ipAddress.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  // IPv6 or other
  return ipAddress.substring(0, 8) + ':xxxx:xxxx';
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
}
