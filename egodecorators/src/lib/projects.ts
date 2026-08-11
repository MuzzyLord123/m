import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Projects are MDX files in content/projects. Frontmatter carries the facts,
 * the body carries the write-up.
 *
 * Files beginning with an underscore are skipped, so _TEMPLATE.mdx can sit in
 * the folder as the thing you copy.
 *
 * Validation is deliberately loud. The old site shipped entries called
 * `project-1` and `project-4`, images with no alt text and links that said
 * "View Product Details". Every one of those is a build error here, with the
 * filename in the message.
 */

export const PROJECT_TYPES = ['domestic', 'commercial', 'industrial'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_LABELS: Record<ProjectType, string> = {
  domestic: 'Domestic',
  commercial: 'Commercial',
  industrial: 'Industrial',
};

/**
 * complete        — checked with Ted, photographs in, ready to publish.
 * awaiting-photos — words confirmed, photographs still to come.
 * from-old-site   — carried over from WordPress and not yet re-confirmed.
 *                   Renders with a visible note; blocks launch.
 */
export const PROJECT_STATUSES = ['complete', 'awaiting-photos', 'from-old-site'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectImage = {
  /** Path under /public. Absent means the photograph has not been supplied. */
  src?: string;
  /** Required once src is set. One line describing the work shown. */
  alt?: string;
  /** Required when src is absent: what photograph belongs here. */
  needs?: string;
  /** Intrinsic size. Required with src so the slot reserves space and CLS stays flat. */
  width?: number;
  height?: number;
};

export type Project = {
  slug: string;
  title: string;
  /** null until confirmed — never guessed. */
  location: string | null;
  year: number | null;
  type: ProjectType;
  /** One sentence: the state it was in. */
  problem: string;
  /** What was done, in order. */
  work: string[];
  before: ProjectImage;
  after: ProjectImage;
  gallery: ProjectImage[];
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

/**
 * A comparison slot. Either it has a photograph with alt text and dimensions,
 * or it says what photograph is missing. There is no third state, because the
 * third state is how the old site ended up rendering empty <img> tags.
 */
function parseImage(file: string, field: string, raw: unknown): ProjectImage {
  const img = (raw ?? {}) as Record<string, unknown>;
  const src = img.src ? String(img.src) : undefined;
  const alt = img.alt ? String(img.alt) : undefined;
  const needs = img.needs ? String(img.needs) : undefined;

  if (!src && !needs) {
    fail(
      file,
      `${field} has neither a "src" nor a "needs" line. An empty slot must say ` +
        `what photograph belongs there — it must never render as a blank image.`,
    );
  }
  if (src && !alt) {
    fail(file, `${field} has a src but no alt. Describe the work shown, in one line.`);
  }
  if (alt && /^(image|photo|img|picture)[\s_-]*\d*$/i.test(alt.trim())) {
    fail(file, `${field}.alt is "${alt}" — describe the work shown, not the file.`);
  }
  if (src && (!img.width || !img.height)) {
    fail(
      file,
      `${field} needs "width" and "height" alongside its src, so the page reserves ` +
        `the space before the image loads. The layout budget is CLS ≤ 0.02.`,
    );
  }

  return {
    ...(src ? { src } : {}),
    ...(alt ? { alt } : {}),
    ...(needs ? { needs } : {}),
    ...(img.width ? { width: Number(img.width) } : {}),
    ...(img.height ? { height: Number(img.height) } : {}),
  };
}

function parseProject(file: string, raw: string): Project {
  const { data, content } = matter(raw);
  const slug = file.replace(/\.mdx?$/, '');

  // The old site had recent_work entries called project-1, project-3 and
  // project-4. Naming a job is the minimum: either it is worth writing up under
  // its own name or it is not worth publishing.
  if (/^project[-_]?\d+$/i.test(slug)) {
    fail(
      file,
      `"${slug}" is a placeholder slug of exactly the kind the rebuild exists to ` +
        `retire. Name the job, or leave it out.`,
    );
  }

  const type = asString(file, 'type', data.type) as ProjectType;
  if (!PROJECT_TYPES.includes(type)) {
    fail(file, `"type" must be one of ${PROJECT_TYPES.join(', ')} — got "${type}".`);
  }

  const status = (data.status ?? 'complete') as ProjectStatus;
  if (!PROJECT_STATUSES.includes(status)) {
    fail(file, `"status" must be one of ${PROJECT_STATUSES.join(', ')} — got "${status}".`);
  }

  const workList: unknown = data.work ?? [];
  if (!Array.isArray(workList) || workList.some((w) => typeof w !== 'string')) {
    fail(file, '"work" must be a list of strings, in the order the job was done.');
  }
  if (!workList.length) {
    fail(file, '"work" is empty. What was actually done, preparation first.');
  }

  const gallery = (Array.isArray(data.gallery) ? data.gallery : []).map(
    (g: unknown, i: number) => parseImage(file, `gallery[${i}]`, g),
  );

  return {
    slug,
    title: asString(file, 'title', data.title),
    location: data.location ? String(data.location) : null,
    year: data.year ? Number(data.year) : null,
    type,
    problem: asString(file, 'problem', data.problem),
    work: workList as string[],
    before: parseImage(file, 'before', data.before),
    after: parseImage(file, 'after', data.after),
    gallery,
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

  // Newest first where the year is known. An unconfirmed year sorts to the end
  // rather than pretending to be this year's work.
  projects.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));

  cache = projects;
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

/**
 * Look a project up for a page that references it by slug. Throws rather than
 * rendering nothing, so a renamed MDX file fails the build instead of quietly
 * removing the comparison from the home page.
 */
export function requireProject(slug: string, referencedBy: string): Project {
  const project = getProject(slug);
  if (!project) {
    throw new Error(
      `${referencedBy} references the project "${slug}", which does not exist in ` +
        `content/projects/. Either restore the file or update the reference.`,
    );
  }
  return project;
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

/** Where a job happened and when, for the metadata line. Omits what is unknown. */
export function projectMeta(project: Project): string {
  return [project.location, project.year ? String(project.year) : null, TYPE_LABELS[project.type]]
    .filter(Boolean)
    .join(' · ');
}
