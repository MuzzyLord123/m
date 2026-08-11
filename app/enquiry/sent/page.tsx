import type { Metadata } from 'next'
import { CallLink } from '@/components/CallLink'
import { Logotype } from '@/components/Logotype'
import { contact } from '@/content/hero'

export const metadata: Metadata = {
  title: 'Message sent | F.A.S Painter and Decorator',
  robots: { index: false, follow: false },
}

/** Where the form lands when JavaScript is not available. */
export default function SentPage() {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-[820px] flex-col justify-center px-5 py-20 md:px-8">
      <a href="/" aria-label="F.A.S Painter &amp; Decorator, back to the home page">
        <Logotype size="lg" />
      </a>

      <h1 className="mt-10 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">{contact.successHeading}</h1>
      <p className="mt-4 max-w-[46ch] font-body text-ink-soft">{contact.successBody}</p>

      <div className="mt-8">
        <CallLink variant="slab" />
      </div>

      <a href="/" className="stroke-link mt-10 w-fit font-body font-medium text-ink">
        Back to the site
      </a>
    </main>
  )
}
