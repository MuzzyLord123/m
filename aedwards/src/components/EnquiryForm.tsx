'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { contact } from '@content/copy'
import { PALETTE } from '@content/fields'
import { phone } from '@content/site'
import { ELAPSED_FIELD, HONEYPOT_FIELD, type EnquiryState } from '@/lib/enquiry-fields'
import { submitEnquiry } from '@/lib/actions'

/**
 * The enquiry form.
 *
 * ── Where it sends ───────────────────────────────────────────────────────────
 *
 * Two modes, and which one runs is decided at build time by whether a delivery
 * address is configured (see src/lib/enquiry.ts).
 *
 * `configured` — a server action posts it to a webhook or emails it. The
 * ordinary thing, and it works without JavaScript.
 *
 * Not configured — which is today, because Andy has no email address — the form
 * hands the finished message to the phone it is being filled in on: it opens a
 * text, addressed to him, with what they wrote already in it. They press send.
 *
 * That is not a consolation prize. He is a sole trader whose only confirmed
 * contact channel is a mobile, his customers are on phones, and a text lands
 * where he will actually see it. Nothing is claimed to have been sent that was
 * not: the customer sends it themselves and it is in their own sent messages.
 * The alternative was hiding the form until somebody sets up an inbox, and a
 * decorator's website with no way to leave your name is a worse site.
 *
 * The moment ENQUIRY_WEBHOOK_URL or RESEND_API_KEY is set and the site is
 * rebuilt, this becomes an ordinary posted form and the hand-off disappears.
 *
 * ── How it looks ─────────────────────────────────────────────────────────────
 *
 * Typed into in display type rather than 15px mono, because everything else on
 * this site that matters is set large and there is no reason a person's name
 * should be the exception. Mono numerals count the fields off. Underlines, no
 * boxes, no radius, no shadow. The submit is a full-bleed band of colour — the
 * same device the menu is built from — rather than a button-shaped rectangle
 * floating in the middle of a field.
 */

const INITIAL: EnquiryState = { status: 'idle' }

type Props = {
  /** True when a server-side delivery target exists. Decided at build time. */
  configured: boolean
  /** Which page the enquiry came from, e.g. "Wallpapering". */
  context?: string
}

export function EnquiryForm({ configured, context }: Props) {
  return configured ? <PostedForm context={context} /> : <TextForm context={context} />
}

/* ------------------------------------------------------------------ parts --- */

function Line({
  n,
  id,
  label,
  children,
}: {
  n: string
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mono-label flex items-baseline gap-3">
        <span className="tabular-nums">{n}</span>
        <span>{label}</span>
      </label>
      {children}
    </div>
  )
}

function Fields({ context }: { context?: string }) {
  return (
    <div className="mt-[clamp(2rem,5vh,3rem)] flex flex-col gap-[clamp(1.75rem,4vh,2.5rem)]">
      <Line n="01" id="enquiry-name" label={contact.form.name}>
        <input
          id="enquiry-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="enquiry-input"
        />
      </Line>

      <Line n="02" id="enquiry-phone" label={contact.form.phone}>
        <input
          id="enquiry-phone"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          className="enquiry-input tabular-nums"
        />
      </Line>

      <Line n="03" id="enquiry-job" label={contact.form.job}>
        <textarea
          id="enquiry-job"
          name="job"
          required
          rows={2}
          /* Seeded with the page they came from, so he knows which job they
             mean and they have less to type. Editable, obviously. */
          defaultValue={context ? `${context}. ` : undefined}
          className="enquiry-input resize-y"
        />
      </Line>
    </div>
  )
}

/** The honeypot and the timing field. Identical in both modes. */
function Traps({ elapsed }: { elapsed: React.RefObject<HTMLInputElement | null> }) {
  return (
    <>
      <div className="trap" aria-hidden="true">
        <label htmlFor="enquiry-website">Website</label>
        <input
          id="enquiry-website"
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input ref={elapsed} name={ELAPSED_FIELD} type="hidden" defaultValue="" />
    </>
  )
}

/**
 * A full-bleed band of colour, edge to edge, the way the menu's links are.
 * Burnt red on the near-black contact field is the only saturated thing on that
 * screen, and it clears 7:1 against bone.
 */
