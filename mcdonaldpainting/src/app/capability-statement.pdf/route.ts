import { renderCapabilityStatement } from '@/lib/pdf/CapabilityStatement';

/**
 * GET /capability-statement.pdf
 *
 * The document is generated on request from content/, not stored as a file, so
 * it can never be a stale copy of a site that has since been corrected. When
 * Sean confirms the insurance limits, the next download has them in it.
 *
 * This URL is also the direct link Sean can paste into an email. The gated
 * version on /contact captures a work email first; this one does not, because a
 * link that only works after a form is a link he cannot use.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const buffer = await renderCapabilityStatement();

  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/pdf',
      // inline, not attachment: a buyer who clicks this on a phone should see it
      // rather than find it in a downloads folder they never open.
      'content-disposition':
        'inline; filename="McDonald-Painting-Contractors-capability-statement.pdf"',
      'cache-control': 'no-store',
    },
  });
}
