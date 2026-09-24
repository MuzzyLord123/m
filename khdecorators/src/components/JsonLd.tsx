/**
 * Renders a JSON-LD block.
 *
 * `<` is escaped in the serialised output so a stray angle bracket in a piece of
 * copy cannot close the script tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
