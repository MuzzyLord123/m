import type { Metadata } from "next";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { BookingFormLazy } from "@/components/quote/BookingFormLazy";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Get a free quote",
  description: `Tell us about the job and we will send a written, itemised price within 48 hours. Free quotes across ${site.serviceArea}, no obligation.`,
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-10 lg:pt-[11rem] lg:pb-12">
        <div className="shell grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              Free quote
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
              Four questions,{" "}
              <em className="inline-block pb-[0.06em] leading-[1.1] italic">two minutes</em>.
            </h1>
          </div>
          <p className="measure text-[1.0625rem] leading-relaxed text-ink-soft lg:pb-3">
            Enough to price most jobs without a visit, and enough to know what to look at when
            we come. A written, itemised price follows within 48 hours.
          </p>
        </div>
      </section>

      <section className="shell pb-20 lg:pb-28" aria-label="Quote request">
        <div className="rounded-[4px] border border-hairline bg-paper p-6 sm:p-9 lg:p-12">
          <QuoteForm />
        </div>
      </section>

      <section className="bg-accent-wash py-20 lg:py-28" aria-labelledby="booking-heading">
        <div className="shell">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
            Or book a look
          </p>
          <div className="tape-line mt-3" aria-hidden="true" />
          <div className="mt-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <h2
              id="booking-heading"
              className="font-display text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] text-ink sm:text-[2.75rem]"
            >
              Book a free site visit.
            </h2>
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-ink-soft lg:mt-2">
              Pick a day that suits you and we will come and look at the job. It is a request,
              not a booked slot — we ring to confirm the time personally, because the person
              quoting is the person painting.
            </p>
          </div>

          <div className="mt-12 rounded-[4px] bg-paper p-6 sm:p-9 lg:p-10">
            <BookingFormLazy />
          </div>
        </div>
      </section>
    </>
  );
}
