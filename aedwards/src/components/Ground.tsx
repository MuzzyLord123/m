import type { FieldColour } from '@content/fields'

/**
 * The colour the page is painted before any JavaScript runs.
 *
 * Repaint takes over on scroll, but it deliberately writes nothing until it has
 * measured the page, so whatever the server rendered is what you see first.
 * This sets that: the first field's colours, straight into :root.
 *
 * It is also the entire no-JavaScript experience. The page stays this colour
 * and every word on it still clears 7:1, because there is only ever one
 * foreground/background pair in play.
 */

export function Ground({ colour }: { colour: FieldColour }) {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root{--bg:${colour.bg};--fg:${colour.fg}}`,
      }}
    />
  )
}
