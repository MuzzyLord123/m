"use client";

import { useId, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

/**
 * Form primitives. Labels sit ABOVE inputs, always — a placeholder is never a
 * label. Errors sit below the input they belong to, in words rather than
 * validation-speak. Inputs carry the 8px radius; nothing else does.
 */

const inputBase =
  "w-full rounded-[8px] border bg-paper px-4 py-3 text-[1rem] text-ink placeholder:text-ink-mute/70 " +
  "transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:border-accent " +
  "focus-visible:ring-2 focus-visible:ring-accent/25 disabled:opacity-50";

export function Field({
  label,
  helper,
  error,
  children,
  id,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  id?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  const helperId = helper ? `${fieldId}-helper` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={fieldId} className="block text-[0.9375rem] font-medium text-ink">
        {label}
      </label>
      {helper && (
        <p id={helperId} className="mt-1 text-[0.8125rem] text-ink-mute">
          {helper}
        </p>
      )}
      <div className="mt-2">{children({ id: fieldId, describedBy, invalid: Boolean(error) })}</div>
      {/* The slot is always here, whether or not it holds a message. An error
          appearing or clearing must never move what is underneath it —
          revalidation on blur otherwise shifts the button out from under a
          cursor that is already coming down on it. */}
      <div className="min-h-[1.5rem] pt-1.5">
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-1.5 text-[0.8125rem] text-accent-ink"
          >
            <WarningCircle weight="light" className="mt-px size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export function TextInput({
  invalid,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputBase} ${invalid ? "border-accent-ink" : "border-hairline"} ${className}`}
    />
  );
}

export function TextArea({
  invalid,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputBase} min-h-32 resize-y ${invalid ? "border-accent-ink" : "border-hairline"} ${className}`}
    />
  );
}

/**
 * Radio group rendered as pill chips. A real radiogroup underneath, so arrow
 * keys and screen readers behave as they should.
 */
export function ChipGroup({
  label,
  helper,
  error,
  name,
  options,
  value,
  onChange,
  columns = false,
}: {
  label: string;
  helper?: string;
  error?: string;
  name: string;
  options: readonly string[];
  value?: string;
  onChange: (next: string) => void;
  columns?: boolean;
}) {
  const groupId = useId();
  const helperId = `${groupId}-helper`;

  return (
    <fieldset>
      {/* The id has to live on the legend. role="radiogroup" is on the div, not
          the fieldset, and a <legend> only implicitly names its own fieldset —
          so without this the aria-labelledby below is a dangling IDREF and the
          group has no accessible name at all. A screen reader then reads out
          five bare options with the question never spoken, on the form that is
          this site's only lead channel. */}
      <legend id={groupId} className="text-[0.9375rem] font-medium text-ink">
        {label}
      </legend>
      {helper && (
        <p id={helperId} className="mt-1 text-[0.8125rem] text-ink-mute">
          {helper}
        </p>
      )}

      <div
        className={`mt-3 ${columns ? "grid gap-2.5 sm:grid-cols-2" : "flex flex-wrap gap-2.5"}`}
        role="radiogroup"
        aria-labelledby={groupId}
        aria-describedby={helper ? helperId : undefined}
      >
        {options.map((option) => {
          const active = value === option;
          return (
            <label
              key={option}
              className={`inline-flex cursor-pointer items-center gap-2.5 rounded-full border px-4 py-2.5 text-[0.9375rem] transition-[border-color,background-color,color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] has-focus-visible:ring-2 has-focus-visible:ring-accent/30 ${
                active
                  ? "border-accent bg-accent-wash text-accent-ink"
                  : "border-hairline bg-paper text-ink-soft hover:border-accent/45 hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={active}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                  active ? "border-accent bg-accent" : "border-ink/25"
                }`}
              >
                {active && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              {option}
            </label>
          );
        })}
      </div>

      <div className="min-h-[1.5rem] pt-1.5">
        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-[0.8125rem] text-accent-ink">
            <WarningCircle weight="light" className="mt-px size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}

/** The honeypot. Off-screen, unlabelled to people, irresistible to bots. */
export function Honeypot({
  register,
}: {
  register: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };
}) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Website</label>
      <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register} />
    </div>
  );
}
