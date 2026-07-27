import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Plus, Clock, Users, Star, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function OfficePollsHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Active Polls', value: 3, icon: BarChart3, color: '#6366f1' },
    { label: 'Total Votes', value: 142, icon: CheckCircle2, color: '#10b981' },
    { label: 'Participation', value: '87%', icon: TrendingUp, color: '#f59e0b' },
    { label: 'Team Members', value: 12, icon: Users, color: '#3b82f6' },
  ];

  const recentPolls = [
    { id: '1', question: 'Which project should we prioritize in Q2?', votes: 40, isActive: true, channel: '#general', createdBy: 'Sarah K.', date: '1 day ago' },
    { id: '2', question: 'Preferred team meeting day?', votes: 30, isActive: false, channel: '#team', createdBy: 'Mike R.', date: '2 days ago' },
    { id: '3', question: 'Office snack preferences?', votes: 25, isActive: true, channel: null, createdBy: 'Alex P.', date: '3 days ago' },
    { id: '4', question: 'Remote work schedule for March?', votes: 18, isActive: true, channel: '#announcements', createdBy: 'Emma C.', date: '4 days ago' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <BarChart3 className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-semibold tracking-tight">Polls & Voting</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => navigate('/lounge/office/polls-create')}>
          <Plus className="h-3.5 w-3.5" /> New Poll
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Polls & Voting</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Create polls, gather feedback, and share to channels.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card/50 border border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <span className="text-xl font-bold text-foreground">{s.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Create Poll', desc: 'New question for the team', icon: Plus, color: '#6366f1', action: () => navigate('/lounge/office/polls-create') },
                { label: 'Share to Channel', desc: 'Send poll to team comms', icon: Users, color: '#3b82f6', action: () => navigate('/lounge/office/polls-create') },
                { label: 'View Results', desc: 'Browse past poll data', icon: TrendingUp, color: '#10b981', action: () => navigate('/lounge/office/polls-create') },
              ].map((action, i) => (
                <motion.button key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={action.action}
                  className="group flex items-center gap-4 p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${action.color}15` }}>
                    <action.icon className="h-5 w-5" style={{ color: action.color }} />
                  </div>
                  <div className="text-left">
                    <span className="text-[12px] font-semibold text-foreground block">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{action.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Recent polls */}
          <section className="pb-10">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recent Polls</h2>
            <div className="space-y-2">
              {recentPolls.map((poll, i) => (
                <motion.button key={poll.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => navigate('/lounge/office/polls-create')}
                  className="w-full group flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/15 hover:border-border/30 hover:shadow-md transition-all text-left">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-semibold text-foreground block truncate">{poll.question}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", poll.isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground/50")}>
                        {poll.isActive ? 'Active' : 'Closed'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">{poll.votes} votes</span>
                      {poll.channel && <span className="text-[10px] text-muted-foreground/40">{poll.channel}</span>}
                      <span className="text-[10px] text-muted-foreground/30">by {poll.createdBy}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/35 shrink-0">{poll.date}</span>
                </motion.button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
