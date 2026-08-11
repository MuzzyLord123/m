Gallery photographs go in this directory.

The five Sean sent through are already written up in content/gallery.ts, with
their captions and their alt text. They are waiting for these exact filenames:

    render-repair-before.jpg      the bungalow gable with the render blown and
                                  patched, dust sheets over the beds
    render-repair-after.jpg       the same gable finished, render even and one
                                  colour

    fitted-bedroom-before.jpg     the alcove stripped back to patched plaster,
                                  carcass in, dust sheets down
    fitted-bedroom-after.jpg      the finished wardrobe, overhead cupboards and
                                  dressing table with the oak top

    dormer-cladding.jpg           the white-clad dormer with grey windows over
                                  the red brick

Drop them in with those names and the labelled frames on /gallery become the
photographs. Nothing else to change.

The two pairs are set up as before-and-after plates with a divider the reader
drags, so each pair has to be shot from roughly the same position — the
comparison is only worth anything if the two frames line up.

---

To add more:

1. Put the file here.
2. Add an entry to content/gallery.ts. The comment at the top of that file
   explains span, ratio and the two kinds of plate.

You can list a photograph before you upload it. Until the file arrives the plate
renders as a labelled frame stating the filename it is waiting for, which means
you can write up fifty photographs in one sitting and upload them over a week
without the page being wrong in between.

---

Two things worth repeating:

Originals only. Do not save images down from Instagram or from the old
WordPress site — both serve cropped, re-encoded copies, and this design runs
photographs the full width of the page. `npm run import:gallery` pulls the
originals off the live site automatically and tells you which ones are too
small to use full width.

If a client supplied the photograph, put their credit in the plate's `credit`
field so it prints under the image, and make sure there is permission to
republish it.
