#!/usr/bin/env node
/**
 * The launch gate.
 *
 *   npm run check:content   report what is outstanding, and rewrite CONTENT-NEEDED.md
 *   npm run check:launch    the same, but exits non-zero if anything blocking is open
 *
 * Run check:launch before the WordPress site is switched off. It is the
 * difference between "the rebuild is finished" and "the rebuild is finished and
 * nobody has published a testimonial that no customer actually wrote".
 *
 * Every switch below is read out of the source rather than tracked by hand, so
 * this script cannot drift from what actually ships.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const needed = JSON.parse(read('content/needed.json'));

/* ---------------------------------------------------------------- flags --- */

const flags = [
  {
    id: 'founded',
    label: 'Founding year set, so "years trading" is computed',
    on: !/export const FOUNDED: number \| null = null/.test(read('content/site.ts')),
    file: 'content/site.ts',
  },
  {
    id: 'review-quotes',
    label: 'All four reviews set verbatim',
    on: !/quote:\s*null/.test(read('content/reviews.ts')),
    file: 'content/reviews.ts',
  },
  {
    id: 'google-profile',
    label: 'Google Business Profile confirmed and linked',
    on: !/google:\s*null as/.test(read('content/site.ts')),
    file: 'content/site.ts',
  },
  {
    id: 'enquiry-delivery',
    label: 'Enquiry actually delivers somewhere',
    on: /export const DELIVERY_CONFIGURED = true/.test(read('src/lib/enquiry.ts')),
    file: 'src/lib/enquiry.ts',
  },
  {
    id: 'team',
    label: 'Who is in the team, confirmed',
    on: !/people:\s*\[\] as/.test(read('content/copy/about.ts')),
    file: 'content/copy/about.ts',
  },
  {
    id: 'insurance',
    label: 'Public liability cover published on /commercial',
    on: !/body:\s*null as/.test(read('content/copy/commercial.ts')),
    file: 'content/copy/commercial.ts',
  },
  {
    id: 'hours',
    label: 'Working hours published on /contact',
    on: !/hours:\s*null as/.test(read('content/copy/contact.ts')),
    file: 'content/copy/contact.ts',
  },
  {
    id: 'yell-rating',
    label: 'Yell rating read off the listing, with the date',
    on: !/export const yellRating[^=]*=\s*null/.test(read('content/reviews.ts')),
    file: 'content/reviews.ts',
  },
  {
    id: 'base-town',
    label: 'One town across the website, Yell and Checkatrade',
    // Answered by hand: delete the entry from needed.json once settled.
    on: false,
    file: 'content/site.ts',
  },
];

/* ------------------------------------------------------------- projects --- */

const projectsDir = path.join(root, 'content', 'projects');
const projectFiles = fs.existsSync(projectsDir)
  ? fs.readdirSync(projectsDir).filter((f) => /\.mdx?$/.test(f) && !f.startsWith('_'))
  : [];

