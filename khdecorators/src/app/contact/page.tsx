import type { Metadata } from 'next'
import { Band } from '@/components/Band'
import { CallLink, EmailLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Needed } from '@/components/Needed'
import { PhoneIcon, TickIcon } from '@/components/icons'
import { fill, pageMetadata } from '@/lib/metadata'
import { areas } from '@content/areas'
import { contact } from '@content/contact'
import { email, phone, region, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  title: contact.title,
  description: contact.description,
  path: '/contact',
})

/**
 * /contact — redirected to from /contact-us on the old site.
 *
 * Deliberately static, with no query parameters read on the server: it is a
 * conversion page for paid traffic, so it should be prerendered and served from the
 * edge rather than rendered per request. The two failure paths for a form posted
 * without JavaScript go to their own small static pages instead of coming back here
 * with a query string.
 */
export default function ContactPage() {
  return (
    <>
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-16 md:px-8 md:pt-20 md:pb-20">
          <div className="kh-reveal grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
            <div>
              <p className="annotation text-gold">Contact</p>
              <h1 className="display mt-4">{contact.h1}</h1>
              <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">{contact.lede}</p>

              <div className="mt-9">
                <CallLink className="kh-btn gap-2" from="contact-hero">
                  <PhoneIcon className="size-4" />
                  Ring Kenny — {phone.label}
                </CallLink>
              </div>

              <dl className="mt-12 grid gap-5 sm:grid-cols-2">
                <div className="kh-card p-5">
                  <dt className="annotation text-gold">Phone</dt>
                  <dd className="mt-2">
                    <CallLink className="link link-hover-target font-medium" from="contact-list" />
                    <span className="mt-2 block text-sm text-paper-dim">
                      {contact.methods[0].note}
                    </span>
                  </dd>
                </div>

                <div className="kh-card p-5">
                  <dt className="annotation text-gold">Email</dt>
                  <dd className="mt-2">
                    <EmailLink className="link link-hover-target font-medium" from="contact-list">
                      {email}
                    </EmailLink>
                    <span className="mt-2 block text-sm text-paper-dim">
                      {contact.methods[1].note}
                    </span>
                  </dd>
                </div>

                <div className="kh-card p-5">
                  <dt className="annotation text-gold">Hours</dt>
                  <dd className="mt-2">
                    {isPlaceholder(contact.methods[2].note) ? (
                      <Needed token="{{HOURS}}" />
                    ) : (
                      contact.methods[2].note
                    )}
                  </dd>
                </div>

                <div className="kh-card p-5">
                  <dt className="annotation text-gold">Area</dt>
                  <dd className="mt-2 text-paper-dim">
                    {isPlaceholder(town) ? (
                      <>
                        <Needed token="{{TOWN}}" /> and {region}
                      </>
                    ) : (
                      <>
                        {town} and {region}
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <EnquiryForm from="contact" />
            </div>
          </div>
        </Drawn>
      </section>

      <Band tone="well" eyebrow="Areas covered" title="Where I work" divider>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-5 text-paper-dim">
            {areas.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="measure">
                {fill(paragraph)}
              </p>
            ))}
          </div>

          <div>
            {areas.towns.length > 0 ? (
              <>
                <ul className="flex flex-wrap gap-2">
                  {areas.towns.map((place) => (
                    <li key={place} className="kh-pill">
                      {place}
                    </li>
                  ))}
                </ul>
                <p className="annotation mt-5 leading-relaxed">{areas.note}</p>
              </>
            ) : (
              <Needed token="areas.towns" inline={false} />
            )}

            <ul className="kh-ticks mt-10">
              {[
                'Free quotes, and no obligation attached',
                'I answer these myself, usually the same day',
                'One job at a time, so the dates I give you are real',
              ].map((item) => (
                <li key={item}>
                  <TickIcon className="mt-1 size-5 text-gold" />
                  <span className="text-paper-dim">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>
    </>
  )
}
