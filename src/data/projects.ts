import type { AspectRatio } from "@/lib/images";

export const CATEGORIES = [
  { id: "interior", label: "Interior", swatch: "var(--color-swatch-sage)" },
  { id: "exterior", label: "Exterior", swatch: "var(--color-swatch-terracotta)" },
  { id: "wallpaper", label: "Wallpaper", swatch: "var(--color-swatch-ochre)" },
  { id: "spray", label: "Spray", swatch: "var(--color-swatch-slate)" },
  { id: "commercial", label: "Commercial", swatch: "var(--color-swatch-blush)" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type ProjectImage = {
  src: string;
  alt: string;
  ratio: AspectRatio;
  tone: string;
};

export type Project = {
  slug: string;
  title: string;
  area: string;
  category: CategoryId;
  /** One line of scope. Concrete, no marketing. */
  scope: string;
  /** Longer detail shown in the lightbox and bottom sheet. */
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
): ProjectImage => ({ src, alt, ratio, tone });

export const projects: Project[] = [
  {
    slug: "victorian-terrace-frodsham",
    title: "Victorian terrace, top to bottom",
    area: "Frodsham",
    category: "interior",
    scope: "Six rooms, hall, stairs and landing. Lime-safe emulsion throughout.",
    detail:
      "The plaster had been papered over four times since the 1970s. We stripped it back, made good the cracks in the hallway ceiling, and put two coats on every wall. The original pine doors were rubbed down and re-glossed rather than replaced.",
    duration: "11 days",
    featured: true,
    images: [
      img("/work/project-1-01.png", "Hallway and stairs in a Frodsham Victorian terrace, freshly painted in a warm off-white", "4:5", "#cfd3d8"),
      img("/work/project-1-02.png", "Front room with restored pine skirting and re-glossed woodwork", "3:2", "#c8bcb4"),
      img("/work/project-1-03.png", "Landing with new emulsion and cut-in edges against the coving", "3:2", "#aab3a4"),
    ],
    beforeAfter: {
      before: img("/work/ba-1-before.png", "Hallway before work: peeling wallpaper and cracked plaster", "3:2", "#bdb0a4"),
      after: img("/work/ba-1-after.png", "The same hallway after two coats of emulsion and restored woodwork", "3:2", "#cfd6d2"),
    },
  },
  {
    slug: "rendered-semi-chester",
    title: "Rendered semi, weathered south wall",
    area: "Chester",
    category: "exterior",
    scope: "Full exterior. Masonry stabiliser, two coats, all sills made good.",
    detail:
      "South-facing render had blown in three places and the previous coating was chalking badly. We cut out and repaired the render, sealed it, and put two coats of breathable masonry paint over the lot. Fascias and downpipes done at the same time while the scaffold was up.",
    duration: "8 days",
    featured: true,
    images: [
      img("/work/project-2-01.png", "Rendered semi-detached house in Chester after a full exterior repaint", "16:9", "#c8bcb4"),
      img("/work/project-2-02.png", "Repaired render on the south-facing gable end", "3:2", "#aab3a4"),
      img("/work/project-2-03.png", "Freshly painted fascias, soffits and downpipes", "3:2", "#d5c9b6"),
    ],
    beforeAfter: {
      before: img("/work/ba-2-before.png", "Exterior before work: chalking masonry paint and blown render", "3:2", "#c9b8ad"),
      after: img("/work/ba-2-after.png", "The same elevation after render repairs and two coats of masonry paint", "3:2", "#bfc7bd"),
    },
  },
  {
    slug: "dining-room-mural-knutsford",
    title: "Hand-hung mural, dining room",
    area: "Knutsford",
    category: "wallpaper",
    scope: "Twelve-drop panoramic mural, hung to a plumb line off the chimney breast.",
    detail:
      "A twelve-drop mural with no repeat, so the whole wall has to be planned before the first drop goes up. Walls were lined and sized first. The client had lived with a mis-hung version of the same paper for two years — the join over the fireplace is now invisible.",
    duration: "3 days",
    featured: true,
    images: [
      img("/work/project-3-01.png", "Dining room with a hand-hung panoramic mural across the chimney breast", "1:1", "#aab3a4"),
      img("/work/project-3-02.png", "Close detail of a seam in the mural, matched across the drop", "3:2", "#d5c9b6"),
      img("/work/project-3-03.png", "The finished dining room with the mural and repainted woodwork", "3:2", "#b4bcc4"),
    ],
  },
  {
    slug: "sprayed-kitchen-wilmslow",
    title: "Sprayed kitchen, factory finish",
    area: "Wilmslow",
    category: "spray",
    scope: "Twenty-two doors and drawer fronts, sprayed off-site in satin.",
    detail:
      "Solid oak doors, forty years old and sound. Taken off, degreased, keyed, primed and sprayed in a controlled space, then refitted with new hinges. The carcasses were brush-finished in place to match. A new kitchen would have been eleven thousand pounds.",
    duration: "5 days",
    featured: true,
    images: [
      img("/work/project-4-01.png", "Kitchen in Wilmslow with sprayed satin doors and drawer fronts", "3:4", "#d5c9b6"),
      img("/work/project-4-02.png", "Doors racked and drying after spraying", "3:2", "#b4bcc4"),
      img("/work/project-4-03.png", "Refitted doors with new hinges and brush-finished carcasses", "3:2", "#c9b8ad"),
    ],
    video: { id: "aqz-KE-bpKQ", title: "Spraying a kitchen: how the doors are prepared" },
  },
  {
    slug: "dental-practice-northwich",
    title: "Dental practice, out of hours",
    area: "Northwich",
    category: "commercial",
    scope: "Four surgeries and reception, painted overnight across two weekends.",
    detail:
      "The practice could not close, so we worked Friday nights through to Sunday afternoons. Low-odour scrubbable emulsion throughout, all skirting and architrave in a water-based satin so the rooms were usable by Monday morning.",
    duration: "2 weekends",
    images: [
      img("/work/project-5-01.png", "Dental practice reception in Northwich after an overnight repaint", "16:9", "#b4bcc4"),
      img("/work/project-5-02.png", "Surgery room painted in low-odour scrubbable emulsion", "3:2", "#c9b8ad"),
      img("/work/project-5-03.png", "Corridor with water-based satin woodwork", "3:2", "#bfc7bd"),
    ],
  },
  {
    slug: "new-build-snagging-tarporley",
    title: "New build, snagging put right",
    area: "Tarporley",
    category: "interior",
    scope: "Full re-decoration of a handover-standard four bed.",
    detail:
      "Contract finish over unfilled joints and roller marks on every ceiling. We filled, sanded and put proper coats on. The difference in a new build is almost entirely preparation — the paint is the easy part.",
    duration: "9 days",
    images: [
      img("/work/project-6-01.png", "Living room in a Tarporley new build after full redecoration", "4:5", "#c9b8ad"),
      img("/work/project-6-02.png", "Ceiling with filled and sanded plasterboard joints", "3:2", "#bfc7bd"),
      img("/work/project-6-03.png", "Master bedroom with two full coats over the contract finish", "3:2", "#d2cabf"),
    ],
  },
  {
    slug: "sash-windows-chester",
    title: "Twelve sash windows, conservation area",
    area: "Chester",
    category: "exterior",
    scope: "Burn-off, repair and repaint in a heritage white, inside and out.",
    detail:
      "Listed frontage, so colour and finish were agreed with the conservation officer before a brush was lifted. Loose putty raked out and renewed, two rotten sills spliced rather than replaced, then primed, undercoated and finished by hand.",
    duration: "14 days",
    images: [
      img("/work/project-7-01.png", "Twelve restored sash windows on a Chester conservation-area frontage", "1:1", "#bfc7bd"),
      img("/work/project-7-02.png", "Renewed putty lines on a repaired sash window", "3:2", "#d2cabf"),
      img("/work/project-7-03.png", "Spliced timber sill primed and undercoated", "3:2", "#adb6b8"),
    ],
  },
  {
    slug: "hallway-panelling-wilmslow",
    title: "Panelled hallway, deep blue",
    area: "Wilmslow",
    category: "interior",
    scope: "New MDF panelling caulked, primed and finished in eggshell.",
    detail:
      "The joiner left the panelling in bare MDF. Every joint caulked, every fixing filled twice because MDF sinks, then primed and two coats of eggshell. A dark colour shows every flaw, which is why the filling took longer than the painting.",
    duration: "4 days",
    featured: true,
    images: [
      img("/work/project-8-01.png", "Hallway with new MDF panelling finished in a deep blue eggshell", "3:2", "#d2cabf"),
      img("/work/project-8-02.png", "Caulked and filled panelling joints before priming", "3:2", "#adb6b8"),
      img("/work/project-8-03.png", "Finished panelling with the stair spindles picked out", "3:2", "#c6cbd0"),
    ],
  },
  {
    slug: "farmhouse-kitchen-mold",
    title: "Farmhouse kitchen and utility",
    area: "Mold",
    category: "interior",
    scope: "Beams cleaned and waxed, walls in a clay white, units hand-painted.",
    detail:
      "Three hundred year old oak beams that had been varnished at some point in the eighties. Cleaned back rather than stripped, then waxed. Walls in a soft clay white so the beams do the talking, and the freestanding units hand-painted in a stone.",
    duration: "10 days",
    images: [
      img("/work/project-9-01.png", "Farmhouse kitchen in Mold with cleaned oak beams and clay white walls", "4:5", "#adb6b8"),
      img("/work/project-9-02.png", "Hand-painted freestanding units in a stone colour", "3:2", "#c6cbd0"),
      img("/work/project-9-03.png", "Utility room painted to match the main kitchen", "3:2", "#bdb0a4"),
    ],
  },
  {
    slug: "office-fit-out-wrexham",
    title: "Office fit-out, three floors",
    area: "Wrexham",
    category: "commercial",
    scope: "Sixty-two rooms and all common parts, phased around a live office.",
    detail:
      "Phased floor by floor over five weeks so the business never stopped. Corridors and stairwells done at weekends. Colour matched to the client's brand for the meeting rooms, everything else in a hard-wearing matt.",
    duration: "5 weeks",
    images: [
      img("/work/project-10-01.png", "Open-plan office floor in Wrexham after a phased repaint", "16:9", "#c6cbd0"),
      img("/work/project-10-02.png", "Meeting room painted to the client's brand colour", "3:2", "#bdb0a4"),
      img("/work/project-10-03.png", "Stairwell and common parts painted at weekends", "3:2", "#cfd6d2"),
    ],
  },
  {
    slug: "nursery-wallpaper-nantwich",
    title: "Nursery, paper and paint",
    area: "Nantwich",
    category: "wallpaper",
    scope: "One papered feature wall, three walls and ceiling in a soft chalk.",
    detail:
      "A tight room with a chimney breast and two alcoves, which is the hardest shape to paper well. Lined first, then papered with a small repeat that had to march evenly around both alcoves. Finished in time for a due date, which concentrates the mind.",
    duration: "2 days",
    images: [
      img("/work/project-11-01.png", "Nursery in Nantwich with a papered chimney breast and chalk white walls", "3:4", "#cfd6d2"),
      img("/work/project-11-02.png", "Small-repeat wallpaper matched around an alcove", "3:2", "#d9d6cd"),
      img("/work/project-11-03.png", "Finished nursery with painted woodwork", "3:2", "#c3ccc9"),
    ],
  },
  {
    slug: "sprayed-staircase-knutsford",
    title: "Sprayed staircase and spindles",
    area: "Knutsford",
    category: "spray",
    scope: "Fifty-eight spindles masked and sprayed in situ, two-tone.",
    detail:
      "Spraying spindles in place means the masking takes three times as long as the spraying. Handrail and newel posts in a dark satin, spindles and strings in white. No brush marks anywhere, which is the only reason to spray a staircase.",
    duration: "6 days",
    featured: true,
    images: [
      img("/work/project-12-01.png", "Staircase in Knutsford with sprayed white spindles and a dark satin handrail", "1:1", "#d9d6cd"),
      img("/work/project-12-02.png", "Masked spindles ready for spraying in situ", "3:2", "#c3ccc9"),
      img("/work/project-12-03.png", "Finished two-tone staircase with no brush marks", "3:2", "#b9ae9f"),
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
