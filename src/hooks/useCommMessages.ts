import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  parent_id: string | null;
  thread_count: number;
  attachments: any[];
  metadata: Record<string, any>;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  mentions: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  sender_name?: string;
  sender_avatar?: string;
  reactions?: { emoji: string; count: number; user_ids: string[] }[];
}

export function useCommMessages(channelId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const profileCache = useRef<Record<string, { full_name: string; avatar_url: string | null }>>({});

  const enrichMessages = useCallback(async (msgs: any[]): Promise<CommMessage[]> => {
    // Gather unique sender IDs not in cache
    const unknownIds = [...new Set(msgs.map(m => m.sender_id))].filter(id => !profileCache.current[id]);

    if (unknownIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', unknownIds);
      if (profiles) {
        profiles.forEach(p => {
          profileCache.current[p.user_id] = { full_name: p.full_name || 'Unknown', avatar_url: p.avatar_url };
        });
      }
    }

    // Fetch reactions for these messages
    const msgIds = msgs.map(m => m.id);
    const { data: reactions } = await supabase
      .from('comm_reactions')
      .select('*')
      .in('message_id', msgIds);

    // Group reactions by message
    const reactionMap: Record<string, { emoji: string; count: number; user_ids: string[] }[]> = {};
    if (reactions) {
      reactions.forEach(r => {
        if (!reactionMap[r.message_id]) reactionMap[r.message_id] = [];
        const existing = reactionMap[r.message_id].find(x => x.emoji === r.emoji);
        if (existing) { existing.count++; existing.user_ids.push(r.user_id); }
        else reactionMap[r.message_id].push({ emoji: r.emoji, count: 1, user_ids: [r.user_id] });
      });
    }

    return msgs.map(m => ({
      ...m,
      sender_name: profileCache.current[m.sender_id]?.full_name || 'Unknown',
      sender_avatar: profileCache.current[m.sender_id]?.avatar_url || null,
      reactions: reactionMap[m.id] || [],
    }));
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('comm_messages')
      .select('*')
      .eq('channel_id', channelId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .limit(200);

    if (!error && data) {
      const enriched = await enrichMessages(data as any[]);
      setMessages(enriched);
    }
    setLoading(false);
  }, [channelId, enrichMessages]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;
    const sub = supabase
      .channel(`comm-messages-${channelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comm_messages',
        filter: `channel_id=eq.${channelId}`,
      }, () => { fetchMessages(); })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'comm_reactions',
      }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [channelId, fetchMessages]);

  const sendMessage = async (content: string, parentId?: string) => {
    if (!user?.id || !channelId || !content.trim()) return;
    setSending(true);
    const { error } = await supabase.from('comm_messages').insert({
      channel_id: channelId,
      sender_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
      mentions: extractMentions(content),
    });
    if (error) console.error('Failed to send:', error);
    setSending(false);
  };

  const editMessage = async (messageId: string, newContent: string) => {
    await supabase.from('comm_messages').update({
      content: newContent, is_edited: true, edited_at: new Date().toISOString(),
    }).eq('id', messageId);
  };

  const deleteMessage = async (messageId: string) => {
    await supabase.from('comm_messages').update({
      is_deleted: true, deleted_at: new Date().toISOString(), content: '[Message deleted]',
    }).eq('id', messageId);
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id) return;
    const { data: existing } = await supabase
      .from('comm_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      await supabase.from('comm_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('comm_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    }
  };

  const pinMessage = async (messageId: string, pinned: boolean) => {
    await supabase.from('comm_messages').update({ is_pinned: pinned }).eq('id', messageId);
  };

  return {
    messages, loading, sending,
    sendMessage, editMessage, deleteMessage, toggleReaction, pinMessage,
    refetch: fetchMessages,
  };
}

function extractMentions(content: string): string[] {
  const matches = content.match(/@\[([^\]]+)\]\(([^)]+)\)/g);
  if (!matches) return [];
  return matches.map(m => {
    const match = m.match(/@\[([^\]]+)\]\(([^)]+)\)/);
    return match ? match[2] : '';
  }).filter(Boolean);
}
