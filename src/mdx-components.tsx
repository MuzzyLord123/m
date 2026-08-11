import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Figure, PullQuote } from "@/components/blog/Prose";

/**
 * The article type system. Every element an MDX post can produce is styled
 * here, so a post is written in plain markdown and still lands in the site's
 * typography without a single class in the file.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2 className="mt-14 mb-4 font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-10 mb-3 font-display text-[1.3125rem] leading-snug font-semibold tracking-[-0.02em] text-ink">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="measure mt-5 grid gap-2.5 text-[1.0625rem] leading-relaxed text-ink-soft">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="measure mt-5 grid list-decimal gap-2.5 pl-5 text-[1.0625rem] leading-relaxed text-ink-soft marker:text-ink-mute">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="pl-5 -indent-5 before:mr-3 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent before:align-middle [ol>&]:pl-0 [ol>&]:indent-0 [ol>&]:before:hidden">
        {children}
      </li>
    ),
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ href = "", children }) => {
      const external = href.startsWith("http");
      const className =
        "font-medium text-accent underline decoration-accent/35 underline-offset-4 transition-colors duration-200 hover:decoration-accent";
      return external ? (
        <a href={href} className={className} target="_blank" rel="noreferrer noopener">
          {children}
        </a>
      ) : (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    },
    blockquote: ({ children }) => <PullQuote>{children}</PullQuote>,
    hr: () => <hr className="tape-line my-12" />,
    table: ({ children }) => (
      <div className="mt-7 overflow-x-auto overscroll-x-contain">
        <table className="w-full border-collapse text-left text-[0.9375rem]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-hairline pb-2.5 pr-6 eyebrow text-ink-mute">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-hairline py-3 pr-6 text-ink-soft">{children}</td>
    ),
    Figure,
    PullQuote,
    ...components,
  };
}
