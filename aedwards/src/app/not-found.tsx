import Link from 'next/link'
import { PALETTE } from '@content/fields'
import { notFound } from '@content/copy'
import { phone } from '@content/site'
import { Field } from '@/components/Field'
import { Ground } from '@/components/Ground'

export default function NotFound() {
  return (
    <>
      <Ground colour={PALETTE.f3} />
      <Field colour={PALETTE.f3} next={null} label={notFound.label}>
        <h1 className="t-display">{notFound.headline}</h1>
        <p className="mono mt-8 max-w-[40ch]">{notFound.line}</p>
        <a href={phone.href} className="t-phone tap mt-10 tabular-nums">
          {phone.display}
        </a>
        <p className="mono-label mt-10">
          <Link href="/" className="underline underline-offset-[6px]">
            Back to the start
          </Link>
        </p>
      </Field>
    </>
  )
}
