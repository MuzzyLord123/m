import { useSiteContent } from "@/hooks/useSiteContent";
import { HOMEPAGE_HEADERS, type SectionHeaderContent } from "@/lib/siteContentSchemas";

/**
 * Load a homepage section header (eyebrow / title prefix / title highlight / subtitle)
 * from `site_content`, falling back to the hard-coded defaults defined in
 * `HOMEPAGE_HEADERS`. Used by Index.tsx so admins can edit these strings from
 * the admin Marketing Site editor and the Visual Editor.
 */
export function useHomepageHeader(key: keyof typeof HOMEPAGE_HEADERS) {
  const fallback: SectionHeaderContent = {
    eyebrow: HOMEPAGE_HEADERS[key].eyebrow,
    titlePrefix: HOMEPAGE_HEADERS[key].titlePrefix,
    titleHighlight: HOMEPAGE_HEADERS[key].titleHighlight,
    subtitle: HOMEPAGE_HEADERS[key].subtitle,
  };
  return useSiteContent<SectionHeaderContent>(key, fallback);
}
