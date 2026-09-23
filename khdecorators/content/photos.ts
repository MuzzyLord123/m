import type { Photo } from './types'

/**
 * Kenny's photographs, as they came off the old site.
 *
 * Every one of these is his: downloaded from khdecorators.uk at the largest size
 * Google would serve (scripts/import-live-photos.mjs), turned the right way up,
 * converted to sRGB and stripped of ALL metadata on the way through — phone
 * photographs of customers' houses can carry the GPS position they were taken
 * at, and that must never be republished.
 *
 * `alt` describes what is IN the picture, for screen readers and Google Images.
 * `caption` is the one line on the plate beneath it. Both are our words, and
 * both are careful to describe what can be seen rather than claim what was done:
 * the old site did not say which parts of each house Kenny painted, so these do
 * not either. If he tells you, make the caption more specific — "timbers and
 * render, two coats" sells harder than "mock-Tudor detached".
 *
 * `width` and `height` are the files' real pixel dimensions. They hold the layout
 * still while the picture loads; wrong values are a layout-shift failure.
 *
 * To add one: drop the file in /public/work, add an entry here, and use it.
 */

export type WorkCategory = 'exterior' | 'interior' | 'wallpaper'

export type WorkPhoto = Photo & {
  src: string
  alt: string
  width: number
  height: number
  caption: string
  category: WorkCategory
  /** Where the crop should hold in a frame of a different shape. */
  focus?: string
}

const photo = (
  name: string,
  width: number,
  height: number,
  category: WorkCategory,
  caption: string,
  alt: string,
  focus?: string,
): WorkPhoto => ({
  src: `/work/${name}.jpg`,
  alt,
  width,
  height,
  category,
  caption,
  brief: caption,
  focus,
})

