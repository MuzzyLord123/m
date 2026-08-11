import { emptyPhoto, type Photo, type SwatchKey } from './types'

export type Service = {
  id: string
  /** Short label used on the swatch. */
  swatchLabel: string
  title: string
  /** 40–60 words, plain description. */
  body: string
  /** Three concrete specifics, not selling points. */
  detail: string[]
  swatch: SwatchKey
  photo: Photo
}

export const services: Service[] = [
  {
    id: 'painting',
    swatchLabel: 'Interior & exterior',
    title: 'Interior & exterior painting',
    body: 'Walls, ceilings and woodwork inside. Rendered walls, soffits and fascias outside. Emulsion over plaster, masonry paint over render, and the right primer under both. Outside work goes on when the weather allows it: dry render, no frost forecast, and enough daylight left to finish a coat properly.',
    detail: [
      'Mist coat thinned into bare plaster before any topcoat',
      'Masonry paint brushed into the texture, not just rolled across it',
      'Ceilings cut in and rolled in one wet edge so there are no lap marks',
    ],
    swatch: 'blue',
    photo: emptyPhoto(
      'A finished room, taken from the doorway with the light on — walls and ceiling both in shot. Landscape.',
    ),
  },
  {
    id: 'preparation-service',
    swatchLabel: 'Preparation',
    title: 'Surface preparation',
    body: 'Nothing gets painted until the wall is sound. Cracks raked out and filled, flaking coats scraped back, nail holes and dents made good, then everything sanded flat and dusted off. Damp patches and blown plaster get flagged before I start, rather than painted over and found again six months later.',
    detail: [
      'Cracks opened up first so the filler has something to hold on to',
      'Deep fills done twice — filler sinks as it goes off',
      'Walls wiped down after sanding; paint will not key to dust',
    ],
    swatch: 'black',
    photo: emptyPhoto(
      'Mid-job: filled and sanded wall before painting, with the filler patches still showing. Close in, landscape.',
    ),
  },
  {
    id: 'woodwork',
    swatchLabel: 'Woodwork',
    title: 'Woodwork finishing',
    body: 'Doors, skirting, architrave, window boards and stairs. Sanded, knots sealed, primed, filled, sanded again, then satin, gloss or eggshell to suit the room. Water-based where you want low smell and a quick recoat, oil-based where the finish has to take knocks. Edges cut in by hand.',
    detail: [
      'Knotting solution on every knot, or it bleeds through the topcoat',
      'Caulk along the top of the skirting and down the architrave',
      'Handles and finger plates taken off rather than cut around',
    ],
    swatch: 'sage',
    photo: emptyPhoto(
      'Freshly finished skirting and architrave, taken low and along the wall so the light runs down the gloss. Landscape.',
    ),
  },
  {
    id: 'residential-commercial',
    swatchLabel: 'Homes & premises',
    title: 'Residential & commercial',
    body: 'Houses, flats and rented property, plus shops, offices and units that stay open while the work is going on. Commercial jobs get worked around opening hours — early starts, evenings or weekends — with the area sheeted off and left clear at the end of every day. One person on the job throughout: me.',
    detail: [
      'Occupied rooms done one at a time so the house stays usable',
      'Sheets lifted and the floor swept before I go each evening',
      'Landlords and letting agents: whole flats between tenancies',
    ],
    swatch: 'clay',
    photo: emptyPhoto(
      'A commercial or communal space — shop, office, hallway or stairwell — after painting. Landscape, wide.',
    ),
  },
]
