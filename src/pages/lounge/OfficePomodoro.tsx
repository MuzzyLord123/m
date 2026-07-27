import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Timer, Play, Pause, RotateCcw, Coffee, Brain, Zap, Check, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SessionType = 'focus' | 'short-break' | 'long-break';
const SESSION_CONFIG = {
  'focus': { label: 'Focus', duration: 25, icon: Brain, color: '#ef4444' },
  'short-break': { label: 'Short Break', duration: 5, icon: Coffee, color: '#22c55e' },
  'long-break': { label: 'Long Break', duration: 15, icon: Zap, color: '#3b82f6' },
};
interface CompletedSession { id?: string; type: SessionType; completedAt: Date; duration: number; }
function getDailyGoal(): number { try { return parseInt(localStorage.getItem('pomodoro_daily_goal') || '4'); } catch { return 4; } }
function getWeeklyData(sessions: CompletedSession[]): { day: string; mins: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const mins = sessions.filter(s => s.type === 'focus' && s.completedAt.toDateString() === dateStr).reduce((sum, s) => sum + s.duration, 0);
    return { day: days[d.getDay()], mins };
  });
}

export default function OfficePomodoro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeLeft, setTimeLeft] = useState(SESSION_CONFIG.focus.duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [customDurations] = useState({ focus: 25, 'short-break': 5, 'long-break': 15 });
  const [dailyGoal, setDailyGoal] = useState(getDailyGoal);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(50);
      if (data) {
        setCompletedSessions(data.map((s: any) => ({ id: s.id, type: s.session_type as SessionType, completedAt: new Date(s.completed_at), duration: s.duration_minutes })));
        setPomodoroCount(data.filter((s: any) => s.session_type === 'focus').length);
      }
    };
    load();
  }, [user]);

  const config = SESSION_CONFIG[sessionType];
  const totalSeconds = customDurations[sessionType] * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      const saveSession = async () => {
        if (!user) return;
        const { data } = await supabase.from('pomodoro_sessions').insert({ user_id: user.id, session_type: sessionType, duration_minutes: customDurations[sessionType] } as any).select().single();
        const session: CompletedSession = { id: data?.id, type: sessionType, completedAt: new Date(), duration: customDurations[sessionType] };
        setCompletedSessions(prev => [session, ...prev]);
      };
      saveSession();
      if (sessionType === 'focus') {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        toast.success(`🍅 Pomodoro #${newCount} complete!`);
        if (newCount % 4 === 0) switchSession('long-break'); else switchSession('short-break');
      } else { toast.success('Break over! Time to focus.'); switchSession('focus'); }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const switchSession = (type: SessionType) => { setSessionType(type); setTimeLeft(customDurations[type] * 60); setIsRunning(false); };
  const toggleTimer = () => setIsRunning(prev => !prev);
  const resetTimer = () => { setIsRunning(false); setTimeLeft(customDurations[sessionType] * 60); };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const todayFocus = completedSessions.filter(s => s.type === 'focus' && s.completedAt.toDateString() === new Date().toDateString());
  const todayFocusMins = todayFocus.reduce((acc, s) => acc + s.duration, 0);
  const todayPomodoroCount = todayFocus.length;
  const goalProgress = Math.min(100, (todayPomodoroCount / dailyGoal) * 100);
  const weeklyData = useMemo(() => getWeeklyData(completedSessions), [completedSessions]);
  const weeklyMax = Math.max(...weeklyData.map(d => d.mins), 1);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const updateGoal = (g: number) => { setDailyGoal(g); localStorage.setItem('pomodoro_daily_goal', String(g)); };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <Timer className="h-4 w-4 text-red-500 shrink-0" />
        <span className="text-sm font-semibold tracking-tight">Pomodoro Timer</span>
      </header>

      <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-auto">
        <div className="flex flex-col items-center gap-6 sm:gap-8 max-w-lg w-full">
          {/* Session Tabs — wrap on mobile */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-2xl w-full sm:w-auto">
            {(Object.keys(SESSION_CONFIG) as SessionType[]).map(type => {
              const cfg = SESSION_CONFIG[type];
              return (
                <button key={type} onClick={() => switchSession(type)}
                  className={cn("flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all",
                    sessionType === type ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
                  <cfg.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden xs:inline sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Timer Circle — scale on mobile */}
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-56 h-56 sm:w-[280px] sm:h-[280px]">
            <svg viewBox="0 0 280 280" className="w-full h-full transform -rotate-90">
              <circle cx="140" cy="140" r="120" fill="none" stroke="currentColor" strokeWidth="4" className="text-border/20" />
              <circle cx="140" cy="140" r="120" fill="none" stroke={config.color} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-mono font-bold text-foreground tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground/50 mt-1">{config.label}</span>
            </div>
          </motion.div>

          {/* Controls — larger tap targets */}
          <div className="flex items-center gap-3 sm:gap-3">
            <Button variant="outline" size="icon" className="h-12 w-12 sm:h-12 sm:w-12 rounded-2xl" onClick={resetTimer}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="lg" className="h-14 px-8 sm:px-10 rounded-2xl gap-2 text-sm font-semibold min-w-[140px]" onClick={toggleTimer}
              style={{ background: config.color }}>
              {isRunning ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {timeLeft === totalSeconds ? 'Start' : 'Resume'}</>}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl" onClick={() => { if (sessionType === 'focus') switchSession('short-break'); else switchSession('focus'); }}>
              <Coffee className="h-4 w-4" />
            </Button>
          </div>

          {/* Daily Goal */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">Daily Goal</span>
              </div>
              <div className="flex items-center gap-1">
                {[2, 4, 6, 8].map(g => (
                  <button key={g} onClick={() => updateGoal(g)}
                    className={cn("px-2 py-1 rounded-md text-[9px] font-bold transition-colors min-h-[28px] min-w-[28px]",
                      dailyGoal === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full transition-all duration-500" style={{ width: `${goalProgress}%`, background: goalProgress >= 100 ? '#22c55e' : config.color }} initial={{ width: 0 }} animate={{ width: `${goalProgress}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1 text-center">
              {todayPomodoroCount}/{dailyGoal} pomodoros today
              {goalProgress >= 100 && <span className="text-emerald-500 font-semibold ml-1">🎉 Goal reached!</span>}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm">
            {[
              { label: 'Pomodoros', value: pomodoroCount, icon: '🍅' },
              { label: 'Focus Today', value: `${todayFocusMins}m`, icon: '⏱️' },
              { label: 'Sessions', value: completedSessions.length, icon: '📊' },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 sm:p-4 rounded-2xl bg-card/40 border border-border/15">
                <span className="text-xl mb-1 block">{stat.icon}</span>
                <span className="text-base sm:text-lg font-bold text-foreground block">{stat.value}</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/50">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Weekly Chart */}
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest">This Week</span>
            </div>
            <div className="flex items-end gap-1.5 h-16 px-1">
              {weeklyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(3, (d.mins / weeklyMax) * 48)}px`, background: i === 6 ? config.color : `${config.color}44` }} title={`${d.day}: ${d.mins} min`} />
                  <span className="text-[7px] font-bold text-muted-foreground/40">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {completedSessions.length > 0 && (
            <div className="w-full max-w-sm pb-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-2">Recent Sessions</h3>
              <div className="space-y-1.5">
                {completedSessions.slice(0, 5).map((s, i) => (
                  <div key={s.id || i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/30 border border-border/10">
                    <Check className="h-3 w-3 shrink-0" style={{ color: SESSION_CONFIG[s.type].color }} />
                    <span className="text-[11px] text-foreground font-medium flex-1">{SESSION_CONFIG[s.type].label}</span>
                    <span className="text-[10px] text-muted-foreground/40">{s.duration}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