export const photos = {
  /* ---- Exterior ----------------------------------------------------------- */
  mockTudor: photo(
    'exterior-mock-tudor',
    2048,
    1536,
    'exterior',
    'Mock-Tudor detached, black and white',
    'A detached mock-Tudor house with crisp black timbers on white gables above red brick, dark grey windows and a front lawn',
    '55% 45%',
  ),
  renderGarage: photo(
    'exterior-render-garage-door',
    2048,
    1536,
    'exterior',
    'Cream render and a black garage door',
    'A detached house finished in cream render with a black up-and-over garage door, seen from the block-paved drive',
    '40% 60%',
  ),
  brickGarage: photo(
    'exterior-brick-black-garage-door',
    1536,
    1536,
    'exterior',
    'Red brick, white porch, black garage door',
    'A red-brick detached house with a white-rendered arched porch, a black front door and a black double garage door',
  ),
  whiteBrickSemi: photo(
    'exterior-white-brick-semi',
    2048,
    1238,
    'exterior',
    'Painted brick semi, white with grey surrounds',
    'A semi-detached house with its brickwork painted white, grey window surrounds and a black front door, under a blue sky',
  ),
  whiteBungalow: photo(
    'exterior-white-bungalow',
    1830,
    1095,
    'exterior',
    'White bungalow with bay windows',
    'A white-painted bungalow with two bay windows and a sage green front door, behind a planted front garden',
  ),
  redTimberTudor: photo(
    'exterior-red-timber-tudor',
    960,
    720,
    'exterior',
    'Mock-Tudor detached, red timbers',
    'A mock-Tudor detached house with dark red timbers on white render above red brick and a gabled porch',
  ),
  whiteRedTrim: photo(
    'exterior-white-red-trim',
    955,
    2048,
    'exterior',
    'White elevation, red woodwork',
    'A white-painted detached house with red window frames and a gabled porch, seen down the front path',
  ),
  brickFarmhouse: photo(
    'exterior-brick-farmhouse',
    1782,
    1536,
    'exterior',
    'Red-brick farmhouse with an oak porch',
    'A double-fronted red-brick farmhouse with white window frames and an oak-framed porch, in low evening light',
  ),
  detachedInProgress: photo(
    'exterior-detached-in-progress',
    2048,
    1536,
    'exterior',
    'On the job: ladders up, van on the drive',
    'A red-brick detached house with ladders against the front and a work van on the herringbone drive',
  ),
  rearConservatory: photo(
    'exterior-rear-conservatory',
    2048,
    1186,
    'exterior',
    'Rear elevation and conservatory, mid-job',
    'The back of a red-brick house with a grey-framed conservatory and stepladders set up in the garden',
  ),
  mockTudorSide: photo(
    'exterior-mock-tudor-side',
    1536,
    1536,
    'exterior',
    'Mock-Tudor, the side elevation — and the van',
    'The side of the black-and-white mock-Tudor house, with a KH Painting and Decorating van parked on the drive',
  ),
  mockTudorGable: photo(
    'exterior-mock-tudor-gable',
    1536,
    1536,
    'exterior',
    'Mock-Tudor gable end',
    'A black-and-white timbered gable end above red brick, seen from the side of the house',
  ),
  farmhouseCourtyard: photo(
    'exterior-farmhouse-courtyard',
    1536,
    1536,
    'exterior',
    'Farmhouse, the courtyard side',
    'The courtyard side of a red-brick farmhouse with pale grey window frames and a paved yard',
  ),
  farmhouseConservatory: photo(
    'exterior-farmhouse-conservatory',
    1536,
    1536,
    'exterior',
    'Farmhouse gable and white conservatory',
    'The gable end of a red-brick farmhouse beside a white conservatory, under a blue sky',
  ),
  brickGable: photo(
    'exterior-brick-gable',
    1536,
    1536,
    'exterior',
    'Brick gable end',
    'A tall red-brick gable end rising against a blue sky with scattered cloud',
  ),
  renderSide: photo(
    'exterior-render-side',
    1536,
    1536,
    'exterior',
    'Cream render, from the garden',
    'The garden side of a cream-rendered detached house, with a ladder up against the wall',
  ),
  renderMasked: photo(
    'exterior-render-masked',
    720,
    720,
    'exterior',
    'Before: masked, patched and sheeted',
    'A rendered rear elevation mid-job: every window masked in plastic, repairs patched into the render, ladders up and the ground sheeted',
  ),
  renderFinished: photo(
    'exterior-render-finished',
    720,
    720,
    'exterior',
    'After: the same elevation, finished',
    'The same rear elevation finished: render coated clean white, sills in black, the masking gone',
  ),
  renderRepairBefore: photo(
    'exterior-render-repair-before',
    720,
    720,
    'exterior',
    'Before: the render patched back',
    'A textured rendered wall beside a window with large repairs patched in, before coating',
  ),
  renderRepairAfter: photo(
    'exterior-render-repair-after',
    720,
    720,
    'exterior',
    'After: one even finish',
    'The same wall finished, the patched repairs lost under one even white textured coat',
  ),
  decking: photo(
    'exterior-decking',
    960,
    720,
    'exterior',
    'Decking finished in grey',
    'A raised timber deck painted mid grey outside white French doors, with a lawn beyond',
  ),

  /* ---- Wallpaper ---------------------------------------------------------- */
  jungleCloakroom: photo(
    'wallpaper-jungle-cloakroom',
    2048,
    1536,
    'wallpaper',
    'Jungle-print paper against black panelling',
    'A cloakroom papered in a dense jungle print of giraffes, zebras and leaves, beside black-painted panelling and a backlit mirror',
  ),
  marbleMural: photo(
    'wallpaper-marble-mural',
    2048,
    1536,
    'wallpaper',
    'Marble-effect mural, navy and gold',
    'A full-wall mural of navy, white and gold marbling hung across a bedroom wall',
    '70% 50%',
  ),
  navyFloral: photo(
    'wallpaper-navy-floral-bedroom',
    2048,
    1536,
    'wallpaper',
    "Navy floral paper, child's bedroom",
    "A child's bedroom papered in a navy floral print with matching curtains at the window",
  ),
  pinkFloral: photo(
    'wallpaper-pink-floral-bedroom',
    2048,
    1536,
    'wallpaper',
    'Pink floral feature wall',
    'A bedroom with a large pink floral paper on the feature wall behind the bed and raspberry walls either side',
  ),
  birdGreenPanelling: photo(
    'wallpaper-bird-green-panelling',
    2048,
    1151,
    'wallpaper',
    'Navy bird print over green panelling',
    'A room papered in a navy print of birds and foliage, above deep green panelling and beside an oak door',
    '30% 50%',
  ),
  birdBathroom: photo(
    'wallpaper-bird-print-bathroom',
    720,
    720,
    'wallpaper',
    'Bathroom in a navy bird print',
    'A bathroom papered in a navy print of white birds, with a black roll-top bath beneath a tall window',
  ),
  birdBasin: photo(
    'wallpaper-bird-print-basin',
    720,
    720,
    'wallpaper',
    'Bird print above white panelling',
    'A washstand and mirror against white panelling, with the navy bird-print paper above it',
  ),
  birdShower: photo(
    'wallpaper-bird-print-shower',
    720,
    720,
    'wallpaper',
    'The same bathroom, shower side',
    'The navy bird-print bathroom from the other side, beside a walk-in shower and an oak door',
  ),
  mustardFloral: photo(
    'wallpaper-mustard-floral',
    2048,
    1151,
    'wallpaper',
    'Mustard floral, every wall',
    'A bedroom papered in a mustard floral print on every wall, with white shutters at the window',
  ),
  mustardStripe: photo(
    'wallpaper-mustard-floral-stripe',
    2048,
    1151,
    'wallpaper',
    'Mustard floral with a striped end wall',
    'The same bedroom from the window: mustard floral paper with a striped paper on the end wall',
  ),
  floralWall: photo(
    'wallpaper-floral-wall',
    1436,
    1080,
    'wallpaper',
    'Floral paper, wall to wall',
    'A long wall hung with a pink and green floral paper, the floor still protected',
  ),
  texturedLounge: photo(
    'wallpaper-textured-lounge',
    1536,
    1536,
    'wallpaper',
    'Lounge in a textured neutral paper',
    'A bright lounge papered in a textured neutral wallcovering, with wood flooring and a white fireplace',
  ),
  texturedLoungeGarden: photo(
    'wallpaper-textured-lounge-2',
    1536,
    1536,
    'wallpaper',
    'The same lounge, towards the garden',
    'The textured-paper lounge looking towards French doors and the garden',
  ),
  galleyStripe: photo(
    'wallpaper-galley-kitchen-stripe',
    960,
    539,
    'wallpaper',
    'Striped paper in a galley kitchen',
    'A long galley kitchen with a soft vertical-striped paper above the worktops',
  ),
  safariMural: photo(
    'wallpaper-safari-mural',
    898,
    594,
    'wallpaper',
    'Safari mural going up',
    'A botanical safari mural of palms, a giraffe, zebras and an elephant being hung, with the floor sheeted',
  ),

  /* ---- Interior ----------------------------------------------------------- */
  goldWall: photo(
    'interior-gold-wall-black-ceiling',
    2048,
    1151,
    'interior',
    'Gold leaf-pattern paper under a black ceiling',
    'A room with a gold leaf-pattern paper on the walls, a black ceiling with downlights and a black four-panel door',
  ),
  goldWallWide: photo(
    'interior-gold-wall-black-ceiling-2',
    2048,
    1536,
    'interior',
    'Black ceiling, gold walls',
    'A gold-papered room under a black ceiling, with a black door and a home gym at the far end',
  ),
  blackCeilingRoom: photo(
    'interior-black-ceiling-room',
    2048,
    1151,
    'interior',
    'Black ceiling, the other way round',
    'The same room from the door: black ceiling, pale walls, a treadmill by the window',
  ),
  bayLounge: photo(
    'interior-bay-window-lounge',
    2048,
    1536,
    'interior',
    'Bay-windowed lounge in pale sage',
    'A large lounge in pale sage green with a deep bay window, a panelled ceiling and a crystal chandelier',
  ),
  tealLounge: photo(
    'interior-teal-lounge',
    1540,
    1536,
    'interior',
    'Teal lounge with a ceiling rose',
    'A lounge painted deep teal with a white ceiling rose, chandelier and coving, opening through to a dining room',
  ),
  tealBayLounge: photo(
    'interior-teal-bay-lounge',
    1536,
    1536,
    'interior',
    'Teal walls and a bay window',
    'A cosy lounge in teal with a bay window, a wood burner and a framed mirror',
  ),
  staircase: photo(
    'interior-staircase',
    1536,
    2048,
    'interior',
    'Hall, stairs and landing',
    'A staircase seen from the landing: white spindles, an oak handrail and bright white walls down to the hall',
  ),
  landingOak: photo(
    'interior-landing-oak-rail',
    720,
    720,
    'interior',
    'Landing with an oak rail',
    'A landing with white spindles, an oak handrail and white doors',
  ),
  landing: photo(
    'interior-landing',
    720,
    720,
    'interior',
    'Landing, finished',
    'A finished landing with white doors and a white balustrade',
  ),
  beamedLanding: photo(
    'interior-beamed-landing',
    1536,
    1536,
    'interior',
    'Beamed bedroom and landing',
    'A cottage bedroom under dark exposed beams, with a dark stained balustrade at the top of the stairs',
  ),
  longHallway: photo(
    'interior-long-hallway',
    1536,
    1536,
    'interior',
    'Long hallway under a roof light',
    'A long, narrow hallway painted white under a roof light, with a fresh carpet',
  ),
  hallwayPrep: photo(
    'interior-hallway-prep',
    1536,
    1536,
    'interior',
    'Hallway, sheeted and prepared',
    'A hallway during preparation: floor sheeted end to end, walls filled and ready for paint',
  ),
  featureWall: photo(
    'interior-feature-wall',
    1536,
    1536,
    'interior',
    'Living room, mid-job',
    'A living room part-way through: walls stripped back and a new chimney wall with shelving alcoves ready to decorate',
  ),
  narrowboat: photo(
    'interior-narrowboat',
    1024,
    768,
    'interior',
    'Narrowboat interior',
    'The inside of a narrowboat: a curved timber-clad ceiling, cream walls and a wood burner',
  ),
} satisfies Record<string, WorkPhoto>

