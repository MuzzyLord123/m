'use client'

import { useRef, useState } from 'react'
import { contact } from '@content/contact'
import { email, phone } from '@content/site'
import { recordConversion } from '@/lib/conversions'
import {
  EMPTY_VALUES,
  HONEYPOT_FIELD,
  TIMESTAMP_FIELD,
  validateEnquiry,
  type EnquiryErrors,
} from '@/lib/enquiry'
import { CallLink, EmailLink } from './CallLink'

/**
 * The quote form. Native HTML, posting to a route handler in this app.
 *
 * There is no Google Form here and no third-party widget of any kind. The old site
 * had an embedded Google Form as its only conversion path, which on paid traffic is
 * about the most expensive choice available: it loads after everything else, it looks
 * like a Google product rather than like Kenny's business, and on a phone it fights
 * the viewport.
 *
 * ## Progressive enhancement, in that order
 *
 * The markup is a working form before this component's JavaScript arrives. With
 * JavaScript it posts through fetch instead, shows the outcome inline without losing
 * the page, and fires the mapped Ads conversion. Without it, the browser posts the
 * form itself and the handler redirects to /contact/sent, which fires the same
 * conversion on load. Either way the enquiry lands and is counted once.
 *
 * ## Interaction
 *
 * The rule under a field thickens to signal blue on focus. That is the entire
 * interaction language of this site, per §7, and there is nothing else here — no
 * floating labels, no animated placeholders, no validation that shouts at you while
 * you are still typing.
 */
export function EnquiryForm({ from = 'form' }: { from?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [errors, setErrors] = useState<EnquiryErrors>({})
  const formRef = useRef<HTMLFormElement>(null)
  // Set once, on first render, so the elapsed-time spam check has a baseline.
  const startedAt = useRef<number>(Date.now())

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    // Validated here as well as on the server, using the same function, so a mistake
    // is caught without a round trip.
    const check = validateEnquiry(data)
    if (!check.ok) {
      setErrors(check.errors)
      // Move focus to the first field that needs attention, or a keyboard user has
      // to go looking for it.
      const firstBad = Object.keys(check.errors)[0]
      if (firstBad) form.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus()
      return
    }

    setErrors({})
    setState('sending')

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: data,
      })

      if (response.ok) {
        setState('sent')
        // Fired here rather than on a thank-you page, because this path never
        // navigates. The native path fires it on /contact/sent instead — one
        // conversion per enquiry, never both.
        recordConversion('form')
        form.reset()
        return
      }

      if (response.status === 422) {
        const body = (await response.json()) as { errors?: EnquiryErrors }
        setErrors(body.errors ?? {})
        setState('idle')
        return
      }

      setState('failed')
    } catch {
      // Offline, or the request never left. Tell them to ring.
      setState('failed')
    }
  }

  if (state === 'sent') {
    return (
      <div className="kh-panel border-l-2 border-gold p-6" role="status">
        <h3 className="display-sm">{contact.form.success.heading}</h3>
        <p className="measure mt-4">
          {contact.form.success.body.split('{phone}')[0]}
          <CallLink className="link link-hover-target" from="form-success" />
          {contact.form.success.body.split('{phone}')[1] ?? ''}
        </p>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      action="/api/enquiry"
      method="post"
      onSubmit={handleSubmit}
      noValidate
      className="kh-panel max-w-[42rem] p-6 md:p-8"
    >
      <div className="space-y-8">
        <Field
          name="name"
          label={contact.form.fields.name.label}
          required
          autoComplete="name"
          error={errors.name}
        />
        <Field
          name="contact"
          label={contact.form.fields.contact.label}
          hint={contact.form.fields.contact.hint}
          required
          autoComplete="tel"
          error={errors.contact}
        />
        <Field
          name="place"
          label={contact.form.fields.place.label}
          hint={contact.form.fields.place.hint}
          autoComplete="postal-code"
          error={errors.place}
        />
        <Field
          name="job"
          label={contact.form.fields.job.label}
          hint={contact.form.fields.job.hint}
          multiline
          error={errors.job}
        />
      </div>

      {/* The honeypot. Off-screen rather than display:none — some bots skip hidden
          fields, and `aria-hidden` plus tabIndex keeps it away from screen readers
          and the tab order. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Website</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name={TIMESTAMP_FIELD} value={startedAt.current} />

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button type="submit" disabled={state === 'sending'} className="kh-btn disabled:opacity-60">
          {state === 'sending' ? 'Sending…' : contact.form.submit}
        </button>

        <p className="annotation">
          or ring <CallLink className="link link-hover-target text-gold" from={from} />
        </p>
      </div>

      <p className="mt-6 max-w-[46ch] text-sm text-paper-dim">{contact.form.privacy}</p>

      {/* One live region for both outcomes, so a screen reader announces the result
          without the form jumping about. */}
      <div aria-live="polite" className="mt-6 empty:mt-0">
        {state === 'failed' ? (
          <div className="kh-panel border-l-2 border-alert p-5">
            <p className="annotation-lg text-gold">{contact.form.error.heading}</p>
            <p className="measure mt-3 text-paper-dim">
              {contact.form.error.body.split('{phone}')[0]}
              <CallLink className="link link-hover-target" from="form-error" />
              {(contact.form.error.body.split('{phone}')[1] ?? '').split('{email}')[0]}
              <EmailLink className="link link-hover-target" from="form-error" />
              {contact.form.error.body.split('{email}')[1] ?? ''}
            </p>
          </div>
        ) : null}
        {errors.form && state !== 'failed' ? (
          <p className="annotation-lg text-gold">
            That didn’t send. Ring {phone.label} or email {email}.
          </p>
        ) : null}
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  hint,
  required = false,
  multiline = false,
  autoComplete,
  error,
}: {
  name: string
  label: string
  hint?: string
  required?: boolean
  multiline?: boolean
  autoComplete?: string
  error?: string
}) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const shared = {
    id: name,
    name,
    required,
    autoComplete,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy,
    className: 'field-input',
  }

  return (
    <div>
      <label htmlFor={name} className="annotation block">
        {label}
        {required ? null : <span className="ml-2 normal-case tracking-normal">(optional)</span>}
      </label>

      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-paper-dim">
          {hint}
        </p>
      ) : null}

      {multiline ? (
        <textarea {...shared} rows={4} className={`${shared.className} mt-3 resize-y`} />
      ) : (
        <input {...shared} type="text" className={`${shared.className} mt-3`} />
      )}

      {error ? (
        <p id={errorId} className="annotation mt-2 text-alert">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
    </div>
  )
}
