'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { contact } from '@content/copy/contact';
import { phone } from '@content/site';
import { submitEnquiry } from '@/lib/actions';
import { initialEnquiryState } from '@/lib/enquiry';
import { track } from '@/components/Analytics';
import { Arrow } from '@/components/Arrow';

/**
 * The enquiry form, routed by type.
 *
 * Three kinds of enquiry arrive and they want different things, so the type is
 * the first question and it changes what is asked next. A tender enquiry needs a
 * work email and a return date; a householder needs to know someone will ring
 * back. Asking all of it every time is how a form gets abandoned.
 *
 * The type is also the most useful thing on the site to measure. Which is why
 * selecting it fires an event — see components/Analytics.tsx.
 */
export function EnquiryForm({
  initialType = 'commercial',
  capabilityStatement = false,
}: {
  initialType?: string;
  /** Renders the capability-statement variant: the download is the outcome. */
  capabilityStatement?: boolean;
}) {
  const [state, action, pending] = useActionState(submitEnquiry, initialEnquiryState);
  const [type, setType] = useState(initialType);
  const [stamp, setStamp] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  useEffect(() => {
    setStamp(String(Date.now()));
  }, []);

  // The download is started by the client rather than by a redirect, so the
  // success message stays on screen while the file arrives.
  useEffect(() => {
    if (state.status === 'success' && state.download) {
      track('capability_statement_download', { enquiry_type: type });
      window.location.href = state.download;
    }
  }, [state, type]);

  const selected = contact.types.find((t) => t.id === type) ?? contact.types[1];

  if (state.status === 'success') {
    return (
      <div data-ground="graphite" className="border-l-[3px] border-[var(--flag)] p-8">
        <p className="t-label !text-[var(--mark)]">Sent</p>
        <h3 className="t-sub mt-3 text-[var(--ink)]">Thank you — that has gone through.</h3>
        <p className="mt-4 max-w-[52ch] text-[var(--muted)]">
          {state.download
            ? 'The capability statement should be downloading now. If it has not started, the link is below. Sean will follow it up.'
            : `Sean will come back to you. If it is urgent, ${phone.display} is faster than waiting for a reply.`}
        </p>
        {state.download ? (
          <a
            href={state.download}
            className="t-label !text-[var(--color-navy)] mt-6 inline-flex items-center gap-3 bg-[var(--color-amber)] px-5 py-3 hover:bg-[#c98d18]"
          >
            Download the capability statement
            <Arrow />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="max-w-[42rem]">
      <input type="hidden" name="stamp" value={stamp} />
      {capabilityStatement ? (
        <input type="hidden" name="capabilityStatement" value="yes" />
      ) : null}

      {/* Honeypot. Off-screen rather than display:none, which some bots detect. */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="border-0 p-0">
        <legend className="t-label mb-4">What kind of enquiry is this?</legend>
        <div className="grid gap-px bg-[var(--rule)] sm:grid-cols-3">
          {contact.types.map((t) => {
            const active = t.id === type;
            return (
              <label
                key={t.id}
                className={`cursor-pointer p-5 transition-colors ${
                  active ? 'bg-[var(--color-amber)] text-[var(--color-navy)]' : 'bg-[var(--ground)] hover:bg-[var(--raised)]'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.id}
                  checked={active}
                  onChange={() => {
                    setType(t.id);
                    track('enquiry_type_selected', { enquiry_type: t.id });
                  }}
                  className="sr-only"
                />
                <span
                  className={`t-label block ${active ? '!text-[var(--color-navy)]' : ''}`}
                >
                  {t.label}
                </span>
                <span className="mt-2 block text-[14px] leading-[1.45]">{t.blurb}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="t-label mt-6">Useful to include</p>
      <ul className="mt-2 space-y-1.5">
        {selected.wants.map((want) => (
          <li key={want} className="pl-5 text-[15px] leading-[1.5] relative">
            <span
              aria-hidden
              className="absolute left-0 top-[0.62em] h-px w-3 bg-[var(--label)]"
            />
            {want}
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Field id={`${id}-name`} name="name" label="Your name" required error={state.fieldErrors?.name} defaultValue={state.values?.name} />
        <Field
          id={`${id}-organisation`}
          name="organisation"
          label={type === 'domestic' ? 'Town' : 'Organisation'}
          defaultValue={state.values?.organisation}
          autoComplete={type === 'domestic' ? 'address-level2' : 'organization'}
        />
        <Field
          id={`${id}-email`}
          name="email"
          label={type === 'domestic' ? 'Email' : 'Work email'}
          type="email"
          required={capabilityStatement || type === 'tender'}
          error={state.fieldErrors?.email}
          defaultValue={state.values?.email}
          autoComplete="email"
        />
        <Field
          id={`${id}-telephone`}
          name="telephone"
          label="Telephone"
          type="tel"
          error={state.fieldErrors?.telephone}
          defaultValue={state.values?.telephone}
          autoComplete="tel"
        />
      </div>

      {type !== 'domestic' ? (
        <div className="mt-6">
          <Field
            id={`${id}-building`}
            name="building"
            label="The building, and where it is"
            defaultValue={state.values?.building}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <label htmlFor={`${id}-message`} className="t-label block">
          {type === 'tender'
            ? 'What is being tendered, and when is it due back?'
            : type === 'domestic'
              ? 'What needs doing?'
              : 'What needs doing, and when can it be worked on?'}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          defaultValue={state.values?.message}
          className="mt-2 w-full border border-[var(--rule)] bg-transparent px-4 py-3 text-[16px] leading-[1.5] focus:border-[var(--mark)] focus:outline-none"
        />
      </div>

      {state.message ? (
        <p className="mt-6 border-l-[3px] border-[var(--flag)] bg-graphite px-4 py-3 text-[15px] text-[var(--ink)]">
          {state.message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={pending}
          className="t-label !text-[var(--color-navy)] inline-flex items-center gap-3 bg-[var(--color-amber)] px-6 py-4 hover:bg-[#c98d18] disabled:opacity-60"
        >
          {pending
            ? 'Sending…'
            : capabilityStatement
              ? 'Send and download the statement'
              : 'Send enquiry'}
          <Arrow />
        </button>
        <a href={phone.href} data-analytics="phone" className="t-label hover:!text-[var(--mark)]">
          Or ring {phone.who} — {phone.display}
        </a>
      </div>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = 'text',
  required,
  error,
  defaultValue,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="t-label block">
        {label}
        {required ? <span aria-hidden> ·</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        /* 16px, so iOS does not zoom the viewport when the field is focused. */
        className="mt-2 w-full border border-[var(--rule)] bg-transparent px-4 py-3 text-[16px] focus:border-[var(--mark)] focus:outline-none"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[14px] text-[var(--mark)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
