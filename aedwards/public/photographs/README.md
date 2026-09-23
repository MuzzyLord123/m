# Photographs

Drop Andy's photographs in this folder and the site picks them up.

## What to do

1. Put the image files in here. JPEGs straight off his phone are fine — they get
   converted to AVIF/WebP and resized automatically at build. Name them so you
   can tell them apart, e.g. `study-gresford.jpg`.
2. Open `content/photos.ts` and add one entry per photograph:

   ```ts
   {
     src: '/photographs/study-gresford.jpg',
     room: 'Study',
     place: 'Gresford',
     alt: 'A study painted in a deep green, with the woodwork in off-white.',
     width: 3024,
     height: 4032,
   }
   ```

   `width` and `height` are the file's real pixel dimensions — right-click →
   Get Info / Properties, or run `file photographs/*.jpg`. They have to be right
   or the page will jump as the images load.
3. That is all. The photo section appears on the home page on its own, and
   disappears again if the array is emptied.

## Where the photographs should come from

**Andy's phone, not the Yell listing.** The copies on the listing have been
resized and recompressed by Yell for a directory page; blown up to full width on
a site about the quality of someone's finish, they look like exactly what they
are. The originals are on his camera roll and they are better in every way.

If all that is available is the Yell set, they will still work — the site will
size them sensibly and they are his own photographs of his own work. Just ask him
for the originals as well, and swap them in when they arrive.

## What makes a photograph worth putting up

This site has no photography at all at the moment and it stands up fine, which
means a photograph only earns its place if it is better than nothing:

- The whole room, lit by daylight, taken straight on rather than at an angle.
- Finished and tidy — no dust sheets, no tins, no ladders in shot.
- Woodwork, edges and cutting-in visible somewhere. That is the craft, and it is
  what somebody comparing two decorators is actually looking at.
- A couple of befores are worth more than another after.

Six good ones beat twelve ordinary ones. A blurry photo of a nice room reads as
carelessness about the thing the customer is paying for.

## The alt text

Somebody using a screen reader should get what the photograph is of, not a
caption. "A study painted in a deep green, with the woodwork in off-white" —
not "Study, Gresford", which is already on the page as a label.
