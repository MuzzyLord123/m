import { emptyPhoto, type ServicePage, type ServiceRow } from './types'

/**
 * The service table on the home page (§03), and the three standard service pages.
 *
 * The table is a table on purpose. A grid of cards with icons tells a visitor
 * nothing they cannot already guess; a table with an application column tells them
 * which work is sprayed and which is hand-painted, which is the only question that
 * actually distinguishes this decorator from the next one.
 */

export const serviceRows: ServiceRow[] = [
  {
    href: '/spraying',
    name: 'Exterior spraying',
    summary: 'Render, cladding, fascias, soffits and gutters. Two coats, sprayed.',
    application: 'Spray',
  },
  {
    href: '/spraying',
    name: 'UPVC & garage door spraying',
    summary: 'Windows, doors, conservatory frames and garage doors, in any colour.',
    application: 'Spray',
  },
  {
    href: '/spraying',
    name: 'Furniture & kitchen doors',
    summary: 'Doors off, degreased, keyed, primed and sprayed flat.',
    application: 'Spray',
  },
  {
    href: '/dustless-sanding',
    name: 'Dustless sanding',
    summary: 'Extraction at the pad, so you can stay in the house while I work.',
    application: 'Brush, roller or spray',
  },
  {
    href: '/interior-decoration',
    name: 'Interior decoration',
    summary: 'Walls, ceilings and woodwork. Filling and flatting before any paint.',
    application: 'Brush & roller',
  },
  {
    href: '/exterior-decoration',
    name: 'Exterior decoration',
    summary: 'Render, masonry, woodwork and making good, by hand where it suits.',
    application: 'Brush, roller or spray',
  },
  {
    href: '/wallpaper-hanging',
    name: 'Wallpaper hanging',
    summary: 'Lining, plain and patterned papers, and short-notice single walls.',
    application: 'Brush & roller',
  },
  {
    href: '/contact',
    name: 'Commercial',
    summary: 'Offices, shops and lets. Out of hours where the space has to stay open.',
    application: 'Brush, roller or spray',
  },
  {
    href: '/contact',
    name: 'Industrial',
    summary: 'Units, workshops, steelwork and floors. Sprayed where the scale calls for it.',
    application: 'Brush, roller or spray',
  },
]

/* ------------------------------------------------------------------ *
 * Interior
 * ------------------------------------------------------------------ */

const interior: ServicePage = {
  slug: 'interior-decoration',
  h1: 'Interior decoration',
  title: 'Interior painting & decorating in {town} | KH Painting and Decorating',
  description:
    'Interior decorating in {town} and across the north west. Walls, ceilings and woodwork, filled and flatted properly, sanded dustless so you can stay in the house. Ring Kenny on 07538 869832.',
  lede: 'Most of what makes an interior look right happened before the topcoat went on. The paint is the last two days of the job and the least skilled part of it. What you are paying for is the filling, the flatting and the cutting in.',
  covers: [
    'Walls and ceilings, new plaster or repaint',
    'Skirting, architrave, doors, window boards and stairs',
    'Kitchens and bathrooms, in coatings that will take the moisture',
    'Staircases, landings and hallways — the awkward ones',
    'Filling, making good and small plaster repairs',
    'New-build snagging and mist coats on fresh plaster',
  ],
  method: [
    {
      title: 'Everything gets covered, then I look properly',
      body: 'Sheets down and furniture moved or covered before anything else. Then I go round the room in a raking light with a pencil and mark every dent, nail hole, cracked joint and proud tape line. In ordinary light you will miss half of them; in the finished job you will see all of them.',
    },
    {
      title: 'Fill, and fill again',
      body: 'Filler shrinks back as it dries, so anything deeper than a scuff wants a second pass. One heavy fill that sinks is the commonest reason a repainted wall still looks tired.',
    },
    {
      title: 'Flatted with the extractor running',
      body: 'Filler and old coatings sanded back with dust extraction at the pad, so the dust ends up in the machine and not through the house. See the dustless sanding page — it is the reason people can stay put while I am working.',
    },
    {
      title: 'Caulk the lines that should be straight',
      body: 'The joint where skirting meets wall, architrave meets plaster, coving meets ceiling. Caulked and cut in, those read as one crisp line. Left open, they read as a gap however good the paint is.',
    },
    {
      title: 'Primer where it earns its place',
      body: 'Bare filler, new plaster, bare timber, water stains and anything I do not trust to hold a topcoat. Not everywhere, as a matter of routine — on the places that need it, for a reason I can give you.',
    },
    {
      title: 'Two coats, cut in by hand',
      body: 'Ceilings, then walls, then woodwork last so nothing lands on a finished surface. Edges cut in with a brush rather than masked, because tape on a fresh wall lifts it.',
    },
    {
      title: 'Cleared, and checked in daylight',
      body: 'Sheets up, everything back where it was, and a walk round in daylight with you. Anything you are not happy with I put right then, not on a snagging visit three weeks later.',
    },
  ],
  spec: [
    { label: 'Preparation', value: 'Fill, flat, caulk, spot-prime' },
    { label: 'Sanding', value: 'Dust-extracted at the pad' },
    { label: 'Coats', value: 'Two, plus primer where needed' },
    { label: 'Order of work', value: 'Ceilings, walls, woodwork' },
    { label: 'Edges', value: 'Cut in by hand, not taped' },
    { label: 'You in the house', value: 'Yes, room by room' },
    { label: 'Daily update', value: 'Photographs at the end of every day' },
    { label: 'Typical three-bed, whole house', value: '{{DAYS_INTERIOR_HOUSE}}' },
  ],
  limits: [
    'I cannot make a bad wall flat with paint. Where plaster has blown or a ceiling is cracked across, that is a plastering job first, and I will tell you before I start rather than paint over it and let you find out.',
    'Damp is not a decorating problem. If a wall is wet, paint traps it and the coating fails; the cause needs finding first. I will say what I can see and be honest that finding it is somebody else’s trade.',
    'New plaster needs to be dry through before it takes a mist coat. That is weeks, not days, and rushing it shows up as patchy suction for the life of the paint.',
    'Fresh emulsion is dry to the touch quickly and hard much later. Skirtings want a few days before things get pushed back against them.',
    'I work on my own, so I do one job at a time and I am not on three sites at once. It means the dates are real. It also means I cannot start next week if next week is already somebody else’s.',
  ],
  photo: emptyPhoto(
    'A finished room shot from the doorway in daylight — woodwork and walls in the same frame so the cut-in line is visible. A raking-light shot of a flatted, filled wall before paint is just as valuable.',
  ),
  callouts: [
    { x: 28, y: 38, side: 'left', label: 'Filled, flatted, dust extracted' },
    { x: 72, y: 52, side: 'right', label: 'Cut in by hand, no tape' },
    { x: 46, y: 80, side: 'right', label: 'Caulked line, wall to skirting' },
  ],
}

