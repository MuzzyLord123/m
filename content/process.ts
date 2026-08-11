/** How a job runs. Four steps, numbered along a painted line. */

export type Step = {
  n: number
  title: string
  body: string
}

export const steps: Step[] = [
  {
    n: 1,
    title: 'Call and look at the job',
    body: 'You ring. I come out and look at what needs doing, measure up and check what is underneath — plaster, old gloss, damp, anything that changes the work.',
  },
  {
    n: 2,
    title: 'Written price',
    body: 'You get the price in writing, broken down by room or area. It covers the preparation as well as the paint, and says how many coats are going on.',
  },
  {
    n: 3,
    title: 'Sheets down, prep, paint',
    body: 'Furniture moved and covered, floors sheeted, then all the filling, sanding, caulking and priming. Topcoats go on last, once the surface is ready for them.',
  },
  {
    n: 4,
    title: 'Tidied, checked, snagged',
    body: 'Sheets up, sockets back on, floors swept. We walk round it together in daylight, and anything you are not happy with gets put right before I leave.',
  },
]
