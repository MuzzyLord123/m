import { useNavigate } from 'react-router-dom';
import { PenLine, Plus, ChevronRight, Layers, Lightbulb, Users, GitBranch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfficeModuleBand, OfficeContent } from '@/pages/lounge/office/ModuleShell';

/**
 * The whiteboard lobby. Every start below opens the real canvas; a
 * board lives in the browser while you sketch. Saved boards are a
 * roadmap item, so no shelf of pretend thumbnails.
 */

const STARTS = [
  { id: 'blank', label: 'Blank canvas', desc: 'Start fresh', icon: PenLine },
  { id: 'brainstorm', label: 'Brainstorm', desc: 'Mind mapping', icon: Lightbulb },
  { id: 'flowchart', label: 'Flowchart', desc: 'Process diagrams', icon: GitBranch },
  { id: 'wireframe', label: 'Wireframe', desc: 'UI layouts', icon: Layers },
  { id: 'retrospective', label: 'Retrospective', desc: 'Team review', icon: Users },
  { id: 'kanban', label: 'Kanban board', desc: 'Visual workflow', icon: BarChart3 },
];

export default function OfficeWhiteboardHome() {
  const navigate = useNavigate();
  const openCanvas = () => navigate('/lounge/office/whiteboard', { state: { fromOfficeApp: true } });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <OfficeModuleBand appId="whiteboard" icon={PenLine} title="Whiteboard">
        <Button size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={openCanvas}>
          <Plus className="h-3.5 w-3.5" /> New board
        </Button>
      </OfficeModuleBand>
      <OfficeContent>
        <div className="mx-auto max-w-[640px] pt-6 sm:pt-10">
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            Sketch it out
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            A fast canvas for thinking - pen, shapes and sticky logic, with a
            few starting layouts when a blank page is the wrong start.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {STARTS.map(t => (
              <button
                key={t.id}
                onClick={openCanvas}
                className="group flex items-center gap-3.5 rounded-[14px] border border-border/40 bg-card px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-foreground/[0.05]">
                  <t.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium">{t.label}</span>
                  <span className="block text-[11.5px] text-muted-foreground">{t.desc}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
              </button>
            ))}
          </div>

          <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Boards live in the browser while you sketch. Saving boards to your
            workspace is on the Office roadmap.
          </p>
        </div>
      </OfficeContent>
    </div>
  );
}
