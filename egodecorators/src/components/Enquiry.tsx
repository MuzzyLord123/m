import { DELIVERY_CONFIGURED } from '@/lib/enquiry';
import { email, phone } from '@content/site';
import { Pending } from '@/components/Pending';
import { EnquiryForm } from '@/components/EnquiryForm';
import { SeamLink } from '@/components/SeamLink';

/**
 * The enquiry block at the foot of a page.
 *
 * Two routes that are known to work — the phone and the email address — are on
 * every page. The form itself is only on /contact: a five-field form under
 * every article would be heavy, and this site is set at a density where it
 * would read as nagging.
 *
 * The form appears only once an inbox has been confirmed. Until then the page
 * says so rather than collecting enquiries into a void — see src/lib/enquiry.ts.
 */
export function Enquiry({
  heading,
  body,
  withForm = false,
}: {
  heading: string;
  body: string;
  /** /contact only. */
  withForm?: boolean;
}) {
  return (
    <div>
      <h2 className="display-sm">{heading}</h2>
      <p className="prose-body lede mt-5">{body}</p>

      <dl className="mt-8">
        <dt className="meta">Phone</dt>
        <dd className="display-sm mt-2">
          <a href={phone.href} className="link-seam">
            {phone.display}
          </a>
        </dd>

        <dt className="meta mt-6">Email</dt>
        <dd className="mt-2">
          <a href={email.href} className="link-seam">
            {email.address}
          </a>
        </dd>
      </dl>

      {withForm ? (
        DELIVERY_CONFIGURED ? (
          <div className="mt-10">
            <EnquiryForm />
          </div>
        ) : (
          <Pending id="enquiry-delivery" label="Enquiry form — not live yet" className="mt-10" />
        )
      ) : (
        <p className="mt-8">
          <SeamLink href="/contact">Send us the details instead</SeamLink>
        </p>
      )}
    </div>
  );
}
