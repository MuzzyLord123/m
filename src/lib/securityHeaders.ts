/**
 * Security Headers Middleware for Netlify
 * 
 * This configuration is deployed to netlify.toml and _headers.
 * Implements CSP, X-Frame-Options, HSTS, Cache-Control and other protective headers.
 * 
 * Security findings addressed:
 * - Cache-Control: Added no-store to prevent sensitive data caching
 * - CSP script-src: Removed unsafe-inline and unsafe-eval
 * - CSP style-src: Removed unsafe-inline
 * - Added Cross-Origin policies (COEP, COOP, CORP)
 * - Added upgrade-insecure-requests and block-all-mixed-content
 */

// Headers for _headers file (Netlify format)
export const securityHeaders = `
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
  Pragma: no-cache
  Expires: 0
  Cross-Origin-Embedder-Policy: credentialless
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.ipify.org https://ip-api.com https://api.qrserver.com wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content;
`;

// For reference - these are the security headers explained:
export const headerExplanations = {
  'X-Frame-Options': 'DENY - Prevents clickjacking by disabling iframe embedding',
  'X-Content-Type-Options': 'nosniff - Prevents MIME type sniffing attacks',
  'X-XSS-Protection': '1; mode=block - Enables XSS filter in older browsers',
  'Referrer-Policy': 'strict-origin-when-cross-origin - Limits referrer information leakage',
  'Permissions-Policy': 'Disables unnecessary browser APIs for security',
  'Strict-Transport-Security': 'HSTS - Forces HTTPS for 1 year with subdomains',
  'Cache-Control': 'no-store - Prevents caching of sensitive data',
  'Cross-Origin-Embedder-Policy': 'credentialless - Controls cross-origin embedding',
  'Cross-Origin-Opener-Policy': 'same-origin - Isolates browsing context',
  'Cross-Origin-Resource-Policy': 'same-origin - Controls resource sharing',
  'Content-Security-Policy': 'Controls resource loading to prevent XSS and data injection',
};
