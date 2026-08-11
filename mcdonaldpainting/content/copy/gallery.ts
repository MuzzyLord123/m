/**
 * /gallery — replaces the old /projects-gallery/.
 *
 * A gallery is not evidence, which is why the site records exist. But a gallery
 * is what a householder and a shop owner actually want to look at, and a
 * before-and-after of a blown render is the most persuasive thing a painting
 * contractor owns. So it gets a page of its own, done properly, and it points
 * at the records rather than pretending to be them.
 */

export const gallery = {
  meta: {
    title: 'Photographs of our work | McDonald Painting Contractors, Cheshire',
    description:
      'Photographs of painting, decorating and repair work, before and after: render repairs, exterior decoration, fitted furniture and interiors across Cheshire, the Wirral and North Wales.',
  },

  sheet: {
    title: 'Photographs of the work',
    standfirst:
      'Plates, numbered, with the before and after side by side where we have both. Drag the divider to see what a wall looked like when we arrived. Nothing here has been staged, straightened or borrowed from anybody else’s job.',
  },

  figures: [
    {
      figure: 'B/A',
      label: 'Before and after',
      note: 'Where both photographs exist, they are shown as one plate with a divider you drag, rather than two pictures you have to hold in your head.',
    },
    {
      figure: '01',
      label: 'Numbered plates',
      note: 'Every photograph has a number, so a job can be pointed at over the phone without describing it.',
    },
    {
      figure: 'RAW',
      label: 'Originals only',
      note: 'Photographs go up at the size they came off the camera. Nothing is saved down from social media, and there is no stock photography anywhere on this site.',
    },
  ],

  records: {
    title: 'A photograph shows the finish. A record shows the job.',
    standfirst:
      'If you are deciding whether to put us on a tender list, the site records are the page you want: sector, client type, scope, location, duration, what was applied, and whether the building stayed open while we worked.',
  },
} as const;
