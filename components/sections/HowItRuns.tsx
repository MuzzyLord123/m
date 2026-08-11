import { steps } from '@/content/process'
import { SectionHead } from '../SectionHead'

/**
 * Four steps strung along a painted line that draws itself as the section
 * scrolls into view — CSS scroll-driven, no JavaScript. Browsers without
 * animation-timeline support get the finished line, which is the point of it.
 *
 * Not four icon cards.
 */
export function HowItRuns() {
  return (
    <section id="how-it-runs" aria-labelledby="how-it-runs-heading" className="bg-chalk">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-12">
          <SectionHead
            eyebrow="How a job runs"
            heading={<span id="how-it-runs-heading">Call, price, sheets down, done.</span>}
            className="col-span-12 md:col-span-6 md:col-start-4"
          />
        </div>

        <div className="relative mt-14 md:mt-20">
          {/* the painted line — horizontal on desktop */}
          <svg
            className="run-line pointer-events-none absolute top-[30px] left-0 hidden h-4 w-full md:block"
            viewBox="0 0 1200 16"
            preserveAspectRatio="none"
            aria-hidden
            focusable="false"
          >
            <path
              d="M6 9 C 160 4, 290 13, 452 8 S 760 4, 900 10 S 1060 6, 1128 9"
              pathLength={1}
              fill="none"
              stroke="#D24E1B"
              strokeWidth={7}
              strokeLinecap="butt"
            />
          </svg>

          {/* and vertical on mobile, down the left of the steps */}
          <svg
            className="run-line pointer-events-none absolute top-0 left-[27px] h-full w-4 md:hidden"
            viewBox="0 0 16 1000"
            preserveAspectRatio="none"
            aria-hidden
            focusable="false"
          >
            <path
              d="M8 4 C 3 180, 13 340, 8 520 S 3 780, 8 996"
              pathLength={1}
              fill="none"
              stroke="#D24E1B"
              strokeWidth={7}
              strokeLinecap="butt"
            />
          </svg>

          <ol className="relative grid grid-cols-1 gap-y-10 md:grid-cols-4 md:gap-x-8">
            {steps.map((step) => (
              <li key={step.n} className="relative pl-[74px] md:pl-0">
                <span
                  aria-hidden
                  className="u-display absolute top-0 left-0 flex h-[60px] w-[60px] items-center justify-center bg-green text-[1.6rem] text-chalk md:relative md:h-[60px] md:w-[60px]"
                  style={{ fontWeight: 800 }}
                >
                  {step.n}
                </span>

                <h3 className="mt-0 text-[1.25rem] text-ink md:mt-6">
                  <span className="sr-only">Step {step.n}: </span>
                  {step.title}
                </h3>
                <p className="mt-2.5 max-w-[38ch] font-body text-[0.96rem] text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
