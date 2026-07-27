import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_owner: boolean;
  initials: string;
}

function computeInitials(name: string | null, email: string | null): string {
  const source = (name && name.trim()) || (email || '').split('@')[0];
  if (!source) return '??';
  const parts = source.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const ids = (roles || []).map((r: any) => r.user_id);
    if (!ids.length) { setAdmins([]); setLoading(false); return; }
    const { data: profs } = await supabase.from('profiles').select('user_id,email,full_name,is_owner').in('user_id', ids);
    const list: AdminUser[] = (profs || []).map((p: any) => ({
      user_id: p.user_id,
      email: p.email,
      full_name: p.full_name,
      is_owner: !!p.is_owner,
      initials: computeInitials(p.full_name, p.email),
    }));
    // Owners first, then by name
    list.sort((a, b) => (Number(b.is_owner) - Number(a.is_owner)) || ((a.full_name || a.email || '').localeCompare(b.full_name || b.email || '')));
    setAdmins(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { admins, loading, refresh };
}

export function adminColor(userId: string): string {
  // Deterministic pastel from user id
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffff;
  return `hsl(${h % 360} 65% 55%)`;
}
