/**
 * The shape the site compiler needs, and nothing more.
 *
 * Deliberately independent of the editor's richer types: this module has to
 * run unchanged in Deno, so it cannot reach for React's CSSProperties or
 * anything else browser-shaped.
 *
 * The style slots are intentionally opaque. The compiler only ever iterates
 * their keys and writes them out as CSS declarations - it never reasons
 * about a particular property - and typing them narrowly would stop the
 * editor's own React CSSProperties from flowing in, since an interface is
 * not assignable to a Record.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

/** A bag of CSS declarations, camelCase keys. */
export type StyleMap = Record<string, any>;

export interface ResponsiveStyles {
  desktop?: any;
  tablet?: any;
  mobile?: any;
}

export interface EditorElement {
  id: string;
  type: string;
  name?: string;
  props: Record<string, any>;
  styles: ResponsiveStyles;
  hoverStyles?: any;
  animations?: any;
  children: EditorElement[];
  locked?: boolean;
  hidden?: boolean;
}
