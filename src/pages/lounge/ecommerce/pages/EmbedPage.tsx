import { useEffect, useMemo, useState } from 'react';
import { Code2, Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { PageHeader, PageBody } from '../shared/PageChrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// This URL is handed to customers to paste onto their own sites, so it must
// never be hardcoded to a project ref - it was still pointing at the old
// Lovable project, which would have served every embed from a dead host.
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ecommerce-embed`;

export default function EmbedPage() {
  const [userId, setUserId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [columns, setColumns] = useState<number>(3);
  const [limit, setLimit] = useState<number>(24);
  const [accent, setAccent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ''));
  }, []);

  const snippet = useMemo(() => {
    const attrs = [
      `src="${FUNCTIONS_URL}"`,
      `data-quooro="1"`,
      userId ? `data-user-id="${userId}"` : '',
      siteId ? `data-site-id="${siteId}"` : '',
      `data-columns="${columns}"`,
      `data-limit="${limit}"`,
      accent ? `data-accent="${accent}"` : '',
      `async`,
    ].filter(Boolean).join(' ');
    return `<div data-quooro-shop></div>\n<script ${attrs}></script>`;
  }, [userId, siteId, columns, limit, accent]);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Embed snippet copied');
    setTimeout(() => setCopied(false), 1500);
  };

  const previewUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (userId) qs.set('user_id', userId);
    if (siteId) qs.set('site_id', siteId);
    qs.set('limit', String(limit));
    return `${FUNCTIONS_URL}/products?${qs.toString()}`;
  }, [userId, siteId, limit]);

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Embed script']}
        title="Embed script"
        description="One script tag. Renders your product grid, search, and a working cart on any external site. Isolated in a shadow DOM so it never fights the host page."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Snippet */}
          <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" /> Paste into your site
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Test feed
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <Button size="sm" onClick={copy} className="h-8 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copied ? 'Copied' : 'Copy snippet'}
                </Button>
              </div>
            </div>
            <pre className="p-4 text-xs leading-relaxed overflow-x-auto bg-muted/30 font-mono text-foreground">
{snippet}
            </pre>
            <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Works on:</strong> Wix, Squarespace, WordPress, Framer, plain HTML — anywhere you can paste a <code>&lt;script&gt;</code> tag.</p>
              <p><strong className="text-foreground">Includes:</strong> product grid, search, add-to-cart, cart drawer, checkout hook.</p>
            </div>
          </div>

          {/* Config */}
          <div className="rounded-xl border border-border/50 bg-background p-4 space-y-4 h-fit">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Configuration</div>
            <div className="space-y-1.5">
              <Label className="text-xs">User ID (auto)</Label>
              <Input value={userId} readOnly className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Site ID (optional)</Label>
              <Input value={siteId} onChange={(e) => setSiteId(e.target.value)} placeholder="Filter to one site" className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Columns</Label>
                <Input type="number" min={1} max={6} value={columns} onChange={(e) => setColumns(+e.target.value || 3)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Limit</Label>
                <Input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(+e.target.value || 24)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Accent color</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={accent || '#111111'} onChange={(e) => setAccent(e.target.value)} className="w-14 h-9 p-1" />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#111111" className="text-xs font-mono" />
              </div>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
