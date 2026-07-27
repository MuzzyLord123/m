import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';

const { useState, useEffect, useCallback, useRef } = React;

interface TypingStatus {
  [recipientId: string]: boolean;
}

export function useTypingIndicator(userId: string | undefined, recipientId: string | null) {
  const [isTyping, setIsTyping] = useState(false);
  const [othersTyping, setOthersTyping] = useState<TypingStatus>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast typing status
  const broadcastTyping = useCallback(async (typing: boolean) => {
    if (!userId || !recipientId) return;

    const channel = supabase.channel('typing-indicators');
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        recipientId,
        isTyping: typing,
      },
    });
  }, [userId, recipientId]);

  // Handle typing input
  const handleTyping = useCallback(() => {
    if (!userId || !recipientId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast that user is typing
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(true);
    }

    // Set timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(false);
    }, 2000);
  }, [userId, recipientId, isTyping, broadcastTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      broadcastTyping(false);
    }
  }, [isTyping, broadcastTyping]);

  // Listen for typing events
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('typing-indicators')
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: senderId, recipientId: targetId, isTyping: typing } = payload.payload;
        
        // If this typing event is for us (we're the recipient)
        if (targetId === userId) {
          setOthersTyping(prev => ({
            ...prev,
            [senderId]: typing,
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId]);

  // Check if a specific user is typing to us
  const isUserTyping = useCallback((otherUserId: string) => {
    return othersTyping[otherUserId] || false;
  }, [othersTyping]);

  return {
    handleTyping,
    stopTyping,
    isUserTyping,
    othersTyping,
  };
}
