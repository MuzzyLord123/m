import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, MessageSquare, Video, Globe, Zap, Mail, Shield,
  ExternalLink, Loader2, Check, X, Plug, Trash2, Eye, EyeOff,
  Link2, Unlink, CalendarDays, CreditCard, Webhook, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ─── Types ─── */
interface ConnectionProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  fields: ConnectionField[];
  helpUrl?: string;
  comingSoon?: boolean;
  category: 'telephony' | 'messaging' | 'video' | 'email' | 'calendar' | 'payments' | 'automation' | 'personal' | 'hosting';
  setupInstructions?: string[];
}

interface ConnectionField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'password' | 'tel';
}

interface ConnectionData {
  provider: string;
  credentials: Record<string, string>;
  is_connected: boolean;
  connected_at: string | null;
}

/* ─── Provider Registry ─── */
const PROVIDERS: ConnectionProvider[] = [
  {
    id: 'personal_phone',
    name: 'My Phone Number',
    description: 'Your personal number for outbound calls from the dial pad',
    icon: Phone,
    color: 'text-primary',
    category: 'personal',
    fields: [
      { key: 'phone_number', label: 'Phone Number', placeholder: '+44 7xxx xxx xxx', type: 'tel' },
    ],
    setupInstructions: [
      'Enter your personal mobile or landline number in international format (e.g. +44 7xxx xxx xxx)',
      'This number will be shown as your caller ID when making outbound calls from the dial pad',
      'Make sure the number is active and can receive verification calls if needed',
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Voice calls, SMS & phone numbers',
    icon: Phone,
    color: 'text-red-500',
    category: 'telephony',
    helpUrl: 'https://www.twilio.com/console',
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'AC...', type: 'text' },
      { key: 'auth_token', label: 'Auth Token', placeholder: 'Your auth token', type: 'password' },
      { key: 'phone_number', label: 'Phone Number', placeholder: '+1234567890', type: 'tel' },
    ],
    setupInstructions: [
      'Sign up or log in at twilio.com/console',
      'Your Account SID and Auth Token are on the main Console dashboard',
      'Purchase a phone number under Phone Numbers → Manage → Buy a number',
      'Paste your Account SID, Auth Token, and purchased number above',
    ],
  },
  {
    id: 'vonage',
    name: 'Vonage',
    description: 'SMS, voice & video APIs',
    icon: MessageSquare,
    color: 'text-purple-500',
    category: 'telephony',
    helpUrl: 'https://dashboard.nexmo.com/sign-up',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'Your API key', type: 'text' },
      { key: 'api_secret', label: 'API Secret', placeholder: 'Your API secret', type: 'password' },
    ],
    setupInstructions: [
      'Sign up or log in at dashboard.nexmo.com',
      'Your API Key and API Secret are shown on the Getting Started page',
      'Copy both values and paste them into the fields above',
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send & receive WhatsApp messages via Meta API',
    icon: MessageSquare,
    color: 'text-green-500',
    category: 'messaging',
    helpUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'Your phone number ID', type: 'text' },
      { key: 'access_token', label: 'Permanent Access Token', placeholder: 'Your access token', type: 'password' },
      { key: 'business_id', label: 'Business Account ID', placeholder: 'Your business account ID', type: 'text' },
    ],
    setupInstructions: [
      'Go to developers.facebook.com and create or select your app',
      'Add the WhatsApp product to your app',
      'Under WhatsApp → API Setup, find your Phone Number ID and temporary Access Token',
      'For a permanent token, create a System User in Business Settings → Users → System Users, then generate a token with whatsapp_business_messaging permission',
      'Your Business Account ID is in WhatsApp → API Setup under the WhatsApp Business Account section',
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Workspace notifications and messaging',
    icon: MessageSquare,
    color: 'text-[#E01E5A]',
    category: 'messaging',
    helpUrl: 'https://api.slack.com/apps',
    fields: [
      { key: 'webhook_url', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/...', type: 'text' },
      { key: 'bot_token', label: 'Bot Token (optional)', placeholder: 'xoxb-...', type: 'password' },
    ],
    setupInstructions: [
      'Go to api.slack.com/apps and click "Create New App" → "From scratch"',
      'Under Features → Incoming Webhooks, toggle it on and click "Add New Webhook to Workspace"',
      'Select the channel to post to and copy the Webhook URL',
      '(Optional) For richer features, go to OAuth & Permissions, add bot scopes (chat:write, channels:read), and install to get a Bot Token',
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Team messaging and meeting integration',
    icon: MessageSquare,
    color: 'text-[#6264A7]',
    category: 'messaging',
    helpUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
    fields: [
      { key: 'webhook_url', label: 'Incoming Webhook URL', placeholder: 'https://...webhook.office.com/...', type: 'text' },
    ],
    setupInstructions: [
      'In Microsoft Teams, go to the channel where you want notifications',
      'Click the ••• menu → Connectors (or Manage channel → Connectors)',
      'Search for "Incoming Webhook" and click Configure',
      'Give it a name (e.g. "Quooro"), optionally upload an icon, then click Create',
      'Copy the generated Webhook URL and paste it above',
    ],
  },
  {
    id: 'smtp',
    name: 'Custom Email (SMTP)',
    description: 'Send emails through your own SMTP server or provider',
    icon: Mail,
    color: 'text-orange-500',
    category: 'email',
    fields: [
      { key: 'host', label: 'SMTP Host', placeholder: 'smtp.example.com', type: 'text' },
      { key: 'port', label: 'Port', placeholder: '587', type: 'text' },
      { key: 'username', label: 'Username', placeholder: 'your@email.com', type: 'text' },
      { key: 'password', label: 'Password', placeholder: 'Your SMTP password', type: 'password' },
      { key: 'from_email', label: 'From Email', placeholder: 'noreply@yourdomain.com', type: 'text' },
    ],
    setupInstructions: [
      'Obtain your SMTP credentials from your email provider (Gmail, Outlook, custom server, etc.)',
      'For Gmail: Host is smtp.gmail.com, Port is 587, and you need an App Password (not your regular password) — enable 2FA first, then generate one at myaccount.google.com → Security → App passwords',
      'For Outlook/Office 365: Host is smtp.office365.com, Port is 587',
      'Set the "From Email" to a verified address on your SMTP server',
    ],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    description: 'Transactional email API for reliable delivery',
    icon: Mail,
    color: 'text-red-400',
    category: 'email',
    helpUrl: 'https://app.mailgun.com/app/dashboard',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'key-...', type: 'password' },
      { key: 'domain', label: 'Domain', placeholder: 'mg.yourdomain.com', type: 'text' },
    ],
    setupInstructions: [
      'Sign up or log in at app.mailgun.com',
      'Go to Settings → API Keys and copy your Private API Key (starts with "key-")',
      'Under Sending → Domains, add and verify your domain, or use the sandbox domain for testing',
      'Paste your API Key and verified domain above',
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing campaigns',
    icon: Mail,
    color: 'text-blue-400',
    category: 'email',
    helpUrl: 'https://app.sendgrid.com/settings/api_keys',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'SG...', type: 'password' },
      { key: 'from_email', label: 'Verified Sender', placeholder: 'noreply@yourdomain.com', type: 'text' },
    ],
    setupInstructions: [
      'Sign up or log in at app.sendgrid.com',
      'Go to Settings → API Keys → Create API Key with "Full Access" or "Restricted Access" (Mail Send permission)',
      'Copy the key immediately (it won\'t be shown again) — it starts with "SG."',
      'Under Settings → Sender Authentication, verify your sender email address or domain',
      'Paste the API Key and your verified sender email above',
    ],
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync events with your Google Calendar. Add your Google OAuth credentials, then authorize.',
    icon: CalendarDays,
    color: 'text-blue-500',
    category: 'calendar',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    fields: [
      { key: 'client_id', label: 'Google Client ID', placeholder: 'xxxx.apps.googleusercontent.com', type: 'text' },
      { key: 'client_secret', label: 'Google Client Secret', placeholder: 'GOCSPX-...', type: 'password' },
    ],
    setupInstructions: [
      'Go to console.cloud.google.com → APIs & Services → Credentials',
      'Click "Create Credentials" → "OAuth Client ID" (select Web application)',
      `Add "${window.location.origin}/lounge/google-calendar-callback" as an Authorized redirect URI`,
      'Under APIs & Services → Library, search for and enable "Google Calendar API"',
      'Copy your Client ID and Client Secret, paste them above, click Save, then Authorize',
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and invoicing',
    icon: CreditCard,
    color: 'text-[#635BFF]',
    category: 'payments',
    helpUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text' },
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', type: 'password' },
      { key: 'webhook_secret', label: 'Webhook Secret (optional)', placeholder: 'whsec_...', type: 'password' },
    ],
    setupInstructions: [
      'Log in at dashboard.stripe.com',
      'Go to Developers → API keys to find your Publishable Key (pk_live_...) and Secret Key (sk_live_...)',
      'For test mode, toggle "Test mode" and use the test keys (pk_test_... / sk_test_...)',
      '(Optional) For webhooks, go to Developers → Webhooks → Add endpoint, set your endpoint URL, and copy the Signing Secret (whsec_...)',
    ],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing & meetings',
    icon: Video,
    color: 'text-blue-500',
    category: 'video',
    comingSoon: true,
    fields: [],
    setupInstructions: [
      'This integration is coming soon',
      'You will be able to create and join Zoom meetings directly from your calendar',
    ],
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Video calls via Google Workspace',
    icon: Video,
    color: 'text-green-500',
    category: 'video',
    comingSoon: true,
    fields: [],
    setupInstructions: [
      'This integration is coming soon',
      'You will be able to generate Google Meet links for calendar events',
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps via Zapier webhooks',
    icon: Zap,
    color: 'text-orange-500',
    category: 'automation',
    helpUrl: 'https://zapier.com/app/dashboard',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/...', type: 'text' },
    ],
    setupInstructions: [
      'Log in at zapier.com and create a new Zap',
      'Choose "Webhooks by Zapier" as the trigger → "Catch Hook"',
      'Zapier will give you a unique Webhook URL — copy it',
      'Paste the URL above and configure your Zap\'s actions (e.g. send to Google Sheets, email, CRM, etc.)',
    ],
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Advanced automation workflows with Make',
    icon: Webhook,
    color: 'text-violet-500',
    category: 'automation',
    helpUrl: 'https://www.make.com/en',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hook.eu1.make.com/...', type: 'text' },
    ],
    setupInstructions: [
      'Log in at make.com and create a new Scenario',
      'Add a "Webhooks" module → "Custom webhook" as the trigger',
      'Click "Add" to create a new webhook and copy the generated URL',
      'Paste the URL above, then build your scenario\'s action modules',
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Custom AI models and GPT integration',
    icon: Bot,
    color: 'text-emerald-500',
    category: 'automation',
    helpUrl: 'https://platform.openai.com/api-keys',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'sk-...', type: 'password' },
      { key: 'org_id', label: 'Organization ID (optional)', placeholder: 'org-...', type: 'text' },
    ],
    setupInstructions: [
      'Go to platform.openai.com → API keys',
      'Click "Create new secret key", give it a name, and copy it immediately (starts with "sk-")',
      '(Optional) Find your Organization ID under Settings → Organization',
      'Paste your API Key (and optionally Org ID) above',
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Site hosting via Cloudflare R2, Pages & CDN with automatic SSL',
    icon: Globe,
    color: 'text-orange-500',
    category: 'hosting',
    helpUrl: 'https://dash.cloudflare.com',
    fields: [
      { key: 'account_id', label: 'Account ID', placeholder: 'Your Cloudflare Account ID', type: 'text' },
      { key: 'api_token', label: 'API Token', placeholder: 'Your API token with R2 & DNS permissions', type: 'password' },
      { key: 'r2_bucket_name', label: 'R2 Bucket Name', placeholder: 'quooro-sites', type: 'text' },
      { key: 'zone_id', label: 'Zone ID', placeholder: 'Zone ID for your domain', type: 'text' },
      { key: 'site_domain', label: 'Site Domain', placeholder: 'quooro.site', type: 'text' },
    ],
    setupInstructions: [
      'Sign up at dash.cloudflare.com and add your domain (e.g. quooro.site)',
      'Find your Account ID and Zone ID on the domain overview page (right sidebar)',
      'Go to R2 → Create Bucket → name it "quooro-sites" → enable public access',
      'Go to My Profile → API Tokens → Create Token with "Edit R2" and "Edit DNS" permissions',
      'Paste all values above — published sites will be hosted on {subdomain}.{your-domain}',
    ],
  },
];

