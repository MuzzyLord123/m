import { Map, LayoutTemplate, Palette, PenTool, Hammer } from 'lucide-react';

export type PlannerMode = 'sitemap' | 'wireframe' | 'style-guide' | 'design' | 'editor';

interface PlannerModeSwitcherProps {
  mode: PlannerMode;
  onModeChange: (mode: PlannerMode) => void;
}

const PLANNER_TABS = [
  { key: 'editor' as const, label: 'Workshop', icon: Hammer },
  { key: 'sitemap' as const, label: 'Sitemap', icon: Map },
  { key: 'wireframe' as const, label: 'Wireframe', icon: LayoutTemplate },
  { key: 'style-guide' as const, label: 'Style Guide', icon: Palette },
  { key: 'design' as const, label: 'Design', icon: PenTool },
];

export function PlannerModeSwitcher({ mode, onModeChange }: PlannerModeSwitcherProps) {
  return (
    <div
      className="flex items-center gap-0 rounded-lg p-0.5"
      style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}
    >
      {PLANNER_TABS.map(tab => {
        const Icon = tab.icon;
        const active = mode === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            className="h-6 px-3 flex items-center gap-1.5 rounded-md text-[10px] font-medium transition-all"
            style={{
              backgroundColor: active ? (tab.key === 'editor' ? 'rgba(0,115,230,0.15)' : 'rgba(255,255,255,0.1)') : 'transparent',
              color: active ? (tab.key === 'editor' ? '#4a9eff' : '#e0e0e0') : '#666',
              border: active ? `1px solid ${tab.key === 'editor' ? 'rgba(0,115,230,0.3)' : '#444'}` : '1px solid transparent',
            }}
          >
            <Icon className="h-3 w-3" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