const projects = projectFiles.map((file) => {
  const raw = fs.readFileSync(path.join(projectsDir, file), 'utf8');
  const frontmatter = raw.split(/^---$/m)[1] ?? '';
  const statusMatch = frontmatter.match(/^status:\s*(\S+)/m);

  // A comparison slot either has a src or says what it needs. Count the ones
  // still waiting: those are the photographs blocking the design.
  const missingPhotos = (frontmatter.match(/^\s{2}needs:/gm) ?? []).length;

  return {
    file,
    slug: file.replace(/\.mdx?$/, ''),
    status: statusMatch ? statusMatch[1].replace(/['"]/g, '') : 'complete',
    hasLocation: /^location:\s*(?!null)\S/m.test(frontmatter),
    hasYear: /^year:\s*\d{4}/m.test(frontmatter),
    missingPhotos,
    hasPair: missingPhotos === 0,
  };
});

/** The brief's floor: four jobs with a matched before-and-after pair. */
const TARGET_PAIRS = 4;
const pairs = projects.filter((p) => p.hasPair).length;

/* ----------------------------------------------------------------- scan --- */

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|mdx?|css|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const markers = [];
for (const file of [...walk(path.join(root, 'src')), ...walk(path.join(root, 'content'))]) {
  const rel = path.relative(root, file);
  read(rel)
    .split('\n')
    .forEach((line, i) => {
      if (/CONFIRM:|\{\{TODO/.test(line)) {
        markers.push({ file: rel, line: i + 1, text: line.trim().slice(0, 90) });
      }
    });
}

/* --------------------------------------------------------------- report --- */

const answered = new Set(flags.filter((f) => f.on).map((f) => f.id));
const open = needed.filter((n) => !answered.has(n.id));
const blocking = open.filter((n) => n.blocksLaunch);

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(`\n${bold('Content check — egodecorators.com')}\n`);

console.log(bold('Switches'));
for (const flag of flags) {
  console.log(`  ${flag.on ? '✓' : '·'} ${flag.label} ${dim(flag.file)}`);
}

console.log(`\n${bold('Jobs')}`);
if (!projects.length) {
  console.log('  · None written up yet.');
} else {
  for (const p of projects) {
    const gaps = [
      !p.hasLocation && 'no location',
      !p.hasYear && 'no year',
      p.missingPhotos > 0 && `${p.missingPhotos} photograph${p.missingPhotos === 1 ? '' : 's'} to come`,
      p.status !== 'complete' && `status: ${p.status}`,
    ].filter(Boolean);
    console.log(`  ${gaps.length ? '·' : '✓'} ${p.slug}${gaps.length ? dim(` — ${gaps.join(', ')}`) : ''}`);
  }
}
console.log(
  `  ${pairs >= TARGET_PAIRS ? '✓' : '·'} ${pairs} of ${TARGET_PAIRS} matched before/after pairs`,
);

console.log(`\n${bold('Open questions')} ${dim(`(${open.length}, ${blocking.length} blocking)`)}`);
for (const n of [...open].sort((a, b) => a.priority - b.priority)) {
  console.log(`  ${n.blocksLaunch ? '!' : '·'} [${n.priority}] ${n.id} ${dim(`→ ${n.where}`)}`);
}

if (markers.length) {
  console.log(`\n${bold('Markers left in the source')}`);
  for (const m of markers) console.log(`  · ${m.file}:${m.line} ${dim(m.text)}`);
}

/* ------------------------------------------------- CONTENT-NEEDED.md ------ */

const byPriority = (p) => needed.filter((n) => n.priority === p && !answered.has(n.id));

const section = (title, items) =>
  items.length
    ? `## ${title}\n\n${items
        .map(
          (n) =>
            `### ${n.question}\n\n` +
            `${n.why}\n\n` +
            `*Answer goes in:* \`${n.where}\`  \n` +
            `*Blocks launch:* ${n.blocksLaunch ? '**yes**' : 'no'}\n`,
        )
        .join('\n')}\n`
    : '';

const doc = `<!--
  GENERATED FILE — do not edit by hand.
  Written by scripts/check-content.mjs from content/needed.json.
  Run: npm run check:content
-->

# What we need from Ted

Everything on this list is something the rebuild deliberately did not invent.
Where an answer is missing the site shows a labelled frame saying what is
missing, rather than a guess — and \`npm run check:launch\` fails while anything
marked *blocks launch* is still open.

That is the whole difference between this site and the one it replaces. The old
one has had Latin placeholder text, five of its theme's dummy client logos and a
stranger's stock photography sitting on its home page since 2022, because
somebody needed to fill a space and filled it.

**The photographs come first.** Everything else on this list is a phone call.
The photographs are the design:

1. **Four matched before-and-after pairs.** Same view, same spot, same framing.
   Currently ${pairs} of ${TARGET_PAIRS}. Without these the home page, every
   project and the repairs page all render an empty frame where the comparison
   should be.
2. **Close-ups of the woodwork repair** — rot opened up, timber cut out, a
   splice going in, filled, primed, finished. \`/repairs\` is the page meant to
   win the work nobody else bids for, and it is the one thing a competitor on
   the same bought theme cannot copy.
3. **The four reviews, verbatim.** We know roughly what they say. Roughly is not
   good enough to put inside quotation marks over somebody's name.

${section('Ask first', byPriority(1))}
${section('Ask next', byPriority(2))}
${section('Worth asking while you have him', byPriority(3))}
## Jobs written up so far

${
  projects.length
    ? projects
        .map((p) => {
          const gaps = [
            !p.hasLocation && 'location',
            !p.hasYear && 'year',
            p.missingPhotos > 0 && `${p.missingPhotos} photograph(s)`,
            p.status !== 'complete' && `status \`${p.status}\``,
          ].filter(Boolean);
          return `- \`${p.slug}\`${gaps.length ? ` — still needs: ${gaps.join(', ')}` : ' — complete'}`;
        })
        .join('\n')
    : '- None yet.'
}

Copy \`content/projects/_TEMPLATE.mdx\` for each new one. Jobs carried over from
the old site are marked \`from-old-site\`: the words came off the WordPress
write-ups and have not been re-confirmed, so they render with a visible note
until they are.

## Photographs

Export from the **WordPress media library at original resolution** before the
old site is switched off — see \`MIGRATION.md\`. Not by saving images off the
live pages, which serve cropped, resized and re-encoded copies.

Discard everything under \`wp-content/themes/decorator-pro/images/\`. That is the
theme's stock photography and its five dummy client logos, and none of it is
theirs.

Every photograph needs one line of alt text describing the work shown. The build
refuses any image whose alt text is missing or reads like \`image1\`, and refuses
a comparison slot that has neither a photograph nor a line saying what belongs
there.
`;

fs.writeFileSync(path.join(root, 'CONTENT-NEEDED.md'), doc);
console.log(`\n${dim('CONTENT-NEEDED.md rewritten.')}`);

/* ----------------------------------------------------------------- gate --- */

if (strict) {
  const failures = [
    ...blocking.map((n) => `${n.id} — ${n.where}`),
    ...(pairs < TARGET_PAIRS
      ? [`only ${pairs} matched before/after pairs, need ${TARGET_PAIRS}`]
      : []),
    ...projects
      .filter((p) => p.status !== 'complete')
      .map((p) => `${p.slug} is not confirmed (status: ${p.status})`),
    ...markers.map((m) => `marker left at ${m.file}:${m.line}`),
  ];

  if (failures.length) {
    console.error(`\n\x1b[31m${bold('Not ready to go live.')}\x1b[0m`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error('\nDo not switch the WordPress site off until these are closed.\n');
    process.exit(1);
  }

  console.log(`\n\x1b[32m${bold('Ready to go live.')}\x1b[0m\n`);
}
