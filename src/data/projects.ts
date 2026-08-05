import type { AspectRatio } from "@/lib/images";

/**
 * The gallery, built around the client's own photographs.
 *
 * Categories are the trades the photographs actually evidence. Wallpapering
 * and commercial work are offered and described on the services page, but no
 * job here shows them, and a filter that resolves to an empty grid is worse
 * than one that is not offered. Add a category here when the photographs to
 * fill it exist.
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
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type ProjectImage = {
  src: string;
  alt: string;
  ratio: AspectRatio;
  /** Sampled from the photograph, so the blur-up matches before it loads. */
  tone: string;
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

const img = (src: string, alt: string, ratio: AspectRatio, tone: string): ProjectImage => ({
  src,
  alt,
  ratio,
  tone,
});

export const projects: Project[] = [
  {
    slug: "kitchen-extension",
    title: "Kitchen extension, bare shell to finished",
    area: "{{TOWN}}",
    category: "interior",
    scope: "Vaulted ceiling, roof lights and full open-plan decoration.",
    detail:
      "We came in behind the builders. Fresh plaster all through, a vaulted ceiling with three roof lights and a run of angled reveals that all have to be cut in by hand — no tape will follow that line. Mist coat, two full coats, and the woodwork and slider reveals finished last so nothing was walked into.",
    duration: "9 days",
    featured: true,
    images: [
      img("/work/kitchen-extension-01.jpg", "Open-plan kitchen and diner with a vaulted ceiling, roof lights and black sliding doors to the garden", "3:4", "#e9e7e2"),
      img("/work/kitchen-extension-02.jpg", "The same room looking back, showing the angled ceiling reveals and wall uplighters", "3:4", "#efece7"),
      img("/work/kitchen-extension-03.jpg", "The extension before decoration, with sliding doors fitted and the floor still bare", "4:3", "#b9b6ae"),
      img("/work/kitchen-extension-04.jpg", "Bare plaster and dust sheets before the first coat went on", "3:4", "#d9cfc0"),
    ],
    beforeAfter: {
      before: img("/work/kitchen-extension-04.jpg", "The extension in bare plaster, dust sheets down, before any paint", "3:4", "#d9cfc0"),
      after: img("/work/kitchen-extension-02.jpg", "The same space finished, with the vaulted ceiling and reveals cut in by hand", "3:4", "#efece7"),
    },
  },
  {
    slug: "alcove-joinery",
    title: "Alcove shelving, bare timber to finished",
    area: "{{TOWN}}",
    category: "woodwork",
    scope: "New alcove units and chimney breast, filled, primed and finished.",
    detail:
      "The joiner left carcasses in bare timber and ply, and the chimney breast in fresh pink plaster. Every fixing filled twice because softwood and MDF both sink, every joint caulked, then primed and two coats. Flat colour on shelving shows every hollow, which is why the filling took longer than the painting.",
    duration: "5 days",
    featured: true,
    images: [
      img("/work/alcove-joinery-01.jpg", "Finished alcove shelving either side of a chimney breast, painted in a soft grey-green", "4:3", "#a9aca4"),
      img("/work/alcove-joinery-02.jpg", "The same alcoves in bare timber and ply before filling and painting", "4:3", "#c6a892"),
    ],
    beforeAfter: {
      before: img("/work/alcove-joinery-02.jpg", "Alcove units in bare timber and ply, chimney breast in fresh plaster", "4:3", "#c6a892"),
      after: img("/work/alcove-joinery-01.jpg", "The finished units and breast, filled, primed and finished in eggshell", "4:3", "#a9aca4"),
    },
  },
  {
    slug: "new-staircase",
    title: "New staircase, bare pine to white",
    area: "{{TOWN}}",
    category: "woodwork",
    scope: "New softwood stairs and balustrade, knotted, primed and finished.",
    detail:
      "A brand new staircase in bare softwood, still full of knots and mill glaze. Every knot sealed before primer or it bleeds through within a year. Spindles, newels, strings and risers all by hand, and the landing balustrade to match. The hallway walls and ceiling were done in the same visit.",
    duration: "7 days",
    featured: true,
    images: [
      img("/work/new-staircase-01.jpg", "Finished hallway with the staircase painted white, oak floor and front door beyond", "3:4", "#e3ded7"),
      img("/work/new-staircase-02.jpg", "The staircase in bare pine before any paint, with the ceiling still to be made good", "3:4", "#cdb694"),
      img("/work/new-staircase-03.jpg", "Mid-decoration, with the balustrade painted and the treads still bare", "3:4", "#ded6cb"),
    ],
    beforeAfter: {
      before: img("/work/new-staircase-02.jpg", "The staircase in bare pine, knots unsealed, before any paint", "3:4", "#cdb694"),
      after: img("/work/new-staircase-01.jpg", "The same stairs finished in white, with the hallway decorated around them", "3:4", "#e3ded7"),
    },
  },
  {
    slug: "landing-balustrade",
    title: "Landing balustrade, pine to near-black",
    area: "{{TOWN}}",
    category: "woodwork",
    scope: "New landing balustrade finished in a dark satin, against existing white.",
    detail:
      "New pine spindles and handrail butted straight onto an old painted newel. The join is the whole job: the new timber had to be knotted and primed while the old post needed rubbing back and filling, and both had to end up looking like one piece. Finished in a dark satin so the run reads as a single line.",
    duration: "3 days",
    featured: true,
    images: [
      img("/work/landing-balustrade-01.jpg", "Landing balustrade finished in a dark satin, running along the stairwell", "3:4", "#4d4b49"),
      img("/work/landing-balustrade-02.jpg", "The same balustrade in bare pine, butted against the old painted newel post", "3:4", "#d5c5a7"),
    ],
    beforeAfter: {
      before: img("/work/landing-balustrade-02.jpg", "New pine spindles and handrail, unpainted, beside the old white newel", "3:4", "#d5c5a7"),
      after: img("/work/landing-balustrade-01.jpg", "The finished run in dark satin, new and old timber reading as one piece", "3:4", "#4d4b49"),
    },
  },
  {
    slug: "panelled-hallway",
    title: "Panelled hallway and entrance",
    area: "{{TOWN}}",
    category: "interior",
    scope: "New wall panelling caulked and finished, with the stairs and doors.",
    detail:
      "Shaker panelling on two walls, all of it caulked before a brush went near it — panelling lives or dies on the caulk line. Walls, panels and skirting in the same soft white at different sheens so the mouldings read without shouting, and the handrail picked out in black to match the door.",
    duration: "6 days",
    featured: true,
    images: [
      img("/work/panelled-hallway-01.jpg", "Hallway with white panelling, herringbone floor, a black console and framed photographs", "3:4", "#dcd7d0"),
      img("/work/panelled-hallway-02.jpg", "The staircase with a grey runner and black pipe handrail against the panelled wall", "3:4", "#d9d5cf"),
    ],
  },
  {
    slug: "stairs-in-colour",
    title: "Three staircases, three finishes",
    area: "{{SERVICE_AREA}}",
    category: "woodwork",
    scope: "Spindles, newels and understairs joinery in grey, near-black and white.",
    detail:
      "Three different houses, the same job done three ways. Turned spindles are slow — there is no way to spray them in an occupied hall, so every one is cut in by hand. Understairs cupboards get the same treatment as the balustrade so the whole run reads as one piece of joinery rather than a stair and some doors.",
    duration: "3 to 5 days each",
    images: [
      img("/work/stairs-colour-01.jpg", "Staircase and understairs cupboards finished in a mid grey, with grey carpet", "3:4", "#b4b5b4"),
      img("/work/stairs-colour-02.jpg", "Two flights with the balustrade finished in near-black against pale walls", "3:4", "#4f4d4b"),
      img("/work/stairs-colour-03.jpg", "White balustrade above grey-green panelled understairs joinery", "3:4", "#d5d0c8"),
    ],
  },
  {
    slug: "halls-and-landings",
    title: "Halls, stairs and landings",
    area: "{{SERVICE_AREA}}",
    category: "interior",
    scope: "The hardest room in the house to decorate, done three times over.",
    detail:
      "Hall, stairs and landing is the job most decorators quote high for, because of the access. Ceilings over a stairwell need a proper platform rather than a ladder propped on a tread, and every wall is a cutting-in job around spindles, strings and coving. These three were all done with the families still living in them.",
    duration: "4 days each",
    images: [
      img("/work/halls-01.jpg", "Hallway in warm grey with an oak floor and a run of framed photographs", "3:4", "#cfccc6"),
      img("/work/halls-02.jpg", "Hall and stairs with a dark stained floor, striped runner and gallery wall", "3:4", "#cdc8c1"),
      img("/work/halls-03.jpg", "Stairs and hallway in a soft olive with white balustrade and understairs panelling", "3:4", "#b7b78f"),
    ],
  },
  {
    slug: "rendered-exteriors",
    title: "Rendered exteriors and timber detail",
    area: "{{SERVICE_AREA}}",
    category: "exterior",
    scope: "Masonry paint over pebbledash and render, with bargeboards and bays.",
    detail:
      "Textured render and pebbledash drink paint, so these go on wet and get two full coats rather than one stretched one. Bargeboards, fascias and bay surrounds are cut in by hand off a tower. Work is planned around the forecast — masonry paint on a damp wall fails inside two winters, so we move a date rather than push on.",
    duration: "6 to 9 days each",
    featured: true,
    images: [
      img("/work/exterior-01.jpg", "Rendered semi finished in off-white with black bargeboards, fascias and a teal front door", "3:4", "#d6d4d0"),
      img("/work/exterior-02.jpg", "Rendered frontage in white with black bay surrounds and window detailing", "4:3", "#e2ded6"),
      img("/work/exterior-03.jpg", "White render with black bay surrounds and an arched porch", "4:3", "#dedad3"),
    ],
  },
  {
    slug: "feature-walls",
    title: "Feature walls, three colours",
    area: "{{SERVICE_AREA}}",
    category: "feature",
    scope: "Deep colours over pale walls — lined, blocked and cut in clean.",
    detail:
      "A strong colour on one wall is not a quick job. Dark shades need a tinted primer or you are putting four coats on, and the cut line against a pale ceiling has to be dead straight because that is the only thing anyone looks at. These three went on over existing pale emulsion with no ghosting through.",
    duration: "1 to 2 days each",
    images: [
      img("/work/feature-01.jpg", "Dining room with an ochre feature wall behind a framed print", "3:4", "#c6a334"),
      img("/work/feature-02.jpg", "A near-black feature wall going on between two oak doors, dust sheets down", "4:3", "#33322f"),
      img("/work/feature-03.jpg", "Kitchen with a lime green feature wall against cream gloss units", "3:4", "#8fae3c"),
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
