import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

/**
 * A note, rendered.
 *
 * Images used to be inserted as base64 data URIs straight into the markdown,
 * which meant the editor showed a wall of several hundred thousand
 * characters instead of a picture, and every note carrying a photo bloated
 * the row it was saved in. They are uploaded to storage now and referenced
 * by a short path under the `quooro-note:` scheme.
 *
 * Notes are private, so the bucket is private too and the path is exchanged
 * for a signed URL at render time rather than being a public address. The
 * exchange is cached for the session, so scrolling a note with a dozen
 * images does not re-sign a dozen URLs every keystroke.
 */

export const NOTE_IMAGE_SCHEME = 'quooro-note:';
const BUCKET = 'customer-uploads';
const SIGNED_URL_TTL = 60 * 60; // an hour; long enough for a working session

const urlCache = new Map<string, string>();

function useSignedURL(src: string | undefined): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(() =>
    src?.startsWith(NOTE_IMAGE_SCHEME) ? urlCache.get(src) : src);

  useEffect(() => {
    if (!src || !src.startsWith(NOTE_IMAGE_SCHEME)) { setResolved(src); return; }
    const cached = urlCache.get(src);
    if (cached) { setResolved(cached); return; }

    let alive = true;
    const path = src.slice(NOTE_IMAGE_SCHEME.length);
    supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL).then(({ data }) => {
      if (!alive || !data?.signedUrl) return;
      urlCache.set(src, data.signedUrl);
      setResolved(data.signedUrl);
    });
    return () => { alive = false; };
  }, [src]);

  return resolved;
}

function NoteImage({ src, alt }: { src?: string; alt?: string }) {
  const url = useSignedURL(src);
  if (!url) {
    // The image exists, its address is being fetched. A sized placeholder
    // means the note does not jump when it arrives.
    return (
      <span
        className="my-2 block h-40 w-full max-w-sm animate-pulse rounded-[10px] bg-foreground/[0.06]"
        role="img"
        aria-label={alt ? `${alt} (loading)` : 'Loading image'}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt || ''}
      loading="lazy"
      decoding="async"
      className="my-2 h-auto max-w-full rounded-[10px] border border-border/50"
    />
  );
}

export function NoteMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown components={{ img: ({ node: _node, ...props }) => <NoteImage {...props} /> }}>
      {children}
    </ReactMarkdown>
  );
}

export default NoteMarkdown;
