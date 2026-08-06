import type { AspectRatio } from "@/lib/images";
import { site } from "@/config/site";

/**
 * The gallery, built around the client's own photographs.
 *
 * Categories are the trades the photographs actually evidence. Wallpapering is
 * offered and described on the services page but no job here shows it, and a
 * filter that resolves to an empty grid is worse than one that is not offered.
 * Commercial earned its category back in batch 8. Add a category here when the
 * photographs to fill it exist — not before.
 *
 * AREAS: `area` follows `site.town` / `site.serviceArea` rather than holding a
 * literal token, so filling the config in reaches the gallery too — it used to
 * print "{{TOWN}}" on every card no matter what the config said. Replace each
 * one with the job's real town when the client supplies them; local search
 * rewards it and it is the first thing a customer looks for.
 *
 * FILENAMES: every `src` below maps to a real photograph. See PHOTO-MAP.md at
 * the repo root for which of your images goes at which path. Drop them into
 * `public/work/` under these names and the whole site populates — no code
 * changes, no re-cropping, because each entry already declares the aspect ratio
 * the photograph was shot at.
 */

export const CATEGORIES = [
  { id: "interior", label: "Interior", swatch: "var(--color-swatch-sage)" },
  { id: "exterior", label: "Exterior", swatch: "var(--color-swatch-terracotta)" },
  { id: "woodwork", label: "Woodwork", swatch: "var(--color-swatch-slate)" },
  { id: "feature", label: "Feature walls", swatch: "var(--color-swatch-ochre)" },
  { id: "commercial", label: "Commercial", swatch: "var(--color-swatch-blush)" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type ProjectImage = {
  src: string;
  alt: string;
  ratio: AspectRatio;
  /** Sampled from the photograph, so the blur-up matches before it loads. */
  tone: string;
  /**
   * What was actually DONE in this shot — not what is in it.
   *
   * `alt` describes the picture for someone who cannot see it. This is the
   * trade note a customer wants: which surfaces, what preparation, what
   * finish. It is what turns a gallery of nice rooms into evidence of work.
   */
  caption: string;
};

export type Project = {
  slug: string;
  title: string;
  area: string;
  category: CategoryId;
  scope: string;
  detail: string;
  duration: string;
  images: ProjectImage[];
  featured?: boolean;
  beforeAfter?: { before: ProjectImage; after: ProjectImage };
  video?: { id: string; title: string };
};

const img = (
  src: string,
  alt: string,
  ratio: AspectRatio,
  tone: string,
  caption: string,
): ProjectImage => ({ src, alt, ratio, tone, caption });

export const projects: Project[] = [
  {
    slug: "kitchen-extension",
    title: "Kitchen extension, bare shell to finished",
    area: site.town,
    category: "interior",
    scope: "Vaulted ceiling, roof lights and full open-plan decoration.",
    detail:
      "We came in behind the builders. Fresh plaster all through, a vaulted ceiling with three roof lights and a run of angled reveals that all have to be cut in by hand — no tape will follow that line. Mist coat, two full coats, and the woodwork and slider reveals finished last so nothing was walked into.",
    duration: "9 days",
    featured: true,
    images: [
      img("/work/kitchen-extension-01.jpg", "Open-plan kitchen and diner with a vaulted ceiling, roof lights and black sliding doors to the garden", "3:4", "#8b847b", "Walls and vaulted ceiling in a warm white, with the roof-light reveals and slider frames cut in by hand around the fitted units."),
      img("/work/kitchen-extension-02.jpg", "The same room looking back, showing the angled ceiling reveals and wall uplighters", "3:4", "#99938e", "Angled ceiling reveals and uplighter returns cut in square. Two full coats over a properly thinned mist coat."),
      img("/work/kitchen-extension-03.jpg", "The extension before decoration, with sliding doors fitted and the floor still bare", "4:3", "#838776", "The shell as we found it — sliders fitted, floor bare, plaster ready for its first coat."),
      img("/work/kitchen-extension-04.jpg", "Bare plaster and dust sheets before the first coat went on", "3:4", "#9e9385", "Sheets down and the old pine door taken back before a tin was opened."),
      img("/work/kitchen-extension-05.jpg", "The extension at its earliest — bare pink plaster, sliders in, garden beyond", "4:3", "#848273", "Bare pink plaster on day one. New plaster takes a thinned mist coat first, never neat emulsion."),
      img("/work/kitchen-extension-06.jpg", "The finished open-plan room from the far end, kitchen and seating together", "4:3", "#8c8780", "The finished room from the far end — kitchen, dining and seating decorated as one space."),
    ],
    beforeAfter: {
      before: img("/work/kitchen-extension-04.jpg", "The extension in bare plaster, dust sheets down, before any paint", "3:4", "#9e9385", "Sheets down and the old pine door taken back before a tin was opened."),
      after: img("/work/kitchen-extension-02.jpg", "The same space finished, with the vaulted ceiling and reveals cut in by hand", "3:4", "#99938e", "Angled ceiling reveals and uplighter returns cut in square. Two full coats over a properly thinned mist coat."),
    },
  },
  {
    slug: "open-plan-kitchen",
    title: "Open-plan kitchen, vaulted and lit",
    area: site.town,
    category: "interior",
    scope: "Vaulted ceiling, roof light and bifold reveals, finished around a fitted kitchen.",
    detail:
      "The kitchen was already in when we started, which makes it a masking job as much as a painting one. Units, worktops and the bifold frames all wrapped, then the vault and its roof-light reveal cut in by hand. Spot-light rings and the ceiling line around a pitched roof are the two places a rushed job always shows.",
    duration: "6 days",
    featured: true,
    images: [
      img("/work/open-plan-kitchen-01.jpg", "Open-plan kitchen with a vaulted ceiling, roof light and bifold doors, decorated around the fitted units", "4:3", "#867a6b", "Vaulted ceiling, roof light and bifold reveals decorated around a fitted kitchen, every edge cut by hand."),
    ],
  },
  {
    slug: "alcove-joinery",
    title: "Alcove shelving, bare timber to finished",
    area: site.town,
    category: "woodwork",
    scope: "New alcove units and chimney breast, filled, primed and finished.",
    detail:
      "The joiner left carcasses in bare timber and ply, and the chimney breast in fresh pink plaster. Every fixing filled twice because softwood and MDF both sink, every joint caulked, then primed and two coats. Flat colour on shelving shows every hollow, which is why the filling took longer than the painting.",
    duration: "5 days",
    featured: true,
    images: [
      img("/work/alcove-joinery-01.jpg", "Finished alcove shelving either side of a chimney breast, painted in a soft grey-green", "4:3", "#71655d", "New alcove units and chimney breast filled, caulked, primed and finished in a grey-green eggshell."),
      img("/work/alcove-joinery-02.jpg", "The same alcoves in bare timber and ply before filling and painting", "4:3", "#a8866e", "The units as they arrived — bare timber and ply, breast in fresh plaster."),
    ],
    beforeAfter: {
      before: img("/work/alcove-joinery-02.jpg", "Alcove units in bare timber and ply, chimney breast in fresh plaster", "4:3", "#a8866e", "The units as they arrived — bare timber and ply, breast in fresh plaster."),
      after: img("/work/alcove-joinery-01.jpg", "The finished units and breast, filled, primed and finished in eggshell", "4:3", "#71655d", "New alcove units and chimney breast filled, caulked, primed and finished in a grey-green eggshell."),
    },
  },
  {
    slug: "new-staircase",
    title: "New staircase, bare pine to white",
    area: site.town,
    category: "woodwork",
    scope: "New softwood stairs and balustrade, knotted, primed and finished.",
    detail:
      "A brand new staircase in bare softwood, still full of knots and mill glaze. Every knot sealed before primer or it bleeds through within a year. Spindles, newels, strings and risers all by hand, and the landing balustrade to match. The hallway walls and ceiling were done in the same visit.",
    duration: "7 days",
    featured: true,
    images: [
      img("/work/new-staircase-01.jpg", "Finished hallway with the staircase painted white, oak floor and front door beyond", "3:4", "#78746f", "Balustrade, spindles and strings finished in white, with the hallway decorated around them."),
      img("/work/new-staircase-02.jpg", "The staircase in bare pine before any paint, with the ceiling still to be made good", "3:4", "#917f69", "Bare pine, knots unsealed. Every knot takes knotting solution before primer or it bleeds through within a year."),
      img("/work/new-staircase-03.jpg", "Mid-decoration, with the balustrade painted and the treads still bare", "3:4", "#86857e", "Mid-job — balustrade finished, treads still to come."),
    ],
    beforeAfter: {
      before: img("/work/new-staircase-02.jpg", "The staircase in bare pine, knots unsealed, before any paint", "3:4", "#917f69", "Bare pine, knots unsealed. Every knot takes knotting solution before primer or it bleeds through within a year."),
      after: img("/work/new-staircase-01.jpg", "The same stairs finished in white, with the hallway decorated around them", "3:4", "#78746f", "Balustrade, spindles and strings finished in white, with the hallway decorated around them."),
    },
  },
  {
    slug: "landing-balustrade",
    title: "Landing balustrade, pine to near-black",
    area: site.town,
    category: "woodwork",
    scope: "New landing balustrade finished in a dark satin, against existing white.",
    detail:
      "New pine spindles and handrail butted straight onto an old painted newel. The join is the whole job: the new timber had to be knotted and primed while the old post needed rubbing back and filling, and both had to end up looking like one piece. Finished in a dark satin so the run reads as a single line.",
    duration: "3 days",
    featured: true,
    images: [
      img("/work/landing-balustrade-01.jpg", "Landing balustrade finished in a dark satin, running along the stairwell", "3:4", "#86776a", "New spindles and handrail in a dark satin, matched to the existing woodwork along the landing."),
      img("/work/landing-balustrade-02.jpg", "The same balustrade in bare pine, butted against the old painted newel post", "3:4", "#9e9285", "New pine butted against the old painted newel. The join disappears once it is filled and finished."),
    ],
    beforeAfter: {
      before: img("/work/landing-balustrade-02.jpg", "New pine spindles and handrail, unpainted, beside the old white newel", "3:4", "#9e9285", "New pine butted against the old painted newel. The join disappears once it is filled and finished."),
      after: img("/work/landing-balustrade-01.jpg", "The finished run in dark satin, new and old timber reading as one piece", "3:4", "#86776a", "New spindles and handrail in a dark satin, matched to the existing woodwork along the landing."),
    },
  },
  {
    slug: "panelled-hallway",
    title: "Panelled hallway and entrance",
    area: site.town,
    category: "interior",
    scope: "New wall panelling caulked and finished, with the stairs and doors.",
    detail:
      "Shaker panelling on two walls, all of it caulked before a brush went near it — panelling lives or dies on the caulk line. Walls, panels and skirting in the same soft white at different sheens so the mouldings read without shouting, and the handrail picked out in black to match the door.",
    duration: "6 days",
    featured: true,
    images: [
      img("/work/panelled-hallway-01.jpg", "Hallway with white panelling, herringbone floor, a black console and framed photographs", "3:4", "#737070", "Panelling set out, battened, filled and caulked, then finished so the joints vanish."),
      img("/work/panelled-hallway-02.jpg", "The staircase with a grey runner and black pipe handrail against the panelled wall", "3:4", "#79797a", "Stair strings and the panelled wall cut in around a fitted runner."),
      img("/work/panelled-hallway-03.jpg", "Looking down over the panelled walls to the black front door and herringbone floor", "3:4", "#7a706b", "Panelling carried down to the front door, with the vertical radiator cut around rather than removed."),
    ],
  },
  {
    slug: "stairs-in-colour",
    title: "Three staircases, three finishes",
    area: site.serviceArea,
    category: "woodwork",
    scope: "Spindles, newels and understairs joinery in grey, near-black and white.",
    detail:
      "Three different houses, the same job done three ways. Turned spindles are slow — there is no way to spray them in an occupied hall, so every one is cut in by hand. Understairs cupboards get the same treatment as the balustrade so the whole run reads as one piece of joinery rather than a stair and some doors.",
    duration: "3 to 5 days each",
    images: [
      img("/work/stairs-colour-01.jpg", "Staircase and understairs cupboards finished in a mid grey, with grey carpet", "3:4", "#837e76", "Balustrade and understairs cupboards in a mid-grey satin, carpet fully protected throughout."),
      img("/work/stairs-colour-02.jpg", "Two flights with the balustrade finished in near-black against pale walls", "3:4", "#7b746d", "Two flights of balustrade in near-black, hand-cut against a pale wall."),
      img("/work/stairs-colour-03.jpg", "White balustrade above grey-green panelled understairs joinery", "3:4", "#75685a", "White balustrade over grey-green panelled understairs — two colours, one clean line."),
      img("/work/stairs-colour-04.jpg", "The near-black balustrade carried up over two levels, against cream walls", "3:4", "#7f7367", "Near-black balustrade carried over two levels against cream walls."),
      img("/work/stairs-colour-05.jpg", "A staircase part-way through: balustrade finished in white, treads stripped back and waiting", "3:4", "#8e7763", "Balustrade finished in white with the treads stripped back and waiting."),
    ],
  },
  {
    slug: "halls-and-landings",
    title: "Halls, stairs and landings",
    area: site.serviceArea,
    category: "interior",
    scope: "The hardest room in the house to decorate, done seven times over.",
    detail:
      "Hall, stairs and landing is the job most decorators quote high for, because of the access. Ceilings over a stairwell need a proper platform rather than a ladder propped on a tread, and every wall is a cutting-in job around spindles, strings and coving. These three were all done with the families still living in them.",
    duration: "4 days each",
    images: [
      img("/work/halls-01.jpg", "Hallway in warm grey with an oak floor and a run of framed photographs", "3:4", "#938472", "Hall and landing in a warm grey with the woodwork in satin, oak floor covered throughout."),
      img("/work/halls-02.jpg", "Hall and stairs with a dark stained floor, striped runner and gallery wall", "3:4", "#66635b", "Gallery wall and stair strings cut in above a dark stained floor."),
      img("/work/halls-03.jpg", "Stairs and hallway in a soft olive with white balustrade and understairs panelling", "3:4", "#877d6b", "Olive walls against a white balustrade, cut in by hand along every spindle."),
      img("/work/halls-04.jpg", "A hallway part-way through: new stairs still in bare timber, panelling in green, sheets down", "4:3", "#6c5d50", "Mid-build — bare timber stairs, green panelling going on, stained-glass door masked off."),
      img("/work/halls-05.jpg", "Traditional hallway with cream spindles, panelled understairs and an oak console", "4:3", "#6b5a48", "Cream spindles and panelled understairs, finished around an oak console."),
      img("/work/halls-06.jpg", "Bright hallway with a panelled dado, dark wood floor and an arched opening to the front door", "3:4", "#8e7057", "Panelled dado and the arch to the front door, dark floor protected throughout."),
      img("/work/halls-07.jpg", "Hallway finished entirely in white, down to the painted floorboards", "3:4", "#88827b", "All-white hallway with the floorboards painted to match the woodwork."),
    ],
  },
  {
    slug: "rendered-exteriors",
    title: "Rendered exteriors and timber detail",
    area: site.serviceArea,
    category: "exterior",
    scope: "Masonry paint over pebbledash and render, with bargeboards, bays and sills.",
    detail:
      "Textured render and pebbledash drink paint, so these go on wet and get two full coats rather than one stretched one. Bargeboards, fascias and bay surrounds are cut in by hand off a tower. Work is planned around the forecast — masonry paint on a damp wall fails inside two winters, so we move a date rather than push on.",
    duration: "6 to 9 days each",
    featured: true,
    images: [
      img("/work/exterior-01.jpg", "Rendered semi finished in off-white with black bargeboards, fascias and a teal front door", "3:4", "#92887d", "Bargeboards, fascias and the front door finished, with a new fence treated to match."),
      img("/work/exterior-02.jpg", "Rendered frontage in white with black bay surrounds and window detailing", "4:3", "#6a7a85", "Render washed down and stabilised, bays and frames cut in black."),
      img("/work/exterior-03.jpg", "White render with black bay surrounds and an arched porch", "4:3", "#8b8885", "White render with black bays and an arched porch, all cut in by hand."),
      img("/work/exterior-04.jpg", "Close detail of a bay window with the surrounds and sills freshly cut in black", "3:4", "#768493", "Bay surrounds and sills cut in black against fresh white render."),
      img("/work/exterior-05.jpg", "Rendered bungalow in off-white with black fascias, soffits and garage doors", "4:3", "#6d7673", "Rendered bungalow with the fascias, soffits and garage doors finished in black."),
    ],
  },
  {
    slug: "commercial-fit-out",
    title: "Commercial fit-out, decorated to handover",
    area: site.serviceArea,
    category: "commercial",
    scope: "Full unit decorated around trades still working, to a fixed handover date.",
    detail:
      "A commercial unit taken from bare partition to handover. Suspended ceiling grid, service runs and first-fix all still live while we worked, so it was phased around the other trades rather than after them. Hard-wearing scrubbable emulsion throughout, and everything cut in around grid, ducting and fittings that could not come off the wall.",
    duration: "3 weeks",
    images: [
      img("/work/commercial-01.jpg", "Commercial unit part-way through decoration, suspended ceiling in and screed floor down", "4:3", "#958e85", "Commercial unit mid-decoration — suspended ceiling and screed floor, worked around the fit-out."),
    ],
  },
  {
    slug: "feature-walls",
    title: "Feature walls, three colours",
    area: site.serviceArea,
    category: "feature",
    scope: "Deep colours over pale walls — lined, blocked and cut in clean.",
    detail:
      "A strong colour on one wall is not a quick job. Dark shades need a tinted primer or you are putting four coats on, and the cut line against a pale ceiling has to be dead straight because that is the only thing anyone looks at. These three went on over existing pale emulsion with no ghosting through.",
    duration: "1 to 2 days each",
    images: [
      img("/work/feature-01.jpg", "Dining room with an ochre feature wall behind a framed print", "3:4", "#968970", "Ochre feature wall rolled to a flat finish and cut in square against the white returns."),
      img("/work/feature-02.jpg", "A near-black feature wall going on between two oak doors, dust sheets down", "4:3", "#82746c", "Near-black feature wall going on between oak doors, edges cut without tape."),
      img("/work/feature-03.jpg", "Kitchen with a lime green feature wall against cream gloss units", "3:4", "#69614e", "Lime green kitchen wall against cream gloss units, cut in along every edge."),
    ],
  },
];

export const featuredProjects = projects.filter((project) => project.featured);

export const beforeAfterProjects = projects.filter((project) => project.beforeAfter);

export function projectsByCategory(category: CategoryId | "all"): Project[] {
  return category === "all"
    ? projects
    : projects.filter((project) => project.category === category);
}
