# Running the site on your own PC

Two minutes, and you do not need to know anything about code.

This gets the site running on your computer so you can look at it in a browser,
fill in the missing bits and see them appear. It is **not** the same as putting it
on the internet — see "Actually going live" at the bottom for that.

---

## 1. Install Node.js (once)

Go to **<https://nodejs.org>** and install the version marked **LTS**.

Click through the installer with all the defaults. You need **Node 20 or newer**;
the LTS download is always newer than that.

You only ever do this once.

---

## 2. Start the site

**Windows** — double-click `start.cmd`

**Mac or Linux** — open Terminal in this folder and run:

```bash
./start.sh
```

The first run takes a minute or two while it downloads what it needs. After that
it is a few seconds.

When it finishes you will see:

```
   ▲ Next.js 16.3.0
   - Local:  http://localhost:3000
```

Open **<http://localhost:3000>** in your browser. That is the site.

To stop it, close the window, or press `Ctrl` and `C` together.

---

## 3. Change something and watch it update

The scripts start the site in **preview mode**, which watches for changes. Open
any file in the `content` folder in a text editor, change some words, save, and
the browser updates on its own.

The two most useful things to change first:

| What                     | File                     | Look for              |
| ------------------------ | ------------------------ | --------------------- |
| The town                 | `content/site.ts`        | `{{TOWN}}`            |
| The towns you cover      | `content/areas.ts`       | `towns: []`           |
| The reviews              | `content/reviews.ts`     | `reviews: []`         |

`README.md` has the longer version, and `CONTENT-NEEDED.md` is the full list of
what is still missing.

**Photographs:** drop them in the `public/work` folder, then follow
"Add a photograph" in `README.md`. There is a note in that folder explaining what
shots are wanted.

---

## Actually going live

Running it on your PC shows it to **you**. For customers to reach it, the site has
to be on a server that is always on.

**A home PC is the wrong place for this one.** Not because it cannot be done — it
can, with a tunnelling tool — but because of what this particular site is:

- Kenny is **paying Google for clicks**. Every minute the PC is asleep, off,
  rebooting, or the broadband drops, those clicks land on nothing and the money is
  gone. You would never know it happened.
- A home broadband connection has no uptime guarantee and most UK ISP home
  contracts do not permit running a public server on them.
- It puts your home network on the public internet, and the enquiry form would be
  handling other people's phone numbers and email addresses on your own machine.

Proper hosting for this site is **free**. It is a Next.js site, so Vercel's free
tier runs it as-is, and `LAUNCH.md` walks through the whole cutover — DNS, the
redirects, Google Business Profile, Search Console, and the Google Ads tag that
must not break.

Read `ADS-MIGRATION.md` first either way. It is the one that protects the ad spend.
