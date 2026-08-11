import { finishes, finishesNote } from '@/content/finishes'
import { SectionHead } from '../SectionHead'

/**
 * Finishes explainer. A real table, not a card grid — this is reference
 * information a homeowner is genuinely looking for before they ring anyone.
 * Stacks into labelled blocks below md without losing table semantics.
 */
export function Finishes() {
  return (
    <section id="finishes" aria-labelledby="finishes-heading" className="bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-12 gap-x-8">
          <SectionHead
            eyebrow="Eggshell, satin or gloss"
            heading={<span id="finishes-heading">Which finish goes where.</span>}
            intro={
              <p>
                The three you will be asked to choose between, what each one is good at, and where
                each one lets you down. If you are unsure, satin on the woodwork is the answer more
                often than not.
              </p>
            }
            className="col-span-12 md:col-span-7 md:col-start-1"
          />
        </div>

        <table className="finish-table mt-12 w-full border-collapse text-left">
          <caption className="sr-only">
            Paint finishes compared: sheen level, where each one suits, and how each one wears.
          </caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-b-2 border-ink">
              <th
                scope="col"
                className="w-[14%] py-3 pr-4 font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink uppercase"
              >
                Finish
              </th>
              <th
                scope="col"
                className="w-[16%] py-3 pr-4 font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink uppercase"
              >
                Sheen
              </th>
              <th
                scope="col"
                className="w-[35%] py-3 pr-4 font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink uppercase"
              >
                Where it suits
              </th>
              <th
                scope="col"
                className="w-[35%] py-3 font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink uppercase"
              >
                How it wears
              </th>
            </tr>
          </thead>
          <tbody>
            {finishes.map((f) => (
              <tr
                key={f.name}
                className="block border-t border-ink/15 py-6 align-top md:table-row md:py-0"
              >
                <th
                  scope="row"
                  className="block pb-3 text-left align-top text-[1.35rem] text-ink md:table-cell md:py-7 md:pr-4"
                >
                  {f.name}
                </th>
                <td
                  data-label="Sheen"
                  className="block pb-4 align-top font-body text-ink-soft md:table-cell md:py-7 md:pr-4"
                >
                  <span className="block font-body text-[0.95rem] text-ink">
                    {f.sheen} · about {f.sheenPercent}%
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 block h-2.5 w-full max-w-[120px] bg-ink/12"
                  >
                    <span
                      className="block h-full bg-ink"
                      style={{ width: `${f.sheenPercent}%` }}
                    />
                  </span>
                </td>
                <td
                  data-label="Where it suits"
                  className="block pb-4 align-top font-body text-[0.97rem] text-ink-soft md:table-cell md:py-7 md:pr-6"
                >
                  {f.suits}
                </td>
                <td
                  data-label="How it wears"
                  className="block align-top font-body text-[0.97rem] text-ink-soft md:table-cell md:py-7"
                >
                  {f.wears}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-14 grid grid-cols-12">
          <div className="col-span-12 border-t-4 border-swatch-clay pt-6 md:col-span-7 md:col-start-6">
            <h3 className="text-[1.4rem] text-ink">{finishesNote.heading}</h3>
            <p className="mt-3 max-w-[62ch] font-body text-ink-soft">{finishesNote.body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
