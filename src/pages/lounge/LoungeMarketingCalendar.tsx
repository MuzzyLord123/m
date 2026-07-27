import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MarketingCalendar from '@/components/MarketingCalendar';

interface AdCampaign {
  id: string;
  platform: string;
  campaign_name: string;
  creative_url: string | null;
  creative_type: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  monthly_budget: number | null;
  notes: string | null;
  last_updated_at: string;
  created_at: string;
}

interface SocialMediaPost {
  id: string;
  account_id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface ContentRequest {
  id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  priority: string | null;
}

export default function LoungeMarketingCalendar() {
  const { user } = useAuth();
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [contentRequests, setContentRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [adsRes, socialRes, contentRes] = await Promise.all([
        supabase
          .from('ad_campaigns')
          .select('*')
          .order('start_date', { ascending: false }),
        supabase
          .from('social_media_posts')
          .select('*')
          .order('scheduled_at', { ascending: false }),
        supabase
          .from('content_requests')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (adsRes.error) throw adsRes.error;
      if (socialRes.error) throw socialRes.error;
      if (contentRes.error) throw contentRes.error;

      setAdCampaigns(adsRes.data || []);
      setSocialPosts(socialRes.data || []);
      setContentRequests(contentRes.data || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <LoungePageHeader
          title="Marketing Calendar"
          description="View all your ad campaigns, social posts, and content requests in one unified timeline"
          icon={Calendar}
        />

        {/* Calendar Component */}
        <MarketingCalendar
          adCampaigns={adCampaigns}
          socialPosts={socialPosts}
          contentRequests={contentRequests}
          loading={loading}
        />
      </motion.div>
    </div>
  );
}
