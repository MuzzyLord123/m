import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Monitor, Cpu, MemoryStick, Wifi, Battery, Gauge,
  CheckCircle2, Sparkles, Zap, Tv2, Laptop,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { PRESET_DESC, PRESET_LABEL, PRESET_OVERRIDES, type PerfPreset } from '@/lib/devicePresets';
import { useUIPreferences, type UIPreferences } from '@/hooks/useUIPreferences';
import { toast } from 'sonner';

const TIER_COLOUR: Record<string, string> = {
  low: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  elite: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
};

function deviceIcon(type: string) {
  if (type === 'phone') return Smartphone;
  if (type === 'tablet') return Tv2;
  if (type === 'laptop') return Laptop;
  return Monitor;
}

export function DeviceSettingsTab() {
  const info = useDeviceInfo();
  const { preferences, updatePreference } = useUIPreferences();

  const recommended: PerfPreset = info?.tier ?? 'medium';

  const activePreset: PerfPreset | null = useMemo(() => {
    const presets: PerfPreset[] = ['low', 'medium', 'high', 'elite'];
    for (const p of presets) {
      const overrides = PRESET_OVERRIDES[p] as Partial<UIPreferences>;
      const matches = (Object.keys(overrides) as Array<keyof UIPreferences>).every(
        (k) => JSON.stringify(preferences[k]) === JSON.stringify(overrides[k])
      );
      if (matches) return p;
    }
    return null;
  }, [preferences]);

  const applyPreset = (preset: PerfPreset) => {
    const overrides = PRESET_OVERRIDES[preset] as Partial<UIPreferences>;
    (Object.keys(overrides) as Array<keyof UIPreferences>).forEach((k) => {
      updatePreference(k, overrides[k] as UIPreferences[typeof k]);
    });
    toast.success(`${PRESET_LABEL[preset]} mode applied`, {
      description: 'Performance settings updated for your device.',
    });
  };


  const stats = useMemo(() => {
    if (!info) return [];
    return [
      { icon: Cpu, label: 'Processor', value: `${info.cpuClass}${info.cpuCores ? ` · ${info.cpuCores} cores` : ''}` },
      { icon: Sparkles, label: 'Graphics', value: info.gpuRenderer || 'Unknown' },
      { icon: MemoryStick, label: 'Memory', value: info.memoryGB ? `${info.memoryGB} GB RAM` : 'Not reported' },
      { icon: Monitor, label: 'Monitor', value: `${info.monitorLabel}${info.monitorCount && info.monitorCount > 1 ? ` · ${info.monitorCount} displays` : ''} · ${info.dpr.toFixed(1)}x` },
      { icon: Wifi, label: 'Network', value: info.networkType !== 'unknown' ? `${info.networkType.toUpperCase()}${info.downlinkMbps ? ` · ${info.downlinkMbps} Mbps` : ''}` : 'Unknown' },
      { icon: Battery, label: 'Battery', value: info.battery ? `${Math.round(info.battery.level * 100)}%${info.battery.charging ? ' · charging' : ''}` : 'Not available' },
    ];
  }, [info]);

  if (!info) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-48 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const DeviceIcon = deviceIcon(info.deviceType);
  const tierClass = TIER_COLOUR[info.tier];

  return (
    <div className="space-y-6">
      {/* Device hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DeviceIcon className="w-4 h-4" /> Your Device
            </CardTitle>
            <CardDescription>Detected automatically from your browser. Used to recommend the best performance mode.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DeviceIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{info.make} {info.model}</p>
                  <p className="text-xs text-muted-foreground capitalize">{info.deviceType} · {info.os} · {info.browser}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance score</p>
                  <p className="text-2xl font-bold text-foreground leading-none">{info.score}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${tierClass}`}>
                  {info.tier}-tier
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium text-foreground truncate" title={value}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {!info.monitorName && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    const w: any = window;
                    if (!w.getScreenDetails) {
                      toast.error('Monitor name detection not supported in this browser');
                      return;
                    }
                    const details = await w.getScreenDetails();
                    const current = details.currentScreen || details.screens?.[0];
                    if (current?.label) {
                      toast.success(`Detected: ${current.label}`, { description: 'Reload to update the panel.' });
                    } else {
                      toast.info('No monitor label exposed by your OS');
                    }
                  } catch {
                    toast.error('Permission denied — allow window management in browser settings');
                  }
                }}
              >
                <Monitor className="w-3.5 h-3.5" /> Detect monitor name
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>


      {/* Smart optimizer */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Gauge className="w-4 h-4" /> Smart Optimizer</CardTitle>
            <CardDescription>
              Based on your device, we recommend <span className="font-semibold text-foreground">{PRESET_LABEL[recommended]}</span> mode.
              Apply it and Quooro will instantly strip heavy effects to feel faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => applyPreset(recommended)}
              className="w-full gap-2 h-11"
              size="lg"
            >
              <Zap className="w-4 h-4" />
              Auto-Optimize for my device ({PRESET_LABEL[recommended]})
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['low', 'medium', 'high', 'elite'] as PerfPreset[]).map((p) => {
                const isRec = p === recommended;
                const isActive = p === activePreset;
                return (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`text-left p-3 rounded-xl border-2 transition-all hover:border-primary/40 ${
                      isActive
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : isRec
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{PRESET_LABEL[p]}</p>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/30">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                      {isRec && !isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3" /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{PRESET_DESC[p]}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              Applying a preset updates every toggle in the <span className="font-medium text-foreground">Performance</span> tab.
              You can still fine-tune individual settings there afterward.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* What changes */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What gets optimised</CardTitle>
            <CardDescription>Battery Saver / Low-end mode flips these globally:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-muted-foreground">
              {[
                'Backdrop blur & glass effects',
                'Box shadows & glow',
                'Animated gradients & orbs',
                'Page transition animations',
                'Hover transforms & 3D tilt',
                'Realtime presence updates',
                'Custom cursor',
                'Floating action button',
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Honest limitation note */}
      <p className="text-[11px] text-muted-foreground text-center px-4">
        Browsers don't always expose exact phone or PC model strings. Make/model is best-effort —
        processor and graphics info is read straight from your hardware where the browser allows it.
      </p>
    </div>
  );
}
