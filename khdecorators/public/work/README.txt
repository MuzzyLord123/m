Kenny's photographs live in this directory.

55 are here already, taken off the old Google Sites site at the largest size it
would give. Every one is catalogued in content/photos.ts, which is where each
photograph's caption, description, size and gallery are set. There is no stock
photography on this site and no AI-generated interiors, and that stays true.

STILL WANTED, IN ORDER OF VALUE
-------------------------------
1. UPVC windows or doors mid-spray — masked up, gun in shot, ideally with one
   frame finished and one not. /spraying is the page paid traffic lands on, and
   its UPVC section uses a conservatory photograph until then.
2. Kitchen doors laid out and sprayed. That slot on /spraying still shows a
   marked "photograph to come".
3. The dustless sanding setup — sander and extractor connected, in a room that
   is obviously still lived in. The contrast is the entire argument.

SEND THE ORIGINALS
------------------
Off the phone or camera they were taken on. The old site stored its copies at
2048px at most; the originals are bigger and sharper.

Upload the biggest version there is. Next.js resizes and re-encodes to AVIF and
WebP on demand — do not shrink anything first.

HOW TO WIRE ONE UP
------------------
See "Add a photograph" in README.md. Two minutes: drop the file here, then add
an entry for it in content/photos.ts.

The real pixel width and height matter — they hold the layout still while the
image loads. Wrong numbers are a layout-shift failure, and CLS is in the
performance budget for this project.
