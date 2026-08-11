import { emptyPhoto } from './types'

/**
 * The differentiator section. Written as a tradesman explaining why the
 * preparation decides how long the finish lasts.
 */

export const preparation = {
  eyebrow: 'Before a brush goes near it',
  heading: 'Paint is the last thing that happens.',
  standfirst:
    'A finish only lasts as long as what is underneath it. Two coats of good emulsion over a dusty, cracked, unsanded wall will look right for a fortnight and then show every fault back through. Most of a decorating job is the part you stop being able to see once it is finished.',
  steps: [
    {
      title: 'Filling',
      body: 'Cracks get raked open first so the filler has something to grip, then filled, left to go off properly and sanded flush. Deep ones get done twice, because filler sinks as it dries. Rushed filling shows up as a shadow down the wall the first sunny morning after the job.',
    },
    {
      title: 'Sanding',
      body: 'By hand on woodwork, orbital on the big flat areas, working down through the grits rather than jumping straight to fine. Old gloss gets keyed back so the next coat has something to hold. Then the lot gets dusted off and wiped down, because paint will not key to dust.',
    },
    {
      title: 'Caulking',
      body: 'The gap where skirting meets wall, and where architrave meets plaster, gets caulked and wiped back to a clean line. It takes an hour or two across a room and it is most of the difference between a room that looks decorated and a room that just looks painted.',
    },
    {
      title: 'Priming and sealing',
      body: 'Bare plaster takes a mist coat thinned down so it soaks in instead of sitting on top. Bare wood gets primed and every knot gets sealed, or the resin comes through the gloss inside a year. Water stains, smoke and nicotine get a stain block first — emulsion alone will not hold them back.',
    },
    {
      title: 'Protection',
      body: 'Cotton dust sheets over floors and furniture rather than plastic, because plastic slides underfoot. Sockets, switch plates and door furniture come off instead of getting cut around. Frames and glass masked where masking is quicker, cut in by hand where by hand looks better.',
    },
  ],
  photo: emptyPhoto(
    'A room mid-preparation: dust sheets down, furniture covered, filler patches on the walls, sockets off. Portrait or landscape.',
  ),
  closing:
    'It is the least interesting part of the week and it is the part that decides whether you are looking at the same walls in eight years or repainting them in three.',
} as const
