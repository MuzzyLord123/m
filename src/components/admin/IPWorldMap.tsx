import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, ShieldOff, ShieldCheck, MapPin } from 'lucide-react';
import type { GeoLocation } from '@/hooks/useIPGeolocation';
import { getFlagEmoji } from '@/hooks/useIPGeolocation';

interface IPData {
  ip: string;
  type: 'blocked' | 'whitelisted' | 'login';
  geo?: GeoLocation;
  reason?: string;
  eventType?: string;
}

interface IPWorldMapProps {
  ips: IPData[];
  title?: string;
  description?: string;
}

// Approximate country coordinates for plotting on the map (longitude, latitude)
const countryCoordinates: Record<string, { lat: number; lng: number }> = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'IN': { lat: 20.5937, lng: 78.9629 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'RU': { lat: 61.5240, lng: 105.3188 },
  'KR': { lat: 35.9078, lng: 127.7669 },
  'IT': { lat: 41.8719, lng: 12.5674 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'MX': { lat: 23.6345, lng: -102.5528 },
  'NL': { lat: 52.1326, lng: 5.2913 },
  'SE': { lat: 60.1282, lng: 18.6435 },
  'CH': { lat: 46.8182, lng: 8.2275 },
  'PL': { lat: 51.9194, lng: 19.1451 },
  'BE': { lat: 50.5039, lng: 4.4699 },
  'AT': { lat: 47.5162, lng: 14.5501 },
  'NO': { lat: 60.4720, lng: 8.4689 },
  'DK': { lat: 56.2639, lng: 9.5018 },
  'FI': { lat: 61.9241, lng: 25.7482 },
  'IE': { lat: 53.4129, lng: -8.2439 },
  'PT': { lat: 39.3999, lng: -8.2245 },
  'NZ': { lat: -40.9006, lng: 174.8860 },
  'SG': { lat: 1.3521, lng: 103.8198 },
  'HK': { lat: 22.3193, lng: 114.1694 },
  'ZA': { lat: -30.5595, lng: 22.9375 },
  'AE': { lat: 23.4241, lng: 53.8478 },
  'IL': { lat: 31.0461, lng: 34.8516 },
  'TR': { lat: 38.9637, lng: 35.2433 },
  'AR': { lat: -38.4161, lng: -63.6167 },
  'CL': { lat: -35.6751, lng: -71.5430 },
  'CO': { lat: 4.5709, lng: -74.2973 },
  'UA': { lat: 48.3794, lng: 31.1656 },
  'RO': { lat: 45.9432, lng: 24.9668 },
  'CZ': { lat: 49.8175, lng: 15.4730 },
  'GR': { lat: 39.0742, lng: 21.8243 },
  'TH': { lat: 15.8700, lng: 100.9925 },
  'MY': { lat: 4.2105, lng: 101.9758 },
  'ID': { lat: -0.7893, lng: 113.9213 },
  'PH': { lat: 12.8797, lng: 121.7740 },
  'VN': { lat: 14.0583, lng: 108.2772 },
  'EG': { lat: 26.8206, lng: 30.8025 },
  'NG': { lat: 9.0820, lng: 8.6753 },
  'KE': { lat: -0.0236, lng: 37.9062 },
  'SA': { lat: 23.8859, lng: 45.0792 },
  'PK': { lat: 30.3753, lng: 69.3451 },
  'BD': { lat: 23.6850, lng: 90.3563 },
};

// Convert lat/lng to map coordinates (simple equirectangular projection)
function latLngToMapPosition(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

export default function IPWorldMap({ ips, title = 'IP Locations Map', description }: IPWorldMapProps) {
  // Group IPs by country
  const countryData = useMemo(() => {
    const grouped: Record<string, { 
      code: string; 
      name: string; 
      blocked: IPData[]; 
      whitelisted: IPData[]; 
      logins: IPData[];
      coords: { lat: number; lng: number } | null 
    }> = {};

    ips.forEach(ipData => {
      if (!ipData.geo || ipData.geo.countryCode === '??' || ipData.geo.countryCode === 'LN') return;
      
      const code = ipData.geo.countryCode;
      if (!grouped[code]) {
        grouped[code] = {
          code,
          name: ipData.geo.country,
          blocked: [],
          whitelisted: [],
          logins: [],
          coords: countryCoordinates[code] || null
        };
      }

      if (ipData.type === 'blocked') {
        grouped[code].blocked.push(ipData);
      } else if (ipData.type === 'whitelisted') {
        grouped[code].whitelisted.push(ipData);
      } else {
        grouped[code].logins.push(ipData);
      }
    });

    return grouped;
  }, [ips]);

  // Stats
  const stats = useMemo(() => {
    const countries = Object.keys(countryData).length;
    const blockedCountries = Object.values(countryData).filter(c => c.blocked.length > 0).length;
    const whitelistedCountries = Object.values(countryData).filter(c => c.whitelisted.length > 0).length;
    return { countries, blockedCountries, whitelistedCountries };
  }, [countryData]);

  const mapWidth = 800;
  const mapHeight = 400;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              {description || `Showing ${ips.length} IPs across ${stats.countries} countries`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-risk" />
              <span className="text-muted-foreground">Blocked ({stats.blockedCountries})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-ok" />
              <span className="text-muted-foreground">Whitelisted ({stats.whitelistedCountries})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Logins</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[2/1] bg-muted/30 rounded-lg overflow-hidden border">
          {/* World Map Background - SVG outline */}
          <svg 
            viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Simplified continent outlines - using paths */}
            <g fill="hsl(var(--muted-foreground))" fillOpacity="0.1" stroke="hsl(var(--border))" strokeWidth="0.5">
              {/* North America */}
              <ellipse cx="180" cy="140" rx="100" ry="70" />
              {/* South America */}
              <ellipse cx="230" cy="280" rx="50" ry="80" />
              {/* Europe */}
              <ellipse cx="430" cy="120" rx="50" ry="40" />
              {/* Africa */}
              <ellipse cx="440" cy="230" rx="60" ry="80" />
              {/* Asia */}
              <ellipse cx="580" cy="150" rx="120" ry="70" />
              {/* Australia */}
              <ellipse cx="680" cy="300" rx="50" ry="35" />
            </g>

            {/* Plot IP locations */}
            <TooltipProvider>
              {Object.values(countryData).map((country) => {
                if (!country.coords) return null;
                
                const pos = latLngToMapPosition(country.coords.lat, country.coords.lng, mapWidth, mapHeight);
                const hasBlocked = country.blocked.length > 0;
                const hasWhitelisted = country.whitelisted.length > 0;
                const hasLogins = country.logins.length > 0;
                const total = country.blocked.length + country.whitelisted.length + country.logins.length;
                
                // Size based on IP count
                const size = Math.min(8 + total * 2, 20);
                
                // Color priority: blocked > whitelisted > logins
                let color = 'hsl(217, 91%, 60%)'; // blue
                if (hasBlocked) color = 'hsl(0, 84%, 60%)'; // red
                else if (hasWhitelisted) color = 'hsl(142, 71%, 45%)'; // green

                return (
                  <Tooltip key={country.code}>
                    <TooltipTrigger asChild>
                      <g className="cursor-pointer transition-transform hover:scale-150">
                        {/* Outer ring pulse effect */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={size + 4}
                          fill="none"
                          stroke={color}
                          strokeWidth="1"
                          opacity="0.3"
                          className="animate-ping"
                          style={{ animationDuration: '3s' }}
                        />
                        {/* Main dot */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={size}
                          fill={color}
                          fillOpacity="0.8"
                          stroke={color}
                          strokeWidth="2"
                        />
                        {/* Inner highlight */}
                        <circle
                          cx={pos.x - size/4}
                          cy={pos.y - size/4}
                          r={size/4}
                          fill="white"
                          fillOpacity="0.4"
                        />
                      </g>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="text-lg">{getFlagEmoji(country.code)}</span>
                          <span>{country.name}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          {hasBlocked && (
                            <div className="flex items-center gap-2 text-risk">
                              <ShieldOff className="h-3 w-3" />
                              <span>{country.blocked.length} blocked IP(s)</span>
                            </div>
                          )}
                          {hasWhitelisted && (
                            <div className="flex items-center gap-2 text-ok">
                              <ShieldCheck className="h-3 w-3" />
                              <span>{country.whitelisted.length} whitelisted IP(s)</span>
                            </div>
                          )}
                          {hasLogins && (
                            <div className="flex items-center gap-2 text-primary">
                              <MapPin className="h-3 w-3" />
                              <span>{country.logins.length} login(s)</span>
                            </div>
                          )}
                        </div>
                        {/* Show IP list */}
                        <div className="pt-2 border-t text-xs text-muted-foreground max-h-24 overflow-y-auto">
                          {[...country.blocked, ...country.whitelisted, ...country.logins].slice(0, 5).map((ip, i) => (
                            <div key={i} className="font-mono">{ip.ip}</div>
                          ))}
                          {total > 5 && <div className="text-muted-foreground">+{total - 5} more</div>}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </svg>

          {/* Empty state */}
          {Object.keys(countryData).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No geographic data available</p>
                <p className="text-xs">IP locations will appear here once resolved</p>
              </div>
            </div>
          )}
        </div>

        {/* Country breakdown list */}
        {Object.keys(countryData).length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.values(countryData)
              .sort((a, b) => (b.blocked.length + b.whitelisted.length + b.logins.length) - (a.blocked.length + a.whitelisted.length + a.logins.length))
              .slice(0, 12)
              .map((country) => {
                const total = country.blocked.length + country.whitelisted.length + country.logins.length;
                return (
                  <div key={country.code} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-lg">{getFlagEmoji(country.code)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{country.name}</p>
                      <div className="flex items-center gap-1">
                        {country.blocked.length > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                            {country.blocked.length}
                          </Badge>
                        )}
                        {country.whitelisted.length > 0 && (
                          <Badge className="bg-ok text-[10px] px-1 py-0 h-4 hover:bg-ok/90">
                            {country.whitelisted.length}
                          </Badge>
                        )}
                        {country.logins.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {country.logins.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
