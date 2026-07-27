import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EditorElement, TemplatePage } from '@/components/designer/types';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string | null;
  elements: EditorElement[];
  pages: TemplatePage[] | null;
  is_public: boolean;
  created_at: string;
}

export function useSavedTemplates() {
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('saved_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTemplates(data.map(t => ({
        ...t,
        description: t.description ?? '',
        elements: (t.elements as unknown as EditorElement[]) || [],
        pages: t.pages ? (t.pages as unknown as TemplatePage[]) : null,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveTemplate = useCallback(async (opts: {
    name: string;
    description?: string;
    category?: string;
    elements: EditorElement[];
    pages?: TemplatePage[];
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sign in required'); return null; }

    const { data, error } = await supabase.from('saved_templates').insert({
      user_id: user.id,
      name: opts.name,
      description: opts.description || '',
      category: opts.category || 'Custom',
      elements: opts.elements as unknown as Json,
      pages: opts.pages ? (opts.pages as unknown as Json) : null,
    }).select('id').single();

    if (error) { toast.error('Failed to save template'); return null; }
    toast.success(`Template "${opts.name}" saved`);
    await load();
    return data.id;
  }, [load]);

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('saved_templates').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Template deleted');
    await load();
  }, [load]);

  return { templates, loading, saveTemplate, deleteTemplate, reload: load };
}
