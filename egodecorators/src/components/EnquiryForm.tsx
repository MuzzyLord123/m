'use client';

import { useActionState, useId } from 'react';
import { submitEnquiry } from '@/app/contact/actions';
import type { EnquiryResult } from '@/lib/enquiry';
import { phone } from '@content/site';
import { cn } from '@/lib/cn';

/**
 * The enquiry form.
 *
 * Styled like the rest of the site: no boxes, no rounded corners, no shadows.
 * A field is a label in metadata type over a hairline rule, and focus turns the
 * rule black. Nothing here is a component library's idea of a form.
 *
 * It works without JavaScript — a server action posts and the page comes back
 * with the result — and it does not render at all until an inbox has been
 * confirmed. See src/lib/enquiry.ts.
 */

const field = cn(
  'w-full border-0 border-b border-hair bg-transparent px-0 py-2',
  'font-body text-[17px] text-black',
  'focus:border-black focus:outline-none',
  'aria-[invalid=true]:border-black',
);

function Field({
  name,
  label,
  hint,
  error,
  type = 'text',
  autoComplete,
  required = false,
  rows,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  rows?: number;
}) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <p className="mb-7">
      <label htmlFor={id} className="meta mb-1 block">
        {label}
        {!required ? ' (optional)' : ''}
      </label>

      {rows ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          required={required}
          className={cn(field, 'resize-y')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className={field}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
      )}

      {hint ? (
        <span id={`${id}-hint`} className="meta mt-2 block normal-case tracking-normal">
          {hint}
        </span>
      ) : null}

      {error ? (
        <strong id={`${id}-error`} className="mt-2 block text-[15px] font-medium">
          {error}
        </strong>
      ) : null}
    </p>
  );
}

export function EnquiryForm() {
  const [state, formAction, pending] = useActionState<EnquiryResult | null, FormData>(
    submitEnquiry,
    null,
  );

  if (state?.ok) {
    return (
      <div role="status" className="border-t-2 border-black pt-6">
        <p className="display-sm">That is with us.</p>
        <p className="prose-body mt-4 max-w-[46ch]">
          We will come back to you shortly. If it is urgent, ring{' '}
          <a href={phone.href} className="link-seam">
            {phone.display}
          </a>{' '}
          — if nobody picks up we are up a ladder, so leave a message and you will get a call
          back.
        </p>
      </div>
    );
  }

  const errors = state?.ok === false ? state.errors : undefined;

  return (
    <form action={formAction} noValidate>
      {errors?.form ? (
        <p role="alert" className="mb-7 border-l-2 border-black pl-4 text-[15px] font-medium">
          {errors.form}
        </p>
      ) : null}

      <Field name="name" label="Your name" required autoComplete="name" error={errors?.name} />

      <Field
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        error={errors?.phone}
        hint="Whichever you would rather we used — a phone number or an email address."
      />

      <Field name="email" label="Email" type="email" autoComplete="email" error={errors?.email} />

      <Field
        name="town"
        label="Town"
        autoComplete="address-level2"
        error={errors?.town}
        hint="Neston, Parkgate, Heswall, Chester — wherever the job is."
      />

      <Field
        name="message"
        label="What needs doing"
        required
        rows={5}
        error={errors?.message}
        hint="Which rooms or which elevations, and anything that looks soft, split or stained."
      />

      {/* Honeypot. Hidden from people and from screen readers; bots fill it in. */}
      <p className="hidden" aria-hidden="true">
        <label htmlFor="website">Do not fill this in</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </p>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          'border-2 border-black bg-black px-6 py-3 font-body text-[15px] font-medium text-white',
          'hover:bg-white hover:text-black',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
          'disabled:opacity-60',
        )}
      >
        {pending ? 'Sending…' : 'Send it'}
      </button>

      <p className="meta mt-4">
        Or ring{' '}
        <a href={phone.href} className="link-seam">
          {phone.display}
        </a>
      </p>
    </form>
  );
}
