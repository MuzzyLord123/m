import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paintbrush, Globe, Layers, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

export default function LoungeWorkshop() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const created = useRef(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [animDone, setAnimDone] = useState(false);

  // Backend: create site in background
  useEffect(() => {
    if (created.current) return;
    created.current = true;

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        // Admins bypass subscription check
        if (!isAdmin) {
          const { data: subData } = await supabase.functions.invoke('check-designer-subscription');
          if (!subData?.subscribed) {
            toast({ title: 'Subscription required', description: 'Please subscribe to use the Workshop.', variant: 'destructive' });
            navigate('/lounge/website-designer');
            return;
          }
        }

        const { data: site, error } = await supabase
          .from('designer_sites')
          .insert({ site_name: 'Untitled Site', user_id: userData.user.id })
          .select()
          .single();
        if (error) throw error;

        await supabase.from('designer_pages').insert([{
          site_id: (site as any).id,
          user_id: userData.user.id,
          page_name: 'Home',
          slug: '/',
          is_homepage: true,
        }]);

        setTargetUrl(`/lounge/editor/${(site as any).id}`);
      } catch {
        toast({ title: 'Error', description: 'Failed to launch workshop.', variant: 'destructive' });
        navigate('/lounge/website-designer');
      }
    })();
  }, [navigate, toast]);

  // Minimum animation duration
  useEffect(() => {
    const t = setTimeout(() => setAnimDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Navigate when both ready
  useEffect(() => {
    if (targetUrl && animDone) navigate(targetUrl);
  }, [targetUrl, animDone, navigate]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Ripple rings */}
      <div className="relative">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.5 + i, opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
            style={{ width: 60, height: 60 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 16 }}
          className="relative rounded-[20px] bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-border/30 flex items-center justify-center"
          style={{ width: 72, height: 72 }}
        >
          <Paintbrush className="h-8 w-8 text-foreground/70" />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mt-8 text-xl font-bold text-foreground tracking-tight"
      >
        Website Designer
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="text-xs text-muted-foreground mt-1.5"
      >
        Preparing your canvas…
      </motion.p>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex items-center gap-2 mt-6"
      >
        {[
          { icon: Layers, label: "Templates" },
          { icon: Globe, label: "Publish" },
          { icon: Palette, label: "Design" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30"
          >
            <item.icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-1 mt-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
