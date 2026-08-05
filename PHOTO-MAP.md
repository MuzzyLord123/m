# Where your photographs go

The site is built around the 30 photographs you sent. Every one has a place
reserved for it at a known filename, aspect ratio and blur tone.

Right now each of those paths holds a **stand-in** — a flat JPEG in the colour
sampled from your photograph, at the same aspect ratio. That is why the site
already looks right: the layout, the crops and the colour rhythm are real, only
the photographs are not.

## What to do

Drop your photographs into `public/work/` and `public/social/` using the
filenames below, replacing the stand-ins. Nothing else to change — no code, no
re-cropping, no rebuilding of the data file.

```bash
# from the project folder
cp ~/photos/kitchen-after-1.jpg public/work/kitchen-extension-01.jpg
# …and so on, then:
npm run build
```

`scripts/generate-placeholders.mjs` never overwrites a file that already exists,
so once your photograph is in place it stays.

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

The last two are the **before/after pair** — 04 slides to 02.

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

### Halls, stairs and landings (batches 1 + 4)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Warm grey hallway, oak floor, framed photographs | `work/halls-01.jpg` | 3:4 |
| Dark stained floor, striped runner, gallery wall | `work/halls-02.jpg` | 3:4 |
| Olive hallway, white balustrade, view to the kitchen | `work/halls-03.jpg` | 3:4 |
| Hallway mid-build — bare timber stairs, green panelling, stained-glass door (batch 6) | `work/halls-04.jpg` | 4:3 |

### Exteriors (batches 4 + 5)

| Your photograph | Filename | Ratio |
| --- | --- | --- |
| Semi, black bargeboards, teal door, new fence | `work/exterior-01.jpg` | 3:4 |
| Rendered frontage, black bays, sunny | `work/exterior-02.jpg` | 4:3 |
| White render, black bays, arched porch | `work/exterior-03.jpg` | 4:3 |
| Bay window detail, surrounds and sills cut in black (batch 6) | `work/exterior-04.jpg` | 3:4 |
| Rendered bungalow, black fascias, soffits and garage doors (batch 6) | `work/exterior-05.jpg` | 4:3 |

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
| Video poster | `work/video-poster.jpg` | 16:9 | Only used if you add a video |

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

Two other things the site describes but no photograph shows: **wallpapering**
and **commercial** work. Both have full sections on the services page, and the
gallery deliberately has no filter for them — an empty filter is worse than an
absent one. Send photographs of either and I will add the category back.
