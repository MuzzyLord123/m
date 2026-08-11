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

    kitchen-wall-units-before.jpg the pine wall cupboards and extractor canopy
                                  over the tiled splashback
    kitchen-wall-units-after.jpg  the same cupboards and canopy in sage green

    kitchen-base-units-before.jpg the pine base units, sink, washing machine
                                  and oven housing
    kitchen-base-units-after.jpg  the base units and oven housing in sage green

    dormer-cladding.jpg           the white-clad dormer with grey windows over
                                  the red brick

Drop them in with those names and the labelled frames on /gallery become the
photographs. Nothing else to change.

Three of the pairs are set up with a divider the reader drags — the render, the
bedroom and the kitchen wall units — because those were shot from the same
position and the two frames line up.

The kitchen base units are set up side by side instead, because those two
photographs were taken from different places: one wide across the sink, one
into the oven corner. A divider between two different viewpoints is not a
comparison, it is a wipe between two pictures, and it flatters the work by
hiding the join. Side by side and labelled, they are honest.

If you ever reshoot that one from the original position, change `kind: 'pair'`
to `kind: 'comparison'` in content/gallery.ts and it becomes a slider.

---

To add more:

1. Put the file here.
2. Add an entry to content/gallery.ts. The comment at the top of that file
   explains span, ratio and the three kinds of plate.

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
