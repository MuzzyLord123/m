import { useState, useCallback, useRef } from 'react';

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  loading?: boolean;
  error?: boolean;
}

// Cache for IP geolocation data to avoid repeated API calls
const geoCache = new Map<string, GeoLocation>();

export function useIPGeolocation() {
  const [geoData, setGeoData] = useState<Record<string, GeoLocation>>({});
  const pendingRequests = useRef<Set<string>>(new Set());

  const lookupIP = useCallback(async (ip: string): Promise<GeoLocation | null> => {
    // Check cache first
    if (geoCache.has(ip)) {
      return geoCache.get(ip)!;
    }

    // Skip if already fetching
    if (pendingRequests.current.has(ip)) {
      return null;
    }

    // Skip private/local IPs
    if (ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.') || ip === 'localhost') {
      const localData: GeoLocation = {
        country: 'Local Network',
        countryCode: 'LN',
        region: 'Private',
        city: 'Private',
        isp: 'Local'
      };
      geoCache.set(ip, localData);
      return localData;
    }

    pendingRequests.current.add(ip);

    try {
      // Using ip-api.com (free, no API key required, 45 req/min limit)
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch geolocation');
      }

      const data = await response.json();

      if (data.status === 'success') {
        const geoLocation: GeoLocation = {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || '??',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          isp: data.isp || 'Unknown'
        };
        
        geoCache.set(ip, geoLocation);
        setGeoData(prev => ({ ...prev, [ip]: geoLocation }));
        return geoLocation;
      } else {
        throw new Error('Geolocation lookup failed');
      }
    } catch (error) {
      console.error(`Failed to lookup IP ${ip}:`, error);
      const errorData: GeoLocation = {
        country: 'Unknown',
        countryCode: '??',
        region: 'Unknown',
        city: 'Unknown',
        isp: 'Unknown',
        error: true
      };
      geoCache.set(ip, errorData);
      setGeoData(prev => ({ ...prev, [ip]: errorData }));
      return errorData;
    } finally {
      pendingRequests.current.delete(ip);
    }
  }, []);

  const lookupMultipleIPs = useCallback(async (ips: string[]) => {
    // Deduplicate and filter already cached IPs
    const uniqueIPs = [...new Set(ips)].filter(ip => !geoCache.has(ip));
    
    // Set loading state for IPs we're about to fetch
    const loadingState: Record<string, GeoLocation> = {};
    uniqueIPs.forEach(ip => {
      loadingState[ip] = {
        country: 'Loading...',
        countryCode: '...',
        region: '',
        city: '',
        isp: '',
        loading: true
      };
    });
    
    if (Object.keys(loadingState).length > 0) {
      setGeoData(prev => ({ ...prev, ...loadingState }));
    }

    // Batch requests with delay to respect rate limits (45/min)
    // Process 5 at a time with 150ms delay between batches
    const batchSize = 5;
    for (let i = 0; i < uniqueIPs.length; i += batchSize) {
      const batch = uniqueIPs.slice(i, i + batchSize);
      await Promise.all(batch.map(ip => lookupIP(ip)));
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < uniqueIPs.length) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  }, [lookupIP]);

  const getGeoData = useCallback((ip: string): GeoLocation | undefined => {
    return geoCache.get(ip) || geoData[ip];
  }, [geoData]);

  return {
    lookupIP,
    lookupMultipleIPs,
    getGeoData,
    geoData
  };
}

// Country code to flag emoji converter
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === '??' || countryCode === 'LN' || countryCode.length !== 2) {
    return '🌐';
  }
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
