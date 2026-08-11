'use client'

import { useEffect, useRef, useState } from 'react'
import { contact } from '@/content/hero'
import { business } from '@/content/site'
import { CallLink } from './CallLink'

/**
 * Four fields. Name, phone, what needs painting, rough timescale.
 *
 * Progressive enhancement: this is an ordinary form that POSTs to
 * /api/enquiry and lands on /enquiry/sent if JavaScript never arrives. With
 * JavaScript it posts in the background and swaps itself for his phone number.
 *
 * Spam is handled by a honeypot field and a time trap rather than a CAPTCHA —
 * nobody should have to identify a motorbike to get a wall painted.
 *
 * No marketing consent checkbox: nothing here signs anyone up to anything.
 */
export function EnquiryForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const timeRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Stamped on the client so the page itself stays statically rendered.
    if (timeRef.current) timeRef.current.value = String(Date.now())
  }, [])

  if (state === 'sent') {
    return (
      <div className="border-4 border-chalk p-6 md:p-8">
        <h3 className="text-[1.6rem] text-chalk">{contact.successHeading}</h3>
        <p className="mt-3 max-w-[46ch] font-body text-chalk/90">{contact.successBody}</p>
        <div className="mt-6">
          <CallLink variant="slab" label="Ring me" />
        </div>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch' },
        body: new FormData(form),
      })
      if (!res.ok) throw new Error(String(res.status))
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <form
      action="/api/enquiry"
      method="post"
      onSubmit={onSubmit}
      className="grid gap-5"
      noValidate={false}
    >
      {/* honeypot — off-screen, out of the tab order, hidden from screen readers */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="enquiry-company">Company</label>
        <input id="enquiry-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={timeRef} type="hidden" name="t" defaultValue="" />

      <Field id="enquiry-name" name="name" label={contact.fields.name} autoComplete="name" required />
      <Field
        id="enquiry-phone"
        name="phone"
        label={contact.fields.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
      />

      <div className="grid gap-2">
        <label htmlFor="enquiry-work" className="font-body text-[0.9rem] font-semibold text-chalk">
          {contact.fields.work}
        </label>
        <textarea
          id="enquiry-work"
          name="work"
          rows={3}
          required
          placeholder={contact.workPlaceholder}
          className="border-2 border-ink bg-paper px-3.5 py-3 font-body text-ink placeholder:text-ink-soft"
        />
      </div>

      <Field
        id="enquiry-timescale"
        name="timescale"
        label={contact.fields.timescale}
        placeholder={contact.timescalePlaceholder}
      />

      <div className="mt-1 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bleed border-2 border-orange-deep bg-orange-deep px-7 py-3.5 font-body text-[1rem] font-semibold text-chalk disabled:opacity-70"
          style={{ '--bleed-colour': '#16130F' } as React.CSSProperties}
        >
          {state === 'sending' ? 'Sending…' : 'Send it'}
        </button>

        <p role="status" aria-live="polite" className="font-body text-[0.9rem] text-chalk/85">
          {state === 'error'
            ? `That did not send. Ring ${business.phoneDisplay} instead and I will pick it up.`
            : ''}
        </p>
      </div>
    </form>
  )
}

function Field({
  id,
  name,
  label,
  type = 'text',
  required = false,
  autoComplete,
  inputMode,
  placeholder,
}: {
  id: string
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'tel' | 'text'
  placeholder?: string
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-body text-[0.9rem] font-semibold text-chalk">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className="border-2 border-ink bg-paper px-3.5 py-3 font-body text-ink placeholder:text-ink-soft"
      />
    </div>
  )
}
