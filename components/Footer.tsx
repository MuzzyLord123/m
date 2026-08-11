import { business } from '@/content/site'
import { confirmedAreas, suggestedAreas } from '@/content/areas'
import { checkatradeUrl } from '@/content/todo'
import { Logotype } from './Logotype'
import { CallLink } from './CallLink'

/**
 * Checkatrade appears as a plain text link and only once a real profile URL
 * exists in /content/todo.ts. No badge, no logo, no star rating, no review
 * count — those assets are licensed to members and an invented rating is worse
 * than no rating at all.
 */
export function Footer() {
  const areas = [...confirmedAreas, ...suggestedAreas.filter((a) => a.confirmed)]

  return (
    <footer className="bg-ink text-chalk">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-9 px-5 py-14 md:px-8 md:py-16">
        <div className="col-span-12 md:col-span-4">
          <Logotype size="lg" tone="chalk" />
          <p className="mt-5 max-w-[30ch] font-body text-[0.95rem] text-chalk/85">
            {business.trade} working in {business.base}, {business.region}.
          </p>
        </div>

        <div className="col-span-12 md:col-span-4">
          <h2 className="text-[1.1rem] text-chalk">Ring me</h2>
          <div className="mt-4">
            <CallLink variant="bar" className="max-w-[280px]" />
          </div>
          {checkatradeUrl ? (
            <p className="mt-5 font-body text-[0.92rem] text-chalk/85">
              Also listed on{' '}
              <a
                href={checkatradeUrl}
                rel="noopener"
                className="stroke-link text-chalk"
                style={{ backgroundImage: 'linear-gradient(#FFFDF8, #FFFDF8)' }}
              >
                Checkatrade
              </a>
              .
            </p>
          ) : null}
        </div>

        <div className="col-span-12 md:col-span-3 md:col-start-10">
          <h2 className="text-[1.1rem] text-chalk">Where I work</h2>
          <ul className="mt-4 font-body text-[0.95rem] text-chalk/85">
            {areas.map((a) => (
              <li key={a.name}>{a.name}</li>
            ))}
            <li className="mt-1 text-chalk/70">and the surrounding area</li>
          </ul>
        </div>

        <p className="col-span-12 border-t border-chalk/20 pt-6 font-body text-[0.82rem] text-chalk/70">
          {business.name} · {business.base}
        </p>
      </div>
    </footer>
  )
}
