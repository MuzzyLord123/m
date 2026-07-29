import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  User, Globe, MessageSquare, Upload, Calendar,
  Check, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader } from '@/components/platform';

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

  if (dismissing) return null;

  return (
    <Panel>
      <PanelHeader label="Getting started">
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {completedCount} of {STEPS.length}
        </span>
        <button
          onClick={handleDismiss}
          className="text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          Dismiss
        </button>
      </PanelHeader>

      {/* Numbered intake ledger */}
      <div>
        {STEPS.map((step, index) => {
          const isComplete = data[step.dbField as keyof OnboardingData];
          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              className="group flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]"
            >
              <span className="flex w-5 shrink-0 items-center justify-center">
                {isComplete ? (
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                ) : (
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn(
                  "block truncate text-[13px] font-[450]",
                  isComplete ? "text-muted-foreground" : "text-foreground"
                )}>
                  {step.label}
                </span>
                <span className="block truncate text-[11.5px] text-muted-foreground">
                  {step.description}
                </span>
              </span>
              {!isComplete && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
