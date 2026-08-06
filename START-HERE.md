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

### If you get a white "404: NOT_FOUND" page

That is **Vercel's** error page, not the site's — the site's own 404 is black
with an orange button. It means Vercel could not find the app, and there is
only ever one reason: it is looking at the wrong folder.

Vercel needs to see `package.json` at the top level of what you give it. So:

- Drag the **`thepaintmen-website` folder itself** — the one that has
  `package.json`, `src` and `public` directly inside it. Not the folder that
  *contains* it, and not the .zip.
- Already deployed and getting the 404? You do not have to start again. Go to
  **Settings → Build and Deployment → Root Directory**, set it to
  `thepaintmen-website`, save, and redeploy.

You can tell it worked before you even open the site: the deployment log should
show `Installing dependencies` and `Creating an optimized production build`. If
it finishes in a couple of seconds without those lines, it never found the app.

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

## The logo, favicon and share image

All three now use James's real logo, lifted off the dark plate it was sent on.

- **Header and menu** — the full-colour mark, with a near-black version for the
  orange menu, where orange-on-orange would vanish.
- **Favicon** — his brush stroke on the brand orange. Orange rather than black
  on purpose: at 16px in a browser tab, what makes an icon findable is contrast
  against the surrounding chrome, and a near-black tile disappears into a dark
  title bar.
- **Share image** — what appears on WhatsApp, Instagram, Snapchat, Facebook and
  in a text. His logo, the headline, the phone number and a finished kitchen
  behind it.

One honest limitation: the brush *handle* in the original is a dark grey object
sitting on an almost identically dark plate, so it could not be fully separated
and reads thinner than the original. At the size the logo actually renders you
cannot see it. If a **transparent PNG or SVG** ever comes from the designer,
drop it over `public/brand/logo.png` and re-run `node scripts/make-og-bg.mjs` —
nothing else changes.

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
