# Fonts committed to the repo

`Fraunces-Light.ttf` is here for one reason: `src/app/opengraph-image.tsx` renders the social sharing
card at build time and needs the typeface as a file. It is **not** served to visitors — the fonts on
the site itself are handled by `next/font/google`, which self-hosts them.

Fraunces is copyright 2018 The Fraunces Project Authors and is licensed under the SIL Open Font
Licence 1.1. The full licence is in `OFL.txt` beside it, as the licence requires.

If the sharing card is ever changed to use a photograph instead of type, this file and its licence can
both be deleted.
