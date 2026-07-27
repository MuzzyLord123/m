import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AI_MODELS = [
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', provider: 'Google', speed: 'Fast', quality: 'High' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'Google', speed: 'Fast', quality: 'Good' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', speed: 'Slow', quality: 'Best' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'Google', speed: 'Medium', quality: 'Best' },
  { id: 'openai/gpt-5', label: 'GPT-5', provider: 'OpenAI', speed: 'Slow', quality: 'Best' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', provider: 'OpenAI', speed: 'Fast', quality: 'Good' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', provider: 'OpenAI', speed: 'Fastest', quality: 'Basic' },
  { id: 'openai/gpt-5.2', label: 'GPT-5.2', provider: 'OpenAI', speed: 'Medium', quality: 'Best' },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

export function useAIModelSettings() {
  const [activeModel, setActiveModel] = useState<AIModelId>('google/gemini-3-flash-preview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('ai_model_settings')
        .select('active_model')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.active_model) {
        setActiveModel(data.active_model as AIModelId);
      }
      setLoading(false);
    })();
  }, []);

  const updateModel = useCallback(async (modelId: AIModelId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setActiveModel(modelId);

    const { error } = await supabase
      .from('ai_model_settings')
      .upsert({ user_id: user.id, active_model: modelId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to save model preference');
    } else {
      const model = AI_MODELS.find(m => m.id === modelId);
      toast.success(`Switched to ${model?.label || modelId}`);
    }
  }, []);

  return { activeModel, updateModel, loading, models: AI_MODELS };
}
