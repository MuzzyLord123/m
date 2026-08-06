"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PaintGauge } from "./PaintGauge";
import { PaintTick } from "./PaintTick";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ChipGroup, Field, Honeypot, TextArea, TextInput } from "@/components/ui/Field";
import { submitQuote } from "@/app/actions/lead";
import {
  PROPERTY_OPTIONS,
  ROOM_OPTIONS,
  SERVICE_OPTIONS,
  TIMING_OPTIONS,
  quoteSchema,
  type QuoteInput,
} from "@/lib/lead-schema";
import { site } from "@/config/site";

const STEP_FIELDS: FieldPath<QuoteInput>[][] = [
  ["service"],
  ["property", "rooms"],
  ["timing"],
  ["name", "phone", "email", "town"],
];

const STEP_LABELS = ["The trade", "The property", "Timing", "Your details"];

/**
 * Keyed on SERVICE_OPTIONS, not on the gallery's CATEGORIES.
 *
 * They are two different taxonomies that happen to share three ids. This used
 * to spread CATEGORIES, so "wallpaper" and "spray" — which exist only as
 * services, never as gallery categories — resolved to undefined and rendered as
 * two blank cards among four coloured ones on the first step of the quote form.
 * Deriving it from the options it actually labels means adding a service can no
 * longer leave a hole here.
 */
const SWATCHES: Record<string, string> = {
  interior: "var(--color-swatch-sage)",
  halls: "var(--color-swatch-slate)",
  kitchens: "var(--color-swatch-ochre)",
  extensions: "var(--color-swatch-terracotta)",
  exterior: "var(--color-swatch-blush)",
  commercial: "var(--color-accent-deep)",
  unsure: "var(--color-plaster-deep)",
};

