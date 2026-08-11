'use client';

import { useActionState, useEffect, useRef, useState } from 'react';

import { PhoneNumber } from '@/components/Phone';
import { ChevronGlyph } from '@/components/icons';
import { initialEnquiryState, submitEnquiry } from '@/lib/actions';
import { contact } from '@content/copy/contact';

/**
 * Works without JavaScript. The form posts to a server action, and React's
 * progressive enhancement means a visitor with scripts switched off gets the
 * same form, the same validation and the same confirmation.
 *
 * No CAPTCHA. There is a honeypot field a person never sees, and a timing check
 * that only applies when JavaScript filled the stamp in — so having scripts off
 * is never treated as suspicious.
 */
export function EnquiryForm({
  source,
  variant = 'general',
}: {
  /** Which page it came from, so Neil knows what the enquiry is about. */
  source: string;
  variant?: 'general' | 'workshop';
}) {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialEnquiryState);
  const stampRef = useRef<HTMLInputElement>(null);
  // Filenames are echoed back so it is obvious the photographs attached. With
  // scripts off this list stays empty, but the files themselves still submit.
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    if (stampRef.current) stampRef.current.value = String(Date.now());
  }, []);

  if (state.status === 'success') {
    return (
      <div className="border border-slate p-8 md:p-10">
        <p className="eyebrow">Sent</p>
        <h3 className="mt-4 text-[clamp(1.5rem,3vw,2rem)]">{contact.success.heading}</h3>
        <p className="secondary mt-4 max-w-[48ch] text-base leading-relaxed">
          {contact.success.body}
        </p>
        <p className="mt-6 text-xl">
          <PhoneNumber />
        </p>
      </div>
    );
  }

  const v = state.values ?? {};

  return (
    <form action={formAction} encType="multipart/form-data" noValidate className="max-w-[46rem]">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="stamp" ref={stampRef} defaultValue="" />

      {/* Honeypot. Hidden from people and from screen readers; bots fill it in. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={`website-${source}`}>Website</label>
        <input
          id={`website-${source}`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.status === 'error' && state.message ? (
        <p role="alert" className="eyebrow mb-8 border border-brass px-4 py-3">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-8">
        <Field
          label="Your name"
          name="name"
          defaultValue={v.name}
          error={state.fieldErrors?.name}
          required
          autoComplete="name"
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field
            label="Phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={v.phone}
            autoComplete="tel"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={v.email}
            autoComplete="email"
          />
        </div>

        {state.fieldErrors?.contact ? (
          <p className="eyebrow -mt-6" role="alert">
            {state.fieldErrors.contact}
          </p>
        ) : (
          <p className="eyebrow eyebrow-muted -mt-6">Either is fine — whichever you prefer.</p>
        )}

        <Field
          label={variant === 'workshop' ? 'What would you like to get out of it?' : 'What is the job?'}
          name="project"
          textarea
          rows={5}
          defaultValue={v.project}
          error={state.fieldErrors?.project}
          required
        />

        {variant === 'workshop' ? (
          <Field
            label="Which Saturday did you have in mind?"
            name="preferredSaturday"
            type="date"
            defaultValue={v.preferredSaturday}
            hint="A rough date is fine — we can move it."
          />
        ) : (
          <div>
            <label htmlFor="timescale" className="eyebrow">
              Rough timescale
            </label>
            {/* The native dropdown indicator is drawn by the operating system and
                looks like somebody else's software, so it is stripped and our own
                chevron drawn in its place. The control underneath is still a plain
                <select>, so it works without JavaScript and on a phone. */}
            <div className="relative mt-3">
              <select
                id="timescale"
                name="timescale"
                defaultValue={v.timescale ?? ''}
                className="w-full appearance-none border border-slate bg-transparent py-3 pr-12 pl-4 text-[color:var(--tone-fg)] focus-visible:border-brass"
              >
                <option value="">No rush / not sure</option>
                <option value="As soon as possible">As soon as you can</option>
                <option value="Next month or two">In the next month or two</option>
                <option value="Later this year">Later this year</option>
                <option value="Getting prices">Just getting prices at this stage</option>
              </select>
              <ChevronGlyph className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[color:var(--tone-accent)]" />
            </div>
          </div>
        )}

        {/* The browser's own file control ("Choose Files — No file chosen") is
            operating-system furniture and the one thing on the page that would
            look like it came from somewhere else. The input is kept — it is what
            submits, with or without JavaScript — but moved off-screen and driven
            by a label styled like every other link on the site. */}
        <div>
          <p className="eyebrow">Photographs (optional)</p>
          <p className="secondary mt-2 max-w-[52ch] text-sm leading-relaxed">
            {contact.photosNote}
          </p>

          <input
            id="photos"
            type="file"
            name="photos"
            multiple
            accept="image/*"
            onChange={(e) => setChosen(Array.from(e.target.files ?? []).map((f) => f.name))}
            className="peer sr-only"
          />
          <label
            htmlFor="photos"
            className="eyebrow link-rule mt-4 inline-block cursor-pointer peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brass"
          >
            Choose photographs
          </label>

          {chosen.length ? (
            <ul className="mt-4">
              {chosen.map((name) => (
                <li key={name} className="secondary border-t border-t-current/15 py-2 text-sm">
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <hr className="hairline mb-8" />
          <button
            type="submit"
            disabled={pending}
            className="eyebrow link-rule disabled:opacity-50"
          >
            {pending ? 'Sending…' : 'Send it'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  textarea = false,
  rows,
  required = false,
  defaultValue,
  error,
  hint,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: 'tel' | 'email' | 'text';
}) {
  const describedBy = [error ? `${name}-error` : null, hint ? `${name}-hint` : null]
    .filter(Boolean)
    .join(' ');

  const shared = {
    id: name,
    name,
    defaultValue,
    required,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': describedBy || undefined,
    autoComplete,
    inputMode,
    className:
      'mt-3 w-full border border-slate bg-transparent px-4 py-3 text-[color:var(--tone-fg)] placeholder:text-[color:var(--tone-secondary)] focus-visible:border-brass',
  };

  return (
    <div>
      <label htmlFor={name} className="eyebrow">
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="secondary mt-2 text-sm">
          {hint}
        </p>
      ) : null}
      {textarea ? (
        <textarea {...shared} rows={rows ?? 4} />
      ) : (
        <input {...shared} type={type} />
      )}
      {error ? (
        <p id={`${name}-error`} className="eyebrow mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
