/**
 * /about — Kenny, in the first person.
 *
 * Written from scratch. The old About page was almost certainly not: its
 * "Services" link pointed at rmdecorsolutions.co.uk, another decorator's website,
 * which is what happens when copy is lifted from a template or from a competitor
 * and the links are never changed. Duplicated boilerplate does not rank, and a
 * link to a rival on your own About page is exactly the detail a careful customer
 * notices.
 *
 * So: no "we pride ourselves on", no "no job too small", no "fully qualified team
 * of professionals" — he does not have a team. Corporate plural is banned on this
 * site. It is one man and the page says so.
 */

export const about = {
  h1: 'About Kenny',
  title: 'About Kenny — painter & decorator in {town} | KH Decorators',
  description:
    'Kenny is a time-served painter, decorator and spray finisher based in {town}, working across the north west. One man, one job at a time. Ring 07538 869832.',

  lede: 'I’m Kenny. I’m a time-served painter and decorator based in {town}, and I have been doing this long enough to have strong opinions about filler.',

  body: [
    'I work on my own. That is a decision, not a stage I am hoping to grow out of. It means the person who comes to quote your job is the person who does it, that I am only ever on one site at a time, and that if something is not right you are not being passed between a salesman and a subcontractor to get it sorted.',
    'Most of what I do is ordinary decorating: walls, ceilings, woodwork, papering, the outside of the house. What I have put the money and the time into is spray finishing and dust extraction, because those are the two things that change the job from the customer’s side rather than just from mine.',
    'Spraying, because there are surfaces a brush cannot do properly — UPVC, a steel garage door, a run of kitchen doors — and on those, hand-painting is a compromise everybody has quietly agreed to accept. Extraction, because the reason people put off decorating is not the paint, it is the fortnight of dust afterwards, and that turns out to be a solvable problem.',
    'I would rather tell you a job is not worth doing than take the work. If a garage door has rusted through, spraying it is money spent on something that needs replacing. If a wall is wet, painting it traps the damp and the coating fails. Saying so costs me the job that day and it is the reason people ring me again.',
  ],

  /**
   * "Time served" is a real trade term and it is worth keeping — it means an
   * apprenticeship rather than a short course. But it is doing a lot of work in one
   * phrase, and the specifics need confirming: which apprenticeship, when, and how
   * long he has been on his own since. See CONTENT-NEEDED.md.
   */
  spec: [
    { label: 'Name', value: 'Kenny' },
    { label: 'Trade', value: 'Painter, decorator, spray finisher' },
    { label: 'Based', value: '{town}' },
    { label: 'Works across', value: 'The north west of England' },
    { label: 'Team', value: 'One. Just me.' },
    { label: 'Time served', value: '{{TIME_SERVED}}' },
    { label: 'Years trading', value: '{{YEARS_TRADING}}' },
    { label: 'Qualifications', value: '{{QUALIFICATIONS}}' },
    { label: 'Insurance', value: '{{INSURANCE}}' },
  ],

  /** How he works, as short statements. These are commitments, so keep them few. */
  principles: [
    {
      title: 'Preparation is the job',
      body: 'The paint is the last part and the easiest part. Filling, flatting, caulking and priming are where a job is won, and they are also the parts that are invisible once it is finished — which is precisely why they are the parts that get skipped.',
    },
    {
      title: 'One job at a time',
      body: 'I do not start your house and then disappear to somebody else’s for three days. It is the main practical advantage of working alone and I am not giving it up.',
    },
    {
      title: 'You hear from me every day',
      body: 'Photographs at the end of each day, including the days when the weather stopped outside work and nothing happened. Especially those days.',
    },
    {
      title: 'Honest about what I cannot do',
      body: 'I am not a plasterer, a joiner, a window fitter or a damp specialist. I will tell you what I can see and who you actually need, and I would rather do that than have a go at it.',
    },
  ],
}
