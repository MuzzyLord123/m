import { useEffect, useCallback, useRef, useState } from 'react';

const STORAGE_KEY = 'quooro_enquiry_draft';
const DEBOUNCE_MS = 1000;

interface DraftData {
  formData: Record<string, unknown>;
  currentStep: number;
  lastSaved: string;
}

interface UseAutosaveReturn {
  saveDraft: () => void;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;
  hasDraft: boolean;
  lastSaved: Date | null;
}

export function useAutosave(
  formData: Record<string, unknown>,
  currentStep: number
): UseAutosaveReturn {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    setHasDraft(!!draft);
    if (draft?.lastSaved) {
      setLastSaved(new Date(draft.lastSaved));
    }
  }, []);

  const saveDraft = useCallback(() => {
    const draftData: DraftData = {
      formData,
      currentStep,
      lastSaved: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData, currentStep]);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as DraftData;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only autosave if there's meaningful data
    const hasData = formData && Object.values(formData).some(v => 
      v !== '' && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)
    );

    if (hasData) {
      timeoutRef.current = setTimeout(() => {
        saveDraft();
      }, DEBOUNCE_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, currentStep, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    lastSaved,
  };
}
