import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'company' | 'contact' | 'opportunity';

export interface CRMCompany {
  id: string;
  owner_id: string | null;
  name: string;
  legal_name: string | null;
  domain: string | null;
  website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  tags: string[] | null;
  relationship_type: string[] | null;
  lifecycle_stage_id: string | null;
  updated_at: string;
  created_at: string;
}

export interface CRMContact {
  id: string;
  owner_id: string | null;
  company_id: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  tags: string[] | null;
  relationship_type: string[] | null;
  lifecycle_stage_id: string | null;
  updated_at: string;
  created_at: string;
}

export interface CRMOpportunity {
  id: string;
  owner_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  value: number | null;
  currency: string | null;
  stage: string | null;
  probability: number | null;
  expected_close_date: string | null;
  lifecycle_stage_id: string | null;
  updated_at: string;
  created_at: string;
}

export interface LifecycleStage {
  id: string;
  name: string;
  slug: string;
  color: string;
  order_index: number;
  category: string;
}

async function fetchAll<T>(table: 'crm_companies' | 'crm_contacts' | 'crm_opportunities'): Promise<T[]> {
  const pageSize = 1000;
  let from = 0;
  const all: T[] = [];
  while (from < 50000) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('updated_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error || !data) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export function useCRMData() {
  const [companies, setCompanies] = useState<CRMCompany[]>([]);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [stages, setStages] = useState<LifecycleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Only the very first load blanks the screen. Every refresh after that
  // is silent: the data on screen stays put and is replaced when the new
  // rows land, so changing a stage never tears the open record down.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    const [c, ct, o, sRes] = await Promise.all([
      fetchAll<CRMCompany>('crm_companies'),
      fetchAll<CRMContact>('crm_contacts'),
      fetchAll<CRMOpportunity>('crm_opportunities'),
      supabase.from('crm_lifecycle_stages').select('*').order('order_index'),
    ]);
    setCompanies(c);
    setContacts(ct);
    setOpportunities(o);
    if (sRes.data) setStages(sRes.data as any);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { companies, contacts, opportunities, stages, loading, refreshing, refresh };
}

export async function fetchTimeline(entityType: EntityType, entityId: string) {
  const { data } = await supabase.rpc('crm_timeline' as any, {
    entity_type: entityType, entity_id: entityId, limit_count: 50,
  } as any);
  return (data as any[]) || [];
}

export async function fetchFinancials(entityType: EntityType, entityId: string) {
  const [linksRes, ltvRes] = await Promise.all([
    supabase.rpc('crm_entity_financials' as any, { _entity_type: entityType, _entity_id: entityId } as any),
    supabase.rpc('crm_entity_lifetime_value' as any, { _entity_type: entityType, _entity_id: entityId } as any),
  ]);
  return {
    links: (linksRes.data as any[]) || [],
    ltv: (ltvRes.data as any[])?.[0] || null,
  };
}

export async function setLifecycleStage(entityType: EntityType, entityId: string, stageId: string, note?: string) {
  return supabase.rpc('crm_set_lifecycle_stage' as any, {
    _entity_type: entityType, _entity_id: entityId, _new_stage_id: stageId, _note: note ?? null,
  } as any);
}
