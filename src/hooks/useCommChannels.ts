import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  channel_type: string;
  icon: string;
  color: string | null;
  created_by: string;
  is_archived: boolean;
  is_default: boolean;
  join_code: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export function useCommChannels() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<CommChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('comm_channels')
      .select('*')
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .order('name');

    if (!error && data) {
      setChannels(data as CommChannel[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  // Subscribe to channel changes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('comm-channel-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comm_channels' }, () => {
        fetchChannels();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchChannels]);

  const createChannel = async (name: string, type: string, description?: string) => {
    if (!user?.id) return null;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await supabase.from('comm_channels').insert({
      name, slug, description: description || null, channel_type: type, created_by: user.id,
    }).select().single();

    if (!error && data) {
      // Auto-join creator
      await supabase.from('comm_channel_members').insert({
        channel_id: data.id, user_id: user.id, role: 'owner',
      });
      fetchChannels();
      return data;
    }
    return null;
  };

  const joinChannel = async (channelId: string) => {
    if (!user?.id) return;
    await supabase.from('comm_channel_members').upsert({
      channel_id: channelId, user_id: user.id, role: 'member',
    }, { onConflict: 'channel_id,user_id' });
  };

  const leaveChannel = async (channelId: string) => {
    if (!user?.id) return;
    await supabase.from('comm_channel_members').delete()
      .eq('channel_id', channelId).eq('user_id', user.id);
  };

  return { channels, loading, fetchChannels, createChannel, joinChannel, leaveChannel };
}
