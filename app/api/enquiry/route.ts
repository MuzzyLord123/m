import { NextResponse } from 'next/server'

/**
 * Enquiry handler.
 *
 * Works two ways on purpose:
 *  - JavaScript present: the form posts here in the background and gets JSON.
 *  - JavaScript absent:  the browser posts here natively and gets redirected
 *                        to /enquiry/sent.
 *
 * Spam handling is a honeypot plus a time trap. A bot that fills every field
 * trips the honeypot; a bot that posts the instant the page loads trips the
 * timer. Neither is told which. No CAPTCHA.
 *
 * WHERE ENQUIRIES GO: set ENQUIRY_WEBHOOK_URL in the hosting environment and
 * every enquiry is POSTed there as JSON. Until the client tells us where he
 * wants them (text message, email, or a form service), they are written to the
 * server log — see CONTENT-NEEDED.md. The phone number is the primary route in
 * and always will be.
 */

const MIN_FILL_MS = 3000

export async function POST(request: Request) {
  const wantsJson = request.headers.get('x-requested-with') === 'fetch'

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail(wantsJson, request, 400)
  }

  const value = (key: string) => String(form.get(key) ?? '').trim()

  const honeypot = value('company')
  const stamped = Number(value('t'))
  const tooFast = Number.isFinite(stamped) && stamped > 0 && Date.now() - stamped < MIN_FILL_MS

  // Silently accepted, quietly binned. A bot gets the same answer as a person.
  if (honeypot !== '' || tooFast) {
    return ok(wantsJson, request)
  }

  const enquiry = {
    name: value('name'),
    phone: value('phone'),
    work: value('work'),
    timescale: value('timescale'),
    receivedAt: new Date().toISOString(),
  }

  if (enquiry.name === '' || enquiry.phone === '') {
    return fail(wantsJson, request, 422)
  }

  const webhook = process.env.ENQUIRY_WEBHOOK_URL
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(enquiry),
      })
      if (!res.ok) throw new Error(`webhook responded ${res.status}`)
    } catch (error) {
      console.error('[enquiry] could not forward enquiry', error, enquiry)
      return fail(wantsJson, request, 502)
    }
  } else {
    console.info('[enquiry] no ENQUIRY_WEBHOOK_URL set — enquiry logged only', enquiry)
  }

  return ok(wantsJson, request)
}

function ok(wantsJson: boolean, request: Request) {
  if (wantsJson) return NextResponse.json({ ok: true })
  return NextResponse.redirect(new URL('/enquiry/sent', request.url), 303)
}

function fail(wantsJson: boolean, request: Request, status: number) {
  if (wantsJson) return NextResponse.json({ ok: false }, { status })
  return NextResponse.redirect(new URL('/enquiry/problem', request.url), 303)
}