export function QuoteForm() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const startedAt = useRef(0);
  const headingRef = useRef<HTMLParagraphElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    mode: "onTouched",
    defaultValues: { website: "", elapsedMs: 0, hasPhotos: false },
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const service = watch("service");
  const property = watch("property");
  const rooms = watch("rooms");
  const timing = watch("timing");

  async function next() {
    const valid = await trigger(STEP_FIELDS[step - 1]);
    if (!valid) return;
    setStep((current) => Math.min(STEP_FIELDS.length, current + 1));
    headingRef.current?.focus();
  }

  async function onSubmit(values: QuoteInput) {
    setStatus("sending");
    setServerError(null);
    try {
      const result = await submitQuote({ ...values, elapsedMs: Date.now() - startedAt.current });
      if (result.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setServerError(result.error);
      }
    } catch {
      /* A server action can REJECT rather than resolve — a dropped connection,
         a deploy landing mid-submit, a cold start that times out. Without this
         the await throws, status stays "sending", and the button sits disabled
         reading "Sending…" for ever: the customer has typed everything out and
         has no way to send it and no idea anything is wrong. */
      setStatus("error");
      setServerError(
        `That did not send — check your connection and try again, or ring ${site.phone} and we will take the details over the phone.`,
      );
    }
  }

  if (status === "sent") return <QuoteSent />;

  const slide = {
    initial: reduced ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? undefined : { opacity: 0, x: -24 },
    transition: { duration: reduced ? 0 : 0.34, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <MotionProvider>
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
      <Honeypot register={register("website")} />

      <PaintGauge step={step} total={STEP_FIELDS.length} labels={STEP_LABELS} />

      <p
        ref={headingRef}
        tabIndex={-1}
        aria-live="polite"
        className="mt-10 text-[0.75rem] font-semibold tracking-[0.14em] text-ink-mute uppercase outline-none"
      >
        Step {step} — {STEP_LABELS[step - 1]}
      </p>

      <div className="mt-5 min-h-[22rem]">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 && (
            <m.div key="step-1" {...slide}>
              <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                What needs doing?
              </h2>
              <p className="measure mt-2 text-[0.9375rem] text-ink-soft">
                Pick the closest. If the job spans two, choose the bigger one and tell us the
                rest at the end.
              </p>

              <fieldset className="mt-6">
                <legend className="sr-only">Choose a trade</legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SERVICE_OPTIONS.map((option) => {
                    const active = service === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`group cursor-pointer overflow-hidden rounded-[4px] border bg-paper transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:rotate-1 hover:shadow-lift active:scale-[0.98] active:rotate-0 has-focus-visible:ring-2 has-focus-visible:ring-accent/35 ${
                          active ? "border-accent shadow-lift" : "border-hairline"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.id}
                          {...register("service")}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="block h-16 w-full"
                          style={{ backgroundColor: SWATCHES[option.id] }}
                        />
                        <span className="block px-4 py-3.5">
                          <span
                            className={`block text-[0.9375rem] font-semibold ${active ? "text-accent" : "text-ink"}`}
                          >
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[0.8125rem] text-ink-mute">
                            {option.note}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="min-h-[1.5rem] pt-2">
                  {errors.service && (
                    <p role="alert" className="text-[0.8125rem] text-accent-ink">
                      {errors.service.message}
                    </p>
                  )}
                </div>
              </fieldset>
            </m.div>
          )}

          {step === 2 && (
            <m.div key="step-2" {...slide} className="grid gap-8">
              <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                Tell us about the place.
              </h2>
              <ChipGroup
                label="What sort of property is it?"
                name="property"
                options={PROPERTY_OPTIONS}
                value={property}
                onChange={(value) => setValue("property", value as QuoteInput["property"], { shouldValidate: true })}
                error={errors.property?.message}
                columns
              />
              <ChipGroup
                label="Roughly how much needs doing?"
                helper="A rough answer is fine — we measure up properly when we visit."
                name="rooms"
                options={ROOM_OPTIONS}
                value={rooms}
                onChange={(value) => setValue("rooms", value as QuoteInput["rooms"], { shouldValidate: true })}
                error={errors.rooms?.message}
              />
            </m.div>
          )}

          {step === 3 && (
            <m.div key="step-3" {...slide} className="grid gap-8">
              <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                When would you like it done?
              </h2>
              <ChipGroup
                label="Timing"
                helper="Pricing it up for a future job is fine. We would rather know than guess."
                name="timing"
                options={TIMING_OPTIONS}
                value={timing}
                onChange={(value) => setValue("timing", value as QuoteInput["timing"], { shouldValidate: true })}
                error={errors.timing?.message}
              />
            </m.div>
          )}

          {step === 4 && (
            <m.div key="step-4" {...slide} className="grid gap-6">
              <h2 className="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                Where do we send the price?
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Your name" error={errors.name?.message}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      autoComplete="name"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      {...register("name")}
                    />
                  )}
                </Field>
                <Field label="Phone" error={errors.phone?.message}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      type="tel"
                      autoComplete="tel"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      {...register("phone")}
                    />
                  )}
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      type="email"
                      autoComplete="email"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      {...register("email")}
                    />
                  )}
                </Field>
                <Field label="Town" error={errors.town?.message}>
                  {({ id, describedBy, invalid }) => (
                    <TextInput
                      id={id}
                      autoComplete="address-level2"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      {...register("town")}
                    />
                  )}
                </Field>
              </div>

              <Field
                label="Anything else we should know?"
                helper="Colours you have in mind, access, parking, deadlines."
                error={errors.message?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    {...register("message")}
                  />
                )}
              </Field>

              <label className="flex cursor-pointer items-start gap-3 rounded-[8px] border border-hairline bg-paper p-4 transition-colors duration-200 hover:border-accent/45 has-focus-visible:ring-2 has-focus-visible:ring-accent/30">
                <input
                  type="checkbox"
                  {...register("hasPhotos")}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span className="text-[0.9375rem] leading-relaxed text-ink-soft">
                  I have photographs of the job.{" "}
                  <span className="text-ink-mute">
                    Tick this and we will reply with an address to send them to — it often saves
                    a visit.
                  </span>
                </span>
              </label>

              {status === "error" && serverError && (
                <p
                  role="alert"
                  className="rounded-[8px] border border-accent-ink/30 bg-accent-wash px-4 py-3 text-[0.9375rem] text-accent-ink"
                >
                  {serverError}
                </p>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-ink/20 px-5 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-[border-color,color,transform] duration-200 hover:border-accent hover:text-accent active:translate-y-px active:scale-[0.98]"
          >
            <ArrowLeft weight="light" className="size-4" />
            Back
          </button>
        )}

        {step < STEP_FIELDS.length ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[0.9375rem] font-semibold whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-bright active:translate-y-px active:scale-[0.98]"
          >
            Continue
            <ArrowRight weight="light" className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "sending"}
            className="relative inline-flex h-12 items-center overflow-hidden rounded-full bg-accent px-7 text-[0.9375rem] font-semibold whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-bright active:translate-y-px active:scale-[0.98] disabled:cursor-wait disabled:opacity-90"
          >
            {status === "sending" && (
              <span aria-hidden="true" className="sending-fill absolute inset-y-0 left-0 bg-accent-deep" />
            )}
            <span className="relative">
              {status === "sending" ? "Sending your enquiry" : "Send my enquiry"}
            </span>
          </button>
        )}

        <p className="text-[0.8125rem] text-ink-mute">
          Or ring{" "}
          <a href={`tel:${site.phoneHref}`} className="font-medium text-accent">
            {site.phone}
          </a>
        </p>
      </div>
    </form>
    </MotionProvider>
  );
}

function QuoteSent() {
  return (
    <div role="status" className="py-4">
      <PaintTick />
      <h2 className="mt-8 font-display text-[2rem] leading-tight font-semibold tracking-[-0.03em] text-ink">
        That is with us.
      </h2>
      <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">
        A confirmation is on its way to your inbox. Here is what happens next, in order.
      </p>

      <ol className="mt-8 grid max-w-2xl gap-5">
        {[
          "We ring you within one working day to talk the job through.",
          "We come and look at it, and measure up properly.",
          "A written, itemised price lands in your inbox within 48 hours.",
        ].map((line, index) => (
          <li key={line} className="flex gap-4">
            <span className="font-display text-[0.875rem] font-semibold text-accent tabular-nums">
              0{index + 1}
            </span>
            <span className="text-[0.9375rem] leading-relaxed text-ink-soft">{line}</span>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-[0.9375rem] text-ink-mute">
        Nothing else will land in your inbox. No newsletter, no chasing.
      </p>
    </div>
  );
}
