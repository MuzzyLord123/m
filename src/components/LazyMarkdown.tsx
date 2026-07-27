import { lazy, Suspense } from "react";

const ReactMarkdown = lazy(() => import("react-markdown"));

/**
 * Markdown rendering for chat message bodies, loaded on demand.
 *
 * ChatBot renders on every route via Layout, so a static `react-markdown` import
 * put the whole markdown pipeline (micromark, mdast, hast - ~33KB gzip) in the
 * eager entry chunk even though nothing can render markdown until a visitor opens
 * the chat and receives a reply.
 *
 * The Suspense boundary is per message body rather than around the panel, so the
 * chat opens instantly and only the individual message swaps from plain text to
 * formatted once the chunk lands.
 */
export function LazyMarkdown({ children }: { children: string }) {
  return (
    <Suspense fallback={<span className="whitespace-pre-wrap">{children}</span>}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </Suspense>
  );
}