function SubmitBand({ label, pending }: { label: string; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: PALETTE.f6.bg, color: PALETTE.f6.fg }}
      className="mono-label -mx-[max(1.25rem,4vw)] mt-[clamp(2.5rem,6vh,3.5rem)] flex min-h-[4rem] w-[calc(100%+2*max(1.25rem,4vw))] items-center gap-3 px-[max(1.25rem,4vw)] disabled:opacity-100"
    >
      {label}
      <span aria-hidden="true">→</span>
    </button>
  )
}

/** Elapsed milliseconds since mount, kept current. See lib/enquiry-fields.ts. */
function useElapsed() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mounted = performance.now()
    const tick = () => {
      if (ref.current) ref.current.value = String(Math.round(performance.now() - mounted))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return ref
}

function Sent({ message, note }: { message: string; note?: string }) {
  return (
    <div>
      <p className="t-line max-w-[24ch]">{message}</p>
      {note ? <p className="mono mt-6 max-w-[40ch]">{note}</p> : null}
      <a href={phone.href} className="t-phone tap mt-6 tabular-nums">
        {phone.display}
      </a>
    </div>
  )
}

/* ------------------------------------------------------------ posted mode --- */

function PostedForm({ context }: { context?: string }) {
  const [state, action, pending] = useActionState(submitEnquiry, INITIAL)
  const elapsed = useElapsed()

  if (state.status === 'ok') return <Sent message={contact.form.sent} />

  return (
    <form action={action} noValidate className="max-w-[34rem]">
      <p className="mono-label">{contact.form.heading}</p>
      <Fields context={context} />
      <Traps elapsed={elapsed} />

      {state.message ? (
        <p role="status" className="mono mt-8">
          {state.message}
          {state.status === 'error' ? (
            <a
              href={phone.href}
              className="tap mt-2 tabular-nums underline underline-offset-[6px]"
            >
              {phone.display}
            </a>
          ) : null}
        </p>
      ) : null}

      <SubmitBand label={contact.form.submit} pending={pending} />
    </form>
  )
}

/* --------------------------------------------------------------- text mode --- */

function TextForm({ context }: { context?: string }) {
  const [handedOff, setHandedOff] = useState(false)
  const [message, setMessage] = useState('')
  const elapsed = useElapsed()

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    // Same trap as the posted mode. A bot gets the same silent nothing.
    if (String(data.get(HONEYPOT_FIELD) ?? '').trim() !== '') return

    const name = String(data.get('name') ?? '').trim()
    const number = String(data.get('phone') ?? '').trim()
    const job = String(data.get('job') ?? '').trim()
    if (!name || !job) return

    const body = [
      `Hi Andy, ${name} here.`,
      job,
      number ? `Best number for me is ${number}.` : '',
    ]
      .filter(Boolean)
      .join(' ')

    setMessage(body)
    setHandedOff(true)

    // "?&body=" rather than "?body=" — the form iOS accepts as well as Android.
    window.location.href = `sms:${phone.e164}?&body=${encodeURIComponent(body)}`
  }

  if (handedOff) {
    return (
      <div>
        <Sent message={contact.form.handedOff} note={contact.form.handedOffFallback} />
        {/* Shown so that if the hand-off did nothing — a desktop with no
            messaging app — the message they wrote is still in front of them to
            copy, rather than lost. */}
        <p className="mono mt-8 max-w-[44ch] whitespace-pre-wrap">{message}</p>
      </div>
    )
  }

  return (
    <>
      {/*
        This mode is the one thing on the site that genuinely needs scripting:
        composing the text happens in the browser. Rather than leave a form that
        silently does nothing, it is removed without JavaScript and the number
        takes its place. The posted mode has no such caveat — a server action on
        a plain form works either way.
      */}
      <noscript>
        <style>{`[data-text-form]{display:none!important}`}</style>
        <p className="mono max-w-[40ch]">{contact.form.handedOffFallback}</p>
        <a href={phone.href} className="t-phone tap mt-4 tabular-nums">
          {phone.display}
        </a>
      </noscript>

      <form data-text-form onSubmit={onSubmit} noValidate className="max-w-[34rem]">
        <p className="mono-label">{contact.form.heading}</p>
        <Fields context={context} />
        <Traps elapsed={elapsed} />
        <p className="mono mt-8 max-w-[40ch]">{contact.form.smsNote}</p>
        <SubmitBand label={contact.form.smsSubmit} />
      </form>
    </>
  )
}
