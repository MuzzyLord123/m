# The Paint Men — start here

The whole site is in this folder. Nothing else is needed.

## Put it online (about ten minutes)

1. Go to **vercel.com/new** and drag this folder onto the page.
   (Or, from inside the folder: `npm install` then `npx vercel`.)
2. When it has built, open **Settings → Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `RESEND_API_KEY` | from resend.com — free, needed for the forms to send |
   | `LEAD_TO_EMAIL` | `jamesdevonshireyoung@btinternet.com` |
   | `NEXT_PUBLIC_SITE_URL` | the final web address, e.g. `https://thepaintmen.com` |

3. Redeploy. That is it — the site is live.

Everything else about James is already in the site: the phone number, ten
years, based on the Wirral, covering Merseyside, Cheshire and North Wales, the
map, the six trades, and all 38 photographs.

## Check it before you launch

From inside the folder:

```bash
npm install
npm run build
npx next start -p 3100 &

npm run audit:content     # nothing unfinished is showing to a customer
npm run audit:images      # every photograph loads and is real
npm run audit:interaction # menus, gallery, quote form all work
npm run audit:contrast    # every colour pair is readable
```

`audit:content` is the important one. It fails if anything is still a
placeholder, so it cannot go live half finished.

## Three things to add when you have them

**1. Facebook.** Set `NEXT_PUBLIC_FACEBOOK_URL` to the page address. Until then
the Facebook links simply do not appear — better than a link going nowhere.

**2. Videos.** Open `src/data/films.ts` and paste one block per film (the format
is written in the file). The video gallery is already built — desktop and
mobile — and appears the moment there is a film in there.

**3. Customer reviews.** Open `src/data/testimonials.ts`. It ships **empty on
purpose**: the examples in it are invented, and publishing invented reviews as
real is against the law in the UK. Ask a few customers if you can quote them,
put the real ones in, and that section appears.

## The logo

The file that came through is a picture of the logo on a dark background, not a
logo file, so the header currently draws the lockup instead. If you can get a
**transparent PNG or SVG** from whoever designed it, it drops straight in —
`src/components/brand/Wordmark.tsx` says exactly where.

## Where things live

| I want to change… | Open… |
| --- | --- |
| Phone, email, area, opening hours | `src/config/site.ts` |
| The gallery — projects, photos, descriptions | `src/data/projects.ts` |
| The six trades and their FAQs | `src/data/services.ts` |
| Videos | `src/data/films.ts` |
| Customer reviews | `src/data/testimonials.ts` |
| The Instagram-style strip on the home page | `src/data/social.ts` |
| Blog posts | `src/content/blog/` |
| The photographs themselves | `public/work/` — see `PHOTO-MAP.md` |

`README.md` has the full technical detail. `PHOTO-MAP.md` says which photograph
is where and how to swap one out.
