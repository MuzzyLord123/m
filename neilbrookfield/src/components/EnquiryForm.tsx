'use client';

import { useActionState, useEffect, useRef } from 'react';

import { PhoneNumber } from '@/components/Phone';
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
            <select
              id="timescale"
              name="timescale"
              defaultValue={v.timescale ?? ''}
              className="mt-3 w-full appearance-none border border-slate bg-transparent px-4 py-3 text-[color:var(--tone-fg)] focus-visible:border-brass"
            >
              <option value="">No rush / not sure</option>
              <option value="As soon as possible">As soon as you can</option>
              <option value="Next month or two">In the next month or two</option>
              <option value="Later this year">Later this year</option>
              <option value="Getting prices">Just getting prices at this stage</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="photos" className="eyebrow">
            Photographs (optional)
          </label>
          <p className="secondary mt-2 max-w-[52ch] text-sm leading-relaxed">
            {contact.photosNote}
          </p>
          <input
            id="photos"
            type="file"
            name="photos"
            multiple
            accept="image/*"
            className="mt-3 w-full border border-slate bg-transparent px-4 py-3 text-sm file:mr-4 file:border file:border-slate file:bg-transparent file:px-3 file:py-1 file:text-[color:var(--tone-fg)]"
          />
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
