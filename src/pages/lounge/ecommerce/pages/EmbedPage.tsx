import { useEffect, useMemo, useState } from 'react';
import { Code2, Copy, Check, ExternalLink, Eye, Sun, Moon } from 'lucide-react';
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
  const [title, setTitle] = useState<string>('');
  const [columns, setColumns] = useState<number>(3);
  const [limit, setLimit] = useState<number>(24);
  const [accent, setAccent] = useState<string>('');
  const [ratio, setRatio] = useState<'square' | 'portrait'>('square');
  const [copied, setCopied] = useState(false);
  const [previewDark, setPreviewDark] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ''));
  }, []);

  const attrs = useMemo(() => [
    `src="${FUNCTIONS_URL}"`,
    `data-quooro="1"`,
    userId ? `data-user-id="${userId}"` : '',
    siteId ? `data-site-id="${siteId}"` : '',
    title ? `data-title="${title.replace(/"/g, '&quot;')}"` : '',
    `data-columns="${columns}"`,
    `data-limit="${limit}"`,
    ratio !== 'square' ? `data-ratio="${ratio}"` : '',
    accent ? `data-accent="${accent}"` : '',
    `async`,
  ].filter(Boolean).join(' '), [userId, siteId, title, columns, limit, ratio, accent]);

  const snippet = useMemo(
    () => `<div data-quooro-shop></div>\n<script ${attrs}></script>`,
    [attrs],
  );

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

  // The preview is the real deployed widget inside a sample host page, so
  // what the merchant sees here is exactly what their customers will get -
  // including how it adopts a serif light site vs a dark sans one.
  const previewDoc = useMemo(() => {
    const host = previewDark
      ? `body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;color:#e6e9f2;background:#101318;padding:28px;}`
      : `body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#2c2620;background:#faf6ef;padding:28px;}`;
    return `<!doctype html><html><head><meta charset="utf-8"><style>${host}</style></head>
<body><div data-quooro-shop></div><script ${attrs}></scr` + `ipt></body></html>`;
  }, [attrs, previewDark]);

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Embed script']}
        title="Embed script"
        description="One script tag turns any page into your storefront: catalogue, search, bag and a full checkout, all in-page. It reads the host site's fonts and colours at runtime, so it looks like part of the site it's pasted into."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
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
                <p><strong className="text-foreground">Includes:</strong> product catalogue, expanding search, product detail, bag drawer, and a full checkout — orders land in your Orders page with the customer's contact and delivery details.</p>
                <p><strong className="text-foreground">Matches the host site:</strong> fonts, text colour, background and dark mode are read off the page it's embedded in. Shipping and tax lines follow your store Settings.</p>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> Live preview — real widget, sample host site
                </div>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setPreviewDark(d => !d)}>
                  {previewDark ? <Sun className="h-3.5 w-3.5 mr-1.5" /> : <Moon className="h-3.5 w-3.5 mr-1.5" />}
                  {previewDark ? 'Light serif host' : 'Dark sans host'}
                </Button>
              </div>
              <iframe
                title="Storefront preview"
                srcDoc={previewDoc}
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-[520px] border-0"
              />
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
              <Label className="text-xs">Shop title (optional — defaults to your store name)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The autumn shop" className="text-xs" />
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
              <Label className="text-xs">Image shape</Label>
              <div className="flex gap-2">
                {(['square', 'portrait'] as const).map(r => (
                  <Button key={r} size="sm" variant={ratio === r ? 'default' : 'outline'} className="h-8 text-xs flex-1" onClick={() => setRatio(r)}>
                    {r === 'square' ? 'Square' : 'Portrait'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Accent colour (optional — defaults to the host site's ink)</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={accent || '#111111'} onChange={(e) => setAccent(e.target.value)} className="w-14 h-9 p-1" />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="Inherit from host site" className="text-xs font-mono" />
              </div>
              {accent && (
                <button className="text-[11px] text-muted-foreground underline underline-offset-2" onClick={() => setAccent('')}>
                  Clear — inherit from host site
                </button>
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
