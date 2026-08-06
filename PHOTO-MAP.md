# Where your photographs go

## The logo (read this first)

The site header now DRAWS the lockup — the brush gesture as inline SVG and the
words set in the site's own display face — rather than loading an image. The
PNG stand-ins were worse than nothing on a black ground: the "white" one
averaged mid-grey, so "PAINTING SERVICES" sank into the header and the mark
shipped with half its words missing. See `src/components/brand/Wordmark.tsx`;
swapping in a real file is a one-line change.

The site header uses a clean recreation of your mark. Your original file is
saved at `public/brand/logo-source.jpg` so it is not lost — but it is a
**mockup render on a dark textured plate**, not a logo asset, and there is no
way to lift the artwork off that plate without dragging the texture and the
drop shadows with it. I tried; it looks like a smudge on paper.

What I need is a **transparent PNG or SVG export** from whoever made it. Two
files:

| File | Used on |
| --- | --- |
| `public/brand/logo.png` | Paper backgrounds — desktop bar, mobile bar |
| `public/brand/logo-white.png` | The flooded accent menu and any dark ground |

Export both with a **transparent background** and an aspect **no wider than
about 4:1**. A wider lockup has to be set so small to fit the header that the
words stop being readable — that is why the first pass at this had to be
resized. SVG is better than PNG; change the extension in
`src/components/brand/Wordmark.tsx` and it works as-is.

The white version matters: the mobile menu floods orange, and the full-colour
mark disappears into it.

## Name and colour

Your logo says **THEPAINTMEN.COM**, plural, in orange. The site had been built
as "The Paint Man" in blue, per the original brief. The logo wins, so:

- `site.name` is now **The Paint Men**. If the trading name is actually
  singular, change it in `src/config/site.ts` and it propagates everywhere.
- The accent is now your orange. It is set as **two weights on purpose**: the
  bright logo orange only reaches ~3:1 against white, so white text on it fails
  accessibility. `--color-accent` is a deeper working orange (5.4:1 with white)
  that carries every button, link and focus ring; `--color-accent-bright` is the
  logo orange, reserved for graphics nothing has to be read against — the brush
  strokes, the drip, the scroll bar, the chat blob.


## Your photographs are in

All **38 photographs are placed and live on the site** — recovered from this
conversation, cropped to each slot's aspect ratio and written to the filenames
below. There are no stand-ins left anywhere.

`npm run audit:images` proves it, and it is worth running after any change that
touches `public/`. It walks every route at phone and desktop width, opens all
eleven projects, and asserts three things per file: the request returned 2xx,
the browser decoded it, and the pixels are a real photograph rather than a flat
colour. That last check is the one that matters — a stand-in loads perfectly
and passes the first two, which is exactly how a site can look finished while
showing forty grey rectangles. Current result: **47 of 47**.

The extra nine beyond your 38 are second crops of the strongest frames — the
hero, the about portrait, the video poster and six square social cards — so no
photograph is stretched into a shape it was not shot for.

### Replacing one

Drop a new file over the old path and rebuild. Then re-sample the blur-up
colour, or the placeholder will be the wrong shade for a beat before the
photograph arrives:

```bash
cp ~/photos/new-kitchen.jpg public/work/kitchen-extension-01.jpg
npm run build && npm run audit:images
```

## The map

Ratios are what the site expects. If your original is a different shape it will
still work — it is cropped from the centre — but a photograph matching the ratio
loses nothing.

### Kitchen extension (batch 1)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Finished kitchen/diner, dark units, mustard stools, sliders right | `work/kitchen-extension-01.jpg` | 3:4 |
| Same room reversed — teal sofa, TV, vaulted ceiling, uplighters | `work/kitchen-extension-02.jpg` | 3:4 |
| Extension shell, sliders fitted, bare floor | `work/kitchen-extension-03.jpg` | 4:3 |
| Bare plaster, old pine door, dust sheets down | `work/kitchen-extension-04.jpg` | 3:4 |
| Earliest shot — bare pink plaster, sliders in, garden beyond (batch 8) | `work/kitchen-extension-05.jpg` | 4:3 |
| Finished room from the far end, kitchen and seating together (batch 8) | `work/kitchen-extension-06.jpg` | 4:3 |

The last two are the **before/after pair** — 04 slides to 02.

### Open-plan kitchen (batch 7)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Vaulted kitchen with roof light, grey gloss units and bifolds | `work/open-plan-kitchen-01.jpg` | 4:3 |

A second extension, separate from batch 1's — different house, bifolds rather
than sliders. Send more angles of this one and it becomes a full project.

### Alcove shelving (batch 2)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Finished alcoves, grey-green, either side of the chimney breast | `work/alcove-joinery-01.jpg` | 4:3 |
| Same alcoves in bare timber and ply, pink plaster breast | `work/alcove-joinery-02.jpg` | 4:3 |

**Before/after pair.**

### New staircase (batch 2 + 3)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Finished hallway, white stairs, oak floor, front door beyond | `work/new-staircase-01.jpg` | 3:4 |
| The staircase in bare pine, ceiling not yet made good | `work/new-staircase-02.jpg` | 3:4 |
| Mid-decoration — balustrade painted, treads still bare | `work/new-staircase-03.jpg` | 3:4 |

**Before/after pair** on 02 → 01. See the query below about 03.

### Landing balustrade (batch 3)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Balustrade finished in near-black, striped carpet | `work/landing-balustrade-01.jpg` | 3:4 |
| Same balustrade in bare pine against the old white newel | `work/landing-balustrade-02.jpg` | 3:4 |

