import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, X, ArrowRight, Globe } from 'lucide-react';
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
          className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-brand/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />

            <button
              onClick={close}
              aria-label="Dismiss"
              className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-accent/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center shadow-lg shadow-brand/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-brand font-medium">A message from Quooro</div>
                  <h2 className="text-lg sm:text-xl font-display font-semibold">
                    Welcome{name ? `, ${name}` : ''} 👋
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap mb-6">
                {message}
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <Button variant="ghost" onClick={close} className="sm:w-auto w-full">
                  Maybe later
                </Button>
                <Button variant="premium" onClick={openPreview} className="sm:w-auto w-full gap-2">
                  <Globe className="h-4 w-4" />
                  View Live Preview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
