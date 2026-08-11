<!--
  GENERATED FILE — do not edit by hand.
  Written by scripts/check-content.mjs from content/needed.json.
  Run: npm run check:content
-->

# What Neil needs to tell us

Everything on this list is something the rebuild deliberately did not invent. Where an answer is
missing the site shows a labelled frame rather than a guess, and `npm run check:launch` fails while
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

## Ask first

### Can we go through your photographs and group them into eight to twelve jobs? For each one: where it was, roughly what year, what the customer wanted, and what you actually did — starting with the preparation.

The single biggest fix in the rebuild. The old portfolio was around a hundred untitled images in no order, several of them duplicated. Named jobs with a location and a colour list are what somebody comparing decorators is actually looking for.

*Answer goes in:* `content/projects/*.mdx — one file per job, copied from _TEMPLATE.mdx`  
*Blocks launch:* no

### For each kitchen, which paints did you use — make, colour name and finish? If you cannot remember exactly, say so and we will leave it off.

Colours render as a specimen strip under each job. In front of this audience a wrong paint name is worse than no paint name, so unconfirmed colours are omitted rather than guessed.

*Answer goes in:* `content/projects/*.mdx → colours[]`  
*Blocks launch:* no

### We need your photographs out of the Wix media manager at full size — the originals, not the copies the website serves.

The site currently carries no photographs at all. It stands up as a typographic site, but this is a decorator: the pictures are the argument.

*Answer goes in:* `public/photographs/<project-slug>/ — see README.md`  
*Blocks launch:* no

### Read the site through and tell me anything that is not how you actually work — the order you do a kitchen in, what you say about preparation, anything that does not sound like you.

Every word is written in Neil's first person. The method described is standard practice for the work, but it is put in his mouth, and it should be his before it goes live.

*Answer goes in:* `content/copy/*.ts`  
*Blocks launch:* no

## Ask next

### Can you send the Google reviews from Janet Leclercq, Andrew Waugh and Stella Steele — the full text, copied exactly?

The reviews section is left off the site entirely until the exact wording arrives. It is not reproduced from memory, and a paraphrased review is a fabricated one.

*Answer goes in:* `content/reviews.ts → quote`  
*Blocks launch:* no

### What is the link to your Google Business Profile?

The reviews link out to the profile so a customer can check them, and it goes in the structured data. On the old site all three credits pointed at the same contributor, so two of the three linked to the wrong person.

*Answer goes in:* `content/reviews.ts → googleProfileUrl`  
*Blocks launch:* no

### How far do you travel, and which villages do you work in most? Anywhere you would rather not go?

The site says Chester and Cheshire and nothing more specific, because naming a village Neil does not cover would be worse than naming none at all.

*Answer goes in:* `content/site.ts → areaServed, and content/copy/contact.ts → areaNote`  
*Blocks launch:* no

### Do you want an email address on the site, and which one?

There is no email address anywhere on the old site, so none is published here.

*Answer goes in:* `content/site.ts and content/copy/contact.ts`  
*Blocks launch:* no

## Worth asking while you have him

### What hours are you happy to be rung on?

No opening hours are published anywhere on the old site, so none are claimed here.

*Answer goes in:* `content/copy/contact.ts`  
*Blocks launch:* no

### Are you insured, and do you belong to any trade body or hold any qualifications you would want mentioned?

Nothing is claimed on the old site, so nothing is claimed here. If any of it exists it is worth saying plainly.

*Answer goes in:* `content/copy/about.ts`  
*Blocks launch:* no

### Do you have Facebook or Instagram pages you keep up to date?

They go in the structured data as sameAs links, which helps Google connect the site to the Business Profile.

*Answer goes in:* `src/lib/schema.ts → sameAs()`  
*Blocks launch:* no

## Jobs written up so far

- `exterior-repaint-window-repair` — status `from-review`, still needs: location, year, colours, 3 photograph(s)

Target is eight to twelve. Copy `content/projects/_TEMPLATE.mdx` for each one.

## Photographs

Export them from the **Wix media manager at original resolution** — not by saving the images off the
live site, which serves cropped, resized and re-encoded copies. Full-resolution originals are the
entire point of a photography-led site.

Each photograph needs one line of alt text describing the work shown. Roughly a hundred images means
roughly a hundred lines; the build refuses any image whose alt text is missing or reads like
`image1`.
