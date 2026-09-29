import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { CallLink } from '@/components/CallLink'
import { Hero } from '@/components/Hero'
import { Needed } from '@/components/Needed'
import { PhoneIcon, SERVICE_ICONS } from '@/components/icons'
import { TrustCard } from '@/components/kit'
import { fill, pageMetadata } from '@/lib/metadata'
import { about } from '@content/about'
import { photos } from '@content/photos'
import { phone, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  title: about.title,
  description: about.description,
  path: '/about',
})

/**
 * /about — redirected to from /about-us, which is where it lived on Google Sites.
 *
 * Every word here is new. The old About page's "Services" link pointed at
 * rmdecorsolutions.co.uk — another decorator's website — which is what happens when
 * copy is taken from a template and the links never get changed. Nothing was
 * carried across, including the parts that read fine.
 */
export default function AboutPage() {
  const icons = ['brush', 'roller', 'shop', 'extractor'] as const

  return (
    <>
      <Hero
        photo={photos.mockTudorSide}
        focus="30% 50%"
        eyebrow="About"
        title={about.h1}
        gild="Kenny"
        lede={
          isPlaceholder(town)
            ? about.lede.replace(' based in {town}', '')
            : fill(about.lede)
        }
        plaque="On a job, van on the drive"
        from="about-hero"
      />

      <Band tone="well" eyebrow="In my own words" title="How I got here, and how I work" divider>
        <div className="mx-auto max-w-[46rem] space-y-5 text-paper-dim">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{fill(paragraph)}</p>
          ))}
        </div>
      </Band>

      <Band eyebrow="How I work" title="Four things I will not budge on" align="centre">
        <div className="grid gap-5 sm:grid-cols-2">
          {about.principles.map((item, i) => (
            <TrustCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={SERVICE_ICONS[icons[i % icons.length]]}
            />
          ))}
        </div>
      </Band>

      <Band tone="well" eyebrow="The facts" title="Everything you might want to check" divider>
        <div className="kh-card max-w-[52rem] p-6 md:p-8">
          <dl className="space-y-4">
            {about.spec.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0"
              >
                <dt className="annotation">{row.label}</dt>
                <dd className="font-medium">
                  {isPlaceholder(fill(row.value)) ? <Needed token={fill(row.value)} /> : fill(row.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CallLink className="kh-btn gap-2" from="about">
            <PhoneIcon className="size-4" />
            Ring Kenny — {phone.label}
          </CallLink>
          <Link href="/contact" className="kh-btn-ghost">
            Send me the job
          </Link>
        </div>
      </Band>
    </>
  )
}
