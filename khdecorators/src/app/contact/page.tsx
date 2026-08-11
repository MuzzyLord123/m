import type { Metadata } from 'next'
import { CallLink, EmailLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { GridRules } from '@/components/GridRules'
import { Needed } from '@/components/Needed'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
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
 * Deliberately static, with no query parameters read on the server. It is a
 * conversion page for paid traffic, so it should be prerendered and served from the
 * edge rather than rendered per request.
 *
 * The two failure paths for a form posted without JavaScript go to their own small
 * static pages — /contact/incomplete and /contact/problem — instead of coming back
 * here with a query string. With JavaScript the form never navigates at all and shows
 * both outcomes inline.
 */
export default function ContactPage() {
  return (
    <PageShell>
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-7">
            <p className="annotation-lg text-ink">Contact</p>
            <h1 className="display mt-4">{contact.h1}</h1>
            <p className="measure mt-8 text-lg leading-relaxed">{contact.lede}</p>

            <div className="mt-10">
              <CallLink
                className="annotation-lg inline-block border border-signal bg-signal px-6 py-4 text-paper transition-opacity duration-150 hover:opacity-85"
                from="contact-hero"
              >
                Ring Kenny — {phone.label}
              </CallLink>
            </div>
          </div>

          <div className="mt-12 lg:col-span-5 lg:mt-0">
            <dl className="border-t border-rule">
              <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 border-b border-rule py-4">
                <dt className="annotation pt-1">Phone</dt>
                <dd>
                  <CallLink className="link link-hover-target" from="contact-list" />
                  <span className="annotation mt-1 block normal-case tracking-normal">
                    {contact.methods[0].note}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 border-b border-rule py-4">
                <dt className="annotation pt-1">Email</dt>
                <dd>
                  <EmailLink className="link link-hover-target" from="contact-list">
                    {email}
                  </EmailLink>
                  <span className="annotation mt-1 block normal-case tracking-normal">
                    {contact.methods[1].note}
                  </span>
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 border-b border-rule py-4">
                <dt className="annotation pt-1">Hours</dt>
                <dd>
                  {isPlaceholder(contact.methods[2].note) ? (
                    <Needed token="{{HOURS}}" />
                  ) : (
                    contact.methods[2].note
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 border-b border-rule py-4">
                <dt className="annotation pt-1">Area</dt>
                <dd>
                  {isPlaceholder(town) ? (
                    <>
                      <Needed token="{{TOWN}}" /> and {region}
                    </>
                  ) : (
                    <>
                      {town} and {region}
                    </>
                  )}
                  {areas.towns.length > 0 ? (
                    <span className="annotation mt-2 block leading-relaxed">
                      {areas.towns.join(' · ')}
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Drawn>

      <Section number="01" title={contact.form.heading} standfirst={contact.form.standfirst}>
        <EnquiryForm from="contact" />
      </Section>

      <Section number="02" title="Where I work">
        <div className="space-y-5">
          {areas.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="measure">
              {fill(paragraph)}
            </p>
          ))}
          {areas.towns.length > 0 ? (
            <ul className="grid max-w-[40rem] grid-cols-2 gap-x-6 border-t border-rule sm:grid-cols-3">
              {areas.towns.map((place) => (
                <li key={place} className="border-b border-rule py-3">
                  {place}
                </li>
              ))}
            </ul>
          ) : (
            <Needed token="areas.towns" inline={false} />
          )}
        </div>
      </Section>
    </PageShell>
  )
}
