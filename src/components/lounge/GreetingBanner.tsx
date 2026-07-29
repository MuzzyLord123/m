import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function GreetingBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [{ data }, { data: prof }] = await Promise.all([
        (supabase as any)
          .from('greeting_messages')
          .select('message,enabled,updated_at')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('profiles').select('full_name, preview_url').eq('user_id', user.id).maybeSingle(),
      ]);
      if (!active) return;
      setName((prof?.full_name || '').split(' ')[0] || '');
      setPreviewUrl((prof as any)?.preview_url || null);
      if (data?.enabled && data.message?.trim()) {
        const key = `greeting:seen:${data.updated_at}`;
        if (sessionStorage.getItem(key) !== '1') {
          setMessage(data.message);
          setOpen(true);
          sessionStorage.setItem(key, '1');
        }
      }
    })();
    return () => { active = false; };
  }, [user]);

  function close() { setOpen(false); }
  function openPreview() {
    setOpen(false);
    if (previewUrl) {
      let url = previewUrl;
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate('/lounge/website');
    }
  }


  return (
    <AnimatePresence>
      {open && message && (
        <motion.div
          key="greeting-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/80 p-4"
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="greeting-banner-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 shadow-premium sm:p-8"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              From the studio
            </p>
            <h2
              id="greeting-banner-title"
              className="mt-2 font-display text-xl font-semibold tracking-[-0.01em] text-foreground"
            >
              Welcome{name ? `, ${name}` : ''}.
            </h2>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
              {message}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button variant="ghost" onClick={close} className="w-full sm:w-auto">
                Not now
              </Button>
              <Button onClick={openPreview} className="w-full sm:w-auto">
                {previewUrl ? 'Open preview' : 'View website'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
