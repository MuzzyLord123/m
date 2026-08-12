Photographs go in this directory.

While it is empty, every image on the site renders as a ruled frame carrying a
description of the shot we need. That is deliberate — there is no stock
photography on this site and no AI-generated interiors.

WHAT IS NEEDED, IN ORDER OF VALUE
---------------------------------
1. UPVC windows or doors mid-spray — masked up, gun in shot, ideally with one
   frame finished and one not. This single photograph does more work than the
   whole of the copy on /spraying, which is the page paid traffic lands on.
2. A garage door, square on from the drive, finished. And the masking in
   progress if there is a shot of it.
3. The dustless sanding setup — sander and extractor connected, in a room that
   is obviously still lived in. The contrast is the entire argument.
4. Rendered elevations, finished interiors, kitchen doors laid out and sprayed.

SEND THE ORIGINALS
------------------
Off the phone or camera they were taken on. Do NOT save them off the old
website: lh3.googleusercontent.com serves cropped, resized, re-encoded copies
and they will look soft at the size this design runs them.

Upload the biggest version there is. Next.js resizes and re-encodes to AVIF and
WebP on demand — do not shrink anything first.

HOW TO WIRE ONE UP
------------------
See "Add a photograph" in README.md. Two minutes: drop the file here, then fill
in src, alt, width and height in the matching file in /content.

The real pixel width and height matter — they hold the layout still while the
image loads. Wrong numbers are a layout-shift failure, and CLS is in the
performance budget for this project.