/** Every photograph, in the order a gallery should hang them. */
export const allPhotos: WorkPhoto[] = Object.values(photos)

/** The strongest dozen for the home page: a mix, the best first. */
export const homeGallery: WorkPhoto[] = [
  photos.jungleCloakroom,
  photos.whiteBrickSemi,
  photos.birdGreenPanelling,
  photos.brickFarmhouse,
  photos.goldWall,
  photos.staircase,
  photos.birdBathroom,
  photos.renderGarage,
  photos.marbleMural,
  photos.tealBayLounge,
  photos.mustardFloral,
  photos.whiteBungalow,
]

export const byCategory = (category: WorkCategory): WorkPhoto[] =>
  allPhotos.filter((p) => p.category === category)

/**
 * Before and after, the same wall both times. These are the most persuasive
 * photographs he has: the "before" in the first pair is the masking the spraying
 * page talks about — every window wrapped, the repairs patched in, the ground
 * sheeted — and the "after" is what that masking buys.
 */
export const pairs = [
  {
    title: 'A rear elevation, masked and finished',
    before: photos.renderMasked,
    after: photos.renderFinished,
  },
  {
    title: 'Render repairs, patched and lost',
    before: photos.renderRepairBefore,
    after: photos.renderRepairAfter,
  },
] as const
