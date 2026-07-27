import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CRMDeal {
  id: string;
  user_id: string;
  lead_id: string | null;
  deal_name: string;
  stage: string;
  probability: number;
  deal_value: number;
  currency: string;
  expected_close_date: string | null;
  actual_close_date: string | null;
  won: boolean | null;
  contact_name: string | null;
  company_name: string | null;
  description: string | null;
  tags: string[] | null;
  notes: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

export const DEAL_STAGES = [
  { key: 'qualification', label: 'Qualification', probability: 10, color: '#60a5fa' },
  { key: 'discovery', label: 'Discovery', probability: 25, color: '#a78bfa' },
  { key: 'proposal', label: 'Proposal', probability: 50, color: '#fbbf24' },
  { key: 'negotiation', label: 'Negotiation', probability: 75, color: '#f97316' },
  { key: 'closing', label: 'Closing', probability: 90, color: '#34d399' },
  { key: 'won', label: 'Won', probability: 100, color: '#22c55e' },
  { key: 'lost', label: 'Lost', probability: 0, color: '#ef4444' },
] as const;

export function useCRMDeals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) setDeals(data as unknown as CRMDeal[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const createDeal = useCallback(async (deal: Partial<CRMDeal>) => {
    if (!user) return null;
    const stage = deal.stage || 'qualification';
    const stageConfig = DEAL_STAGES.find(s => s.key === stage);
    const { data, error } = await supabase
      .from('crm_deals')
      .insert({
        user_id: user.id,
        deal_name: deal.deal_name || 'New Deal',
        stage,
        probability: deal.probability ?? stageConfig?.probability ?? 20,
        deal_value: deal.deal_value ?? 0,
        currency: deal.currency || 'GBP',
        expected_close_date: deal.expected_close_date || null,
        contact_name: deal.contact_name || null,
        company_name: deal.company_name || null,
        description: deal.description || null,
        lead_id: deal.lead_id || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create deal', description: error.message, variant: 'destructive' });
      return null;
    }
    if (data) {
      setDeals(prev => [data as unknown as CRMDeal, ...prev]);
      // Log activity
      await supabase.from('crm_deal_activities').insert({
        deal_id: (data as any).id,
        user_id: user.id,
        activity_type: 'created',
        new_value: stage,
        description: `Deal "${deal.deal_name}" created`,
      } as any);
    }
    return data as unknown as CRMDeal;
  }, [user, toast]);

  const updateDeal = useCallback(async (id: string, updates: Partial<CRMDeal>) => {
    if (!user) return;
    const existing = deals.find(d => d.id === id);
    const { error } = await supabase
      .from('crm_deals')
      .update(updates as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update deal', variant: 'destructive' });
      return;
    }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    // Log stage changes
    if (updates.stage && existing && updates.stage !== existing.stage) {
      await supabase.from('crm_deal_activities').insert({
        deal_id: id,
        user_id: user.id,
        activity_type: 'stage_change',
        old_value: existing.stage,
        new_value: updates.stage,
        description: `Stage changed from ${existing.stage} to ${updates.stage}`,
      } as any);

      // Auto-trigger onboarding when deal moves to 'won'
      if (updates.stage === 'won') {
        try {
          await supabase.from('client_onboarding').insert({
            user_id: user.id,
            deal_id: id,
            client_name: existing.contact_name || existing.deal_name || 'New Client',
            client_email: null,
            company_name: existing.company_name || null,
            status: 'pending',
            account_created: true,
            account_created_at: new Date().toISOString(),
          } as any);
          toast({ title: 'Onboarding initiated', description: `Onboarding flow started for ${existing.contact_name || existing.deal_name}` });
        } catch {
          // Silent fail — onboarding is supplementary
        }
      }
    }
  }, [user, deals, toast]);

  const deleteDeal = useCallback(async (id: string) => {
    const { error } = await supabase.from('crm_deals').delete().eq('id', id);
    if (!error) {
      setDeals(prev => prev.filter(d => d.id !== id));
      toast({ title: 'Deal deleted' });
    }
  }, [toast]);

  // Analytics
  const analytics = useMemo(() => {
    const active = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const won = deals.filter(d => d.stage === 'won' || d.won === true);
    const lost = deals.filter(d => d.stage === 'lost' || d.won === false);

    const totalPipeline = active.reduce((s, d) => s + Number(d.deal_value), 0);
    const weightedPipeline = active.reduce((s, d) => s + Number(d.deal_value) * (d.probability / 100), 0);
    const totalWon = won.reduce((s, d) => s + Number(d.deal_value), 0);
    const totalLost = lost.reduce((s, d) => s + Number(d.deal_value), 0);
    const winRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    const avgDealSize = won.length > 0 ? totalWon / won.length : 0;

    // Monthly forecast (next 6 months)
    const now = new Date();
    const forecast: { month: string; projected: number; weighted: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const monthLabel = m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthDeals = active.filter(d => {
        if (!d.expected_close_date) return false;
        const close = new Date(d.expected_close_date);
        return close >= m && close <= monthEnd;
      });
      forecast.push({
        month: monthLabel,
        projected: monthDeals.reduce((s, d) => s + Number(d.deal_value), 0),
        weighted: monthDeals.reduce((s, d) => s + Number(d.deal_value) * (d.probability / 100), 0),
      });
    }

    // Stage distribution
    const stageDistribution = DEAL_STAGES.filter(s => s.key !== 'won' && s.key !== 'lost').map(s => ({
      stage: s.label,
      key: s.key,
      color: s.color,
      count: active.filter(d => d.stage === s.key).length,
      value: active.filter(d => d.stage === s.key).reduce((sum, d) => sum + Number(d.deal_value), 0),
    }));

    // Win/loss by month (last 6 months)
    const winLossHistory: { month: string; won: number; lost: number; wonValue: number; lostValue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = m.toLocaleDateString('en-US', { month: 'short' });
      const mWon = won.filter(d => {
        const close = new Date(d.actual_close_date || d.updated_at);
        return close >= m && close <= monthEnd;
      });
      const mLost = lost.filter(d => {
        const close = new Date(d.actual_close_date || d.updated_at);
        return close >= m && close <= monthEnd;
      });
      winLossHistory.push({
        month: monthLabel,
        won: mWon.length,
        lost: mLost.length,
        wonValue: mWon.reduce((s, d) => s + Number(d.deal_value), 0),
        lostValue: mLost.reduce((s, d) => s + Number(d.deal_value), 0),
      });
    }

    return {
      totalPipeline, weightedPipeline, totalWon, totalLost, winRate,
      avgDealSize, activeCount: active.length, wonCount: won.length,
      lostCount: lost.length, forecast, stageDistribution, winLossHistory,
    };
  }, [deals]);

  return { deals, loading, createDeal, updateDeal, deleteDeal, fetchDeals, analytics };
}
