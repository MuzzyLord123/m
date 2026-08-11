# Hosting this site

This folder is the whole website: plain HTML, CSS, JavaScript and fonts. There
is nothing to install, no database and no build step. Upload it and it works.

## Putting it up

**Netlify or Cloudflare Pages** — drag this folder onto the deploy page. The
`_headers` file in here is picked up automatically. Done.

**Shared hosting / cPanel** — upload everything in this folder into
`public_html` (or whatever the web root is called). The `.htaccess` file is
already in here; make sure your FTP client is showing hidden files, because it
starts with a dot and clients hide those by default.

**Anywhere else** — it is a static site. Point the web root at this folder.

Whichever you use, two things to check:

- **https**, with the plain `http://` address redirecting to it. Every host does
  this for free now.
- **Compression on.** Netlify and Cloudflare do it automatically; the
  `.htaccess` in here switches it on for Apache. It matters more than it
  sounds: serving this site uncompressed over a phone connection costs eleven
  Lighthouse points, measured — 86 instead of 97.

## After it is live

1. Point the domain at it.
2. Add the web address to Andy's Yell listing — free, and it is the one page
   already sending him work.
3. Add it to his Google Business Profile.

## Two things this bundle cannot do

**The enquiry form is not in it.** A static site has no server to receive a form
submission, so the contact section shows Andy's phone number instead. That is
also what it does on the full version right now, because he has no email address
set up yet — so nothing is missing today. But if he later wants a working form,
the site has to move to a host that runs Node (Vercel and Netlify both do this
for free), and be rebuilt with `npm run build` rather than `npm run build:static`.

**Security headers depend on the host.** `_headers` covers Netlify and
Cloudflare Pages; `.htaccess` covers Apache and most cPanel hosting. If yours is
neither, copy the header list out of `_headers` into whatever your host's
configuration looks like.

## Rebuilding it

This bundle is generated. Do not edit the HTML in here — the next rebuild will
overwrite it. Edit the source, then:

```
npm install
npm run pack
```

which produces `aedwards-decorating-site.zip` again.

The most likely reason to rebuild is the review excerpts. `REVIEWS.md` in the
source explains that, and it is written for someone who does not write code.

## Before this goes in front of customers

Run `npm run check:launch` in the source. It lists what is still unconfirmed —
at the time this bundle was built that included the phone number never having
been dialled, the 4.9 rating never having been checked against the listing, and
every review excerpt still being blank. `CONTENT-NEEDED.md` is the phone call
that clears it.
