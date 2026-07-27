import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ScopeItem {
  id: string;
  title: string;
  description: string;
  included: boolean;
}

export interface PricingItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  is_recurring: boolean;
  frequency?: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  lead_id: string | null;
  deal_id: string | null;
  proposal_number: string;
  template_type: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  client_phone: string | null;
  title: string;
  introduction: string | null;
  scope_items: ScopeItem[];
  pricing_items: PricingItem[];
  total_amount: number;
  currency: string;
  valid_until: string | null;
  terms: string | null;
  notes: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_by_email: string | null;
  accepted_ip: string | null;
  acceptance_token: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export type TemplateType = 'website_design' | 'seo_marketing' | 'full_service';

interface TemplateConfig {
  label: string;
  title: string;
  introduction: string;
  scope: ScopeItem[];
  pricing: PricingItem[];
  terms: string;
}

const uid = () => crypto.randomUUID();

export const PROPOSAL_TEMPLATES: Record<TemplateType, TemplateConfig> = {
  website_design: {
    label: 'Website Design',
    title: 'Website Design Proposal',
    introduction: 'Thank you for considering us for your website project. We are excited to help bring your vision to life with a modern, responsive, and conversion-focused website.',
    scope: [
      { id: uid(), title: 'Discovery & Strategy', description: 'Initial consultation, competitor analysis, and project roadmap', included: true },
      { id: uid(), title: 'UI/UX Design', description: 'Custom wireframes, mockups, and interactive prototypes', included: true },
      { id: uid(), title: 'Responsive Development', description: 'Mobile-first build with cross-browser compatibility', included: true },
      { id: uid(), title: 'Content Integration', description: 'CMS setup and content population', included: true },
      { id: uid(), title: 'SEO Foundations', description: 'On-page SEO, meta tags, and sitemap', included: true },
      { id: uid(), title: 'Launch & Handover', description: 'Domain setup, hosting, and training session', included: true },
      { id: uid(), title: 'E-commerce Integration', description: 'Online store with payment processing', included: false },
      { id: uid(), title: 'Custom Animations', description: 'Micro-interactions and scroll-based animations', included: false },
    ],
    pricing: [
      { id: uid(), name: 'Website Design & Development', description: 'Complete website build', amount: 2500, is_recurring: false },
      { id: uid(), name: 'Monthly Maintenance', description: 'Updates, security, and hosting', amount: 99, is_recurring: true, frequency: 'monthly' },
    ],
    terms: 'This proposal is valid for 30 days from the date of issue. A 50% deposit is required to commence work, with the remainder due upon project completion. All prices are exclusive of VAT.',
  },
  seo_marketing: {
    label: 'SEO & Marketing',
    title: 'SEO & Digital Marketing Proposal',
    introduction: 'We specialise in data-driven SEO and digital marketing strategies that deliver measurable growth. This proposal outlines our recommended approach to boost your online presence.',
    scope: [
      { id: uid(), title: 'SEO Audit', description: 'Comprehensive technical and content audit', included: true },
      { id: uid(), title: 'Keyword Research', description: 'Target keyword identification and competitor gap analysis', included: true },
      { id: uid(), title: 'On-Page Optimisation', description: 'Meta tags, content structure, and internal linking', included: true },
      { id: uid(), title: 'Content Strategy', description: 'Blog calendar, content briefs, and copywriting', included: true },
      { id: uid(), title: 'Link Building', description: 'High-quality backlink acquisition', included: true },
      { id: uid(), title: 'Monthly Reporting', description: 'Performance dashboards and insights', included: true },
      { id: uid(), title: 'Social Media Management', description: 'Content creation and community management', included: false },
      { id: uid(), title: 'PPC Campaign Management', description: 'Google Ads and social advertising', included: false },
    ],
    pricing: [
      { id: uid(), name: 'SEO Setup & Audit', description: 'One-time setup and optimisation', amount: 1500, is_recurring: false },
      { id: uid(), name: 'Monthly SEO Retainer', description: 'Ongoing optimisation and reporting', amount: 499, is_recurring: true, frequency: 'monthly' },
    ],
    terms: 'This proposal is valid for 30 days. SEO results typically take 3-6 months to materialise. We recommend a minimum 6-month engagement for best results. All prices are exclusive of VAT.',
  },
  full_service: {
    label: 'Full Service Bundle',
    title: 'Full Service Digital Package Proposal',
    introduction: 'This comprehensive package combines web design, branding, and digital marketing into a unified strategy. Perfect for businesses looking for a complete digital transformation.',
    scope: [
      { id: uid(), title: 'Brand Strategy', description: 'Brand identity, voice, and visual guidelines', included: true },
      { id: uid(), title: 'Logo & Brand Design', description: 'Logo, colour palette, typography, and brand kit', included: true },
      { id: uid(), title: 'Website Design & Build', description: 'Custom responsive website with CMS', included: true },
      { id: uid(), title: 'SEO & Content Strategy', description: 'Full SEO setup with ongoing content plan', included: true },
      { id: uid(), title: 'Social Media Setup', description: 'Profile optimisation and content templates', included: true },
      { id: uid(), title: 'Analytics & Tracking', description: 'GA4, conversion tracking, and dashboards', included: true },
      { id: uid(), title: 'Email Marketing Setup', description: 'Newsletter templates and automation flows', included: false },
      { id: uid(), title: 'Video Production', description: 'Brand video and social media content', included: false },
    ],
    pricing: [
      { id: uid(), name: 'Full Service Package', description: 'Complete brand + web + marketing build', amount: 5000, is_recurring: false },
      { id: uid(), name: 'Monthly Growth Retainer', description: 'SEO, content, social, and maintenance', amount: 799, is_recurring: true, frequency: 'monthly' },
    ],
    terms: 'This proposal is valid for 30 days. A 40% deposit is required to commence, 30% at midpoint, and 30% upon completion. Monthly retainer begins after project launch. All prices exclusive of VAT.',
  },
};

