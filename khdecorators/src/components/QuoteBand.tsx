import { Gilded } from './Band'
import { CallLink, EmailLink } from './CallLink'
import { EnquiryForm } from './EnquiryForm'
import { TickIcon } from './icons'

/**
 * The foot of every service page: ask for a price, or ring. The form sits in a
 * lacquered card; the number is set large in gold leaf beside it, because on a
 * decorator's site the phone converts better than the form and it should look
 * like the first choice rather than the fallback.
 */
export function QuoteBand({
  from,
  title = 'Ask for a price',
  gild = 'price',
  standfirst = 'A couple of lines about the job and a town is enough to start with. I will ring you back rather than send a brochure.',
}: {
  /** Where on the site the enquiry came from, for the conversion record. */
  from: string
  title?: string
  gild?: string
  standfirst?: string
}) {
  return (
    <section id="quote" className="kh-well relative scroll-mt-32 overflow-hidden">
      <div className="kh-moulding" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_0%,rgb(201_162_39/0.1),transparent_65%)]"
      />
      <div className="shell relative py-20 md:py-28">
        <div className="kh-reveal grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
          <div>
            <p className="kh-eyebrow annotation">Free quote</p>
            <h2 className="display-sm mt-5">
              <Gilded text={title} gild={gild} />
            </h2>
            <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">{standfirst}</p>

            <div className="mt-12 border-t border-rule pt-8">
              <p className="annotation">Or just ring me</p>
              <p className="mt-3">
                <CallLink
                  className="gilt display inline-block transition-opacity duration-300 hover:opacity-85"
                  from={`${from}-quote`}
                />
              </p>
              <p className="mt-4">
                <EmailLink className="link link-hover-target" from={`${from}-quote`} />
              </p>
              <ul className="kh-ticks mt-10">
                {[
                  'Free, and no obligation attached to it',
                  'Same-day answer, usually',
                  'One job at a time, so the dates are real',
                ].map((item) => (
                  <li key={item}>
                    <TickIcon className="mt-1 size-5 text-gold" />
                    <span className="text-paper-dim">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="kh-card p-6 md:p-8">
            <EnquiryForm from={from} />
          </div>
        </div>
      </div>
    </section>
  )
}
