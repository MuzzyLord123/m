import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge, Flame, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureUsage {
  feature: string;
  count: number;
}

const FEATURE_LABELS: Record<string, string> = {
  calendar: 'Calendar',
  crm: 'CRM',
  mail: 'Mail',
  content: 'Content',
  apps: 'App Projects',
  assets: 'Assets',
  messages: 'Messages',
  billing: 'Billing',
  ai: 'AI Assistant',
  website: 'Website',
  team: 'Team',
  settings: 'Settings',
  tickets: 'Support',
  seo: 'SEO',
};

export default function UsageInsights() {
  const { user } = useAuth();
  const [topFeatures, setTopFeatures] = useState<FeatureUsage[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(500 * 1024 * 1024); // 500MB default
  const [loginStreak, setLoginStreak] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function load() {
      // Top features from activity log
      const { data: activityData } = await supabase
        .from('user_activity_log')
        .select('feature_name')
        .eq('user_id', user!.id)
        .order('visited_at', { ascending: false })
        .limit(200);

      if (activityData) {
        const counts: Record<string, number> = {};
        activityData.forEach(a => {
          counts[a.feature_name] = (counts[a.feature_name] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([feature, count]) => ({ feature, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopFeatures(sorted);
      }

      // Storage quota
      const { data: quota } = await supabase
        .from('storage_quotas')
        .select('used_bytes, quota_bytes')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (quota) {
        setStorageUsed(quota.used_bytes || 0);
        setStorageQuota(quota.quota_bytes || 500 * 1024 * 1024);
      }

      // Login streak (count consecutive days with activity)
      const { data: recentActivity } = await supabase
        .from('user_activity_log')
        .select('visited_at')
        .eq('user_id', user!.id)
        .order('visited_at', { ascending: false })
        .limit(100);

      if (recentActivity && recentActivity.length > 0) {
        const days = new Set(recentActivity.map(a => new Date(a.visited_at).toDateString()));
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          if (days.has(d.toDateString())) {
            streak++;
          } else if (i > 0) break; // Allow today to be missing
        }
        setLoginStreak(streak);
      }
    }

    load();
  }, [user]);

  const storagePercent = useMemo(() => Math.min(100, Math.round((storageUsed / storageQuota) * 100)), [storageUsed, storageQuota]);
  const storageMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const quotaMB = (storageQuota / (1024 * 1024)).toFixed(0);
  const maxCount = topFeatures.length > 0 ? topFeatures[0].count : 1;

  return (
    <div className="rounded-lg bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Gauge className="w-3.5 h-3.5 text-[#a78bfa]" />
        <span className="text-[11px] font-semibold text-foreground/80">Usage Insights</span>
      </div>
      <div className="p-4 space-y-5">
        {/* Login Streak */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#f97316]/10">
            <Flame className="w-4 h-4 text-[#f97316]" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-foreground tabular-nums">{loginStreak}</p>
            <p className="text-[10px] text-muted-foreground">day streak</p>
          </div>
        </div>

        {/* Most Used Tools */}
        {topFeatures.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Most Used</p>
            <div className="space-y-1.5">
              {topFeatures.map(f => (
                <div key={f.feature} className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/70 w-16 truncate">{FEATURE_LABELS[f.feature] || f.feature}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#a78bfa]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(f.count / maxCount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[9px] tabular-nums text-muted-foreground w-6 text-right">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <HardDrive className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Storage</p>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: storagePercent > 80 ? '#ef4444' : storagePercent > 60 ? '#fbbf24' : '#34d399' }}
              initial={{ width: 0 }}
              animate={{ width: `${storagePercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1">{storageMB} MB / {quotaMB} MB used</p>
        </div>
      </div>
    </div>
  );
}
