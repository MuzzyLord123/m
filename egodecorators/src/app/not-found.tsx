import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { SeamLink } from '@/components/SeamLink';
import { nav, phone } from '@content/site';

/**
 * Nothing from the old site should ever reach this page — every WordPress URL
 * is redirected in next.config.mjs, including catch-alls for the retired
 * prefixes. If this page is being seen from an old link, that is a bug in the
 * redirect map and it belongs in MIGRATION.md.
 */
export default function NotFound() {
  return (
    <Band tone="paper" className="min-h-[60vh]">
      <Container>
        <h1 className="display cross-seam max-w-[12ch]">That page has gone</h1>

        <Split
          className="mt-10"
          stackRule={false}
          left={<Meta>404</Meta>}
          right={
            <div>
              <p className="lede max-w-[46ch]">
                We rebuilt this site and a few things moved. Everything that was on the old one is
                either below or a phone call away.
              </p>

              <ul className="mt-8">
                {nav.map((item) => (
                  <li key={item.href} className="border-t border-hair py-2">
                    <SeamLink href={item.href}>{item.label}</SeamLink>
                  </li>
                ))}
                <li className="border-t border-hair py-2">
                  <a href={phone.href} className="link-seam">
                    {phone.display}
                  </a>
                </li>
              </ul>
            </div>
          }
        />
      </Container>
    </Band>
  );
}
