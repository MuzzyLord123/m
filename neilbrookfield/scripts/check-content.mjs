#!/usr/bin/env node
/**
 * The launch gate.
 *
 *   npm run check:content   report what is outstanding, and rewrite CONTENT-NEEDED.md
 *   npm run check:launch    the same, but exits non-zero if anything blocking is open
 *
 * Run check:launch before the Wix site is switched off. It is the difference
 * between "the rebuild is finished" and "the rebuild is finished and nobody has
 * published a phone number that has not been dialled".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const needed = JSON.parse(read('content/needed.json'));

/* ---------------------------------------------------------------- flags --- */
/* Each flag is the single boolean that publishes a piece of content. They are
   read out of the source so this script cannot drift from what actually ships. */

const flags = [
  {
    id: 'phone',
    label: 'Telephone number confirmed',
    on: /const PHONE_CONFIRMED = true/.test(read('content/site.ts')),
    file: 'content/site.ts',
  },
  {
    id: 'workshop-pricing',
    label: 'Workshop pricing confirmed and published',
    on: /confirmed:\s*true/.test(read('content/pricing.ts')),
    file: 'content/pricing.ts',
  },
  {
    id: 'enquiry-delivery',
    label: 'Enquiry form wired to send email (needs RESEND_API_KEY + ENQUIRY_TO on the host)',
    on: /api\.resend\.com\/emails/.test(read('src/lib/enquiry.ts')),
    file: 'src/lib/enquiry.ts',
  },
  {
    id: 'placeholders',
    label: 'Placeholder frames hidden (published state, not the review state)',
    on: /SHOW_PLACEHOLDERS = false/.test(read('content/site.ts')),
    file: 'content/site.ts',
  },
  {
    id: 'review-quotes',
    label: 'All three review quotes set verbatim',
    on: !/quote:\s*null/.test(read('content/reviews.ts')),
    file: 'content/reviews.ts',
  },
  {
    id: 'google-profile',
    label: 'Google Business Profile linked',
    on: !/googleProfileUrl:\s*string \| null = null/.test(read('content/reviews.ts')),
    file: 'content/reviews.ts',
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

  const slotCount = (frontmatter.match(/^\s*-\s+(src|needs):/gm) ?? []).length;
  const missingPhotos = (frontmatter.match(/^\s*-?\s*needs:/gm) ?? []).length;
  const statusMatch = frontmatter.match(/^status:\s*(\S+)/m);

  return {
    file,
    slug: file.replace(/\.mdx?$/, ''),
    status: statusMatch ? statusMatch[1].replace(/['"]/g, '') : 'complete',
    hasLocation: /^location:\s*\S/m.test(frontmatter),
    hasYear: /^year:\s*\d{4}/m.test(frontmatter),
    hasColours: /^colours:/m.test(frontmatter),
    photos: slotCount - missingPhotos,
    missingPhotos,
  };
});

const TARGET_PROJECTS = 8;

/* ----------------------------------------------------------------- scan --- */
/* Any CONFIRM: or {{TODO}} marker left anywhere in the content or the source. */

function walk(dir, out = []) {
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
        markers.push({ file: rel, line: i + 1, text: line.trim().slice(0, 100) });
      }
    });
}

/* --------------------------------------------------------------- report --- */

const answered = new Set(flags.filter((f) => f.on).map((f) => f.id));
const open = needed.filter((n) => !answered.has(n.id));
const blocking = open.filter((n) => n.blocksLaunch);

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(`\n${bold('Content check — neilbrookfield.co.uk')}\n`);

console.log(bold('Switches'));
for (const flag of flags) {
  console.log(`  ${flag.on ? '✓' : '·'} ${flag.label} ${dim(flag.file)}`);
}

