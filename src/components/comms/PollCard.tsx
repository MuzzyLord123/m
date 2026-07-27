import { useState, useEffect } from 'react';
import { BarChart3, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface PollCardProps {
  messageId: string;
  pollId: string;
  question: string;
  options: string[];
  isOwn: boolean;
}

interface VoteSummary {
  option_index: number;
  count: number;
  user_ids: string[];
  voter_names: string[];
}

export function PollCard({ messageId, pollId, question, options, isOwn }: PollCardProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<VoteSummary[]>([]);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);

  // Fetch votes
  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_index, user_id')
      .eq('poll_id', pollId);

    if (error) { setLoading(false); return; }

    // Group by option
    const grouped: Record<number, string[]> = {};
    options.forEach((_, i) => { grouped[i] = []; });
    (data || []).forEach(v => {
      if (!grouped[v.option_index]) grouped[v.option_index] = [];
      grouped[v.option_index].push(v.user_id);
      if (v.user_id === user?.id) setMyVote(v.option_index);
    });

    // Get voter names
    const allUserIds = [...new Set((data || []).map(v => v.user_id))];
    let nameMap: Record<string, string> = {};
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allUserIds);
      if (profiles) {
        profiles.forEach(p => { nameMap[p.user_id] = p.full_name || 'Unknown'; });
      }
    }

    const summary: VoteSummary[] = options.map((_, i) => ({
      option_index: i,
      count: grouped[i]?.length || 0,
      user_ids: grouped[i] || [],
      voter_names: (grouped[i] || []).map(uid => nameMap[uid] || 'Unknown'),
    }));

    setVotes(summary);
    setLoading(false);
  };

  useEffect(() => {
    fetchVotes();

    // Realtime subscription for live updates
    const channel = supabase
      .channel(`poll-votes-${pollId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_votes',
        filter: `poll_id=eq.${pollId}`,
      }, () => { fetchVotes(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pollId, user?.id]);

  const castVote = async (optionIndex: number) => {
    if (!user?.id || myVote !== null || voting) return;
    setVoting(true);

    const { error } = await supabase.from('poll_votes').insert({
      poll_id: pollId,
      option_index: optionIndex,
      user_id: user.id,
      message_id: messageId,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('You already voted on this poll');
      } else {
        toast.error('Failed to vote');
        console.error('Vote error:', error);
      }
    } else {
      setMyVote(optionIndex);
      setShowConfirmation(true);
      toast.success('Vote recorded!');
      fetchVotes();
      setTimeout(() => setShowConfirmation(false), 3000);
    }
    setVoting(false);
  };

  const hasVoted = myVote !== null;

  return (
    <div className={cn(
      "w-full max-w-sm rounded-xl border overflow-hidden bg-card text-card-foreground",
      isOwn ? "border-primary/20" : "border-border/30"
    )}>
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Poll</span>
      </div>

      {/* Question */}
      <div className="px-3.5 pb-2">
        <p className={cn("text-[13px] font-semibold leading-snug", isOwn ? "text-foreground" : "text-foreground")}>{question}</p>
      </div>

      {/* Options */}
      <div className="px-3 pb-2 space-y-1.5">
        {options.map((option, idx) => {
          const vote = votes.find(v => v.option_index === idx);
          const count = vote?.count || 0;
          const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const isMyChoice = myVote === idx;

          return (
            <button
              key={idx}
              disabled={hasVoted || voting}
              onClick={() => castVote(idx)}
              className={cn(
                "w-full relative rounded-lg overflow-hidden transition-all text-left",
                hasVoted
                  ? "cursor-default h-9"
                  : "cursor-pointer h-9 hover:bg-accent/50 active:scale-[0.98]",
                isMyChoice && "ring-1 ring-primary/40"
              )}
            >
              {/* Progress bar */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg",
                    isMyChoice ? "bg-primary/15" : "bg-muted/50"
                  )}
                />
              )}

              <div className={cn(
                "relative flex items-center justify-between px-3 h-full",
                !hasVoted && "border border-border/30 rounded-lg"
              )}>
                <div className="flex items-center gap-2 min-w-0">
                  {isMyChoice && <Check className="h-3 w-3 text-primary shrink-0" />}
                  <span className={cn(
                    "text-[12px] truncate",
                    isMyChoice ? "font-semibold text-primary" : "text-foreground"
                  )}>{option}</span>
                </div>
                {hasVoted && (
                  <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 ml-2">
                    {Math.round(pct)}% ({count})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3.5 pb-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
          <Users className="h-3 w-3" />
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {hasVoted && (
          <span className="text-[10px] text-primary/60 flex items-center gap-1">
            <Check className="h-3 w-3" /> You voted
          </span>
        )}
      </div>

      {/* Voter names tooltip on hover for each option */}
      {hasVoted && votes.some(v => v.voter_names.length > 0) && (
        <div className="px-3.5 pb-3 border-t border-border/10 pt-2">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-semibold mb-1">Voters</p>
          {votes.filter(v => v.count > 0).map(v => (
            <div key={v.option_index} className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold text-foreground/70 shrink-0">{options[v.option_index]}:</span>
              <span className="text-[10px] text-muted-foreground/50 truncate">{v.voter_names.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
