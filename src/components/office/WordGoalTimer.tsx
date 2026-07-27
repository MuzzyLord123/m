import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Target, Play, Pause, RotateCcw, Timer, Trophy, Flame, CalendarCheck } from 'lucide-react';

interface WordGoalTimerProps {
  wordCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStreakData(): { dates: string[]; current: number; best: number } {
  try {
    const raw = JSON.parse(localStorage.getItem('writing_streak') || '{"dates":[],"current":0,"best":0}');
    return raw;
  } catch { return { dates: [], current: 0, best: 0 }; }
}

function recordWritingDay() {
  const today = new Date().toISOString().slice(0, 10);
  const data = getStreakData();
  if (data.dates.includes(today)) return data;
  data.dates.push(today);
  // Calculate streak
  let streak = 1;
  const sorted = [...data.dates].sort().reverse();
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = (prev.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) streak++;
    else break;
  }
  data.current = streak;
  data.best = Math.max(data.best, streak);
  localStorage.setItem('writing_streak', JSON.stringify(data));
  return data;
}

export function WordGoalTimer({ wordCount, open, onOpenChange }: WordGoalTimerProps) {
  const [goalWords, setGoalWords] = useState(500);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionWords, setSessionWords] = useState(0);
  const [startWordCount, setStartWordCount] = useState(0);
  const [streak, setStreak] = useState(getStreakData);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      setSessionWords(Math.max(0, wordCount - startWordCount));
    }
  }, [wordCount, isRunning, startWordCount]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  // Session history
  const [sessionHistory, setSessionHistory] = useState<{ date: string; words: number; mins: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('writing_sessions') || '[]'); } catch { return []; }
  });

  const startTimer = () => {
    setTimeLeft(timerMinutes * 60);
    setStartWordCount(wordCount);
    setSessionWords(0);
    setIsRunning(true);
    setStreak(recordWritingDay());
  };

  const togglePause = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    // Save session if any words written
    if (sessionWords > 0) {
      const session = { date: new Date().toISOString(), words: sessionWords, mins: timerMinutes - Math.ceil(timeLeft / 60) };
      const updated = [session, ...sessionHistory].slice(0, 10);
      setSessionHistory(updated);
      try { localStorage.setItem('writing_sessions', JSON.stringify(updated)); } catch {}
    }
    setIsRunning(false);
    setTimeLeft(0);
    setSessionWords(0);
  };

  const progressPercent = goalWords > 0 ? Math.min(100, (wordCount / goalWords) * 100) : 0;
  const sessionProgress = goalWords > 0 ? Math.min(100, (sessionWords / goalWords) * 100) : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Writing Goals & Focus Timer
            </DialogTitle>
          </DialogHeader>

          {/* Progress Ring */}
          <div className="flex justify-center my-6">
            <div className="relative">
              <svg width="100" height="100" className="-rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums">{Math.round(progressPercent)}%</span>
                <span className="text-[9px] text-muted-foreground">{wordCount}/{goalWords}</span>
              </div>
            </div>
          </div>

          {/* Goal Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Word Goal</span>
              <div className="flex-1" />
              <div className="flex gap-1">
                {[250, 500, 1000, 2000].map(g => (
                  <button
                    key={g}
                    onClick={() => setGoalWords(g)}
                    className={cn(
                      "px-2 py-0.5 text-[9px] rounded-md font-medium transition-colors",
                      goalWords === g ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="number"
              value={goalWords}
              onChange={e => setGoalWords(Number(e.target.value))}
              className="h-7 text-xs rounded-lg"
              min={1}
            />
          </div>

          {/* Timer */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pomodoro Timer</span>
              <div className="flex-1" />
              <div className="flex gap-1">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setTimerMinutes(m); if (!isRunning) setTimeLeft(m * 60); }}
                    className={cn(
                      "px-2 py-0.5 text-[9px] rounded-md font-medium transition-colors",
                      timerMinutes === m ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tabular-nums font-mono">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                {isRunning && (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </motion.div>
                )}
              </div>
              <div className="flex gap-1">
                {timeLeft === 0 ? (
                  <Button size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={startTimer}>
                    <Play className="h-3 w-3" /> Start
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg" onClick={togglePause}>
                      {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg" onClick={resetTimer}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Session stats */}
            {(isRunning || sessionWords > 0) && (
              <div className="text-center text-[10px] text-muted-foreground">
                <span className="font-semibold text-primary">{sessionWords}</span> words this session
                {sessionWords > 0 && (
                  <span> · {Math.round(sessionWords / (((timerMinutes * 60) - timeLeft) / 60) || 0)} wpm</span>
                )}
              </div>
            )}

            {/* Streak */}
            <div className="flex items-center justify-between bg-card rounded-xl p-2.5 border border-border/30 mt-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-3.5 w-3.5 text-amber-500" />
                <div>
                  <div className="text-[10px] font-semibold">{streak.current}-day streak</div>
                  <div className="text-[8px] text-muted-foreground">Best: {streak.best} days</div>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const key = d.toISOString().slice(0, 10);
                  const active = streak.dates.includes(key);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-3 w-3 rounded-sm transition-colors",
                        active ? "bg-emerald-500/80" : "bg-muted"
                      )}
                      title={key}
                    />
                  );
                })}
              </div>
            </div>
            {/* Session History */}
            {sessionHistory.length > 0 && (
              <div className="bg-card rounded-xl p-2.5 border border-border/30 mt-2">
                <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">Recent Sessions</p>
                <div className="space-y-1">
                  {sessionHistory.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                      <span className="text-muted-foreground">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">{s.words}w</span>
                        <span className="text-muted-foreground/60 tabular-nums">{s.mins}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mini progress indicator for status bar
export function WordGoalMini({ wordCount, goal, onClick }: { wordCount: number; goal: number; onClick: () => void }) {
  if (goal <= 0) return null;
  const pct = Math.min(100, (wordCount / goal) * 100);
  return (
    <button onClick={onClick} className="flex items-center gap-1 hover:bg-muted/50 px-1 rounded transition-colors" title={`${wordCount}/${goal} words`}>
      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[8px] tabular-nums">{Math.round(pct)}%</span>
    </button>
  );
}
