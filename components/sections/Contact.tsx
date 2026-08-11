import { contact } from '@/content/hero'
import { CallLink } from '../CallLink'
import { EnquiryForm } from '../EnquiryForm'
import { Tape } from '../Tape'

/**
 * Contact. Phone first and largest, form second. Tape label 4 of 4.
 */
export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="bg-green text-chalk">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-12 px-5 py-16 md:px-8 md:py-24">
        <div className="col-span-12 md:col-span-6 md:col-start-1">
          <Tape>{contact.eyebrow}</Tape>

          <h2
            id="contact-heading"
            className="mt-6 text-[clamp(2rem,4.8vw,3.3rem)] text-chalk"
          >
            {contact.heading}
          </h2>

          <p className="mt-5 max-w-[44ch] font-body text-[1.05rem] text-chalk/90">
            {contact.body}
          </p>

          <div className="mt-8">
            <CallLink variant="slab" />
          </div>

          <p className="mt-8 max-w-[44ch] border-l-4 border-orange pl-5 font-body text-[0.98rem] text-chalk/90">
            {contact.formNote}
          </p>
        </div>

        <div className="col-span-12 md:col-span-5 md:col-start-8">
          <h3 className="text-[1.5rem] text-chalk">{contact.formHeading}</h3>
          <div className="mt-6">
            <EnquiryForm />
          </div>
        </div>
      </div>
    </section>
  )
}
