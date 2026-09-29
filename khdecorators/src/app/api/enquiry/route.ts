import { NextResponse } from 'next/server'
import { deliverEnquiry } from '@/lib/deliver'
import { looksAutomated, validateEnquiry } from '@/lib/enquiry'

/**
 * The enquiry form's endpoint.
 *
 * The form posts here as a plain HTML form. That is what makes it work with
 * JavaScript switched off, blocked, or still loading — which on a slow 4G
 * connection is the first couple of seconds of every visit, and those are exactly
 * the seconds a paid visitor is deciding whether to bother.
 *
 * Two response shapes from one handler:
 *
 *  - `Accept: application/json` — the enhanced path. The form component posts with
 *    fetch, gets JSON back, shows the result inline without a page change, and
 *    fires the Ads conversion itself.
 *  - anything else — the native path. A 303 redirect, so the browser follows it
 *    with a GET and the back button does not offer to re-post the form.
 */

// nodemailer needs Node, not the edge runtime.
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const data = await request.formData()
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false

  /*
   * Bots get told it worked. They are not the audience for an error message, and a
   * spam filter that explains itself is a spam filter that gets tuned around.
   */
  if (looksAutomated(data)) {
    return wantsJson
      ? NextResponse.json({ ok: true })
      : NextResponse.redirect(new URL('/contact/sent', request.url), 303)
  }

  const result = validateEnquiry(data)

  if (!result.ok) {
    return wantsJson
      ? NextResponse.json({ ok: false, errors: result.errors }, { status: 422 })
      : // A dedicated page rather than /contact with a query string on it. Query
        // params would make /contact server-rendered on every request, and it is a
        // conversion page for paid traffic — it should be static and served from the
        // edge. This path is only ever reached without JavaScript.
        NextResponse.redirect(new URL('/contact/incomplete', request.url), 303)
  }

  const delivery = await deliverEnquiry(result.values)

  if (!delivery.ok) {
    /*
     * 502, and an honest message. The enquiry is in the server log in full (see
     * deliver.ts) so it is recoverable, but the visitor is told to ring rather than
     * being shown a tick for an email that never left. Never fake a success here.
     */
    return wantsJson
      ? NextResponse.json({ ok: false, errors: { form: 'delivery' } }, { status: 502 })
      : NextResponse.redirect(new URL('/contact/problem', request.url), 303)
  }

  return wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL('/contact/sent', request.url), 303)
}
