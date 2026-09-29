/**
 * Builds the whole site as ONE self-contained HTML file.
 *
 *   node --experimental-strip-types scripts/build-single-file.mjs
 *
 * Why this exists: the Next.js project is the real site, but it needs a build
 * step and a host. This produces a single file you can paste into a chat, hand
 * to a website builder, or open by double-clicking. Every word comes from
 * content/, so it cannot drift from the real thing.
 *
 * What it keeps: all eight pages, the copy, the design, the phone number from
 * its single constant, the structured data, and the page titles/descriptions.
 * What it drops: the image pipeline and the server-side enquiry form, neither of
 * which can exist in a file with no server behind it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site, phone, nav, cta, FOUNDED, yearsTrading } from '../content/site.ts';
import { home } from '../content/copy/home.ts';
import { work as workCopy } from '../content/copy/work.ts';
import { about } from '../content/copy/about.ts';
import { kitchens } from '../content/copy/kitchens.ts';
import { decorating } from '../content/copy/decorating.ts';
import { workshops } from '../content/copy/workshops.ts';
import { contact } from '../content/copy/contact.ts';
import { workshop } from '../content/pricing.ts';
import { reviews } from '../content/reviews.ts';

/** Only real, verbatim reviews are shown. Where there are none, the section is
 *  left off entirely rather than paraphrased or faked. */
const hasReviewQuotes = reviews.some((r) => Boolean(r.quote));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPE_LABELS = {
  kitchen: 'Hand-painted kitchen',
  interior: 'Interior decorating',
  exterior: 'Exterior decorating',
  furniture: 'Hand-painted furniture',
  effects: 'Paint effects',
};

/**
 * Read the jobs out of content/projects/*.mdx. Deliberately minimal YAML
 * handling — these files only ever use the shapes the template defines, and a
 * dependency is not worth it for one folder of known files. Underscore-prefixed
 * files (the template) are skipped, as in the real site.
 */
