import Link from 'next/link';

import { Section, Container } from '@/components/Section';
import { PhoneNumber } from '@/components/Phone';

export default function NotFound() {
  return (
    <Section tone="night">
      <Container>
        <hr className="hairline max-w-24" />
        <p className="eyebrow mt-6">Nothing here</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(2.5rem,6vw,4.5rem)]">
          That page has moved, or never existed.
        </h1>
        <p className="secondary mt-8 max-w-[48ch] text-lg leading-[1.7]">
          The site was rebuilt and a few addresses changed. The work is all still here.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-8">
          <Link href="/work" className="eyebrow link-rule">
            See the work
          </Link>
          <Link href="/" className="eyebrow link-rule">
            Start again
          </Link>
          <span className="text-xl">
            <PhoneNumber />
          </span>
        </div>
      </Container>
    </Section>
  );
}
