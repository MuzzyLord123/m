import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';

/**
 * The MDX bodies are prose and nothing else — headings, paragraphs, lists,
 * emphasis and links. There are no components embedded in the content, on
 * purpose: whoever ends up editing these files after handover should be able to
 * do it without knowing what a component is.
 *
 * The styling lives in the `.prose-sheet` rules in globals.css so it is one
 * decision rather than one per element.
 */
export const mdxComponents: MDXComponents = {
  a: ({ href, children, ...rest }) => {
    const url = String(href ?? '');
    if (url.startsWith('/')) {
      return (
        <Link href={url} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={url} rel="noopener" {...rest}>
        {children}
      </a>
    );
  },
};
