import { DELIVERY_CONFIGURED } from '@/lib/enquiry';
import { email, phone } from '@content/site';
import { Pending } from '@/components/Pending';

/**
 * The enquiry block.
 *
 * There is no form on this site yet, and that is deliberate. A contact form
 * that delivers nowhere is worse than no form at all: the customer believes
 * they have got in touch, and then waits. Until an inbox is confirmed and a
 * test enquiry has actually arrived in it, the page gives the two routes that
 * are known to work — the phone and the email address.
 *
 * Flip DELIVERY_CONFIGURED in src/lib/enquiry.ts once that is true, and wire
 * the action. The markup for the form belongs here, next to this comment, so
 * that whoever does it cannot miss the reason it was left out.
 */
export function Enquiry({ heading, body }: { heading: string; body: string }) {
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

      {!DELIVERY_CONFIGURED ? (
        <Pending
          id="enquiry-delivery"
          label="Enquiry form — not live yet"
          className="mt-8"
          minHeight="0"
        />
      ) : null}
    </div>
  );
}
