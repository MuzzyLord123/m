import { preparation } from '@/content/preparation'
import { PhotoSlot } from '../PhotoSlot'
import { Tape } from '../Tape'

/**
 * The differentiator. Off-black field, chalk type — the serious part of the
 * page, given the weight it deserves. Tape label 2 of 4.
 */
export function Preparation() {
  return (
    <section
      id="preparation"
      aria-labelledby="preparation-heading"
      className="bg-swatch-black text-chalk"
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-10 px-5 py-16 md:px-8 md:py-24">
        <div className="col-span-12 md:col-span-7 md:col-start-1">
          <Tape>{preparation.eyebrow}</Tape>

          <h2
            id="preparation-heading"
            className="mt-6 text-[clamp(2.1rem,5.2vw,3.6rem)] text-chalk"
          >
            {preparation.heading}
          </h2>

          <p className="mt-6 max-w-[58ch] font-body text-[1.05rem] text-chalk/90">
            {preparation.standfirst}
          </p>
        </div>

        <div className="col-span-12 md:col-span-4 md:col-start-9">
          <PhotoSlot
            photo={preparation.photo}
            swatch="clay"
            className="aspect-[3/4] w-full"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        </div>

        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <ol className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
            {preparation.steps.map((step, i) => (
              <li key={step.title} className={i === 4 ? 'md:col-span-2 md:max-w-[70ch]' : ''}>
                <h3 className="flex items-baseline gap-3 text-[1.3rem] text-chalk">
                  <span
                    aria-hidden
                    className="font-body text-[0.8rem] font-semibold tracking-[0.18em] text-chalk/60"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-[56ch] font-body text-[0.98rem] text-chalk/85">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-12 max-w-[62ch] border-l-4 border-orange pl-5 font-body text-[1.08rem] text-chalk">
            {preparation.closing}
          </p>
        </div>
      </div>
    </section>
  )
}