export function useProposals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProposals(data.map(d => ({
        ...d,
        scope_items: (d.scope_items as any) || [],
        pricing_items: (d.pricing_items as any) || [],
      })) as Proposal[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const createFromTemplate = useCallback(async (
    templateType: TemplateType,
    leadData?: { id: string; business_name?: string; contact_name?: string; email?: string; phone?: string; }
  ) => {
    if (!user) return null;
    const template = PROPOSAL_TEMPLATES[templateType];

    // Generate proposal number
    const { data: numData } = await supabase.rpc('generate_proposal_number');
    const proposalNumber = (numData as unknown as string) || `PROP-${Date.now()}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const newProposal = {
      user_id: user.id,
      proposal_number: proposalNumber,
      template_type: templateType,
      status: 'draft',
      lead_id: leadData?.id || null,
      client_name: leadData?.contact_name || leadData?.business_name || null,
      client_email: leadData?.email || null,
      client_company: leadData?.business_name || null,
      client_phone: leadData?.phone || null,
      title: template.title,
      introduction: template.introduction,
      scope_items: template.scope as any,
      pricing_items: template.pricing as any,
      total_amount: template.pricing.reduce((s, p) => s + (p.is_recurring ? 0 : p.amount), 0),
      currency: 'GBP',
      valid_until: validUntil.toISOString().split('T')[0],
      terms: template.terms,
    };

    const { data, error } = await supabase
      .from('proposals')
      .insert(newProposal as any)
      .select()
      .single();

    if (error) {
      toast({ title: 'Failed to create proposal', description: error.message, variant: 'destructive' });
      return null;
    }

    const created = {
      ...data,
      scope_items: (data.scope_items as any) || [],
      pricing_items: (data.pricing_items as any) || [],
    } as Proposal;

    setProposals(prev => [created, ...prev]);
    toast({ title: 'Proposal created', description: proposalNumber });
    return created;
  }, [user, toast]);

  const updateProposal = useCallback(async (id: string, updates: Partial<Proposal>) => {
    if (!user) return;
    const dbUpdates: any = { ...updates };
    if (updates.scope_items) dbUpdates.scope_items = updates.scope_items;
    if (updates.pricing_items) dbUpdates.pricing_items = updates.pricing_items;

    const { error } = await supabase
      .from('proposals')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update proposal', variant: 'destructive' });
      return;
    }
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [user, toast]);

  const deleteProposal = useCallback(async (id: string) => {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (!error) {
      setProposals(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Proposal deleted' });
    }
  }, [toast]);

  const sendProposal = useCallback(async (id: string) => {
    await updateProposal(id, { status: 'sent', sent_at: new Date().toISOString() } as any);
    toast({ title: 'Proposal marked as sent' });
  }, [updateProposal, toast]);

  return { proposals, loading, fetchProposals, createFromTemplate, updateProposal, deleteProposal, sendProposal };
}
