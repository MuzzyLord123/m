import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, Lock, Megaphone, Plus, Search, Settings, Users, Send,
  Smile, MoreVertical, Pin, PinOff, Edit2, Trash2,
  MessageSquare, X, Check, Grid3X3,
  Archive, Phone, PhoneOff, Video, Paperclip,
  ChevronDown, UserPlus, AtSign, Bell, BellOff,
  Circle, LogOut, Info, Star, Copy, Forward,
  Inbox, Clock, Contact, PhoneCall, Keyboard,
  Delete, Volume2, VolumeX,
  Mic, MicOff, VideoOff, Monitor, LinkIcon, Eye, EyeOff,
  Moon, Sun, Globe, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useCommChannels, CommChannel } from '@/hooks/useCommChannels';
import { useCommMessages, CommMessage } from '@/hooks/useCommMessages';
import { useCommPresence } from '@/hooks/useCommPresence';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';
import { CallPanel } from './CallPanel';
import { IncomingCallOverlay } from './IncomingCallOverlay';
import { useTeamCalls } from '@/hooks/useTeamCalls';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PollCard } from './PollCard';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '💯', '🚀', '💬', '👏', '🤔', '😍', '🙏', '💪'];

// ─── Presence Dot ──────────────────────────────────
function PresenceDot({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    busy: 'bg-destructive',
    dnd: 'bg-destructive',
    offline: 'bg-muted-foreground/40',
  };
  const sizes = { sm: 'h-2.5 w-2.5', md: 'h-3 w-3' };
  return <span className={cn(sizes[size], 'rounded-full block border-2 border-card', colors[status] || colors.offline)} />;
}

// ─── Typing dots animation ─────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}

// ─── Time label ────────────────────────────────────
function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 7 * 86400000) return format(d, 'EEE');
  return format(d, 'dd/MM/yy');
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
}

