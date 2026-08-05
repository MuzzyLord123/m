"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DayPicker } from "react-day-picker";
import { addDays, format, startOfDay } from "date-fns";
import { enGB } from "date-fns/locale";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { PaintTick } from "./PaintTick";
import { ChipGroup, Field, Honeypot, TextArea, TextInput } from "@/components/ui/Field";
import { submitBooking } from "@/app/actions/lead";
import { AM_PM, bookingSchema, type BookingInput } from "@/lib/lead-schema";
import { site } from "@/config/site";

/**
 * "Book a free site visit" — our own flow, not an embedded scheduler.
 *
 * Weekdays only, four weeks out. The copy is honest that this is a request the
 * decorator confirms personally, which is the truth and reads as better
 * service than a slot machine that books itself.
 *
 * react-day-picker supplies the calendar logic; every class on it is ours, and
 * its stylesheet is deliberately not imported.
 */
const dayPickerClassNames = {
  root: "w-full",
  months: "relative",
  month: "w-full",
  month_caption: "flex items-center justify-center pb-4",
  caption_label: "font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink",
  nav: "absolute inset-x-0 top-0 flex items-center justify-between",
  button_previous:
    "grid size-9 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-plaster hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent",
  button_next:
    "grid size-9 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-plaster hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent",
  month_grid: "w-full border-collapse",
  weekdays: "",
  weekday:
    "pb-2 text-[0.75rem] font-semibold tracking-[0.08em] text-ink-mute uppercase",
  week: "",
  day: "p-0.5 text-center",
  day_button:
    "grid aspect-square w-full place-items-center rounded-full text-[0.9375rem] text-ink transition-[background-color,color,transform] duration-200 hover:bg-accent-wash hover:text-accent-ink active:scale-95",
  selected: "[&_button]:bg-accent [&_button]:text-white [&_button]:font-semibold [&_button]:hover:bg-accent-deep [&_button]:hover:text-white",
  today: "[&_button]:ring-1 [&_button]:ring-accent/40",
  disabled: "[&_button]:cursor-not-allowed [&_button]:text-ink-mute/35 [&_button]:hover:bg-transparent [&_button]:hover:text-ink-mute/35",
  outside: "[&_button]:text-ink-mute/30",
  hidden: "invisible",
};

export function BookingForm() {
  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | undefined>();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAt = useRef(0);
  const reduced = useReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: { website: "", startedAt: 0, date: "" },
  });

  // Dates are resolved after mount so the server and client never disagree.
  useEffect(() => {
    setToday(startOfDay(new Date()));
    startedAt.current = Date.now();
  }, []);

  const preference = watch("preference");

  function pick(date: Date | undefined) {
    setSelected(date);
    setValue("date", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true });
  }

  async function onSubmit(values: BookingInput) {
    setStatus("sending");
    setServerError(null);
    const result = await submitBooking({ ...values, startedAt: startedAt.current });
    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setServerError(result.error);
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="py-4">
        <PaintTick />
        <h2 className="mt-8 font-display text-[2rem] leading-tight font-semibold tracking-[-0.03em] text-ink">
          Visit requested.
        </h2>
        <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">
          {selected ? format(selected, "EEEE d MMMM", { locale: enGB }) : "That day"} is pencilled
          in. Nothing is fixed until we have spoken — we will ring within one working day to
          agree a time that actually works, rather than one a calendar picked.
        </p>
        <p className="mt-6 text-[0.9375rem] text-ink-mute">
          Need to change it? Ring{" "}
          <a href={`tel:${site.phoneHref}`} className="font-medium text-accent">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative grid gap-8">
      <Honeypot register={register("website")} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-10">
        <div>
          <p className="text-[0.9375rem] font-medium text-ink">Pick a day</p>
          <p className="mt-1 text-[0.8125rem] text-ink-mute">
            Weekdays, within the next four weeks.
          </p>

          <div className="mt-3 rounded-[4px] border border-hairline bg-paper p-4">
            {today ? (
              <DayPicker
                mode="single"
                locale={enGB}
                weekStartsOn={1}
                selected={selected}
                onSelect={pick}
                startMonth={today}
                endMonth={addDays(today, 28)}
                disabled={[
                  { dayOfWeek: [0, 6] },
                  { before: addDays(today, 1) },
                  { after: addDays(today, 28) },
                ]}
                classNames={dayPickerClassNames}
                components={{
                  PreviousMonthButton: (props) => (
                    <button {...props} type="button">
                      <CaretLeft weight="light" className="size-4" />
                    </button>
                  ),
                  NextMonthButton: (props) => (
                    <button {...props} type="button">
                      <CaretRight weight="light" className="size-4" />
                    </button>
                  ),
                }}
              />
            ) : (
              <CalendarSkeleton />
            )}
          </div>

          <div className="min-h-[1.5rem] pt-1.5">
            {errors.date && (
              <p role="alert" className="text-[0.8125rem] text-accent-ink">
                {errors.date.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <ChipGroup
            label="Morning or afternoon?"
            helper="A preference, not a promise — we confirm the hour when we ring."
            name="preference"
            options={AM_PM}
            value={preference}
            onChange={(value) =>
              setValue("preference", value as BookingInput["preference"], { shouldValidate: true })
            }
            error={errors.preference?.message}
          />

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
          </div>

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

          <Field
            label="Address of the job"
            helper="Enough for us to find it and park."
            error={errors.address?.message}
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                autoComplete="street-address"
                aria-describedby={describedBy}
                invalid={invalid}
                {...register("address")}
              />
            )}
          </Field>

          <Field label="Anything we should know?" error={errors.message?.message}>
            {({ id, describedBy, invalid }) => (
              <TextArea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                {...register("message")}
              />
            )}
          </Field>

          {status === "error" && serverError && (
            <p
              role="alert"
              className="rounded-[8px] border border-accent-ink/30 bg-accent-wash px-4 py-3 text-[0.9375rem] text-accent-ink"
            >
              {serverError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending"}
              className="relative inline-flex h-13 items-center overflow-hidden rounded-full bg-accent px-7 py-4 text-[0.9375rem] font-semibold whitespace-nowrap text-white shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-deep active:translate-y-px active:scale-[0.98] disabled:cursor-wait disabled:opacity-90"
            >
              {status === "sending" && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-accent-deep"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: reduced ? 0 : 1.4, ease: "linear" }}
                />
              )}
              <span className="relative">
                {status === "sending" ? "Requesting the visit" : "Request this visit"}
              </span>
            </button>
            <p className="text-[0.8125rem] text-ink-mute">
              Free, and there is no obligation afterwards.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Matches the calendar's shape exactly, so nothing moves when it arrives. */
function CalendarSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mx-auto h-6 w-32 rounded-full bg-plaster" />
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={`head-${index}`} className="h-3 rounded-full bg-plaster" />
        ))}
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={index} className="aspect-square rounded-full bg-plaster/70" />
        ))}
      </div>
    </div>
  );
}
