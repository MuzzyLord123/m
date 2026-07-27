import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Layout, Palette, Sparkles, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    <div className="h-full flex bg-background text-foreground overflow-hidden">
      <aside className="w-[72px] bg-background border-r border-border/40 flex flex-col items-center py-3 gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}
              className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 mb-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150"
              aria-label="Back to Office"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
              <span className="text-[9px] font-medium leading-none">Back</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Back to Office</TooltipContent>
        </Tooltip>
        {NAV_ITEMS.map((item) => {
          const isActive = item.action === 'create' ? false : activeNav === item.action;
          return (
            <button key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150",
                item.action === 'create' ? "bg-primary text-primary-foreground mb-2 shadow-sm" :
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <button className="w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:bg-muted/50">
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span className="text-[9px] font-medium">More</span>
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto scrollbar-none">
        {children}
      </main>
    </div>
  );
}
