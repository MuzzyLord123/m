/**
 * The site compiler now lives in supabase/functions/_shared/site so that the
 * publish path (Deno) and the editor (browser) run the identical code. There
 * used to be two separate compilers, and the weaker one ran on publish - so
 * seventy-five element types that rendered correctly in your exported code
 * came out as empty <div>s on the site you actually put live.
 *
 * This file stays as a re-export so existing imports keep working.
 */
export * from '@site/cssCompiler.ts';
