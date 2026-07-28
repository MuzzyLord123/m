/**
 * Shared CORS utility for edge functions.
 * Validates origins against an allowlist instead of using wildcard.
 *
 * Migration note (2026-07-28): this allowlist still pointed at the *old*
 * Lovable project (`ijybotwfiediocoewwux.supabase.co`) and its preview
 * domains, and it never contained the Vite dev port this repo actually uses
 * (8080, see vite.config.ts) - only 5173/3000. Every function importing this
 * module would therefore have failed CORS both locally and on the new
 * deployment. Origins are now: production, the current Supabase project,
 * local dev, and Vercel preview/production domains.
 *
 * To add a custom domain without editing code, set EXTRA_CORS_ORIGINS on the
 * project as a comma-separated list, e.g.
 *   EXTRA_CORS_ORIGINS="https://app.quooro.com,https://staging.quooro.com"
 */

const STATIC_ALLOWED_ORIGINS = [
  'https://quooro.com',
  'https://www.quooro.com',
  // Current Supabase project (functions calling each other / redirects).
  'https://tkvphfxqyoavnuibvmfp.supabase.co',
  // Local development - 8080 is this project's Vite port.
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/** Extra origins supplied per-project, so a new domain needs no redeploy. */
function extraOrigins(): string[] {
  return (Deno.env.get('EXTRA_CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Vercel deployment URLs are generated per commit
 * (e.g. quooro-a1b2c3-team.vercel.app), so they are matched by suffix rather
 * than listed. Suffix matching is done on the parsed hostname, never on the
 * raw origin string: `endsWith('.vercel.app')` against the raw string would
 * also accept `https://vercel.app.attacker.com`.
 */
function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
  if (extraOrigins().includes(origin)) return true;

  // Only https for wildcard-matched hosts.
  if (!origin.startsWith('https://')) return false;
  const host = hostnameOf(origin);
  if (!host) return false;
  return host === 'vercel.app' || host.endsWith('.vercel.app');
}

/**
 * Gets CORS headers for a request, validating the origin.
 *
 * On a disallowed origin we echo the canonical production origin, which the
 * browser will refuse to match - the request fails closed rather than being
 * silently permitted.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed = isAllowedOrigin(origin);

  return {
    'Access-Control-Allow-Origin': allowed ? origin : STATIC_ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

/**
 * Checks if the origin is allowed.
 */
export function isOriginAllowed(req: Request): boolean {
  return isAllowedOrigin(req.headers.get('origin') || '');
}

/**
 * Creates a CORS preflight response.
 * Returns 403 for disallowed origins.
 */
export function handleCorsPreflightRequest(req: Request): Response {
  const corsHeaders = getCorsHeaders(req);

  if (!isOriginAllowed(req)) {
    return new Response(null, {
      status: 403,
      headers: corsHeaders,
    });
  }

  return new Response(null, { headers: corsHeaders });
}
