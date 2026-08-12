import type { EnquiryResult } from '@/lib/enquiry';

/**
 * Stands in for the enquiry server action in the static-export bundle.
 *
 * Static hosting has no server, so a Server Action cannot exist there — Next
 * refuses to export one at all. This module is aliased in for that build only
 * (see STATIC_EXPORT in next.config.mjs).
 *
 * In practice it never runs: the form is not rendered unless
 * DELIVERY_CONFIGURED is true, and if you want a working form you want the Node
 * deployment rather than this bundle. But if it ever did run it says so plainly
 * and points at the phone, rather than swallowing an enquiry and letting
 * somebody believe they had been in touch.
 */
export async function submitEnquiry(): Promise<EnquiryResult> {
  return {
    ok: false,
    errors: {
      form:
        'This copy of the site is hosted as plain files, so the form cannot send. ' +
        'Please ring or email us instead — both are just below.',
    },
  };
}
