'use client'

import { useActionState, useEffect, useRef } from 'react'
import { contact } from '@content/copy'
import { phone } from '@content/site'
import { ELAPSED_FIELD, HONEYPOT_FIELD } from '@/lib/enquiry-fields'
import { submitEnquiry, type EnquiryState } from '@/lib/actions'

/**
 * Three fields, mono labels, underline inputs on the field colour, no boxes.
 *
 * Works without JavaScript: it is a server action on a plain form, so it posts
 * and re-renders. The timing trap simply stands down when scripts are off (see
 * src/lib/enquiry.ts) rather than locking out the customer.
 *
 * On success the form is replaced by his number in display type, because at
 * that point the number is the only thing left worth showing.
 */

const INITIAL: EnquiryState = { status: 'idle' }

export function EnquiryForm() {
  const [state, action, pending] = useActionState(submitEnquiry, INITIAL)
  const elapsed = useRef<HTMLInputElement>(null)

  // Elapsed milliseconds since this mounted, kept current so it is right
  // whenever they get round to submitting. performance.now() is monotonic, so
  // a wrong clock on the customer's phone cannot lock them out.
  useEffect(() => {
    const mounted = performance.now()
    const tick = () => {
      if (elapsed.current) elapsed.current.value = String(Math.round(performance.now() - mounted))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (state.status === 'ok') {
    return (
      <div>
        <p className="mono">{contact.form.sent}</p>
        <a href={phone.href} className="t-phone mt-6 block tabular-nums">
          {phone.display}
        </a>
      </div>
    )
  }

  return (
    <form action={action} noValidate className="max-w-[36rem]">
      <p className="mono-label">{contact.form.heading}</p>

      <div className="mt-8 flex flex-col gap-8">
        <div>
          <label htmlFor="enquiry-name" className="mono-label block">
            {contact.form.name}
          </label>
          <input
            id="enquiry-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field-input mt-2"
          />
        </div>

        <div>
          <label htmlFor="enquiry-phone" className="mono-label block">
            {contact.form.phone}
          </label>
          <input
            id="enquiry-phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            className="field-input mt-2 tabular-nums"
          />
        </div>

        <div>
          <label htmlFor="enquiry-job" className="mono-label block">
            {contact.form.job}
          </label>
          <textarea
            id="enquiry-job"
            name="job"
            required
            rows={3}
            className="field-input mt-2 resize-y"
          />
        </div>
      </div>

      {/* The honeypot. Off-screen rather than hidden, so a bot fills it in. */}
      <div className="trap" aria-hidden="true">
        <label htmlFor="enquiry-website">Website</label>
        <input id="enquiry-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={elapsed} name={ELAPSED_FIELD} type="hidden" defaultValue="" />

      {state.status !== 'idle' && state.message ? (
        <p role="status" className="mono mt-8">
          {state.message}
          {state.status === 'error' ? (
            <a href={phone.href} className="mt-2 block tabular-nums underline underline-offset-[6px]">
              {phone.display}
            </a>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mono-label mt-10 inline-flex items-center gap-3 underline underline-offset-[6px] disabled:opacity-100"
      >
        {contact.form.submit}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
