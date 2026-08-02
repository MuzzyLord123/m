import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, ChevronRight, PenLine, ListChecks, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfficeModuleBand, OfficeContent } from '@/pages/lounge/office/ModuleShell';

/**
 * The forms lobby. The builder holds a form in the browser while you
 * shape it; saved forms with response counts are a roadmap item, so
 * this screen offers the real ways in and claims nothing else.
 */

const STARTS = [
  { icon: PenLine, label: 'Blank form', desc: 'Fields, one at a time' },
  { icon: ListChecks, label: 'Survey', desc: 'Choices and a comment box' },
  { icon: Star, label: 'Feedback', desc: 'Ratings with room to explain' },
];

export default function OfficeForms() {
  const navigate = useNavigate();
  const openBuilder = () => navigate('/lounge/office/forms', { state: { fromOfficeApp: true } });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <OfficeModuleBand appId="forms" icon={ClipboardList} title="Forms">
        <Button size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={openBuilder}>
          <Plus className="h-3.5 w-3.5" /> New form
        </Button>
      </OfficeModuleBand>
      <OfficeContent>
        <div className="mx-auto max-w-[560px] pt-6 sm:pt-10">
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            Build a form
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Text, choices, checkboxes, ratings and numbers - assembled in the
            builder and previewed as you go.
          </p>

          <div className="mt-6 overflow-hidden rounded-[14px] border border-border/40 bg-card">
            <ul className="divide-y divide-border/30">
              {STARTS.map(t => (
                <li key={t.label}>
                  <button
                    onClick={openBuilder}
                    className="group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
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
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Forms are not saved to your workspace yet - a form lives in the
            builder while you work on it. Saved forms and response collection
            are on the Office roadmap.
          </p>
        </div>
      </OfficeContent>
    </div>
  );
}