// ─── Settings Dialog ───────────────────────────────
function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [notifSound, setNotifSound] = useState(true);
  const [showTyping, setShowTyping] = useState(true);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [emailDigest, setEmailDigest] = useState('daily');
  const [saving, setSaving] = useState(false);

  // Connections state
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [vonageKey, setVonageKey] = useState('');
  const [vonageSecret, setVonageSecret] = useState('');

  // Load settings
  useEffect(() => {
    if (!open || !user?.id) return;
    (async () => {
      const { data } = await supabase.from('comm_user_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setNotifSound(data.notification_sound ?? true);
        setShowTyping(data.show_typing_indicator ?? true);
        setShowReadReceipts(data.show_read_receipts ?? true);
        setShowLastSeen(data.show_last_seen ?? true);
        setCompactMode(data.compact_mode ?? false);
        setQuietStart(data.quiet_hours_start || '22:00');
        setQuietEnd(data.quiet_hours_end || '08:00');
        setEmailDigest(data.email_digest || 'daily');
      }
    })();
  }, [open, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      notification_sound: notifSound,
      show_typing_indicator: showTyping,
      show_read_receipts: showReadReceipts,
      show_last_seen: showLastSeen,
      compact_mode: compactMode,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
      email_digest: emailDigest,
    };
    const { error } = await supabase.from('comm_user_settings').upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) toast.error('Failed to save settings');
    else { toast.success('Settings saved'); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Communication Settings</DialogTitle>
          <DialogDescription className="text-xs">Customize your messaging experience</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="notifications" className="flex-1 overflow-hidden">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs">Privacy</TabsTrigger>
            <TabsTrigger value="display" className="text-xs">Display</TabsTrigger>
            <TabsTrigger value="connections" className="text-xs">Connections</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[340px] mt-4">
            <TabsContent value="notifications" className="space-y-5 px-1 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notification Sound</p>
                  <p className="text-xs text-muted-foreground">Play sounds for new messages</p>
                </div>
                <Switch checked={notifSound} onCheckedChange={setNotifSound} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Quiet Hours</p>
                <p className="text-xs text-muted-foreground">Mute all notifications during these hours</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">From</Label>
                    <Input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="h-8 text-xs w-28" />
                  </div>
                  <span className="text-muted-foreground mt-4">→</span>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">To</Label>
                    <Input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="h-8 text-xs w-28" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Email Digest</p>
                <p className="text-xs text-muted-foreground">Get a summary of unread messages</p>
                <Select value={emailDigest} onValueChange={setEmailDigest}>
                  <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-5 px-1 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Typing Indicator</p>
                  <p className="text-xs text-muted-foreground">Show others when you're typing</p>
                </div>
                <Switch checked={showTyping} onCheckedChange={setShowTyping} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Read Receipts</p>
                  <p className="text-xs text-muted-foreground">Let others see when you've read messages</p>
                </div>
                <Switch checked={showReadReceipts} onCheckedChange={setShowReadReceipts} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Last Seen</p>
                  <p className="text-xs text-muted-foreground">Show your online status to others</p>
                </div>
                <Switch checked={showLastSeen} onCheckedChange={setShowLastSeen} />
              </div>
            </TabsContent>

            <TabsContent value="display" className="space-y-5 px-1 m-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing between messages</p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </TabsContent>

            <TabsContent value="connections" className="space-y-5 px-1 m-0">
              <div className="space-y-1">
                <p className="text-sm font-medium">Phone & Calling Integrations</p>
                <p className="text-xs text-muted-foreground">Connect your telephony provider to make real calls from the dial pad</p>
              </div>

              {/* Twilio */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Twilio</p>
                      <p className="text-[10px] text-muted-foreground">Voice, SMS & Video</p>
                    </div>
                  </div>
                  <Badge variant={twilioSid ? 'default' : 'outline'} className="text-[9px]">
                    {twilioSid ? 'Connected' : 'Not connected'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Account SID</Label>
                    <Input placeholder="AC..." value={twilioSid} onChange={e => setTwilioSid(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Auth Token</Label>
                    <Input type="password" placeholder="••••••••" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Phone Number</Label>
                    <Input placeholder="+1234567890" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <Button size="sm" className="w-full text-xs" disabled={!twilioSid || !twilioToken || !twilioPhone}
                  onClick={() => toast.info('Twilio credentials saved locally. Backend integration coming soon.')}>
                  Save Twilio Credentials
                </Button>
              </div>

              {/* Vonage */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Vonage</p>
                      <p className="text-[10px] text-muted-foreground">Communication APIs</p>
                    </div>
                  </div>
                  <Badge variant={vonageKey ? 'default' : 'outline'} className="text-[9px]">
                    {vonageKey ? 'Connected' : 'Not connected'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">API Key</Label>
                    <Input placeholder="Your API Key" value={vonageKey} onChange={e => setVonageKey(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">API Secret</Label>
                    <Input type="password" placeholder="••••••••" value={vonageSecret} onChange={e => setVonageSecret(e.target.value)} className="h-8 text-xs font-mono" />
                  </div>
                </div>
                <Button size="sm" className="w-full text-xs" disabled={!vonageKey || !vonageSecret}
                  onClick={() => toast.info('Vonage credentials saved locally. Backend integration coming soon.')}>
                  Save Vonage Credentials
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">More integrations coming soon: Plivo, Bandwidth, etc.</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="pt-2 border-t border-border mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Join Channel Dialog ───────────────────────────
function JoinChannelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!user?.id || !code.trim()) return;
    setJoining(true);
    const { data: ch, error } = await supabase
      .from('comm_channels')
      .select('id, name')
      .eq('join_code', code.toUpperCase().trim())
      .maybeSingle();

    if (error || !ch) {
      toast.error('Invalid channel code');
      setJoining(false);
      return;
    }

    const { error: joinErr } = await supabase.from('comm_channel_members').upsert(
      { channel_id: ch.id, user_id: user.id, role: 'member' },
      { onConflict: 'channel_id,user_id' }
    );

    setJoining(false);
    if (joinErr) toast.error('Failed to join channel');
    else { toast.success(`Joined #${ch.name}`); setCode(''); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Join Channel by Code</DialogTitle>
          <DialogDescription className="text-xs">Enter the 6-character code shared by the channel admin.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Input
            placeholder="e.g. A2B3C4"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-2xl font-mono tracking-[0.5em] h-14 uppercase"
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleJoin} disabled={code.length < 6 || joining}>
            {joining ? 'Joining...' : 'Join Channel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Member Dialog ─────────────────────────────
function AddMemberDialog({ open, onClose, channelId }: { open: boolean; onClose: () => void; channelId: string }) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!email.trim() || !channelId) return;
    setAdding(true);

    // Look up user by email from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('email', email.trim())
      .maybeSingle();

    if (!profile) {
      // Try partial match
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${email.trim()}%`)
        .limit(1);

      if (!profiles || profiles.length === 0) {
        toast.error('User not found. Check the name or email.');
        setAdding(false);
        return;
      }

      const { error } = await supabase.from('comm_channel_members').upsert(
        { channel_id: channelId, user_id: profiles[0].user_id, role: 'member' },
        { onConflict: 'channel_id,user_id' }
      );
      setAdding(false);
      if (error) toast.error('Failed to add member');
      else { toast.success(`Added ${profiles[0].full_name}`); setEmail(''); onClose(); }
      return;
    }

    const { error } = await supabase.from('comm_channel_members').upsert(
      { channel_id: channelId, user_id: profile.user_id, role: 'member' },
      { onConflict: 'channel_id,user_id' }
    );
    setAdding(false);
    if (error) toast.error('Failed to add member');
    else { toast.success(`Added ${profile.full_name || email}`); setEmail(''); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">Add Member</DialogTitle>
          <DialogDescription className="text-xs">Add a team member by name or email.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Input
            placeholder="Name or email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            className="text-sm"
          />
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!email.trim() || adding}>
            {adding ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Phone Link Call Overlay ───────────────────────
function PhoneLinkCallOverlay({ number, startTime, isMuted, onToggleMute, onEnd }: {
  number: string; startTime: number; isMuted: boolean; onToggleMute: () => void; onEnd: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[340px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden"
    >
      {/* Pulsing top bar */}
      <div className="h-1 bg-emerald-500 animate-pulse" />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected via Phone Link
          </div>
          <p className="text-2xl font-mono font-bold text-foreground tracking-wide">{number}</p>
          <p className="text-sm font-mono text-muted-foreground">{fmt(elapsed)}</p>
        </div>

        {/* Call controls */}
        <div className="flex items-center justify-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? 'destructive' : 'outline'}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={onToggleMute}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
          </Tooltip>

          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={onEnd}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => {
                const link = document.createElement('a');
                link.href = `tel:${number}`;
                link.click();
              }}>
                <Phone className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redial</TooltipContent>
          </Tooltip>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">Call is handled by your linked device</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function TeamComms() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const { channels, loading: channelsLoading, createChannel, joinChannel, leaveChannel, fetchChannels } = useCommChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const { messages, loading: msgsLoading, sending, sendMessage, editMessage, deleteMessage, toggleReaction, pinMessage } = useCommMessages(activeChannelId);
  useCommPresence();
  const { incomingCall, activeCallSession, initiateCall, acceptCall, declineCall, endCallSession, setActiveCallSession } = useTeamCalls();
  const [messageInput, setMessageInput] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video' } | null>(null);
  const [showDialPad, setShowDialPad] = useState(false);
  const [phoneLinkCall, setPhoneLinkCall] = useState<{ number: string; startTime: number; isMuted: boolean } | null>(null);
  const [callProvider, setCallProvider] = useState<'phone-link' | 'twilio' | 'vonage'>('phone-link');
  const [activeIconTab, setActiveIconTab] = useState<'inbox' | 'history' | 'contacts'>('inbox');
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinChannel, setShowJoinChannel] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [createdChannelCode, setCreatedChannelCode] = useState<string | null>(null);
  const [dialNumber, setDialNumber] = useState('');
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mobileView, setMobileView] = useState<'channels' | 'chat'>('channels');

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      const defaultCh = channels.find(c => c.is_default) || channels[0];
      setActiveChannelId(defaultCh.id);
    }
  }, [channels, activeChannelId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch presence
  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase.from('comm_presence').select('user_id, status');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.user_id] = p.status; });
        setPresenceMap(map);
      }
    };
    fetchPresence();
    const sub = supabase.channel('comm-presence-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comm_presence' }, () => fetchPresence())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Fetch members
  useEffect(() => {
    if (!activeChannelId) return;
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('comm_channel_members')
        .select('*')
        .eq('channel_id', activeChannelId);
      if (data) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds);
        const profileMap: Record<string, any> = {};
        profiles?.forEach(p => { profileMap[p.user_id] = p; });
        setMembers(data.map(m => ({ ...m, profile: profileMap[m.user_id] || {} })));
      }
    };
    fetchMembers();
    const sub = supabase.channel(`members-${activeChannelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comm_channel_members', filter: `channel_id=eq.${activeChannelId}` }, () => fetchMembers())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeChannelId]);

  // Fetch call history
  useEffect(() => {
    if (!user?.id) return;
    const fetchCallHistory = async () => {
      setCallHistoryLoading(true);
      const { data } = await supabase
        .from('call_sessions')
        .select('*')
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        // Get all unique user IDs to resolve names
        const userIds = new Set<string>();
        data.forEach((c: any) => {
          userIds.add(c.caller_id);
          userIds.add(c.callee_id);
        });
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', Array.from(userIds));
        const profileMap: Record<string, any> = {};
        profiles?.forEach(p => { profileMap[p.user_id] = p; });

        setCallHistory(data.map((c: any) => ({
          ...c,
          callerProfile: profileMap[c.caller_id] || null,
          calleeProfile: profileMap[c.callee_id] || null,
        })));
      } else {
        setCallHistory([]);
      }
      setCallHistoryLoading(false);
    };
    fetchCallHistory();

    // Subscribe to new call sessions
    const sub = supabase.channel('call-history-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => fetchCallHistory())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user?.id]);

  // Handlers
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput('');
    inputRef.current?.focus();
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const ch = await createChannel(newChannelName, newChannelType, newChannelDesc);
    if (ch) {
      // Fetch the join code from the created channel
      const { data: freshCh } = await supabase.from('comm_channels').select('join_code').eq('id', ch.id).single();
      const code = freshCh?.join_code;
      setCreatedChannelCode(code || null);
      toast.success(`#${newChannelName} created`);
      setNewChannelName('');
      setNewChannelDesc('');
      setActiveChannelId(ch.id);
      // Don't close dialog yet – show the join code
      if (!code) setShowNewChannel(false);
    }
  };

  const handleStartEdit = (msg: CommMessage) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await editMessage(editingId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const handleDialCall = () => {
    if (!dialNumber.trim()) return;
    const cleanNumber = dialNumber.replace(/\s/g, '');
    if (callProvider === 'phone-link') {
      const link = document.createElement('a');
      link.href = `tel:${cleanNumber}`;
      link.click();
    } else if (callProvider === 'twilio') {
      toast.info('Twilio call initiated. Configure credentials in Settings → Connections.');
    } else if (callProvider === 'vonage') {
      toast.info('Vonage call initiated. Configure credentials in Settings → Connections.');
    }
    setPhoneLinkCall({ number: cleanNumber, startTime: Date.now(), isMuted: false });
    setShowDialPad(false);
  };

  const endPhoneLinkCall = () => {
    setPhoneLinkCall(null);
    setDialNumber('');
    toast.success('Call ended');
  };

  const filteredChannels = channels.filter(c =>
    !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: CommMessage[] }[]>((acc, msg) => {
    const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = acc[acc.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else acc.push({ date, messages: [msg] });
    return acc;
  }, []);

  const onlineCount = useMemo(() => Object.values(presenceMap).filter(s => s === 'online').length, [presenceMap]);

  const iconTabs = [
    { key: 'inbox' as const, icon: Inbox, label: 'Channels', badge: channels.length },
    { key: 'history' as const, icon: Clock, label: 'History' },
    { key: 'contacts' as const, icon: Contact, label: 'Contacts' },
  ];

  const dialKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  const dialLabels: Record<string, string> = {
    '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
    '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ', '0': '+',
  };

  // Mobile: switch to chat when selecting a channel
  const selectChannel = (id: string) => {
    setActiveChannelId(id);
    setActiveIconTab('inbox');
    if (isMobile) setMobileView('chat');
  };

  const goBackToChannels = () => {
    setMobileView('channels');
    setShowInfoPanel(false);
  };

  // ─── Shared sub-renders ──────────────────────────────

  const renderIconRail = () => (
    <div className="w-[60px] shrink-0 border-r border-border flex flex-col items-center py-4 gap-1 bg-muted/20">
      <div className="mb-4 relative">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {user?.email?.substring(0, 2).toUpperCase() || 'ME'}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status="online" /></span>
      </div>
      <Separator className="w-8 mb-2" />
      {iconTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeIconTab === tab.key;
        return (
          <Tooltip key={tab.key}>
            <TooltipTrigger asChild>
              <button onClick={() => setActiveIconTab(tab.key)}
                className={cn("relative h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <Icon className="w-[18px] h-[18px]" />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">{tab.badge}</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{tab.label}</TooltipContent>
          </Tooltip>
        );
      })}
      <div className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => setShowSettings(true)} className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Settings</TooltipContent>
      </Tooltip>
    </div>
  );

  const renderChannelList = () => (
    <div className={cn("flex flex-col bg-card", isMobile ? "flex-1" : "w-[280px] shrink-0 border-r border-border")}>
      {/* Search header */}
      <div className="p-2.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm bg-muted/40 border-border/50 rounded-xl" />
        </div>
        <Popover open={showDialPad} onOpenChange={setShowDialPad}>
          <PopoverTrigger asChild>
            <Button variant={showDialPad ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 shrink-0"><Keyboard className="w-4 h-4 text-muted-foreground" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4 bg-card border-border z-50" align="start" side="bottom">
            <div className="space-y-3">
              <h3 className="text-sm font-bold">Dial Pad</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {['phone-link', 'twilio', 'vonage'].map(p => (
                  <button key={p} onClick={() => setCallProvider(p as any)}
                    className={cn("flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all text-[10px] font-medium",
                      callProvider === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50")}>
                    {p === 'phone-link' ? <Monitor className="w-4 h-4" /> : p === 'twilio' ? <Phone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {p === 'phone-link' ? 'Phone Link' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <div className="bg-muted/30 rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-mono font-semibold tracking-wider min-h-[28px]">{dialNumber || '\u00A0'}</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {dialKeys.map(k => (
                  <button key={k} onClick={() => setDialNumber(prev => prev + k)}
                    className="h-12 rounded-xl bg-muted/40 hover:bg-muted transition-colors flex flex-col items-center justify-center">
                    <span className="text-base font-semibold">{k}</span>
                    {dialLabels[k] && <span className="text-[7px] text-muted-foreground tracking-widest">{dialLabels[k]}</span>}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setDialNumber(prev => prev.slice(0, -1))} disabled={!dialNumber}><Delete className="w-4 h-4" /></Button>
                <Button size="icon" className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleDialCall}><Phone className="w-5 h-5" /></Button>
                <div className="w-9" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowJoinChannel(true)}><LinkIcon className="w-4 h-4 text-muted-foreground" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowNewChannel(true)}><Plus className="w-4 h-4 text-muted-foreground" /></Button>
      </div>

      {/* Mobile icon tabs (horizontal) */}
      {isMobile && (
        <div className="flex items-center gap-1 px-2.5 pb-2">
          {iconTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeIconTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveIconTab(tab.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium transition-all",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground")}>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="px-1">
          {activeIconTab === 'history' ? (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5">
                <p className="text-xs font-bold text-foreground">Call History</p>
                <p className="text-[10px] text-muted-foreground">Recent & missed calls</p>
              </div>
              <Separator className="my-1" />
              {callHistoryLoading ? (
                <div className="space-y-2 p-2">{[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-2.5 p-2 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1"><div className="h-3 bg-muted rounded w-24" /><div className="h-2.5 bg-muted rounded w-16" /></div>
                  </div>
                ))}</div>
              ) : callHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">No call history</p>
                </div>
              ) : (
                callHistory.map(call => {
                  const isOutgoing = call.caller_id === user?.id;
                  const otherProfile = isOutgoing ? call.calleeProfile : call.callerProfile;
                  const otherName = otherProfile?.full_name || 'Unknown';
                  const isMissed = call.status === 'missed';
                  const isDeclined = call.status === 'declined';
                  const duration = call.started_at && call.ended_at ? Math.round((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000) : 0;
                  const durationStr = duration > 0 ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : null;
                  return (
                    <button key={call.id}
                      className={cn("w-full flex items-center gap-2.5 rounded-xl px-2.5 py-3 transition-all text-left hover:bg-muted/40", isMissed && "bg-destructive/5")}
                      onClick={() => { if (otherProfile?.user_id) { initiateCall(otherProfile.user_id, call.call_type as 'audio' | 'video'); setActiveCall({ type: call.call_type as 'audio' | 'video' }); } }}>
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={otherProfile?.avatar_url || ''} />
                        <AvatarFallback className={cn("text-[10px] font-bold", isMissed ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}>{getInitials(otherName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold truncate", isMissed && "text-destructive")}>{otherName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isOutgoing ? <PhoneCall className="w-2.5 h-2.5 text-muted-foreground rotate-[135deg]" /> : isMissed ? <PhoneOff className="w-2.5 h-2.5 text-destructive" /> : <PhoneCall className="w-2.5 h-2.5 text-muted-foreground" />}
                          <span className={cn("text-[10px]", isMissed ? "text-destructive" : "text-muted-foreground")}>{isMissed ? 'Missed' : isDeclined ? 'Declined' : isOutgoing ? 'Outgoing' : 'Incoming'}{durationStr && ` · ${durationStr}`}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{timeLabel(call.created_at)}</span>
                        {call.call_type === 'video' ? <Video className="w-3 h-3 text-muted-foreground" /> : <Phone className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : activeIconTab === 'contacts' ? (
            <div className="p-3 space-y-2">
              <Button size="sm" className="w-full gap-2 text-xs h-10 rounded-xl" onClick={() => setShowAddMember(true)}>
                <UserPlus className="w-3.5 h-3.5" /> Add Contact
              </Button>
              <Separator />
              {members.length > 0 ? members.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 hover:bg-muted/40 transition-colors">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10"><AvatarImage src={m.profile?.avatar_url || ''} /><AvatarFallback className="text-[10px] bg-muted text-foreground font-bold">{getInitials(m.profile?.full_name || 'U')}</AvatarFallback></Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status={presenceMap[m.user_id] || 'offline'} /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{m.profile?.full_name || 'Unknown'}</p>
                    <p className="text-[10px] text-muted-foreground">{presenceMap[m.user_id] === 'online' ? 'Online' : presenceMap[m.user_id] === 'away' ? 'Away' : 'Offline'}</p>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(m.profile?.full_name || 'Unknown'); toast.success('Name copied'); }} title="Copy name"><Copy className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { initiateCall(m.user_id, 'audio', activeChannelId || undefined); setActiveCall({ type: 'audio' }); }}><Phone className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { initiateCall(m.user_id, 'video', activeChannelId || undefined); setActiveCall({ type: 'video' }); }}><Video className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Contact className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">No contacts yet</p>
                </div>
              )}
            </div>
          ) : channelsLoading ? (
            <div className="space-y-0.5 p-1">{[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3 bg-muted rounded w-24" /><div className="h-2.5 bg-muted rounded w-36" /></div>
              </div>
            ))}</div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground mb-4">No conversations yet</p>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setShowNewChannel(true)}><Plus className="w-3 h-3" /> Create Channel</Button>
                <Button size="sm" variant="ghost" className="text-xs gap-1.5" onClick={() => setShowJoinChannel(true)}><LinkIcon className="w-3 h-3" /> Join by Code</Button>
              </div>
            </div>
          ) : (
            filteredChannels.map(ch => (
              <button key={ch.id} onClick={() => selectChannel(ch.id)}
                className={cn("w-full flex items-center gap-2.5 rounded-xl px-2.5 py-3 transition-all text-left group",
                  ch.id === activeChannelId ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40 border border-transparent")}>
                <div className="relative shrink-0">
                  {ch.channel_type === 'direct' ? (
                    <Avatar className="h-11 w-11"><AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">{ch.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
                      {ch.channel_type === 'private' ? <Lock className="w-4 h-4 text-primary" /> : ch.channel_type === 'announcement' ? <Megaphone className="w-4 h-4 text-primary" /> : <Hash className="w-4 h-4 text-primary" />}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status={presenceMap[ch.created_by] || 'offline'} /></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[13px] font-semibold truncate">{ch.name}</span>
                      {ch.is_default && <Pin className="w-2.5 h-2.5 text-muted-foreground shrink-0 rotate-45" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeLabel(ch.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate">{ch.description || 'No messages yet'}</p>
                    {(ch.unread_count || 0) > 0 && (
                      <span className="h-[18px] min-w-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shrink-0">{ch.unread_count}</span>
                    )}
                  </div>
                </div>
                {isMobile && <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Mobile: Settings + dial button at bottom */}
      {isMobile && (
        <div className="flex items-center justify-around py-2 border-t border-border/30">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setShowDialPad(true)}><Phone className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setShowSettings(true)}><Settings className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );

  const renderChatArea = () => (
    <div className="flex-1 flex flex-col min-w-0 bg-background relative">
      {activeChannel ? (
        <>
          {/* Chat Header */}
          <div className={cn("border-b border-border flex items-center justify-between px-3 shrink-0 bg-card", isMobile ? "h-14" : "h-14 px-4")}>
            <div className="flex items-center gap-2 min-w-0">
              {isMobile && (
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={goBackToChannels}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{activeChannel.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate leading-tight">{activeChannel.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">{members.length} member{members.length !== 1 ? 's' : ''} · {onlineCount} online</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {activeChannel.join_code && !isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => { navigator.clipboard.writeText(activeChannel.join_code || ''); toast.success('Join code copied!'); }}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 hover:bg-muted/60 text-xs font-mono font-bold transition-colors">
                      <LinkIcon className="w-3 h-3" />{activeChannel.join_code}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Click to copy join code</TooltipContent>
                </Tooltip>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { initiateCall(members[0]?.user_id, 'audio', activeChannelId || undefined); setActiveCall({ type: 'audio' }); }}><Phone className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { initiateCall(members[0]?.user_id, 'video', activeChannelId || undefined); setActiveCall({ type: 'video' }); }}><Video className="w-4 h-4" /></Button>
              <Button variant={showInfoPanel ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setShowInfoPanel(v => !v)}><Info className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="px-4 py-4 space-y-0.5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">Start the conversation</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">{activeChannel.description || 'Send a message to get things going.'}</p>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-4 py-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest shrink-0">
                        {isToday(new Date(group.messages[0].created_at)) ? 'Today' :
                         isYesterday(new Date(group.messages[0].created_at)) ? 'Yesterday' :
                         format(new Date(group.messages[0].created_at), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {group.messages.map((msg, idx) => {
                      const isOwn = msg.sender_id === user?.id;
                      const isCompactSameSender = idx > 0 && group.messages[idx - 1].sender_id === msg.sender_id &&
                        new Date(msg.created_at).getTime() - new Date(group.messages[idx - 1].created_at).getTime() < 300000;
                      // Only compact own messages; always show name+avatar for others
                      const isCompact = isOwn ? isCompactSameSender : false;
                      if (msg.is_deleted) return (
                        <div key={msg.id} className="py-1 px-2">
                          <div className="inline-block bg-muted/40 rounded-xl px-4 py-2">
                            <p className="text-xs text-muted-foreground italic">Message was deleted</p>
                          </div>
                        </div>
                      );
                      return (
                        <div key={msg.id} className={cn("group relative py-0.5", isOwn ? "flex justify-end" : "flex justify-start", !isCompact && "mt-3")}>
                          <div className={cn("flex gap-2.5", isMobile ? "max-w-[85%]" : "max-w-[75%]", isOwn && "flex-row-reverse")}>
                            {!isCompact ? (
                              <div className="relative shrink-0 mt-1">
                                <Avatar className="h-8 w-8"><AvatarImage src={msg.sender_avatar || ''} /><AvatarFallback className="text-[10px] bg-muted text-foreground font-bold">{getInitials(msg.sender_name || 'U')}</AvatarFallback></Avatar>
                                <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status={presenceMap[msg.sender_id] || 'offline'} /></span>
                              </div>
                            ) : <div className="w-8 shrink-0" />}
                            <div className="min-w-0 relative">
                              {!isCompact && (
                                <div className={cn("flex items-baseline gap-2 mb-1", isOwn && "justify-end")}>
                                  <span className="text-xs font-bold">{msg.sender_name}</span>
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                </div>
                              )}
                              <div className={cn("rounded-2xl px-4 py-2.5 relative",
                                isOwn ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-card border border-border rounded-tl-md",
                                isCompact && isOwn && "rounded-tr-2xl", isCompact && !isOwn && "rounded-tl-2xl")}>
                                {editingId === msg.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input value={editContent} onChange={e => setEditContent(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditContent(''); } }}
                                      className="text-sm h-7 bg-background/20 border-0" autoFocus />
                                    <Button size="icon" className="h-6 w-6 shrink-0" onClick={handleSaveEdit}><Check className="w-3 h-3" /></Button>
                                  </div>
                                ) : msg.message_type === 'poll' && msg.metadata?.poll_question ? (
                                  <PollCard messageId={msg.id} pollId={msg.metadata.poll_id || msg.id} question={msg.metadata.poll_question}
                                    options={msg.metadata.poll_options || []} isOwn={isOwn} />
                                ) : (
                                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                {msg.is_edited && <span className={cn("text-[9px] mt-0.5 block", isOwn ? "text-primary-foreground/50" : "text-muted-foreground/50")}>(edited)</span>}
                              </div>
                              {/* Copy button - bottom right under the message bubble */}
                              {!isMobile && (
                                <button
                                  className="absolute -bottom-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-5 w-5 rounded bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted"
                                  onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied to clipboard'); }}
                                  title="Copy text"
                                >
                                  <Copy className="w-2.5 h-2.5 text-muted-foreground" />
                                </button>
                              )}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className={cn("flex flex-wrap gap-1 mt-1", isOwn && "justify-end")}>
                                  {msg.reactions.map(r => (
                                    <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)}
                                      className="inline-flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-0.5 text-xs hover:border-primary/30 transition-colors">
                                      <span>{r.emoji}</span><span className="text-[10px] font-semibold text-muted-foreground">{r.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {msg.thread_count > 0 && (
                                <button className="flex items-center gap-1 mt-1 text-primary hover:underline text-[11px] font-medium"><MessageSquare className="w-3 h-3" />{msg.thread_count} replies</button>
                              )}
                              {msg.is_pinned && <div className={cn("absolute -top-2", isOwn ? "-left-2" : "-right-2")}><Pin className="w-3 h-3 text-primary rotate-45" /></div>}
                            </div>
                          </div>
                          {/* Hover actions (desktop) - emoji, more menu */}
                          {!isMobile && (
                            <div className={cn("absolute -top-3 opacity-0 group-hover:opacity-100 transition-all z-10", isOwn ? "right-1" : "left-10")}>
                              <div className="flex items-center bg-card border border-border rounded-lg shadow-lg shadow-black/10 overflow-hidden">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><Smile className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-1.5" align="end" side="top">
                                    <div className="flex gap-0.5">{QUICK_EMOJIS.slice(0, 8).map(e => (
                                      <button key={e} onClick={() => toggleReaction(msg.id, e)} className="text-base hover:bg-muted rounded-md p-1 transition-colors">{e}</button>
                                    ))}</div>
                                  </PopoverContent>
                                </Popover>
                                {(isOwn || isAdmin) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="h-7 w-7 flex items-center justify-center hover:bg-muted transition-colors"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[150px]">
                                      {isOwn && <DropdownMenuItem onClick={() => handleStartEdit(msg)} className="text-xs"><Edit2 className="w-3 h-3 mr-2" /> Edit</DropdownMenuItem>}
                                      <DropdownMenuItem onClick={() => pinMessage(msg.id, !msg.is_pinned)} className="text-xs">{msg.is_pinned ? <PinOff className="w-3 h-3 mr-2" /> : <Pin className="w-3 h-3 mr-2" />}{msg.is_pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteMessage(msg.id)}><Trash2 className="w-3 h-3 mr-2" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Mobile: simple action menu */}
                          {isMobile && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={cn("absolute top-1 opacity-0 group-active:opacity-100 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center shadow-sm", isOwn ? "right-0 translate-x-[calc(100%+4px)]" : "left-0 -translate-x-[calc(100%+4px)]")}>
                                  <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl">
                                <div className="flex gap-0.5 px-2 py-1.5">{QUICK_EMOJIS.slice(0, 6).map(e => (
                                  <button key={e} onClick={() => toggleReaction(msg.id, e)} className="text-lg hover:bg-muted rounded-md p-1 transition-colors">{e}</button>
                                ))}</div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied to clipboard'); }} className="text-xs gap-2"><Copy className="w-3 h-3" /> Copy text</DropdownMenuItem>
                                {isOwn && <DropdownMenuItem onClick={() => handleStartEdit(msg)} className="text-xs gap-2"><Edit2 className="w-3 h-3" /> Edit</DropdownMenuItem>}
                                {(isOwn || isAdmin) && <DropdownMenuItem onClick={() => pinMessage(msg.id, !msg.is_pinned)} className="text-xs gap-2">{msg.is_pinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}</DropdownMenuItem>}
                                {(isOwn || isAdmin) && <><DropdownMenuSeparator /><DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => deleteMessage(msg.id)}><Trash2 className="w-3 h-3" /> Delete</DropdownMenuItem></>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="h-4 px-4 flex items-center shrink-0" />

          {/* Message composer */}
          {activeChannel.channel_type !== 'announcement' || isAdmin ? (
            <div className="border-t border-border px-3 py-2.5 bg-card shrink-0" style={isMobile ? { paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' } : undefined}>
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-xl"><Paperclip className="w-[18px] h-[18px]" /></Button>
                <div className="flex-1 relative">
                  <Textarea ref={inputRef} placeholder="Write a message" value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    className="min-h-[40px] max-h-[120px] resize-none text-sm border-border/50 bg-muted/30 rounded-xl shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 pr-10"
                    rows={1} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="absolute right-2.5 bottom-2.5 text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-[18px] h-[18px]" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <div className="grid grid-cols-5 gap-0.5">{QUICK_EMOJIS.map(e => (
                        <button key={e} onClick={() => setMessageInput(prev => prev + e)} className="text-lg hover:bg-muted rounded-md p-1.5 transition-colors">{e}</button>
                      ))}</div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleSendMessage} disabled={!messageInput.trim() || sending} size="icon" className="h-10 w-10 shrink-0 rounded-full">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border p-4 text-center text-xs text-muted-foreground bg-card">
              <Megaphone className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Announcement channel — only admins can post.
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="h-20 w-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-9 h-9 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-base mb-1">Team Communications</h3>
            <p className="text-sm text-muted-foreground mb-5">Select a conversation or start a new one</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowNewChannel(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Channel</Button>
              <Button variant="outline" onClick={() => setShowJoinChannel(true)} className="gap-2"><LinkIcon className="w-4 h-4" /> Join by Code</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInfoPanel = () => (
    <AnimatePresence>
      {showInfoPanel && activeChannel && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: isMobile ? '100%' : 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className={cn("border-l border-border bg-card flex flex-col overflow-hidden shrink-0", isMobile && "fixed inset-0 z-50 border-l-0")}>
          <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
            <span className="text-sm font-semibold text-muted-foreground">Conversation Info</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setShowInfoPanel(false)}><X className="w-4 h-4" /></Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-3"><AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{activeChannel.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <h3 className="font-bold text-base">{activeChannel.name}</h3>
                {activeChannel.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{activeChannel.description}</p>}
              </div>
              {activeChannel.join_code && (
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Channel Join Code</p>
                  <button onClick={() => { navigator.clipboard.writeText(activeChannel.join_code || ''); toast.success('Copied!'); }}
                    className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 hover:border-primary/30 transition-colors">
                    <span className="text-xl font-mono font-bold tracking-[0.3em]">{activeChannel.join_code}</span>
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold">{members.length} member{members.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => setShowAddMember(true)} className="text-xs text-primary font-medium hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                </div>
                <div className="space-y-0.5">{members.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/40 transition-colors cursor-pointer group">
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9"><AvatarImage src={m.profile?.avatar_url || ''} /><AvatarFallback className="text-[10px] bg-muted text-foreground font-bold">{getInitials(m.profile?.full_name || 'U')}</AvatarFallback></Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot status={presenceMap[m.user_id] || 'offline'} /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold truncate">{m.profile?.full_name || 'Unknown'}</p>
                        {m.role === 'owner' && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">Owner</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{presenceMap[m.user_id] === 'online' ? 'Online' : presenceMap[m.user_id] === 'away' ? 'Away' : 'Offline'}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveCall({ type: 'audio' })}><Phone className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveCall({ type: 'video' })}><Video className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}</div>
              </div>
              <Separator />
              <div className="space-y-1">
                {isAdmin && (
                  <button className="w-full flex items-center gap-2.5 text-xs rounded-lg px-2 py-2.5 hover:bg-muted/40 transition-colors text-left"
                    onClick={async () => { await supabase.from('comm_channels').update({ is_archived: true }).eq('id', activeChannel.id); toast.success('Channel archived'); setShowInfoPanel(false); setActiveChannelId(null); fetchChannels(); }}>
                    <Archive className="w-3.5 h-3.5 text-muted-foreground" /> Archive Channel
                  </button>
                )}
                <button className="w-full flex items-center justify-center gap-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg py-2.5 transition-colors"
                  onClick={async () => { await leaveChannel(activeChannel.id); setShowInfoPanel(false); setActiveChannelId(null); if (isMobile) setMobileView('channels'); toast.success('Left channel'); }}>
                  <LogOut className="w-3.5 h-3.5" /> Leave Channel
                </button>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── MAIN RETURN ─────────────────────────────────────
  return (
    <div className={cn("flex h-full overflow-hidden bg-card", isMobile ? "rounded-none border-0" : "min-h-[calc(100vh-4rem)] rounded-xl border border-border")}>

      {/* MOBILE LAYOUT */}
      {isMobile ? (
        <>
          {mobileView === 'channels' && renderChannelList()}
          {mobileView === 'chat' && renderChatArea()}
          {renderInfoPanel()}
        </>
      ) : (
        /* DESKTOP LAYOUT */
        <>
          {renderIconRail()}
          {renderChannelList()}
          {renderChatArea()}
          {renderInfoPanel()}
        </>
      )}

      {/* ═══ Dialogs ═══ */}
      <Dialog open={showNewChannel} onOpenChange={v => { if (!v) { setShowNewChannel(false); setCreatedChannelCode(null); } }}>
        <DialogContent className="sm:max-w-[440px]">
          {createdChannelCode ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Channel Created! 🎉</DialogTitle>
                <DialogDescription className="text-xs">Share this code with team members so they can join.</DialogDescription>
              </DialogHeader>
              <div className="py-6 text-center">
                <div className="bg-muted/30 rounded-2xl p-6 inline-block">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-3">Channel Join Code</p>
                  <p className="text-4xl font-mono font-bold tracking-[0.4em] text-primary">{createdChannelCode}</p>
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(createdChannelCode); toast.success('Code copied!'); }}><Copy className="w-3.5 h-3.5" /> Copy Code</Button>
                </div>
              </div>
              <DialogFooter><Button size="sm" onClick={() => { setShowNewChannel(false); setCreatedChannelCode(null); }}>Done</Button></DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Create Channel</DialogTitle>
                <DialogDescription className="text-xs">Create a new channel. A unique join code will be generated automatically.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Name</Label>
                  <Input placeholder="e.g. Sales Team" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Type</Label>
                  <Select value={newChannelType} onValueChange={setNewChannelType}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public"><div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Public</div></SelectItem>
                      <SelectItem value="private"><div className="flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Private</div></SelectItem>
                      <SelectItem value="announcement"><div className="flex items-center gap-2"><Megaphone className="w-3.5 h-3.5" /> Announcement</div></SelectItem>
                      <SelectItem value="direct"><div className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Direct Message</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input placeholder="What's this about?" value={newChannelDesc} onChange={e => setNewChannelDesc(e.target.value)} className="text-sm" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewChannel(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreateChannel} disabled={!newChannelName.trim()}>Create</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <JoinChannelDialog open={showJoinChannel} onClose={() => setShowJoinChannel(false)} />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      {activeChannelId && <AddMemberDialog open={showAddMember} onClose={() => setShowAddMember(false)} channelId={activeChannelId} />}

      {/* Call Panel */}
      <AnimatePresence>
        {activeCall && activeChannelId && activeChannel && (
          <CallPanel channelId={activeChannelId} channelName={activeChannel.name} callType={activeCall.type}
            onClose={() => { if (activeCallSession) endCallSession(activeCallSession.id); setActiveCall(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {incomingCall && !activeCall && (
          <IncomingCallOverlay call={incomingCall}
            onAccept={async () => { const call = await acceptCall(incomingCall.id); if (call) { if (call.channel_id) setActiveChannelId(call.channel_id); setActiveCall({ type: call.call_type as 'audio' | 'video' }); } }}
            onDecline={() => declineCall(incomingCall.id)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phoneLinkCall && (
          <PhoneLinkCallOverlay number={phoneLinkCall.number} startTime={phoneLinkCall.startTime} isMuted={phoneLinkCall.isMuted}
            onToggleMute={() => setPhoneLinkCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)} onEnd={endPhoneLinkCall} />
        )}
      </AnimatePresence>
    </div>
  );
}