/* ------------------------------------------------------------------ *
 * Exterior
 * ------------------------------------------------------------------ */

const exterior: ServicePage = {
  slug: 'exterior-decoration',
  h1: 'Exterior decoration',
  title: 'Exterior painting & decorating in {town} | KH Painting and Decorating',
  description:
    'Exterior decorating in {town} and across the north west. Render, masonry and woodwork, made good before painting, two coats. Weather-honest dates. Ring Kenny on 07538 869832.',
  lede: 'Outside, the paint is doing a job rather than a decorating job — it is the thing keeping weather out of the render and off the timber. So the making good matters more than the colour, and the date depends on the forecast rather than on the diary.',
  covers: [
    'Rendered and pebbledashed walls',
    'Brick, stone and painted masonry',
    'Fascias, soffits, bargeboards and gutters',
    'Windows, doors and timber frames',
    'Garden walls, gates, railings and metalwork',
    'Making good — cracks, loose render, rotten timber',
  ],
  method: [
    {
      title: 'Wash it down and kill what is growing on it',
      body: 'Render on a shaded north wall in this part of the country is usually carrying green growth. It gets treated and rinsed rather than painted over, because a coating on top of it feeds it and it comes back through.',
    },
    {
      title: 'Make good before anything else',
      body: 'Cracks raked out and filled, loose and hollow render cut back to sound, rotten timber cut out and replaced or filled depending on how far it has gone. Paint does not bridge a moving crack, and covering one up only hides where the water is getting in.',
    },
    {
      title: 'Stabilise the powdery bits',
      body: 'Old masonry paint chalks. If the topcoat goes onto dust, it takes the dust with it when it fails. Anything bare or friable gets a stabilising coat first.',
    },
    {
      title: 'Timber back to something sound',
      body: 'Flaking paint off, bare timber primed, knots treated, and the putty lines and joints sealed. Sills get the most attention because that is where water sits and where the rot starts.',
    },
    {
      title: 'Two coats, by brush or sprayed',
      body: 'Whichever suits the surface. Rough render sprayed gets into the texture properly; window timber is better hand-painted, and I will say which I am proposing and why. Both, on the same house, is normal.',
    },
    {
      title: 'Left as I found it',
      body: 'Sheets and masking off, borders and paths checked over, and any overspray or splashes dealt with before I go — not left for the rain to sort out.',
    },
  ],
  spec: [
    { label: 'Preparation', value: 'Clean, treat growth, make good, stabilise' },
    { label: 'Coats', value: 'Two, plus primer on bare substrate' },
    { label: 'Application', value: 'Brush, roller or spray, chosen per surface' },
    { label: 'Access', value: 'Ladder, tower or scaffold as needed' },
    { label: 'Temperature', value: 'Above roughly 10°C, and dry' },
    { label: 'Weather', value: 'Dates given as a week, not a day' },
    { label: 'Typical semi, all elevations', value: '{{DAYS_EXTERIOR_HOUSE}}' },
  ],
  limits: [
    'The weather runs the schedule. Masonry has to be dry through, and after a wet week that takes longer than it looks. I would rather move a date than spray or brush onto a damp wall.',
    'Between roughly November and March there are not many usable days in the north west. I will take the booking and be straight with you about when it can realistically happen.',
    'Painting does not cure damp, fix a leaking gutter or repair failed render. Those come first or the coating fails and you have paid twice.',
    'Pebbledash that is already coming away will keep coming away. Coating it does not fix the adhesion underneath.',
    'Where there is rot in a window I will show you and tell you honestly whether it is a filler job or a joiner job.',
  ],
  photo: emptyPhoto(
    'A finished elevation in flat daylight, the whole house in frame. A close shot of a made-good crack or a repaired sill before painting is worth as much — it shows the part nobody photographs.',
  ),
  callouts: [
    { x: 24, y: 30, side: 'left', label: 'Growth treated before coating' },
    { x: 70, y: 44, side: 'right', label: 'Cracks raked out and made good' },
    { x: 44, y: 78, side: 'left', label: 'Sills primed, joints sealed' },
  ],
}

