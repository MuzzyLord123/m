/**
 * /projects — replaces /projects-gallery/.
 *
 * The old page was photographs. This one is records, and the difference is the
 * caption block: sector, client type, scope, location, duration, system
 * applied, and whether the building stayed open. A buyer reading it is checking
 * one thing — has this firm done this, in a building like mine, while it was
 * in use.
 */

export const projects = {
  meta: {
    title: 'Site records — commercial & industrial painting projects | McDonald Painting Contractors',
    description:
      'Painting and decorating site records by sector: what the job was, where, how long we were on site, what was applied and whether the building stayed open during the works.',
  },

  sheet: {
    title: 'Site records',
    standfirst:
      'Each record carries the same seven fields, so two jobs can be compared without reading two paragraphs. Where a field has not been confirmed with the client it is marked outstanding rather than filled with something plausible.',
  },

  /**
   * There should be six to eight records here. There are three, drafted from
   * jobs we know the company has done, and three slots stating what is missing.
   *
   * That is not a gap in the build — it is the build showing its working. Every
   * one of these needs ten minutes with Sean and the original photographs, and
   * the questions are in CONTENT-NEEDED.md so the ten minutes is productive.
   */
  note: {
    title: 'Three more records, and what they need',
    body: 'Six to eight records is the point at which this page carries a sector list on its own. Three are drafted below from jobs the company has done. The remaining slots say what is wanted and why — they are questions for Sean, not placeholders for a designer.',
  },

  filter: {
    label: 'Filter by sector',
    all: 'All sectors',
  },
} as const;
