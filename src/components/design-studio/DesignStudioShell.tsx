import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Layout, Palette, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';

/**
 * The Design studio's own chrome, mounted inside the Office anatomy:
 * the module band on top, the studio's section rail beneath it as the
 * toolbar. One fix here dresses all five studio screens.
 */

const NAV_ITEMS = [
  { icon: Plus, label: 'Create', action: 'create', path: '/lounge/office/design-studio/editor' },
  { icon: FolderOpen, label: 'Home', action: 'home', path: '/lounge/office/design-studio' },
  { icon: FolderOpen, label: 'Projects', action: 'designs', path: '/lounge/office/design-studio/projects' },
  { icon: Layout, label: 'Templates', action: 'templates', path: '/lounge/office/design-studio/templates' },
  { icon: Palette, label: 'Brand', action: 'brand', path: '/lounge/office/design-studio/brand' },
  { icon: Sparkles, label: 'Quooro AI', action: 'ai', path: '/lounge/office/design-studio/ai' },
];

interface Props {
  activeNav: string;
  children: ReactNode;
}

export default function DesignStudioShell({ activeNav, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background text-foreground">
      <OfficeModuleBand appId="design" icon={Palette} title="Design" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[64px] shrink-0 flex-col items-center gap-1 border-r border-border/60 bg-black/60 py-2.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.action === 'create' ? false : activeNav === item.action;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-11 w-12 flex-col items-center justify-center gap-0.5 rounded-[10px] transition-colors duration-150',
                  item.action === 'create'
                    ? 'mb-1.5 bg-primary text-primary-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18)]'
                    : isActive
                      ? 'bg-foreground/[0.06] text-primary'
                      : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >
                <item.icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-[8.5px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </aside>
        <main className="flex-1 overflow-y-auto scrollbar-none bg-card/45">
          {children}
        </main>
      </div>
    </div>
  );
}
