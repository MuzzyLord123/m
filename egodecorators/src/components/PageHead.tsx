import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { SlideFromSeam } from '@/components/SlideFromSeam';

/**
 * The top of an inner page.
 *
 * The title crosses the seam at display size — that tension is the design, and
 * it is the one place type is allowed over the centre line. The standfirst sits
 * in the right-hand column, out of the seam, with the section label opposite it.
 */
export function PageHead({
  eyebrow,
  title,
  standfirst,
}: {
  eyebrow: string;
  title: string;
  standfirst: string;
}) {
  return (
    <Band tone="paper">
      <Container>
        <SlideFromSeam side="left">
          <h1 className="display cross-seam max-w-[16ch]">{title}</h1>
        </SlideFromSeam>

        <Split
          className="mt-10"
          align="baseline"
          stackRule={false}
          left={<Meta>{eyebrow}</Meta>}
          right={<p className="lede max-w-[52ch]">{standfirst}</p>}
        />
      </Container>
    </Band>
  );
}

/**
 * A numbered or titled row hanging off the seam: the label right-aligned into
 * the centre line, the body left-aligned out of it. The whole site is built out
 * of these.
 */
export function SeamRow({
  label,
  title,
  children,
  className,
}: {
  /** Metadata type, above the title. A stage number, a step, a place. */
  label?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Split
      className={className ?? 'border-t border-hair py-8'}
      left={
        <div className="md:ml-auto md:max-w-[18ch]">
          {label ? <Meta className="mb-2">{label}</Meta> : null}
          <h3 className="display-sm cross-seam">{title}</h3>
        </div>
      }
      right={<div className="prose-body max-w-[52ch]">{children}</div>}
    />
  );
}
