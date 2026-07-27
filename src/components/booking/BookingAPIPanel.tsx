import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, Key, Eye, EyeOff, Shield, BookOpen } from 'lucide-react';

interface APIKey {
  id: string;
  key_name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number | null;
  expires_at: string | null;
}

export function BookingAPIPanel() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showDocs, setShowDocs] = useState(true);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apiUrl = `https://${projectId}.supabase.co/functions/v1/booking-api`;

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setKeys(data as any);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);
    try {
      // Generate a random key
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const rawKey = 'bk_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      const keyPrefix = rawKey.substring(0, 8);

      // Hash it
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      const keyHash = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        key_name: newKeyName.trim(),
        key_prefix: keyPrefix,
        key_hash: keyHash,
        permissions: { booking: true },
      });

      if (error) throw error;
      setCreatedKey(rawKey);
      setNewKeyName('');
      fetchKeys();
      toast.success('API key created');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    setKeys(prev => prev.filter(k => k.id !== id));
    toast.success('API key deleted');
  };

  const toggleKey = async (id: string, active: boolean) => {
    await supabase.from('api_keys').update({ is_active: active }).eq('id', id);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: active } : k));
    toast.success(active ? 'Key activated' : 'Key deactivated');
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      {/* Create Key */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">API Keys</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate API keys to integrate the booking system into any website or app via REST API.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Key name (e.g. My Website)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={createKey} disabled={creating || !newKeyName.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Create Key
          </Button>
        </div>

        {createdKey && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🔑 Your new API key (copy it now — it won't be shown again):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded text-xs font-mono break-all border">{createdKey}</code>
              <Button size="icon" variant="outline" onClick={() => copyText(createdKey, 'API key')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setCreatedKey(null)}>Dismiss</Button>
          </div>
        )}

        {/* Existing Keys */}
        <div className="space-y-2">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No API keys yet. Create one above.</p>
          ) : (
            keys.map(key => (
              <div key={key.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{key.key_name}</span>
                    <Badge variant={key.is_active ? 'default' : 'secondary'}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <code>{key.key_prefix}••••••••</code>
                    {key.last_used_at && <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>}
                    {key.usage_count ? <> · {key.usage_count} requests</> : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleKey(key.id, !key.is_active)}
                  >
                    {key.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteKey(key.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">API Documentation</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowDocs(!showDocs)}>
            {showDocs ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showDocs && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded-lg text-sm truncate">{apiUrl}</code>
                <Button variant="outline" size="icon" onClick={() => copyText(apiUrl, 'API URL')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Include your API key as a header: <code className="bg-muted px-1 rounded">x-api-key: bk_your_key_here</code>
              </p>
            </div>

            {/* Get Services */}
            <DocEndpoint
              title="Get Services"
              description="List all active booking services"
              code={`fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({ action: "get-services" })\n})`}
              onCopy={copyText}
            />

            {/* Get Slots */}
            <DocEndpoint
              title="Get Available Slots"
              description="Get available time slots for a date"
              code={`fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({\n    action: "get-slots",\n    date: "2026-03-15",\n    service_id: "optional-service-uuid"\n  })\n})`}
              onCopy={copyText}
            />

            {/* Create Booking */}
            <DocEndpoint
              title="Create Booking"
              description="Book an appointment"
              code={`fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({\n    action: "create-booking",\n    date: "2026-03-15",\n    start_time: "10:00",\n    service_id: "service-uuid",\n    customer_name: "John Doe",\n    customer_email: "john@example.com",\n    customer_phone: "+44 7700 900000",\n    notes: "First visit"\n  })\n})`}
              onCopy={copyText}
            />

            {/* Cancel Booking */}
            <DocEndpoint
              title="Cancel Booking"
              description="Cancel an existing booking"
              code={`fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({\n    action: "cancel-booking",\n    booking_id: "booking-uuid",\n    reason: "Customer requested cancellation"\n  })\n})`}
              onCopy={copyText}
            />

            {/* Get Staff */}
            <DocEndpoint
              title="Get Staff"
              description="List available staff members"
              code={`fetch("${apiUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "YOUR_API_KEY"\n  },\n  body: JSON.stringify({\n    action: "get-staff",\n    service_id: "optional-filter-by-service"\n  })\n})`}
              onCopy={copyText}
            />

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Keep your API key secret. Never expose it in client-side JavaScript on public websites. Use it from your backend server only.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocEndpoint({ title, description, code, onCopy }: { title: string; description: string; code: string; onCopy: (t: string, l: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-semibold">{title}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="relative">
        <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono">{code}</pre>
        <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => onCopy(code, title)}>
          <Copy className="h-3 w-3 mr-1" /> Copy
        </Button>
      </div>
    </div>
  );
}