function loadProjects() {
  const dir = path.join(root, 'content', 'projects');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith('_'))
    .map((f) => {
      const fm = fs.readFileSync(path.join(dir, f), 'utf8').split(/^---$/m)[1] ?? '';
      const scalar = (key) => {
        const m = fm.match(new RegExp(`^${key}:\\s*(?:>-\\s*\\n((?:\\s{2,}.*\\n?)+)|(.+))$`, 'm'));
        if (!m) return null;
        const v = (m[1] ? m[1].replace(/\s+/g, ' ') : m[2]).trim().replace(/^['"]|['"]$/g, '');
        return v || null;
      };
      // A list of quoted strings under `work:`, up to the next top-level key.
      const listBlock = fm.match(/^work:\s*\n((?:\s+-\s+.*\n?)+)/m);
      const work = listBlock
        ? listBlock[1]
            .split('\n')
            .map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
        : [];

      return {
        slug: f.replace(/\.mdx?$/, ''),
        title: scalar('title'),
        type: scalar('type'),
        location: scalar('location'),
        year: scalar('year'),
        brief: scalar('brief'),
        work,
      };
    })
    .filter((p) => p.title && p.brief);
}

/* ------------------------------------------------------------------ utils - */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A section with a tone. Tones alternate so the eye resets. */
const section = (tone, inner, extra = '') =>
  `<section class="s ${tone}"${extra}><div class="wrap">${inner}</div></section>`;

/** Hairline + small-caps label, the only decoration the design owns. */
const eyebrow = (text) => `<hr class="rule"><p class="eb">${esc(text)}</p>`;

/** The asymmetric two-column spread: narrow label left, text right. */
const split = (left, right) =>
  `<div class="grid"><div class="c4">${left}</div><div class="c7">${right}</div></div>`;

const paras = (list, cls = 'lede') => list.map((p) => `<p class="${cls}">${esc(p)}</p>`).join('');

/** Numbered list — preparation first, which is the whole argument. */
const steps = (items) =>
  `<ol class="steps">${items
    .map(
      (it, i) =>
        `<li><span class="num">${String(i + 1).padStart(2, '0')}</span><div>` +
        `<h3>${esc(it.title)}</h3><p class="muted">${esc(it.body)}</p></div></li>`,
    )
    .join('')}</ol>`;

/* ------------------------------------------------------------------ pages - */

function pageHome() {
  const knownFor = home.knownFor.items
    .map(
      (it) =>
        `<div class="grid row"><div class="c5"><h3 class="big">${esc(it.heading)}</h3></div>` +
        `<div class="c6"><p class="muted">${esc(it.body)}</p>` +
        `<a class="lnk" href="#${it.href.slice(1)}">${esc(it.linkLabel)}</a></div></div>`,
    )
    .join('');

  const reviewBlock = hasReviewQuotes
    ? section(
        'linen',
        eyebrow(home.reviews.eyebrow) +
          `<h2>${esc(home.reviews.heading)}</h2>` +
          `<div class="quotes">${reviews
            .filter((r) => r.quote)
            .map(
              (r) =>
                `<figure><blockquote>${esc(r.quote)}</blockquote>` +
                `<figcaption class="eb">${esc(r.name)}</figcaption></figure>`,
            )
            .join('')}</div>`,
      )
    : '';

  return (
    `<div class="s night hero"><div class="wrap">` +
    `<hr class="rule"><p class="eb">${esc(home.hero.eyebrow)}</p>` +
    `<h1>${esc(home.hero.heading)}</h1>` +
    `<p class="lede wide">${esc(home.hero.lede)}</p></div></div>` +
    section('night', eyebrow(home.knownFor.eyebrow) + `<div class="stack">${knownFor}</div>`) +
    section(
      'linen',
      eyebrow(home.work.eyebrow) +
        `<h2>${esc(home.work.heading)}</h2>` +
        `<p class="muted wide">${esc(workCopy.lede)}</p>` +
        `<a class="lnk" href="#work">${esc(home.work.link.label)}</a>`,
    ) +
    section(
      'night',
      split(
        eyebrow(home.story.eyebrow),
        `<h2>${esc(home.story.heading)}</h2><p class="lede">${esc(home.story.body)}</p>` +
          `<a class="lnk" href="#about">${esc(home.story.link.label)}</a>`,
      ),
    ) +
    reviewBlock +
    section(
      'night',
      split(
        eyebrow(home.enquiry.eyebrow) +
          `<h2>${esc(home.enquiry.heading)}</h2>` +
          `<p class="muted">${esc(home.enquiry.body)}</p>`,
        callToAction(),
      ),
    )
  );
}

function pageWork() {
  // The real jobs, read from content/projects. Only completed facts are shown:
  // a location or a year that was never confirmed simply is not printed.
  const projects = loadProjects();

  const entries = projects
    .map((p) => {
      const meta = [p.type && TYPE_LABELS[p.type], p.location, p.year].filter(Boolean).join(' · ');
      const work = p.work.length
        ? `<h3 class="mt">What the job involved</h3>` +
          `<ol class="steps">${p.work
            .map(
              (w, i) =>
                `<li><span class="num">${String(i + 1).padStart(2, '0')}</span>` +
                `<div><p class="muted" style="margin-top:0">${esc(w)}</p></div></li>`,
            )
            .join('')}</ol>`
        : '';
      return (
        `<article class="job">` +
        `<hr class="rule"><p class="eb">${esc(meta)}</p>` +
        `<h2>${esc(p.title)}</h2>` +
        `<p class="lede">${esc(p.brief)}</p>` +
        work +
        `</article>`
      );
    })
    .join('');

  return (
    section(
      'night',
      eyebrow(workCopy.eyebrow) +
        `<h1>${esc(workCopy.heading)}</h1><p class="lede wide">${esc(workCopy.lede)}</p>`,
    ) +
    section('linen', `<div class="stack">${entries}</div>`) +
    section(
      'night',
      split(
        eyebrow('Arrange a visit') + `<h2>Want the same doing?</h2>`,
        callToAction(),
      ),
    )
  );
}

function pageKitchens() {
  const blocks = [kitchens.furniture, kitchens.colour, kitchens.cost]
    .map((b) =>
      split(eyebrow(b.eyebrow), `<h3 class="big">${esc(b.heading)}</h3><p class="muted">${esc(b.body)}</p>`),
    )
    .join('');

  return (
    section(
      'night',
      split(
        eyebrow(kitchens.eyebrow) + `<h1>${esc(kitchens.heading)}</h1>`,
        `<p class="lede">${esc(kitchens.lede)}</p>`,
      ),
    ) +
    section(
      'linen',
      split(
        eyebrow(kitchens.brushedNotSprayed.eyebrow),
        `<h2>${esc(kitchens.brushedNotSprayed.heading)}</h2>` +
          paras(kitchens.brushedNotSprayed.paragraphs),
      ),
    ) +
    section(
      'night',
      split(
        eyebrow(kitchens.process.eyebrow) +
          `<h2>${esc(kitchens.process.heading)}</h2>` +
          `<p class="muted">${esc(kitchens.process.intro)}</p>`,
        steps(kitchens.process.steps),
      ),
    ) +
    section('linen', `<div class="stack">${blocks}</div>`) +
    section('night', split(eyebrow('Arrange a visit') + `<h2>Have a look at your kitchen?</h2>`, callToAction()))
  );
}

function pageDecorating() {
  const services = decorating.services
    .map((s, i) =>
      section(
        i % 2 === 0 ? 'linen' : 'night',
        split(eyebrow(s.eyebrow), `<h2>${esc(s.heading)}</h2>` + paras(s.paragraphs)),
      ),
    )
    .join('');

  return (
    section(
      'night',
      split(
        eyebrow(decorating.eyebrow) + `<h1>${esc(decorating.heading)}</h1>`,
        `<p class="lede">${esc(decorating.lede)}</p>`,
      ),
    ) +
    services +
    section(
      'linen',
      split(
        eyebrow(decorating.how.eyebrow) + `<h2>${esc(decorating.how.heading)}</h2>`,
        `<ul class="list">${decorating.how.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
      ),
    ) +
    section('night', split(eyebrow('Arrange a visit') + `<h2>Come and look at it?</h2>`, callToAction()))
  );
}

function pageWorkshops() {
  // The price is printed in figures only when it has been confirmed — a stale
  // price is worse than no price.
  const price = workshop.confirmed
    ? `<div class="price"><dl>` +
      `<div><dt>By the hour</dt><dd>${workshop.currency}${workshop.hourly}</dd></div>` +
      `<div><dt>${workshop.block.hours} hours</dt><dd>${workshop.currency}${workshop.block.price}</dd></div>` +
      `</dl><hr class="rule"><p class="muted sm">${esc(workshop.travel)}</p></div>`
    : `<p class="muted">Ring for the current rate.</p>`;

  return (
    section(
      'night',
      split(
        eyebrow(workshops.eyebrow) + `<h1>${esc(workshops.heading)}</h1>`,
        `<p class="lede">${esc(workshops.lede)}</p>`,
      ),
    ) +
    section(
      'linen',
      split(eyebrow(workshops.who.eyebrow), `<h2>${esc(workshops.who.heading)}</h2>` + paras(workshops.who.paragraphs)),
    ) +
    section(
      'night',
      split(
        eyebrow(workshops.covers.eyebrow) +
          `<h2>${esc(workshops.covers.heading)}</h2>` +
          `<p class="muted">${esc(workshops.covers.intro)}</p>`,
        steps(workshops.covers.items),
      ),
    ) +
    section(
      'linen',
      split(
        eyebrow(workshops.practical.eyebrow) +
          `<ul class="list">${workshops.practical.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
        `<p class="eb">${esc(workshops.price.eyebrow)}</p><h2>${esc(workshops.price.heading)}</h2>${price}`,
      ),
    ) +
    section(
      'night',
      split(
        eyebrow(workshops.enquiry.eyebrow) +
          `<h2>${esc(workshops.enquiry.heading)}</h2><p class="muted">${esc(workshops.enquiry.body)}</p>`,
        callToAction(),
      ),
    )
  );
}

function pageAbout() {
  const sections = about.sections
    .map((s, i) => section(i % 2 === 0 ? 'linen' : 'night', split(eyebrow(s.heading), paras(s.paragraphs))))
    .join('');

  return (
    section(
      'night',
      split(
        eyebrow(about.eyebrow) +
          `<h1>${esc(about.heading)}</h1>` +
          `<p class="eb mt">${yearsTrading()} years on my own account · eight before that</p>`,
        `<p class="lede">${esc(about.lede)}</p>`,
      ),
    ) +
    sections +
    section(
      'linen',
      split(
        eyebrow(`Since ${FOUNDED}`),
        `<h2>${esc(about.closing.heading)}</h2><p class="lede">${esc(about.closing.body)}</p>` +
          `<p class="mt"><a class="lnk big-num" href="${phone.href}">${esc(phone.display)}</a></p>`,
      ),
    )
  );
}

function pageContact() {
  return (
    section(
      'night',
      split(eyebrow(contact.eyebrow) + `<h1>${esc(contact.heading)}</h1>`, `<p class="lede">${esc(contact.lede)}</p>`),
    ) +
    section(
      'linen',
      split(
        eyebrow('Ring me') +
          `<p><a class="big-num" href="${phone.href}">${esc(phone.display)}</a></p>` +
          `<p class="muted sm">${esc(contact.phoneNote)}</p>` +
          `<hr class="rule mt"><p class="eb">Where I work</p><p>${esc(contact.areaNote)}</p>`,
        enquiryForm(),
      ),
    )
  );
}

/** Phone first. In a file with no server behind it, the number is the CTA. */
function callToAction() {
  return (
    `<p class="eb">Ring me</p>` +
    `<p><a class="big-num" href="${phone.href}">${esc(phone.display)}</a></p>` +
    `<p class="muted sm">${esc(contact.phoneNote)}</p>`
  );
}

/**
 * The enquiry form, kept so a website builder can see the intended fields.
 * It cannot post anywhere from a static file, so submitting it says so plainly
 * rather than pretending to have sent something.
 */
function enquiryForm() {
  const field = (id, label, type = 'text') =>
    `<p><label class="eb" for="${id}">${esc(label)}</label><input id="${id}" name="${id}" type="${type}"></p>`;

  return (
    `<p class="eb">${esc(contact.form.eyebrow)}</p><h2>${esc(contact.form.heading)}</h2>` +
    `<!-- The fields Neil wants. Wire this to an email service when you rebuild it. -->` +
    `<form id="enq" class="form">` +
    field('name', 'Your name') +
    field('phone', 'Phone', 'tel') +
    field('email', 'Email', 'email') +
    `<p><label class="eb" for="job">What is the job?</label><textarea id="job" name="job" rows="5"></textarea></p>` +
    `<p class="muted sm">${esc(contact.photosNote)}</p>` +
    `<p><button type="submit" class="lnk">Send it</button></p>` +
    `<p id="enqmsg" class="eb" hidden></p>` +
    `</form>`
  );
}

/* -------------------------------------------------------------------- css - */

const CSS = `
:root{--night:#101518;--linen:#F4EFE8;--brass:#A9822F;--brass-ink:#7A5C1E;--slate:#2A363E;--muted:#9BA3A6;--muted-ink:#5A6469;
--gut:clamp(1.5rem,5vw,6rem);--sec:clamp(4.5rem,10vh,8rem)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--night);color:var(--linen);font:400 1.125rem/1.7 "Newsreader",Georgia,serif}
h1,h2,h3{font-family:"Fraunces",Georgia,serif;font-weight:300;line-height:1.05;letter-spacing:-.015em;text-wrap:balance;margin:0}
h1{font-size:clamp(2.25rem,4.6vw,4rem);margin:1.25rem 0 0;max-width:20ch}
.hero h1{font-size:clamp(2.5rem,7vw,5.5rem);max-width:17ch}
h2{font-size:clamp(1.9rem,4.2vw,3rem)}
h3.big{font-size:clamp(1.4rem,2.6vw,2rem)}
h3{font-size:clamp(1.15rem,2.2vw,1.45rem)}
p{margin:0 0 1.25rem}
a{color:inherit}
.s{padding:var(--sec) var(--gut);background:var(--night);color:var(--linen)}
.s.linen{background:var(--linen);color:var(--night);--brass:var(--brass-ink);--muted:var(--muted-ink)}
.hero{padding-top:clamp(5rem,12vh,9rem)}
.wrap{max-width:100rem;margin:0 auto}
.rule{border:0;border-top:1px solid var(--brass);opacity:.55;max-width:6rem;margin:0}
.eb{font-size:.75rem;letter-spacing:.18em;font-variant-caps:all-small-caps;color:var(--brass);margin:1.25rem 0 0}
.mt{margin-top:2rem}
.sm{font-size:.95rem}
.lede{font-size:1.125rem;max-width:64ch;margin:1.5rem 0 0}
.lede+.lede{margin-top:1.25rem}
.wide{max-width:56ch}
.muted{color:var(--muted);max-width:60ch;margin:1.25rem 0 0}
.grid{display:grid;gap:2rem}
.stack{display:flex;flex-direction:column;gap:4rem;margin-top:3rem}
.row{align-items:start}
h2+.lede,h1+.lede{margin-top:1.75rem}
.lnk{display:inline-block;margin-top:1.75rem;font-size:.75rem;letter-spacing:.18em;font-variant-caps:all-small-caps;
color:var(--brass);text-decoration:none;border-bottom:1px solid var(--brass);padding-bottom:.2rem;background:none;border-left:0;border-right:0;border-top:0;cursor:pointer;font-family:inherit}
.big-num{font-family:"Fraunces",Georgia,serif;font-size:clamp(1.6rem,3.5vw,2.25rem);font-weight:300;text-decoration:none;
border-bottom:1px solid var(--brass);font-variant-numeric:tabular-nums}
.steps{list-style:none;margin:0;padding:0}
.steps li{display:flex;gap:1.5rem;border-top:1px solid currentColor;padding:1.75rem 0;opacity:1}
.steps li{border-color:color-mix(in oklab,currentColor 18%,transparent)}
.steps li:first-child{border-top:0;padding-top:0}
.num{font-size:.75rem;letter-spacing:.18em;color:var(--brass);font-variant-numeric:tabular-nums;padding-top:.35rem}
.list{list-style:none;margin:0;padding:0}
.list li{border-top:1px solid color-mix(in oklab,currentColor 18%,transparent);padding:1.1rem 0;max-width:56ch}
.list li:first-child{border-top:0;padding-top:0}
.quotes{display:grid;gap:3rem;margin-top:3rem}
.quotes figure{margin:0}
blockquote{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:1.5rem;line-height:1.3;margin:0}
.price{border:1px solid currentColor;padding:2rem;margin-top:1.5rem}
.price dl{margin:0}
.price dl>div{display:flex;justify-content:space-between;align-items:baseline;gap:2rem;padding:1rem 0;
border-bottom:1px solid color-mix(in oklab,currentColor 18%,transparent)}
.price dl>div:last-child{border-bottom:0}
.price dt{font-size:1.05rem}
.price dd{margin:0;font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:clamp(1.9rem,5vw,2.75rem);
font-variant-numeric:tabular-nums}
.form{margin-top:2rem;max-width:40rem}
.form label{display:block;margin-bottom:.5rem}
.form input,.form textarea{width:100%;padding:.75rem 1rem;background:transparent;color:inherit;
border:1px solid color-mix(in oklab,currentColor 30%,transparent);border-radius:0;font:inherit;font-size:1rem}
.form input:focus,.form textarea:focus{outline:1px solid var(--brass);outline-offset:2px}
header{position:sticky;top:0;z-index:40;background:var(--night);border-bottom:1px solid color-mix(in oklab,var(--brass) 55%,transparent)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:2rem;height:4rem;padding:0 var(--gut);max-width:100rem;margin:0 auto}
.brand{font-family:"Fraunces",Georgia,serif;font-size:1.05rem;text-decoration:none;white-space:nowrap}
nav.main{display:none;gap:2rem}
.eb-link,nav.main a{font-size:.75rem;letter-spacing:.18em;font-variant-caps:all-small-caps;color:inherit;text-decoration:none}
header .eb-link,header nav.main a{color:var(--linen)}
nav.main a[aria-current]{color:var(--brass)}
.bar .right{display:none;gap:2rem;align-items:center}
.burger{display:block;background:none;border:0;color:var(--linen);font:inherit;font-size:.75rem;
letter-spacing:.18em;font-variant-caps:all-small-caps;cursor:pointer}
#menu{position:fixed;inset:0;z-index:50;background:var(--night);padding:6rem var(--gut) 3rem;
display:flex;flex-direction:column;justify-content:space-between;transition:opacity .3s}
#menu[hidden]{display:none}
#menu a.mi{font-family:"Fraunces",Georgia,serif;font-weight:300;font-size:clamp(2rem,9vw,3rem);
text-decoration:none;display:block;margin-bottom:1.5rem}
footer{padding:4rem var(--gut) 3rem;border-top:1px solid color-mix(in oklab,var(--brass) 55%,transparent)}
.fcols{display:flex;flex-direction:column;gap:3rem;max-width:100rem;margin:0 auto}
@media(min-width:1024px){
.grid{grid-template-columns:repeat(12,1fr);column-gap:var(--gut)}
.c4{grid-column:1/span 4}.c5{grid-column:1/span 5}.c6{grid-column:7/span 6}.c7{grid-column:6/span 7}
nav.main{display:flex}.bar .right{display:flex}.burger{display:none}
.quotes{grid-template-columns:repeat(2,1fr);gap:4rem}
.fcols{flex-direction:row;justify-content:space-between}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
`;

/* ------------------------------------------------------------------- build - */

const PAGES = [
  { id: 'home', label: 'Home', title: home.meta.title, desc: home.meta.description, html: pageHome() },
  { id: 'work', label: 'Work', title: workCopy.meta.title, desc: workCopy.meta.description, html: pageWork() },
  {
    id: 'hand-painted-kitchens',
    label: 'Hand-painted kitchens',
    title: kitchens.meta.title,
    desc: kitchens.meta.description,
    html: pageKitchens(),
  },
  {
    id: 'decorating',
    label: 'Decorating',
    title: decorating.meta.title,
    desc: decorating.meta.description,
    html: pageDecorating(),
  },
  {
    id: 'workshops',
    label: 'Workshops',
    title: workshops.meta.title,
    desc: workshops.meta.description,
    html: pageWorkshops(),
  },
  { id: 'about', label: 'About', title: about.meta.title, desc: about.meta.description, html: pageAbout() },
  { id: 'contact', label: 'Arrange a visit', title: contact.meta.title, desc: contact.meta.description, html: pageContact() },
];

const NAVLINKS = nav.map((n) => ({ id: n.href.slice(1), label: n.label }));

const schema = {
  '@context': 'https://schema.org',
  '@type': 'HousePainter',
  name: site.name,
  url: site.url,
  telephone: phone.e164,
  description:
    'Decorator in Chester specialising in hand-painted kitchens and furniture, alongside interior and exterior decorating, wallpapering and exterior woodwork repair.',
  foundingDate: site.foundingDate,
  founder: { '@type': 'Person', name: site.name },
  areaServed: site.areaServed.map((n) => ({ '@type': 'AdministrativeArea', name: n })),
  address: { '@type': 'PostalAddress', addressLocality: 'Chester', addressRegion: 'Cheshire', addressCountry: 'GB' },
};

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(home.meta.title)}</title>
<meta name="description" content="${esc(home.meta.description)}">
<meta name="google-site-verification" content="${site.googleSiteVerification}">
<meta property="og:title" content="${esc(home.meta.title)}">
<meta property="og:description" content="${esc(home.meta.description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_GB">
<meta name="theme-color" content="#101518">
<link rel="canonical" href="${site.url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
<header>
  <div class="bar">
    <a class="brand" href="#home">${esc(site.name)}</a>
    <nav class="main">${NAVLINKS.map((n) => `<a href="#${n.id}" data-nav="${n.id}">${esc(n.label)}</a>`).join('')}</nav>
    <div class="right">
      <a class="eb-link" href="#contact" style="border-bottom:1px solid var(--brass);padding-bottom:.2rem">${esc(cta.label)}</a>
      <a class="eb-link" href="${phone.href}" style="font-variant-numeric:tabular-nums">${esc(phone.display)}</a>
    </div>
    <button class="burger" id="burger" aria-expanded="false" aria-controls="menu">Menu</button>
  </div>
</header>

<div id="menu" hidden role="dialog" aria-modal="true" aria-label="Menu">
  <nav>${NAVLINKS.map((n) => `<a class="mi" href="#${n.id}">${esc(n.label)}</a>`).join('')}</nav>
  <div>
    <hr class="rule" style="max-width:100%">
    <p><a class="eb-link" href="#contact" style="border-bottom:1px solid var(--brass);padding-bottom:.2rem">${esc(cta.label)}</a></p>
    <p><a class="big-num" href="${phone.href}">${esc(phone.display)}</a></p>
  </div>
</div>

<main id="main">
${PAGES.map((p) => `<div class="page" id="${p.id}" data-title="${esc(p.title)}" data-desc="${esc(p.desc)}" hidden>${p.html}</div>`).join('\n')}
</main>

<footer>
  <div class="fcols">
    <div style="max-width:34ch">
      <p style="font-family:Fraunces,Georgia,serif;font-size:1.5rem;margin:0">${esc(site.name)}</p>
      <p class="muted sm" style="margin-top:1rem">Decorator in Chester. Hand-painted kitchens and furniture, and decorating inside and out across Cheshire. Trading on my own account since ${FOUNDED}.</p>
    </div>
    <nav>${NAVLINKS.concat([{ id: 'contact', label: cta.label }])
      .map((n) => `<a class="eb-link" href="#${n.id}" style="display:block;margin-bottom:.75rem">${esc(n.label)}</a>`)
      .join('')}</nav>
    <div>
      <p class="eb" style="margin-top:0">Ring me</p>
      <p><a class="big-num" href="${phone.href}">${esc(phone.display)}</a></p>
      <p class="muted sm">Chester and across Cheshire.</p>
    </div>
  </div>
  <hr class="rule" style="max-width:100%;margin-top:3rem">
  <p class="eb">© ${esc(site.name)}</p>
</footer>

<script>
(function(){
  var pages=[].slice.call(document.querySelectorAll('.page'));
  var menu=document.getElementById('menu'),burger=document.getElementById('burger');
  function show(id){
    var found=false;
    pages.forEach(function(p){
      var on=p.id===id;
      p.hidden=!on;
      if(on){found=true;document.title=p.dataset.title;
        var d=document.querySelector('meta[name=description]');if(d)d.setAttribute('content',p.dataset.desc);}
    });
    if(!found){pages[0].hidden=false;}
    document.querySelectorAll('[data-nav]').forEach(function(a){
      if(a.dataset.nav===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    close();window.scrollTo(0,0);
  }
  function route(){show((location.hash||'#home').slice(1));}
  function close(){menu.hidden=true;burger.setAttribute('aria-expanded','false');burger.textContent='Menu';document.body.style.overflow='';}
  burger.addEventListener('click',function(){
    var open=menu.hidden;menu.hidden=!open;burger.setAttribute('aria-expanded',String(open));
    burger.textContent=open?'Close':'Menu';document.body.style.overflow=open?'hidden':'';
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  window.addEventListener('hashchange',route);
  var f=document.getElementById('enq');
  if(f)f.addEventListener('submit',function(e){
    e.preventDefault();
    var m=document.getElementById('enqmsg');
    m.hidden=false;
    m.textContent='This form is not connected to an inbox yet — please ring ${phone.display} and I will pick it up.';
  });
  route();
})();
</script>
</body>
</html>
`;

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'neilbrookfield.html');
fs.writeFileSync(outFile, html);

console.log(`Wrote ${path.relative(root, outFile)}`);
console.log(`${(Buffer.byteLength(html) / 1024).toFixed(1)} KB · ${PAGES.length} pages · one file, no build step`);
