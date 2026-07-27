/**
 * Shared CORS utility for edge functions.
 * Validates origins against an allowlist instead of using wildcard.
 */

// Allowed origins for CORS - add your production domains here
const ALLOWED_ORIGINS = [
  'https://quooro.com',
  'https://www.quooro.com',
  'https://ijybotwfiediocoewwux.supabase.co',
  // Lovable preview and published URLs
  'https://id-preview--6fbf2a38-8cc4-4a7b-8250-344a8f1b0fb1.lovable.app',
  // Allow localhost for development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * Gets CORS headers for a request, validating the origin.
 * Returns restricted headers if origin is not in the allowlist.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Checks if the origin is allowed.
 */
export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovableproject.com')
  );
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
      headers: corsHeaders 
    });
  }
  
  return new Response(null, { headers: corsHeaders });
}