console.log(`\n${bold('Jobs')}`);
if (!projects.length) {
  console.log('  · No jobs written up yet.');
} else {
  for (const p of projects) {
    const gaps = [
      !p.hasLocation && 'no location',
      !p.hasYear && 'no year',
      !p.hasColours && 'no colours',
      p.missingPhotos > 0 && `${p.missingPhotos} photograph${p.missingPhotos === 1 ? '' : 's'} to come`,
      p.status !== 'complete' && `status: ${p.status}`,
    ].filter(Boolean);
    console.log(
      `  ${gaps.length ? '·' : '✓'} ${p.slug}${gaps.length ? dim(` — ${gaps.join(', ')}`) : ''}`,
    );
  }
}
console.log(
  `  ${projects.length >= TARGET_PROJECTS ? '✓' : '·'} ${projects.length} of ${TARGET_PROJECTS}–12 jobs written up`,
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

const byPriority = (p) =>
  [...needed].filter((n) => n.priority === p && !answered.has(n.id));

const section = (title, items) =>
  items.length
    ? `## ${title}\n\n${items
        .map(
          (n) =>
            `### ${n.question}\n\n` +
            `${n.why}\n\n` +
            `*Answer goes in:* \`${n.where}\`  \n` +
            `*Blocks launch:* ${n.blocksLaunch ? 'yes' : 'no'}\n`,
        )
        .join('\n')}`
    : '';

const doc = `<!--
  GENERATED FILE — do not edit by hand.
  Written by scripts/check-content.mjs from content/needed.json.
  Run: npm run check:content
-->

# What Neil needs to tell us

Everything on this list is something the rebuild deliberately did not invent. Where an answer is
missing the site shows a labelled frame rather than a guess, and \`npm run check:launch\` fails while
anything marked *blocks launch* is still open.

It is one phone call. Work down it in order.

**Start with these three:**

1. **The mobile number.** Read back digit by digit. The old site linked a number two digits short of
   the one it displayed, so every visitor who tapped it on a phone failed to get through. That single
   fault is probably the most expensive thing on the old site.
2. **What the Saturday sessions cost now.** The published figures are from 2024 and the page shows a
   frame rather than a stale price.
3. **The photographs, grouped into jobs.** An hour with the pictures, naming eight to twelve jobs with
   a location, a rough year and what was actually done. This is the fix the whole rebuild is built
   around.

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
            !p.hasColours && 'colours',
            p.missingPhotos > 0 && `${p.missingPhotos} photograph(s)`,
          ].filter(Boolean);
          return `- \`${p.slug}\` — status \`${p.status}\`${
            gaps.length ? `, still needs: ${gaps.join(', ')}` : ', complete'
          }`;
        })
        .join('\n')
    : '- None yet.'
}

Target is eight to twelve. Copy \`content/projects/_TEMPLATE.mdx\` for each one.

## Photographs

Export them from the **Wix media manager at original resolution** — not by saving the images off the
live site, which serves cropped, resized and re-encoded copies. Full-resolution originals are the
entire point of a photography-led site.

Each photograph needs one line of alt text describing the work shown. Roughly a hundred images means
roughly a hundred lines; the build refuses any image whose alt text is missing or reads like
\`image1\`.
`;

fs.writeFileSync(path.join(root, 'CONTENT-NEEDED.md'), doc);
console.log(`\n${dim('CONTENT-NEEDED.md rewritten.')}`);

/* ----------------------------------------------------------------- gate --- */

if (strict) {
  // The gate asks one question: would publishing this state say anything that
  // is not true? Missing content does not fail — the site omits what it does
  // not have. Publishing the review state, or a switch left inconsistent, does.
  const failures = [
    ...blocking.map((n) => `${n.id} — ${n.where}`),
    ...(/SHOW_PLACEHOLDERS = true/.test(read('content/site.ts'))
      ? ['SHOW_PLACEHOLDERS is on — that is the review state, with dashed frames on every gap']
      : []),
  ];

  if (failures.length) {
    console.error(`\n\x1b[31m${bold('Not ready to go live.')}\x1b[0m`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error('\nDo not switch the Wix site off until these are closed.\n');
    process.exit(1);
  }

  console.log(`\n\x1b[32m${bold('Nothing published here is unverified.')}\x1b[0m`);
  console.log(
    `${dim('Still worth collecting, though the site stands up without them:')}\n` +
      open
        .filter((n) => n.priority === 1)
        .map((n) => `  · ${n.id}`)
        .join('\n') +
      '\n',
  );
}
