/**
 * Retry utility with exponential backoff.
 *
 * Usage:
 *   const data = await withRetry(() => supabase.from('table').select('*'));
 *   const data = await withRetry(() => fetch('/api'), { maxAttempts: 5 });
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms before first retry (default: 500) */
  baseDelay?: number;
  /** Maximum delay cap in ms (default: 10000) */
  maxDelay?: number;
  /** Jitter factor 0-1 to randomise delay (default: 0.2) */
  jitter?: number;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
  /** Called on each retry with attempt number and error */
  onRetry?: (attempt: number, error: unknown) => void;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/**
 * Execute an async function with retry + exponential backoff.
 * Throws the last error if all attempts fail.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 500,
    maxDelay = 10_000,
    jitter = 0.2,
    signal,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry aborts
      if (err instanceof DOMException && err.name === 'AbortError') throw err;

      if (attempt < maxAttempts) {
        onRetry?.(attempt, err);
        const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
        const jitteredDelay = delay * (1 + (Math.random() - 0.5) * 2 * jitter);
        await sleep(jitteredDelay, signal);
      }
    }
  }

  throw lastError;
}

/**
 * Wrapper for Supabase queries that throws on error (for use with withRetry).
 * Supabase client returns { data, error } instead of throwing.
 */
export async function supabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T; error: any }>,
): Promise<T> {
  const { data, error } = await queryFn();
  if (error) throw error;
  return data as T;
}
