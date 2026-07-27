import { supabase } from '@/integrations/supabase/client';
import type { EntityType } from './useCRMData';

/* ---------- CSV helpers ---------- */
function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join('|') : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: any[], columns: string[]): string {
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => csvEscape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (field.length || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ''; }
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const header = rows.shift()!.map(h => h.trim());
  return rows.filter(r => r.length && r.some(v => v !== '')).map(r => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Column definitions ---------- */
export const EXPORT_COLUMNS: Record<EntityType, string[]> = {
  company: ['name', 'legal_name', 'domain', 'website', 'industry', 'phone', 'email', 'city', 'country', 'relationship_type', 'tags', 'notes', 'created_at', 'updated_at'],
  contact: ['full_name', 'first_name', 'last_name', 'email', 'phone', 'mobile', 'job_title', 'relationship_type', 'tags', 'notes', 'created_at', 'updated_at'],
  opportunity: ['title', 'description', 'value', 'currency', 'stage', 'probability', 'expected_close_date', 'created_at', 'updated_at'],
};

/* ---------- Export ---------- */
export function exportEntities(entity: EntityType, rows: any[]) {
  const cols = EXPORT_COLUMNS[entity];
  const csv = toCSV(rows, cols);
  downloadCSV(`crm-${entity}s-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

/* ---------- Import ---------- */
function splitArray(v: string): string[] | null {
  if (!v) return null;
  return v.split(/[|,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

export async function importEntities(
  entity: EntityType,
  csvText: string,
): Promise<{ inserted: number; failed: number; errors: string[] }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Not signed in');
  // Resolve org_id (primary admin id) for insert
  const { data: adminRow } = await supabase
    .from('user_roles').select('user_id, created_at')
    .eq('role', 'admin').order('created_at', { ascending: true }).limit(1).maybeSingle();
  const orgId = adminRow?.user_id;
  if (!orgId) throw new Error('No admin org available');

  const parsed = parseCSV(csvText);
  const errors: string[] = [];
  let inserted = 0;
  let failed = 0;

  const chunkSize = 200;
  for (let i = 0; i < parsed.length; i += chunkSize) {
    const chunk = parsed.slice(i, i + chunkSize);
    const rows = chunk.map(r => {
      const base: any = { org_id: orgId, owner_id: userId };
      if (entity === 'company') {
        return {
          ...base,
          name: r.name || r.company || r.business_name || '(Unnamed)',
          legal_name: r.legal_name || null,
          domain: r.domain || null,
          website: r.website || r.website_url || null,
          industry: r.industry || r.category || null,
          phone: r.phone || null,
          email: r.email || null,
          city: r.city || r.location_city || null,
          country: r.country || null,
          notes: r.notes || null,
          tags: splitArray(r.tags),
          relationship_type: splitArray(r.relationship_type) || ['lead'],
        };
      }
      if (entity === 'contact') {
        return {
          ...base,
          full_name: r.full_name || r.name || r.contact_name || r.personal_name || null,
          first_name: r.first_name || null,
          last_name: r.last_name || null,
          email: r.email || null,
          phone: r.phone || null,
          mobile: r.mobile || null,
          job_title: r.job_title || r.title || null,
          notes: r.notes || null,
          tags: splitArray(r.tags),
          relationship_type: splitArray(r.relationship_type) || ['lead'],
        };
      }
      // opportunity
      return {
        ...base,
        title: r.title || r.name || '(Untitled)',
        description: r.description || null,
        value: r.value ? Number(r.value) : null,
        currency: r.currency || 'GBP',
        stage: r.stage || null,
        probability: r.probability ? Number(r.probability) : null,
        expected_close_date: r.expected_close_date || null,
      };
    });

    const table = entity === 'company' ? 'crm_companies' : entity === 'contact' ? 'crm_contacts' : 'crm_opportunities';
    const { error, count } = await supabase.from(table as any).insert(rows as any, { count: 'exact' } as any);
    if (error) {
      failed += rows.length;
      errors.push(error.message);
    } else {
      inserted += count ?? rows.length;
    }
  }
  return { inserted, failed, errors };
}
