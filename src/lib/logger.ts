/**
 * Safe error logging utility that masks sensitive details in production.
 * Prevents exposure of database schemas, internal paths, or query details.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface SafeError {
  message: string;
  timestamp: string;
  context: string;
}

/**
 * Extracts a safe, user-friendly message from an error object.
 * In production, this masks potentially sensitive information.
 */
function getSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    // In production, return a generic message for common sensitive error patterns
    if (import.meta.env.PROD) {
      const message = error.message.toLowerCase();
      
      // Database-related errors
      if (message.includes('pgrst') || message.includes('postgres') || message.includes('supabase')) {
        return 'Database operation failed';
      }
      
      // Authentication errors
      if (message.includes('auth') || message.includes('jwt') || message.includes('token')) {
        return 'Authentication error';
      }
      
      // Network errors
      if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
        return 'Network request failed';
      }
      
      // Storage errors
      if (message.includes('storage') || message.includes('bucket') || message.includes('upload')) {
        return 'Storage operation failed';
      }
      
      // Return a truncated, sanitized message for other errors
      return error.message.slice(0, 100).replace(/[^\w\s-]/g, '');
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return import.meta.env.PROD ? error.slice(0, 100).replace(/[^\w\s-]/g, '') : error;
  }
  
  return 'Unknown error occurred';
}

/**
 * Logs an error with context information.
 * In development: logs the full error object for debugging.
 * In production: logs only safe, sanitized information.
 * 
 * @param context - A descriptive label for where the error occurred (e.g., 'enquiry-submission')
 * @param error - The error object or message to log
 */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    // In development, log full error details for debugging
    console.error(`[${context}]`, error);
  } else {
    // In production, log only safe information
    const safeError: SafeError = {
      message: getSafeMessage(error),
      timestamp: new Date().toISOString(),
      context
    };
    console.error(`[${context}]`, safeError);
  }
}

/**
 * Logs a warning with context information.
 * Follows the same safety rules as logError.
 */
export function logWarn(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[${context}]`, message, data);
  } else {
    console.warn(`[${context}]`, { message, timestamp: new Date().toISOString() });
  }
}

/**
 * Logs info messages. Only logs in development by default.
 */
export function logInfo(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.info(`[${context}]`, message, data);
  }
}

/**
 * Logs debug messages. Only logs in development.
 */
export function logDebug(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data);
  }
}

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug
};
