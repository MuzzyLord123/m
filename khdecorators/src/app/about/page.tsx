import type { Metadata } from 'next'
import Link from 'next/link'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { GridRules } from '@/components/GridRules'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
import { Spec } from '@/components/Spec'
import { fill, pageMetadata } from '@/lib/metadata'
import { about } from '@content/about'
import { phone } from '@content/site'

export const metadata: Metadata = pageMetadata({
  title: about.title,
  description: about.description,
  path: '/about',
})

/**
 * /about — redirected to from /about-us, which is where it lived on Google Sites.
 *
 * Every word here is new. The old About page's "Services" link pointed at
 * rmdecorsolutions.co.uk — another decorator's website — which is what happens when copy
 * is taken from a template or a competitor and the links never get changed. Nothing was
 * carried across, including the parts that read fine.
 */
export default function AboutPage() {
  const rail = [
    { id: 'kenny', number: '01', label: 'Kenny' },
    { id: 'how', number: '02', label: 'How I work' },
    { id: 'facts', number: '03', label: 'The facts' },
  ]

  return (
    <PageShell rail={rail}>
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <p className="annotation-lg text-gold">About</p>
            <h1 className="display mt-4">{about.h1}</h1>
            <p className="measure mt-8 text-lg leading-relaxed">{fill(about.lede)}</p>
          </div>
        </div>
      </Drawn>

      <Section id="kenny" number="01" title="In my own words">
        <div className="space-y-5">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="measure">
              {fill(paragraph)}
            </p>
          ))}
        </div>
      </Section>

      <Section id="how" number="02" title="How I work">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {about.principles.map((item) => (
            <div key={item.title} className="border-t border-edge pt-4">
              <h3 className="display-xs">{item.title}</h3>
              <p className="mt-3 text-paper-dim">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="facts" number="03" title="The facts">
        <div className="max-w-[46rem]">
          <Spec rows={about.spec.map((row) => ({ ...row, value: fill(row.value) }))} />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4">
          <CallLink className="kh-btn" from="about">
            Ring Kenny — {phone.label}
          </CallLink>
          <Link href="/contact" className="kh-btn-ghost">
            Send me the job
          </Link>
        </div>
      </Section>
    </PageShell>
  )
}
