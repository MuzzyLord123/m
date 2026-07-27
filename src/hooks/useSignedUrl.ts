import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const urlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_DURATION_MS = 50 * 60 * 1000; // 50 minutes (signed URLs expire in 1 hour)

export function useSignedUrl(imagePath: string | null, bucket: string = 'customer-uploads') {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setSignedUrl(null);
      return;
    }

    // If it's already a full URL (legacy data), use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      setSignedUrl(imagePath);
      return;
    }

    // Check cache first
    const cacheKey = `${bucket}:${imagePath}`;
    const cached = urlCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSignedUrl(cached.url);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(imagePath, 3600); // 1 hour expiration

        if (error) {
          console.error('Error creating signed URL:', error);
          setSignedUrl(null);
        } else if (data?.signedUrl) {
          // Cache the URL
          urlCache.set(cacheKey, {
            url: data.signedUrl,
            expiresAt: Date.now() + CACHE_DURATION_MS,
          });
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error creating signed URL:', err);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [imagePath, bucket]);

  return { signedUrl, loading };
}

// Helper function for getting signed URLs outside of React components
export async function getSignedUrl(imagePath: string | null, bucket: string = 'customer-uploads'): Promise<string | null> {
  if (!imagePath) return null;

  // If it's already a full URL (legacy data), return it directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Check cache first
  const cacheKey = `${bucket}:${imagePath}`;
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(imagePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    // Cache the URL
    urlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    });

    return data.signedUrl;
  } catch (err) {
    console.error('Error creating signed URL:', err);
    return null;
  }
}