/* ------------------------------------------------------------------ *
 * Wallpaper
 * ------------------------------------------------------------------ */

const wallpaper: ServicePage = {
  slug: 'wallpaper-hanging',
  h1: 'Wallpaper hanging',
  title: 'Wallpaper hanging in {town} | KH Painting and Decorating',
  description:
    'Wallpaper hung in {town} and across the north west. Lining, plain and patterned papers, feature walls at short notice. Walls prepared properly first. Ring Kenny on 07538 869832.',
  lede: 'Papering is judged on two things: whether the seams show and whether the pattern still lines up at the far corner. Both are decided by the wall underneath and by how carefully the first length was hung.',
  covers: [
    'Feature walls and chimney breasts',
    'Full rooms, hallways, stairs and landings',
    'Lining paper before painting, on walls that need it',
    'Patterned and matched papers',
    'Heavy and delicate hangings — grasscloth, textured, paste-the-wall',
    'Stripping old paper and making the wall good',
  ],
  method: [
    {
      title: 'Get the old paper off properly',
      body: 'Stripped back, and the residue washed off rather than papered over. Old paste left on the wall reactivates under new paste and the new paper lifts.',
    },
    {
      title: 'Make the wall flat and consistent',
      body: 'Filled, sanded with extraction, and sized or primed so the whole wall has the same suction. A patch that drinks paste faster than the wall next to it is a seam that opens later.',
    },
    {
      title: 'Set the first length off a plumb line',
      body: 'Not off the corner. No corner in any house is plumb, and if the first drop follows the corner, the pattern leans a little further out all the way round the room.',
    },
    {
      title: 'Plan where the pattern lands',
      body: 'Before anything is cut. Where the repeat falls on the chimney breast, where the join sits relative to the window, and which corner takes the mismatch — because on a patterned paper in a real room, one of them has to.',
    },
    {
      title: 'Butt the seams, roll them down',
      body: 'Edges butted rather than overlapped, brushed out from the centre so no air is trapped, and the seams rolled once the paste has grabbed but before it has set.',
    },
    {
      title: 'Trim clean and wipe down as I go',
      body: 'Sharp blade, changed constantly — a dull blade tears wet paper rather than cutting it. Paste wiped off the woodwork and the ceiling line before it dries, not after.',
    },
  ],
  spec: [
    { label: 'Preparation', value: 'Strip, wash off, fill, sand, size' },
    { label: 'Setting out', value: 'From a plumb line, pattern planned first' },
    { label: 'Seams', value: 'Butted and rolled, not overlapped' },
    { label: 'Lining', value: 'Where the wall needs it — advised, not assumed' },
    { label: 'Short notice', value: 'A single wall can often be fitted in' },
    { label: 'Typical feature wall', value: '{{HOURS_FEATURE_WALL}}' },
    { label: 'Typical room', value: '{{DAYS_PAPER_ROOM}}' },
  ],
  limits: [
    'Order enough paper, and order it in one go. Batches vary in colour, and a second batch bought a fortnight later can be visibly different in the same room.',
    'Allow for the repeat when you are working out quantities. A big pattern repeat can waste most of a roll, and running short mid-wall stops the job.',
    'On a damp wall, paper will not stay up. That is a wall problem and it needs solving first.',
    'Very old, soft plaster can come away when old paper is stripped. It sometimes cannot be avoided, and if it looks likely I will say so before starting.',
    'I hang paper. I do not sell it — you buy the paper you actually want, and I will tell you how many rolls you need before you do.',
  ],
  photo: emptyPhoto(
    'A finished papered wall, shot at a slight angle in raking light so the seams are visibly not visible. A chimney breast with a matched pattern is the best possible version of this shot.',
  ),
  callouts: [
    { x: 30, y: 34, side: 'left', label: 'Seams butted, not overlapped' },
    { x: 68, y: 50, side: 'right', label: 'Set out from a plumb line' },
    { x: 48, y: 82, side: 'right', label: 'Wall filled and sized first' },
  ],
}

export const servicePages: ServicePage[] = [interior, exterior, wallpaper]

export const servicePageBySlug = (slug: string): ServicePage | undefined =>
  servicePages.find((s) => s.slug === slug)