const CATEGORIES = [
  { key: 'personal', label: 'Personal' },
  { key: 'hosting', label: 'Hosting & CDN' },
  { key: 'telephony', label: 'Telephony' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'email', label: 'Email' },
  { key: 'payments', label: 'Payments' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'video', label: 'Video' },
  { key: 'automation', label: 'Automation & AI' },
] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/* ─── Component ─── */
export default function ConnectionsSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Record<string, ConnectionData>>({});
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('provider, credentials, is_connected, connected_at')
        .eq('user_id', user!.id);

      if (error) throw error;

      const connMap: Record<string, ConnectionData> = {};
      const formMap: Record<string, Record<string, string>> = {};

      data?.forEach(conn => {
        connMap[conn.provider] = conn as ConnectionData;
        formMap[conn.provider] = (conn.credentials as Record<string, string>) || {};
      });

      setConnections(connMap);
      setFormData(formMap);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (provider: string, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), [key]: value },
    }));
  };

  const handleSave = async (provider: ConnectionProvider) => {
    if (!user) return;

    const fields = formData[provider.id] || {};
    const requiredFields = provider.fields.filter(f => !f.label.includes('optional'));
    const missingFields = requiredFields.filter(f => !fields[f.key]?.trim());

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setSavingProvider(provider.id);
    try {
      const { error } = await supabase
        .from('user_connections')
        .upsert({
          user_id: user.id,
          provider: provider.id,
          credentials: fields,
          is_connected: true,
          connected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' });

      if (error) throw error;

      setConnections(prev => ({
        ...prev,
        [provider.id]: {
          provider: provider.id,
          credentials: fields,
          is_connected: true,
          connected_at: new Date().toISOString(),
        },
      }));

      // Also sync phone to profile if it's the personal phone
      if (provider.id === 'personal_phone' && fields.phone_number) {
        await supabase
          .from('profiles')
          .update({ phone: fields.phone_number })
          .eq('user_id', user.id);
      }

      toast.success(`${provider.name} connected successfully`);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(`Failed to save ${provider.name} credentials`);
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDisconnect = async (provider: ConnectionProvider) => {
    if (!user) return;

    setSavingProvider(provider.id);
    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider.id);

      if (error) throw error;

      setConnections(prev => {
        const copy = { ...prev };
        delete copy[provider.id];
        return copy;
      });
      setFormData(prev => {
        const copy = { ...prev };
        delete copy[provider.id];
        return copy;
      });

      toast.success(`${provider.name} disconnected`);
    } catch (err) {
      toast.error(`Failed to disconnect ${provider.name}`);
    } finally {
      setSavingProvider(null);
    }
  };

  const handleGoogleCalendarAuthorize = async () => {
    if (!user) return;
    const conn = connections['google_calendar'];
    const creds = conn?.credentials as Record<string, string> | undefined;
    if (!creds?.client_id || !creds?.client_secret) {
      toast.error('Please save your Google Client ID and Client Secret first');
      return;
    }

    setSavingProvider('google_calendar');
    try {
      const redirectUri = `${window.location.origin}/lounge/google-calendar-callback`;
      const res = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'get_auth_url',
          redirect_uri: redirectUri,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      // Redirect to Google consent screen
      window.location.href = res.data.auth_url;
    } catch (err: any) {
      console.error('Google auth error:', err);
      toast.error(err.message || 'Failed to start Google authorization');
    } finally {
      setSavingProvider(null);
    }
  };

  const togglePasswordVisibility = (fieldKey: string) => {
    setVisiblePasswords(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const connectedCount = Object.values(connections).filter(c => c.is_connected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plug className="w-5 h-5" />
                <div>
                  <CardTitle className="text-lg">External Connections</CardTitle>
                  <CardDescription>
                    Connect third-party services for calling, messaging, email, payments and more
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Link2 className="w-3 h-3" />
                {connectedCount} connected
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Provider cards grouped by category */}
      {CATEGORIES.map(category => {
        const categoryProviders = PROVIDERS.filter(p => p.category === category.key);
        if (categoryProviders.length === 0) return null;

        return (
          <div key={category.key} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {category.label}
            </h3>
            {categoryProviders.map(provider => {
              const conn = connections[provider.id];
              const isConnected = conn?.is_connected;
              const isSaving = savingProvider === provider.id;
              const fields = formData[provider.id] || {};
              const Icon = provider.icon;

              return (
                <motion.div key={provider.id} variants={itemVariants}>
                  <Collapsible defaultOpen={false}>
                    <Card className={isConnected ? 'border-primary/20' : ''}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-3 cursor-pointer select-none group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isConnected ? 'bg-primary/10' : 'bg-muted'
                              }`}>
                                <Icon className={`w-5 h-5 ${isConnected ? 'text-primary' : provider.color}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">{provider.name}</CardTitle>
                                  {isConnected && (
                                    <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-0">
                                      <Check className="w-2.5 h-2.5" />
                                      Connected
                                    </Badge>
                                  )}
                                  {provider.comingSoon && (
                                    <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                                  )}
                                </div>
                                <CardDescription>{provider.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {provider.helpUrl && (
                                <a
                                  href={provider.helpUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                  Get credentials <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        {!provider.comingSoon && provider.fields.length > 0 && (
                          <CardContent className="space-y-3">
                            {provider.fields.map(field => {
                              const fieldId = `${provider.id}_${field.key}`;
                              const isPassword = field.type === 'password';
                              const showPassword = visiblePasswords[fieldId];

                              return (
                                <div key={field.key} className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                                  <div className="relative">
                                    <Input
                                      type={isPassword && !showPassword ? 'password' : 'text'}
                                      placeholder={field.placeholder}
                                      value={fields[field.key] || ''}
                                      onChange={e => updateField(provider.id, field.key, e.target.value)}
                                      className="font-mono text-sm pr-10"
                                    />
                                    {isPassword && (
                                      <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(fieldId)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <Button
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleSave(provider)}
                                className="gap-1.5"
                              >
                                {isSaving && savingProvider === provider.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isConnected ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Link2 className="w-3.5 h-3.5" />
                                )}
                                {isConnected ? 'Update' : 'Save Credentials'}
                              </Button>

                              {provider.id === 'google_calendar' && isConnected && (
                                <Button
                                  size="sm"
                                  variant={conn?.credentials && (conn.credentials as Record<string, string>).access_token ? 'outline' : 'default'}
                                  disabled={isSaving}
                                  onClick={handleGoogleCalendarAuthorize}
                                  className="gap-1.5"
                                >
                                  {isSaving && savingProvider === 'google_calendar' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  )}
                                  {conn?.credentials && (conn.credentials as Record<string, string>).access_token
                                    ? 'Re-authorize'
                                    : 'Authorize with Google'}
                                </Button>
                              )}

                              {isConnected && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isSaving}
                                  onClick={() => handleDisconnect(provider)}
                                  className="gap-1.5 text-destructive hover:text-destructive"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                  Disconnect
                                </Button>
                              )}

                              {isConnected && conn.connected_at && (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  Connected {new Date(conn.connected_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {provider.setupInstructions && provider.setupInstructions.length > 0 && (
                              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground/70">Setup Instructions:</p>
                                <ol className="list-decimal list-inside space-y-0.5">
                                  {provider.setupInstructions.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </CardContent>
                        )}

                        {provider.comingSoon && (
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                              <Zap className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Coming soon — connect your {provider.name} account
                              </p>
                            </div>
                            {provider.setupInstructions && provider.setupInstructions.length > 0 && (
                              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground/70">What to expect:</p>
                                <ol className="list-decimal list-inside space-y-0.5">
                                  {provider.setupInstructions.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </motion.div>
              );
            })}
          </div>
        );
      })}

      {/* Security note */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/70">Security Notice</p>
            <p>All credentials are encrypted at rest and transmitted over secure connections. Only you can access your stored credentials. We never share your API keys with third parties.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
