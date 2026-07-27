/**
 * Input Validation Library - Security Critical
 * 
 * Provides Zod schemas and validation utilities for all user inputs.
 * All schemas include proper sanitization and length limits.
 */

import { z } from 'zod';

// ============================================================================
// PASSWORD VALIDATION
// Requirements: 8+ chars, 1+ uppercase, 1+ number
// ============================================================================

export const passwordRequirements = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasNumber: /\d/,
} as const;

export const passwordSchema = z.string()
  .min(passwordRequirements.minLength, 'Password must be at least 8 characters')
  .regex(passwordRequirements.hasUppercase, 'Password must contain at least one uppercase letter')
  .regex(passwordRequirements.hasNumber, 'Password must contain at least one number');

/**
 * Check individual password requirements
 */
export function checkPasswordRequirements(password: string): {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
} {
  const minLength = password.length >= passwordRequirements.minLength;
  const hasUppercase = passwordRequirements.hasUppercase.test(password);
  const hasNumber = passwordRequirements.hasNumber.test(password);

  return {
    minLength,
    hasUppercase,
    hasNumber,
    isValid: minLength && hasUppercase && hasNumber,
  };
}

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  company: z.string()
    .trim()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  phone: z.string()
    .trim()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+\d\s()-]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const passwordResetRequestSchema = z.object({
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
});

export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================================================
// 2FA SCHEMAS
// ============================================================================

export const totpCodeSchema = z.string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must be 6 digits');

export const backupCodeSchema = z.string()
  .length(9, 'Backup code must be in format XXXX-XXXX')
  .regex(/^[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}$/, 'Invalid backup code format')
  .transform((val) => val.toUpperCase());

// ============================================================================
// CONTACT & FORM SCHEMAS
// ============================================================================

export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  phone: z.string()
    .trim()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+\d\s()-]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

// ============================================================================
// FILE UPLOAD VALIDATION
// ============================================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
} = {}): { valid: boolean; error?: string } {
  const maxSize = options.maxSize ?? MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes ?? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file name for suspicious patterns
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitizedName.includes('..') || sanitizedName.startsWith('.')) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}

// ============================================================================
// SANITIZATION UTILITIES
// ============================================================================

/**
 * Sanitize text input by removing potential XSS vectors
 * Note: This is a basic sanitizer. For HTML content, use DOMPurify.
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim().toLowerCase();
  
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return null;
    }
    return url.trim();
  } catch {
    // If it's a relative URL, it's probably safe
    if (url.startsWith('/') || url.startsWith('#')) {
      return url.trim();
    }
    return null;
  }
}

// ============================================================================
// RATE LIMIT ERROR HANDLING
// ============================================================================

export interface RateLimitError {
  type: 'rate_limit';
  retryAfter: number;
  message: string;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as RateLimitError).type === 'rate_limit'
  );
}

// ============================================================================
// GENERIC ERROR MESSAGES
// To prevent user enumeration, use generic messages for auth errors
// ============================================================================

export const GENERIC_AUTH_ERROR = 'Invalid credentials. Please check your email and password.';
export const GENERIC_2FA_ERROR = 'Invalid verification code. Please try again.';
export const GENERIC_RESET_MESSAGE = 'If an account exists with this email, a password reset link has been sent.';