**Before/after pair.** The tightest of the four — same corner, same carpet.

### Panelled hallway (batch 3)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Entrance — panelling, round mirror, black console, herringbone | `work/panelled-hallway-01.jpg` | 3:4 |
| Stairs with grey runner and black pipe handrail | `work/panelled-hallway-02.jpg` | 3:4 |
| Looking down to the black front door, vertical radiator, herringbone (batch 6) | `work/panelled-hallway-03.jpg` | 3:4 |

### Staircases in colour (batch 5)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Mid-grey balustrade and understairs cupboards, grey carpet | `work/stairs-colour-01.jpg` | 3:4 |
| Near-black balustrade, two flights | `work/stairs-colour-02.jpg` | 3:4 |
| White balustrade over grey-green panelled understairs | `work/stairs-colour-03.jpg` | 3:4 |
| The near-black balustrade over two levels, cream walls (batch 6) | `work/stairs-colour-04.jpg` | 3:4 |
| Balustrade finished in white, treads stripped back and waiting (batch 7) | `work/stairs-colour-05.jpg` | 3:4 |

### Halls, stairs and landings (batches 1 + 4)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Warm grey hallway, oak floor, framed photographs | `work/halls-01.jpg` | 3:4 |
| Dark stained floor, striped runner, gallery wall | `work/halls-02.jpg` | 3:4 |
| Olive hallway, white balustrade, view to the kitchen | `work/halls-03.jpg` | 3:4 |
| Hallway mid-build — bare timber stairs, green panelling, stained-glass door (batch 6) | `work/halls-04.jpg` | 4:3 |
| Cream spindles, panelled understairs, oak console and lamp (batch 7) | `work/halls-05.jpg` | 4:3 |
| Panelled dado, dark wood floor, arch to the front door (batch 7) | `work/halls-06.jpg` | 3:4 |
| All-white hallway with painted floorboards (batch 7) | `work/halls-07.jpg` | 3:4 |

### Exteriors (batches 4 + 5)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Semi, black bargeboards, teal door, new fence | `work/exterior-01.jpg` | 3:4 |
| Rendered frontage, black bays, sunny | `work/exterior-02.jpg` | 4:3 |
| White render, black bays, arched porch | `work/exterior-03.jpg` | 4:3 |
| Bay window detail, surrounds and sills cut in black (batch 6) | `work/exterior-04.jpg` | 3:4 |
| Rendered bungalow, black fascias, soffits and garage doors (batch 6) | `work/exterior-05.jpg` | 4:3 |

### Commercial (batch 8)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Commercial unit mid-decoration, suspended ceiling and screed floor | `work/commercial-01.jpg` | 4:3 |

This one brought the **Commercial filter back**. It had been removed because
nothing evidenced it. Send two or three more and it becomes a proper project
rather than a single photograph.

### Feature walls (batches 2, 4, 5)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Ochre wall, framed print, dining table | `work/feature-01.jpg` | 3:4 |
| Near-black wall going on between oak doors | `work/feature-02.jpg` | 4:3 |
| Lime green kitchen wall, cream gloss units | `work/feature-03.jpg` | 3:4 |

### The three that carry the most weight

| Where | Filename | Ratio | Suggestion |
| --- | --- | --- | --- |
| Home page hero | `work/hero.jpg` | 3:2 | The finished kitchen extension — it is the strongest thing you sent |
| About page portrait | `work/about-portrait.jpg` | 4:5 | You on site, if you have one. Otherwise the panelled hallway |
| Video poster | *(removed)* | 16:9 | The about page carried a stock third-party film with a note-to-the-developer as its caption. Both are gone. Send a film and the `VideoFacade` component is still there, still click-to-load |

### Social cards

`social/post-1.jpg` to `post-6.jpg`, all **1:1**. Captions are in
`src/data/social.ts` and describe work in progress — rewrite them to match
whichever photographs you use, and set the `permalink` on each to the real
Instagram or Facebook post.

## Two things I need from you

1. **Are the staircase photographs the same job?** The bare-pine staircase, the
   mid-decoration shot and the finished white hallway are grouped as one
   project. If the mid-decoration one is a different house, say so and I will
   split it — I would rather ask than publish a job that mixes two properties.

2. **Which town is each job in?** Every `area` in `src/data/projects.ts` is
   `{{TOWN}}` or `{{SERVICE_AREA}}`. Real town names are worth a great deal for
   local search, and they are the first thing a customer looks for.

## Still placeholders

`src/config/site.ts` holds `{{PHONE}}`, `{{EMAIL}}`, `{{TOWN}}`,
`{{SERVICE_AREA}}`, `{{YEARS}}`, `{{INSTAGRAM_URL}}`, `{{FACEBOOK_URL}}` and
`{{MAP_ADDRESS}}`. Fill those in and they propagate everywhere, including the
blog posts and the structured data.

The testimonials in `src/data/testimonials.ts` are written examples, not real
customers. **Replace them with genuine ones before the site goes live.**

One other thing the site describes but no photograph shows: **wallpapering**.
It has a full section on the services page, and the
gallery deliberately has no filter for it — an empty filter is worse than an
absent one. Send a papered room and I will add the category back, exactly as
commercial came back in batch 8.

**One duplicate:** the all-white hallway with painted floorboards arrived in
both batch 7 and batch 8. It is mapped once, at `work/halls-07.jpg`.
