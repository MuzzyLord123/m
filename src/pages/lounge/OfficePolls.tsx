import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Plus, Trash2, Check, Users, ArrowRight, Send, Hash, Lock, Megaphone, User, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCommChannels } from '@/hooks/useCommChannels';

interface PollOption { id: string; text: string; votes: number; voters: string[]; }
interface Poll { id: string; question: string; options: PollOption[]; createdAt: Date; isActive: boolean; totalVotes: number; sharedTo?: { type: 'channel' | 'contact'; name: string }[]; }

interface Contact {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function OfficePolls() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { channels } = useCommChannels();
  const [view, setView] = useState<'list' | 'create' | 'results'>('list');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '']);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharePollId, setSharePollId] = useState<string | null>(null);
  const [shareTab, setShareTab] = useState<'channels' | 'contacts'>('channels');
  const [shareSearch, setShareSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Load polls from DB
  const fetchPolls = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: pollsData } = await supabase.from('office_polls').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!pollsData) { setLoading(false); return; }

    const pollIds = pollsData.map(p => p.id);
    const { data: optionsData } = await supabase.from('office_poll_options').select('*').in('poll_id', pollIds.length > 0 ? pollIds : ['none']).order('sort_order');
    const { data: votesData } = await supabase.from('office_poll_votes').select('*').in('poll_id', pollIds.length > 0 ? pollIds : ['none']);

    // Get voter names
    const voterIds = [...new Set((votesData || []).map(v => v.voter_id))];
    const { data: profiles } = voterIds.length > 0 
      ? await supabase.from('profiles').select('user_id, full_name').in('user_id', voterIds)
      : { data: [] };
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || 'Unknown'; });

    const myVotedPolls = new Set<string>();

    const mapped: Poll[] = pollsData.map(p => {
      const opts = (optionsData || []).filter(o => o.poll_id === p.id);
      const votes = (votesData || []).filter(v => v.poll_id === p.id);
      
      if (votes.some(v => v.voter_id === user.id)) myVotedPolls.add(p.id);

      const options: PollOption[] = opts.map(o => {
        const optVotes = votes.filter(v => v.option_id === o.id);
        return { id: o.id, text: o.text, votes: optVotes.length, voters: optVotes.map(v => nameMap[v.voter_id] || 'Unknown') };
      });

      return {
        id: p.id, question: p.question, isActive: p.is_active,
        createdAt: new Date(p.created_at), totalVotes: votes.length, options, sharedTo: [],
      };
    });

    setPolls(mapped);
    setVotedPolls(myVotedPolls);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // Fetch contacts for share dialog
  useEffect(() => {
    if (!shareDialogOpen || !user?.id) return;
    const fetchContacts = async () => {
      setContactsLoading(true);
      const { data } = await supabase.from('profiles').select('user_id, full_name, avatar_url').neq('user_id', user.id).order('full_name');
      if (data) setContacts(data as Contact[]);
      setContactsLoading(false);
    };
    fetchContacts();
  }, [shareDialogOpen, user?.id]);

  const createPoll = async () => {
    if (!user || !newQuestion.trim()) { toast.error('Enter a question'); return; }
    const validOptions = newOptions.filter(o => o.trim());
    if (validOptions.length < 2) { toast.error('Add at least 2 options'); return; }

    const { data: pollData, error: pollError } = await supabase.from('office_polls').insert({
      user_id: user.id, question: newQuestion, is_active: true,
    } as any).select().single();

    if (pollError || !pollData) { toast.error('Failed to create poll'); return; }

    const optInserts = validOptions.map((text, i) => ({ poll_id: pollData.id, text, sort_order: i }));
    const { data: optsData } = await supabase.from('office_poll_options').insert(optInserts as any).select();

    const poll: Poll = {
      id: pollData.id, question: newQuestion, isActive: true, totalVotes: 0, createdAt: new Date(),
      options: (optsData || []).map((o: any) => ({ id: o.id, text: o.text, votes: 0, voters: [] })),
      sharedTo: [],
    };
    setPolls(prev => [poll, ...prev]);
    setNewQuestion(''); setNewOptions(['', '', '']); setView('list');
    toast.success('Poll created!');
  };

  const vote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId) || !user?.id) { toast.error('Already voted'); return; }

    const { error } = await supabase.from('office_poll_votes').insert({
      poll_id: pollId, option_id: optionId, voter_id: user.id,
    } as any);

    if (error && error.code === '23505') { toast.error('Already voted'); return; }
    if (error) { toast.error('Failed to vote'); return; }

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
    const voterName = profile?.full_name || 'You';

    setPolls(prev => prev.map(p => p.id === pollId ? {
      ...p, totalVotes: p.totalVotes + 1,
      options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1, voters: [...o.voters, voterName] } : o),
    } : p));
    setVotedPolls(prev => new Set(prev).add(pollId));
    toast.success('Vote recorded!');
  };

  const closePoll = async (id: string) => {
    await supabase.from('office_polls').update({ is_active: false } as any).eq('id', id);
    setPolls(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
  };

  const deletePoll = async (id: string) => {
    await supabase.from('office_polls').delete().eq('id', id);
    setPolls(prev => prev.filter(p => p.id !== id));
    toast.success('Deleted');
  };

  const openShareDialog = (pollId: string) => {
    setSharePollId(pollId);
    setShareSearch('');
    setShareTab('channels');
    setShareDialogOpen(true);
  };

  const sendPollToChannel = async (channelId: string, channelName: string) => {
    if (!user?.id || !sharePollId) return;
    const poll = polls.find(p => p.id === sharePollId);
    if (!poll) return;
    setSending(channelId);

    const { data: membership } = await supabase.from('comm_channel_members').select('id').eq('channel_id', channelId).eq('user_id', user.id).maybeSingle();
    if (!membership) {
      await supabase.from('comm_channel_members').insert({ channel_id: channelId, user_id: user.id, role: 'member' });
    }

    const pollContent = `📊 **Poll: ${poll.question}**\n\n${poll.options.map((o, i) => `${i + 1}. ${o.text}`).join('\n')}\n\n_Vote in Office → Polls_`;
    const { error } = await supabase.from('comm_messages').insert({
      channel_id: channelId, sender_id: user.id, content: pollContent, message_type: 'poll',
      metadata: { poll_id: poll.id, poll_question: poll.question, poll_options: poll.options.map(o => o.text) },
    });

    if (error) { toast.error('Failed to send poll'); } else {
      setPolls(prev => prev.map(p => p.id === sharePollId ? { ...p, sharedTo: [...(p.sharedTo || []), { type: 'channel', name: channelName }] } : p));
      toast.success(`Poll sent to #${channelName}`);
    }
    setSending(null);
  };

  const sendPollToContact = async (contact: Contact) => {
    if (!user?.id || !sharePollId) return;
    const poll = polls.find(p => p.id === sharePollId);
    if (!poll) return;
    setSending(contact.user_id);

    const slug = [user.id, contact.user_id].sort().join('-').substring(0, 60);
    let dmChannelId: string | null = null;

    const { data: existing } = await supabase.from('comm_channels').select('id').eq('channel_type', 'dm').eq('slug', `dm-${slug}`).maybeSingle();
    if (existing) { dmChannelId = existing.id; } else {
      const { data: newCh } = await supabase.from('comm_channels').insert({ name: `DM`, slug: `dm-${slug}`, channel_type: 'dm', created_by: user.id }).select('id').single();
      if (newCh) {
        dmChannelId = newCh.id;
        await supabase.from('comm_channel_members').insert([
          { channel_id: newCh.id, user_id: user.id, role: 'member' },
          { channel_id: newCh.id, user_id: contact.user_id, role: 'member' },
        ]);
      }
    }

    if (!dmChannelId) { toast.error('Failed to create conversation'); setSending(null); return; }

    const pollContent = `📊 **Poll: ${poll.question}**\n\n${poll.options.map((o, i) => `${i + 1}. ${o.text}`).join('\n')}\n\n_Vote in Office → Polls_`;
    const { error } = await supabase.from('comm_messages').insert({
      channel_id: dmChannelId, sender_id: user.id, content: pollContent, message_type: 'poll',
      metadata: { poll_id: poll.id, poll_question: poll.question, poll_options: poll.options.map(o => o.text) },
    });

    if (error) { toast.error('Failed to send poll'); } else {
      setPolls(prev => prev.map(p => p.id === sharePollId ? { ...p, sharedTo: [...(p.sharedTo || []), { type: 'contact', name: contact.full_name }] } : p));
      toast.success(`Poll sent to ${contact.full_name}`);
    }
    setSending(null);
  };

  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(shareSearch.toLowerCase()) && c.channel_type !== 'dm');
  const filteredContacts = contacts.filter(c => c.full_name?.toLowerCase().includes(shareSearch.toLowerCase()));
  const viewPoll = polls.find(p => p.id === selectedPoll);
  const sharePoll = polls.find(p => p.id === sharePollId);

  const channelIcon = (type: string) => {
    if (type === 'private') return <Lock className="h-3.5 w-3.5 text-muted-foreground" />;
    if (type === 'announcement') return <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Hash className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-3 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => {
          if (view !== 'list') { setView('list'); setSelectedPoll(null); }
          else navigate('/lounge/office', { state: { fromOfficeApp: true } });
        }}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{view !== 'list' ? 'Back' : 'Back to Office'}</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <BarChart3 className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold tracking-tight">Polls & Voting</span>
        <div className="flex-1" />
        {view === 'list' && (
          <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => setView('create')}>
            <Plus className="h-3.5 w-3.5" /> New Poll
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Polls</h1>
                <p className="text-sm text-muted-foreground/60 mb-6">Create polls, gather feedback, and share to channels or contacts.</p>
                {loading ? (
                  <p className="text-sm text-muted-foreground/40 py-12 text-center">Loading…</p>
                ) : polls.length === 0 ? (
                  <p className="text-sm text-muted-foreground/40 py-12 text-center">No polls yet. Create one!</p>
                ) : (
                  <div className="space-y-3">
                    {polls.map(poll => (
                      <motion.div key={poll.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="group p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                          <div className="cursor-pointer flex-1" onClick={() => { setSelectedPoll(poll.id); setView('results'); }}>
                            <h3 className="text-[13px] font-semibold text-foreground">{poll.question}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", poll.isActive ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground/50")}>
                                {poll.isActive ? 'Active' : 'Closed'}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1"><Users className="h-3 w-3" />{poll.totalVotes} votes</span>
                              {poll.sharedTo && poll.sharedTo.length > 0 && (
                                <span className="text-[10px] text-primary/60 flex items-center gap-1">
                                  <Send className="h-2.5 w-2.5" /> Shared to {poll.sharedTo.length} {poll.sharedTo.length === 1 ? 'place' : 'places'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 mt-2 sm:mt-0">
                            <button onClick={() => openShareDialog(poll.id)}
                              className="h-7 px-2.5 rounded-lg hover:bg-primary/10 flex items-center gap-1.5 text-[10px] font-medium text-primary transition-colors">
                              <Send className="h-3 w-3" /> Share
                            </button>
                            {poll.isActive && <button onClick={e => { e.stopPropagation(); closePoll(poll.id); }} className="h-7 px-2 rounded-lg hover:bg-accent text-[10px] text-muted-foreground">Close</button>}
                            <button onClick={e => { e.stopPropagation(); deletePoll(poll.id); }} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5 cursor-pointer" onClick={() => { setSelectedPoll(poll.id); setView('results'); }}>
                          {poll.options.map(opt => {
                            const pct = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
                            return (
                              <div key={opt.id} className="relative h-8 rounded-lg bg-muted/30 overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-primary/10 rounded-lg transition-all" style={{ width: `${pct}%` }} />
                                <div className="relative flex items-center justify-between px-3 h-full">
                                  <span className="text-[11px] font-medium text-foreground">{opt.text}</span>
                                  <span className="text-[10px] text-muted-foreground/60 font-mono">{Math.round(pct)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Create Poll</h1>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 block">Question</label>
                    <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="What would you like to ask?" className="h-12 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2 block">Options</label>
                    <div className="space-y-2">
                      {newOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input value={opt} onChange={e => { const next = [...newOptions]; next[i] = e.target.value; setNewOptions(next); }}
                            placeholder={`Option ${i + 1}`} className="h-10 rounded-xl text-sm" />
                          {newOptions.length > 2 && <button onClick={() => setNewOptions(prev => prev.filter((_, j) => j !== i))} className="h-8 w-8 rounded-lg hover:bg-destructive/20 flex items-center justify-center shrink-0">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>}
                        </div>
                      ))}
                    </div>
                    {newOptions.length < 6 && (
                      <Button variant="outline" size="sm" className="mt-2 h-8 gap-1.5 rounded-xl text-xs" onClick={() => setNewOptions(prev => [...prev, ''])}>
                        <Plus className="h-3 w-3" /> Add Option
                      </Button>
                    )}
                  </div>
                  <Button className="h-10 gap-2 rounded-xl" onClick={createPoll}>Create Poll <ArrowRight className="h-3.5 w-3.5" /></Button>
                </div>
              </motion.div>
            )}

            {view === 'results' && viewPoll && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight mb-1">{viewPoll.question}</h1>
                    <p className="text-[11px] text-muted-foreground/50">{viewPoll.totalVotes} votes · {viewPoll.isActive ? 'Active' : 'Closed'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => openShareDialog(viewPoll.id)}>
                    <Send className="h-3 w-3" /> Share
                  </Button>
                </div>

                {viewPoll.sharedTo && viewPoll.sharedTo.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {viewPoll.sharedTo.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/5 text-primary/70 font-medium">
                        {s.type === 'channel' ? <Hash className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {viewPoll.options.map(opt => {
                    const pct = viewPoll.totalVotes > 0 ? (opt.votes / viewPoll.totalVotes) * 100 : 0;
                    const hasVoted = votedPolls.has(viewPoll.id);
                    return (
                      <div key={opt.id}>
                        <button disabled={hasVoted || !viewPoll.isActive}
                          onClick={() => vote(viewPoll.id, opt.id)}
                          className={cn("w-full relative h-14 rounded-2xl border overflow-hidden transition-all text-left",
                            hasVoted || !viewPoll.isActive ? "border-border/20 cursor-default" : "border-border/30 hover:border-primary/40 hover:shadow-md cursor-pointer")}>
                          <div className="absolute inset-y-0 left-0 bg-primary/10 rounded-2xl transition-all duration-500" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between px-5 h-full">
                            <span className="text-[13px] font-medium text-foreground">{opt.text}</span>
                            <span className="text-[12px] text-muted-foreground/60 font-mono font-semibold">{Math.round(pct)}% ({opt.votes})</span>
                          </div>
                        </button>
                        {opt.voters.length > 0 && (
                          <div className="mt-1 ml-2 flex flex-wrap gap-1">
                            {opt.voters.slice(0, 5).map((name, i) => (
                              <span key={i} className="text-[9px] text-muted-foreground/40">{name}</span>
                            ))}
                            {opt.voters.length > 5 && <span className="text-[9px] text-muted-foreground/30">+{opt.voters.length - 5} more</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Share Poll</DialogTitle>
            {sharePoll && <p className="text-[11px] text-muted-foreground/60 mt-1">"{sharePoll.question}"</p>}
          </DialogHeader>
          <div className="space-y-3">
            <Input value={shareSearch} onChange={e => setShareSearch(e.target.value)} placeholder="Search…" className="h-9 rounded-xl text-sm" />
            <Tabs value={shareTab} onValueChange={v => setShareTab(v as 'channels' | 'contacts')}>
              <TabsList className="w-full rounded-xl h-9">
                <TabsTrigger value="channels" className="flex-1 text-xs rounded-lg">Channels</TabsTrigger>
                <TabsTrigger value="contacts" className="flex-1 text-xs rounded-lg">Contacts</TabsTrigger>
              </TabsList>
              <TabsContent value="channels">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1 p-1">
                    {filteredChannels.map(ch => (
                      <button key={ch.id} disabled={sending === ch.id}
                        onClick={() => sendPollToChannel(ch.id, ch.name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left">
                        {channelIcon(ch.channel_type)}
                        <span className="text-[12px] font-medium text-foreground flex-1">{ch.name}</span>
                        {sending === ch.id ? <span className="text-[10px] text-primary animate-pulse">Sending…</span> : <Send className="h-3 w-3 text-muted-foreground/30" />}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="contacts">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-1 p-1">
                    {contactsLoading ? <p className="text-[11px] text-muted-foreground/40 text-center py-6">Loading…</p> :
                      filteredContacts.map(c => (
                        <button key={c.user_id} disabled={sending === c.user_id}
                          onClick={() => sendPollToContact(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={c.avatar_url || ''} />
                            <AvatarFallback className="text-[10px]">{getInitials(c.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] font-medium text-foreground flex-1">{c.full_name}</span>
                          {sending === c.user_id ? <span className="text-[10px] text-primary animate-pulse">Sending…</span> : <Send className="h-3 w-3 text-muted-foreground/30" />}
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
