import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  User, Globe, MessageSquare, Upload, Calendar,
  CheckCircle2, X, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  dbField: string;
}

const STEPS: OnboardingStep[] = [
  { id: 'profile', label: 'Complete your profile', description: 'Add your name and company details', icon: User, path: '/lounge/settings', dbField: 'completed_profile' },
  { id: 'website', label: 'Explore your website', description: 'Check your website status and preview', icon: Globe, path: '/lounge/website', dbField: 'explored_website' },
  { id: 'message', label: 'Send a message', description: 'Start a conversation with us', icon: MessageSquare, path: '/lounge/messages', dbField: 'sent_message' },
  { id: 'upload', label: 'Upload a file', description: 'Add logos, assets, or documents', icon: Upload, path: '/lounge/assets', dbField: 'uploaded_file' },
  { id: 'calendar', label: 'Check your calendar', description: 'View upcoming events and milestones', icon: Calendar, path: '/lounge/calendar', dbField: 'checked_calendar' },
];

type OnboardingData = {
  completed_profile: boolean;
  explored_website: boolean;
  sent_message: boolean;
  uploaded_file: boolean;
  checked_calendar: boolean;
  dismissed: boolean;
};

export function OnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchOnboarding = async () => {
      const { data: existing } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setData(existing as unknown as OnboardingData);
      } else {
        // Create onboarding record for new user
        const { data: created } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (created) setData(created as unknown as OnboardingData);
      }
      setLoading(false);
    };

    fetchOnboarding();
  }, [user]);

  if (loading || !data || data.dismissed) return null;

  const completedCount = STEPS.filter(s => data[s.dbField as keyof OnboardingData]).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);
  const allComplete = completedCount === STEPS.length;

  if (allComplete) return null;

  const handleDismiss = async () => {
    setDismissing(true);
    await supabase
      .from('user_onboarding')
      .update({ dismissed: true })
      .eq('user_id', user!.id);
    setData(prev => prev ? { ...prev, dismissed: true } : prev);
  };

  const handleStepClick = async (step: OnboardingStep) => {
    // Mark step as complete when user clicks it
    if (!data[step.dbField as keyof OnboardingData]) {
      const update = { [step.dbField]: true } as Partial<OnboardingData>;
      await supabase
        .from('user_onboarding')
        .update(update)
        .eq('user_id', user!.id);
      setData(prev => prev ? { ...prev, [step.dbField]: true } : prev);
    }
    navigate(step.path);
  };

  return (
    <AnimatePresence>
      {!dismissing && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0073E6]" />
              <span className="text-[11px] font-semibold text-foreground/80">Getting Started</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0073E6]/20 text-[#0073E6]">
                {completedCount}/{STEPS.length}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[9px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Dismiss
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-[#0073E6]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Steps */}
          <div className="p-3 space-y-1">
            {STEPS.map(step => {
              const isComplete = data[step.dbField as keyof OnboardingData];
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-left transition-all group",
                    isComplete
                      ? "opacity-60"
                      : "hover:bg-accent"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isComplete ? "bg-[#34d399]/20" : "bg-muted"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                    ) : (
                      <step.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-medium truncate",
                      isComplete ? "line-through text-muted-foreground" : "text-foreground/80"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">{step.description}</p>
                  </div>
                  {!isComplete && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
