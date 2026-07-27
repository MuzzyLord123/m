import { useState } from 'react';
import { BarChart3, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface PollData {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  createdBy: string;
  isMultiSelect?: boolean;
  expiresAt?: string;
}

interface PollEmbedProps {
  poll: PollData;
  onVote?: (pollId: string, optionId: string) => void;
  currentUserId?: string;
  votedOptionIds?: string[];
}

export function PollEmbed({ poll, onVote, votedOptionIds = [] }: PollEmbedProps) {
  const [localVotes, setLocalVotes] = useState<string[]>(votedOptionIds);
  const hasVoted = localVotes.length > 0;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes + (localVotes.includes(o.id) ? 1 : 0), 0);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    setLocalVotes([optionId]);
    onVote?.(poll.id, optionId);
  };

  return (
    <div className="rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-3.5 max-w-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-3 w-3 text-primary" />
        </div>
        <span className="text-[11px] font-semibold text-primary/70">Poll</span>
      </div>

      <p className="text-[13px] font-semibold text-foreground mb-3">{poll.question}</p>

      <div className="space-y-1.5">
        {poll.options.map(opt => {
          const voted = localVotes.includes(opt.id);
          const votes = opt.votes + (voted ? 1 : 0);
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted}
              className={cn(
                "w-full relative rounded-lg border px-3 py-2 text-left transition-all text-[12px]",
                hasVoted
                  ? "border-border/20 cursor-default"
                  : "border-border/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
              )}
            >
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-y-0 left-0 bg-primary/10 rounded-lg"
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {voted && <Check className="h-3 w-3 text-primary" />}
                  <span className={cn("font-medium", voted ? "text-primary" : "text-foreground")}>{opt.text}</span>
                </div>
                {hasVoted && (
                  <span className="text-[10px] text-muted-foreground/60 font-medium">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted-foreground/50">
        <Users className="h-3 w-3" />
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {poll.expiresAt && <span>· Expires {poll.expiresAt}</span>}
      </div>
    </div>
  );
}
