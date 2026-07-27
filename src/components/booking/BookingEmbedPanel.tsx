import { useState, useEffect, useMemo } from 'react';
import { BookingSettings } from '@/hooks/useBookingSystem';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, ExternalLink, Code, Globe, Paintbrush, Check, Eye, QrCode, FileJson, Smartphone, Monitor } from 'lucide-react';

export function BookingEmbedPanel({ settings, onSaveSettings }: { settings: BookingSettings | null; onSaveSettings: (d: Partial<BookingSettings>) => void }) {
  const slug = settings?.business_slug;
  const origin = window.location.origin;
  const hostedUrl = slug ? `${origin}/book/${slug}` : null;
  const [copied, setCopied] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const loadServices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('booking_services').select('id, name').eq('user_id', user.id).eq('is_active', true);
      if (data) setServices(data);
    };
    loadServices();
  }, []);

  const brandColor = settings?.branding_color || '#3b82f6';

  const iframeSnippet = hostedUrl
    ? `<iframe\n  src="${hostedUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  allow="payment"\n  loading="lazy"\n  style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:100%;"\n  title="Book an appointment"\n></iframe>`
    : '';

  const scriptSnippet = slug
    ? `<!-- Quooro Booking Widget -->\n<div\n  data-quooro-booking="${slug}"\n  data-quooro-color="${brandColor}"\n  data-quooro-height="700"\n  data-quooro-rounded="12"\n  data-quooro-shadow="true"\n></div>\n<script src="${origin}/booking-embed.js" defer></script>`
    : '';

  const popupSnippet = slug
    ? `<!-- Quooro Booking Popup Button -->\n<button\n  onclick="window.open('${hostedUrl}','quooro-booking','width=500,height=750,scrollbars=yes')"\ n  style="padding:12px 28px;background:${brandColor};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif"\n>\n  Book Now\n</button>`
    : '';

  const apiExample = `// API Booking Example\nconst response = await fetch('${origin}/functions/v1/booking-api', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json',\n    'x-api-key': 'YOUR_API_KEY'\n  },\n  body: JSON.stringify({\n    action: 'get-services'\n  })\n});\nconst data = await response.json();\nconsole.log(data.services);`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <Button
      size="sm"
      variant="secondary"
      className="h-7 text-xs gap-1"
      onClick={() => copyToClipboard(text, label)}
    >
      {copied === label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied === label ? 'Copied!' : 'Copy'}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Business Slug Setup */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Hosted Booking Page</h3>
          <Badge variant={slug ? 'default' : 'secondary'} className="ml-auto text-[10px]">
            {slug ? 'Active' : 'Not configured'}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label>Business Slug</Label>
          <div className="flex gap-2">
            <Input
              defaultValue={settings?.business_slug || ''}
              onBlur={(e) => onSaveSettings({ business_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="my-business"
              className="flex-1 font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your booking URL will be: <code className="text-primary">{origin}/book/{slug || 'your-slug'}</code>
          </p>
        </div>

        {hostedUrl && (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm truncate font-mono">{hostedUrl}</code>
            <CopyBtn text={hostedUrl} label="URL" />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(hostedUrl, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings?.booking_page_enabled !== false}
              onCheckedChange={(v) => onSaveSettings({ booking_page_enabled: v })}
            />
            <Label className="text-sm">Enable hosted booking page</Label>
          </div>
        </div>
      </div>

      {/* Embed Code Tabs */}
      {slug ? (
        <div className="rounded-xl border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Embed Code</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Copy and paste into any website — WordPress, Shopify, Webflow, Squarespace, Wix, or plain HTML.
          </p>

          <Tabs defaultValue="script" className="space-y-3">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="script" className="text-xs">Widget</TabsTrigger>
              <TabsTrigger value="iframe" className="text-xs">iFrame</TabsTrigger>
              <TabsTrigger value="popup" className="text-xs">Popup</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">Recommended</Badge>
                <CopyBtn text={scriptSnippet} label="Widget snippet" />
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto">
                {scriptSnippet}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                ✓ Auto-sizing &nbsp;✓ Brand colors &nbsp;✓ Shadow &nbsp;✓ Rounded corners &nbsp;✓ Lazy loading
              </p>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-3">
              <div className="flex justify-end">
                <CopyBtn text={iframeSnippet} label="iFrame snippet" />
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto">
                {iframeSnippet}
              </pre>
            </TabsContent>

            <TabsContent value="popup" className="space-y-3">
              <div className="flex justify-end">
                <CopyBtn text={popupSnippet} label="Popup snippet" />
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto">
                {popupSnippet}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                Opens a styled popup window — great for "Book Now" buttons.
              </p>
            </TabsContent>

            <TabsContent value="api" className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">Developer</Badge>
                <CopyBtn text={apiExample} label="API example" />
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[250px] overflow-y-auto">
                {apiExample}
              </pre>
              <p className="text-[11px] text-muted-foreground">
                Use with your API keys from the API Management section. Supports get-services, get-slots, create-booking, cancel-booking, reschedule-booking.
              </p>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings?.embed_enabled !== false}
                onCheckedChange={(v) => onSaveSettings({ embed_enabled: v })}
              />
              <Label className="text-sm">Allow embeds</Label>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Embed Code</h3>
          </div>
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
            Set a business slug above to generate embed snippets.
          </p>
        </div>
      )}

      {/* Branding */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Branding & Customisation</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Brand Color</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                defaultValue={brandColor}
                onBlur={(e) => onSaveSettings({ branding_color: e.target.value })}
                className="w-10 h-9 rounded cursor-pointer border"
              />
              <Input
                defaultValue={brandColor}
                onBlur={(e) => onSaveSettings({ branding_color: e.target.value })}
                className="flex-1 font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input
              defaultValue={settings?.branding_logo || ''}
              onBlur={(e) => onSaveSettings({ branding_logo: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Business Name</Label>
          <Input
            defaultValue={settings?.business_name || ''}
            onBlur={(e) => onSaveSettings({ business_name: e.target.value })}
            placeholder="Your Business Name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Confirmation Message</Label>
          <Input
            defaultValue={settings?.confirmation_message || ''}
            onBlur={(e) => onSaveSettings({ confirmation_message: e.target.value })}
            placeholder="Your booking has been confirmed! We'll send you a reminder."
          />
        </div>
      </div>

      {/* Live Preview */}
      {hostedUrl && (
        <div className="rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Live Preview</h3>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                className="h-7 w-7"
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                className="h-7 w-7"
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div
            className="mx-auto rounded-xl overflow-hidden border bg-muted"
            style={{
              width: previewDevice === 'mobile' ? '375px' : '100%',
              height: '500px',
              transition: 'width 0.3s ease',
            }}
          >
            <iframe
              src={hostedUrl}
              className="w-full h-full border-none"
              title="Booking preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
