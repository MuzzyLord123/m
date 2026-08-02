import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppTile } from './AppTile';

/**
 * The page anatomy every Office module mounts into.
 *
 * One band across every module - the way out, the module's own mark and
 * name, the actions - with the ember scanline that marks Office's
 * instrument chrome. When forty screens share this band, the suite
 * stops reading as modules bolted together and starts reading as one
 * machine. Deviating from it requires a written reason in OFFICE-SPEC.
 */

export function OfficeModuleBand({ appId, icon, title, context, children }: {
  appId: string;
  icon: LucideIcon;
  title: string;
  /** Optional quiet context after the title: a count, a filename. */
  context?: string;
  /** Right-side actions: the module's toolbar buttons. */
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2.5 border-b border-border/60 bg-black/60 px-2.5 sm:px-3.5">
      <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-primary/60" />
      <button
        onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}
        aria-label="Back to Office"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <span aria-hidden className="h-4 w-px bg-border/50" />
      <div className="flex min-w-0 items-center gap-2 pl-0.5">
        <AppTile id={appId} icon={icon} size={22} />
        <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em]">{title}</span>
        {context && <span className="hidden truncate text-[11.5px] text-muted-foreground sm:block">{context}</span>}
      </div>
      <div className="min-w-0 flex-1" />
      {children}
    </header>
  );
}

/** The toolbar row under the band: filters left, search right. */
export function OfficeToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3', className)}>
      {children}
    </div>
  );
}

/** Standard content column. */
export function OfficeContent({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-card/45">
      <div className={cn('mx-auto w-full px-4 pb-16 pt-5 sm:px-6', wide ? 'max-w-[1240px]' : 'max-w-[1000px]', className)}>
        {children}
      </div>
    </div>
  );
}

/** The honest empty state: quiet, no dashes, no mascots. */
export function OfficeEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[14px] bg-foreground/[0.025] px-6 py-14 text-center">
      <p className="text-[14px] font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
