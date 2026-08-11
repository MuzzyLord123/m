/**
 * /work — the index of jobs.
 *
 * The old portfolio was around a hundred untitled photographs in no order,
 * several of them duplicated. This page replaces it with named jobs. The
 * `pending` block below is what stands in until Neil and the photographs have
 * been through together — see content/needed.ts#project-grouping.
 */

export const work = {
  meta: {
    title: 'Work — hand-painted kitchens and decorating, Chester | Neil Brookfield',
    description:
      'Jobs in and around Chester, set out one at a time: what the customer wanted, what the work involved, and what it was painted in.',
  },

  eyebrow: 'Work',
  heading: 'Job by job.',
  lede: 'Every job here is set out the same way — what the customer wanted, what the work actually involved with the preparation first, and where I know it, what it was painted in.',

  pending: {
    eyebrow: 'Still to come',
    heading: 'The rest of the work is in a box of photographs.',
    body: 'There are around a hundred photographs of finished jobs, and on their own they tell you very little — which is what was wrong with the old portfolio page. They are being grouped into eight to twelve jobs, each with where it was, what was done and what it was painted in. That work needs Neil sat down with the pictures for an hour.',
  },
} as const;
