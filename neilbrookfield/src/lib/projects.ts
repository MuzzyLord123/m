import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Projects are MDX files in content/projects. Frontmatter carries the facts,
 * the body carries whatever Neil wants to say about the job.
 *
 * Files beginning with an underscore are ignored, so _TEMPLATE.mdx can sit in
 * the folder as the thing you copy.
 *
 * Validation here is deliberately loud. A project with a colour missing its hex
 * or an image missing its alt text fails the build with the filename in the
 * message, rather than shipping a silent gap.
 */

export const PROJECT_TYPES = ['kitchen', 'interior', 'exterior', 'furniture', 'effects'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_LABELS: Record<ProjectType, string> = {
  kitchen: 'Hand-painted kitchen',
  interior: 'Interior decorating',
  exterior: 'Exterior decorating',
  furniture: 'Hand-painted furniture',
  effects: 'Paint effects',
};

export type Colour = {
  name: string;
  /** #rrggbb — the actual colour, for the specimen square. */
  hex: string;
  /** Manufacturer and finish. Omitted rather than guessed. */
  product?: string;
};

export type ProjectImage = {
  /** Path under /public. Absent means the photograph has not been supplied yet
   *  and the slot renders as a labelled frame. */
  src?: string;
  /** Required once src is set. One line describing the work shown — not "image1". */
  alt?: string;
  caption?: string;
  /** Required when src is absent: what photograph belongs here. */
  needs?: string;
  /** Intrinsic size, needed to reserve space and keep CLS at zero. */
  width?: number;
  height?: number;
};

/**
 * complete        — checked with Neil, photographs in, ready to publish.
 * awaiting-photos — words confirmed, photographs still to come.
 * from-review     — reconstructed from a customer's review; Neil has not yet
 *                   confirmed the details. Renders with a visible note.
 */
export type ProjectStatus = 'complete' | 'awaiting-photos' | 'from-review';

export type Project = {
  slug: string;
  title: string;
  /** null until confirmed — never guessed. */
  location: string | null;
  year: number | null;
  type: ProjectType;
  brief: string;
  /** What was done, in order, preparation first. */
  work: string[];
  colours: Colour[];
  images: ProjectImage[];
  featured: boolean;
  status: ProjectStatus;
  /** Shown to the reader when the record is not yet confirmed. */
  note?: string;
  /** MDX source for the write-up. */
  body: string;
};

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects');

function fail(file: string, message: string): never {
  throw new Error(`content/projects/${file}: ${message}`);
}

function asString(file: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(file, `"${field}" is required and must be a non-empty string.`);
  }
  return value.trim();
}

function parseProject(file: string, raw: string): Project {
  const { data, content } = matter(raw);
  const slug = file.replace(/\.mdx?$/, '');

  const type = asString(file, 'type', data.type) as ProjectType;
  if (!PROJECT_TYPES.includes(type)) {
    fail(file, `"type" must be one of ${PROJECT_TYPES.join(', ')} — got "${type}".`);
  }

  const status = (data.status ?? 'complete') as ProjectStatus;
  if (!['complete', 'awaiting-photos', 'from-review'].includes(status)) {
    fail(file, `"status" must be complete, awaiting-photos or from-review — got "${status}".`);
  }

  const workList: unknown = data.work ?? [];
  if (!Array.isArray(workList) || workList.some((w) => typeof w !== 'string')) {
    fail(file, '"work" must be a list of strings, in the order the job was done.');
  }

  const colours: Colour[] = (Array.isArray(data.colours) ? data.colours : []).map(
    (c: Record<string, unknown>, i: number) => {
      const name = asString(file, `colours[${i}].name`, c?.name);
      const hex = asString(file, `colours[${i}].hex`, c?.hex);
      if (!/^#[0-9a-f]{6}$/i.test(hex)) {
        fail(file, `colours[${i}].hex must be a six-digit hex colour — got "${hex}".`);
      }
      return {
        name,
        hex,
        ...(c?.product ? { product: String(c.product) } : {}),
      };
    },
  );

  const images: ProjectImage[] = (Array.isArray(data.images) ? data.images : []).map(
    (img: Record<string, unknown>, i: number) => {
      const src = img?.src ? String(img.src) : undefined;
      const alt = img?.alt ? String(img.alt) : undefined;
      const needs = img?.needs ? String(img.needs) : undefined;

      if (src && !alt) {
        fail(
          file,
          `images[${i}] has a src but no alt. Every photograph gets one line describing the work shown.`,
        );
      }
      if (!src && !needs) {
        fail(
          file,
          `images[${i}] has neither a src nor a "needs" line. An empty slot must say what photograph belongs there.`,
        );
      }
      if (alt && /^(image|photo|img)[\s_-]*\d*$/i.test(alt.trim())) {
        fail(file, `images[${i}].alt is "${alt}" — describe the work shown, not the file.`);
      }
      return {
        ...(src ? { src } : {}),
        ...(alt ? { alt } : {}),
        ...(needs ? { needs } : {}),
        ...(img?.caption ? { caption: String(img.caption) } : {}),
        ...(img?.width ? { width: Number(img.width) } : {}),
        ...(img?.height ? { height: Number(img.height) } : {}),
      };
    },
  );

  return {
    slug,
    title: asString(file, 'title', data.title),
    location: data.location ? String(data.location) : null,
    year: data.year ? Number(data.year) : null,
    type,
    brief: asString(file, 'brief', data.brief),
    work: workList as string[],
    colours,
    images,
    featured: Boolean(data.featured),
    status,
    ...(data.note ? { note: String(data.note) } : {}),
    body: content.trim(),
  };
}

let cache: Project[] | null = null;

export function getProjects(): Project[] {
  if (cache) return cache;
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const files = fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith('_'));

  const projects = files.map((f) =>
    parseProject(f, fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8')),
  );

  // Newest first where the year is known; unconfirmed years sort to the end
  // rather than pretending to be recent.
  projects.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));

  cache = projects;
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getFeaturedProjects(limit = 3): Project[] {
  const featured = getProjects().filter((p) => p.featured);
  return (featured.length ? featured : getProjects()).slice(0, limit);
}

export function getProjectsByType(type: ProjectType): Project[] {
  return getProjects().filter((p) => p.type === type);
}

/** The next job in the index, wrapping round, for the foot of a project page. */
export function getNextProject(slug: string): Project | undefined {
  const all = getProjects();
  if (all.length < 2) return undefined;
  const i = all.findIndex((p) => p.slug === slug);
  return all[(i + 1) % all.length];
}

/** The photograph a project leads with, if it has one. */
export function heroImage(project: Project): ProjectImage | undefined {
  return project.images[0];
}
