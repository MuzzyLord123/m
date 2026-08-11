import type { Metadata } from 'next'
import { CallLink } from '@/components/CallLink'
import { Logotype } from '@/components/Logotype'

export const metadata: Metadata = {
  title: 'That did not send | F.A.S Painter and Decorator',
  robots: { index: false, follow: false },
}

/** The no-JavaScript failure path. Always ends with the phone number. */
export default function ProblemPage() {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-[820px] flex-col justify-center px-5 py-20 md:px-8">
      <a href="/" aria-label="F.A.S Painter &amp; Decorator, back to the home page">
        <Logotype size="lg" />
      </a>

      <h1 className="mt-10 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">That did not send.</h1>
      <p className="mt-4 max-w-[48ch] font-body text-ink-soft">
        Something went wrong at our end, not yours. Ring instead and I will pick it up.
      </p>

      <div className="mt-8">
        <CallLink variant="slab" />
      </div>

      <a href="/#contact" className="stroke-link mt-10 w-fit font-body font-medium text-ink">
        Back to the form
      </a>
    </main>
  )
}
