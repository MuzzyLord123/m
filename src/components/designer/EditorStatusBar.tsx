import { memo, useMemo } from 'react';
import { ChevronRight, Command } from 'lucide-react';
import { useEditor } from './EditorContext';
import { findElement, findParent } from './utils/treeUtils';
import { cn } from '@/lib/utils';

/**
 * The status bar.
 *
 * It used to carry an FPS meter with a live sparkline, a letter grade for
 * "performance", a payload size, an elements-per-second readout and a
 * shortcut popover - nine numbers, none of which a person building a
 * website can act on. Telemetry theatre is one of the fastest ways to make
 * a tool feel generated: it looks technical without being useful, and this
 * one cost a requestAnimationFrame loop running for the whole session.
 *
 * What is left is what a builder actually needs at a glance: where the
 * selected element sits, how big the page is, and whether the work is
 * saved. The path earns the most room, because it is how you climb out of
 * a nested selection - so every crumb selects that ancestor.
 */

interface Node { id: string; name?: string; type: string; children?: Node[] }

function breadcrumbFor(elements: Node[], id: string) {
  const path: { name: string; id: string }[] = [];
  const current = findElement(elements as never, id) as Node | null;
  if (!current) return path;
  path.unshift({ name: current.name || current.type, id: current.id });
  let parent = findParent(elements as never, id) as Node | null;
  while (parent) {
    path.unshift({ name: parent.name || parent.type, id: parent.id });
    parent = findParent(elements as never, parent.id) as Node | null;
  }
  return path;
}

function countElements(elements: Node[]): number {
  let n = 0;
  for (const el of elements) {
    n++;
    if (el.children?.length) n += countElements(el.children);
  }
  return n;
}

const CELL = 'flex items-center gap-1.5 px-2.5 text-[11px] leading-none text-[hsl(var(--studio-ink-3))]';

export const EditorStatusBar = memo(function EditorStatusBar() {
  const { state, selectedElement, dispatch } = useEditor();

  const total = useMemo(() => countElements(state.elements as unknown as Node[]), [state.elements]);
  const path = useMemo(
    () => (selectedElement ? breadcrumbFor(state.elements as unknown as Node[], selectedElement.id) : []),
    [selectedElement, state.elements],
  );

  const saved = !state.isDirty;

  return (
    <footer
      className="flex h-7 shrink-0 items-center border-t border-[hsl(var(--studio-line))] bg-[hsl(var(--studio-panel))]"
      role="status"
      aria-live="off"
    >
      {/* Where you are. Every crumb selects that ancestor. */}
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden px-2">
        {path.length === 0 ? (
          <span className="px-1 text-[11px] text-[hsl(var(--studio-ink-3))]">Nothing selected</span>
        ) : (
          path.map((crumb, i) => (
            <span key={crumb.id} className="flex min-w-0 items-center">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-[hsl(var(--studio-ink-3))] opacity-50" />}
              <button
                onClick={() => dispatch({ type: 'SELECT', payload: crumb.id })}
                className={cn(
                  'max-w-[160px] truncate rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none transition-colors',
                  'hover:bg-[hsl(var(--studio-hover))]',
                  i === path.length - 1
                    ? 'text-[hsl(var(--studio-ink))]'
                    : 'text-[hsl(var(--studio-ink-3))] hover:text-[hsl(var(--studio-ink-2))]',
                )}
              >
                {crumb.name}
              </button>
            </span>
          ))
        )}
      </div>

      <div className={cn(CELL, 'border-l border-[hsl(var(--studio-line))]')}>
        <span className="tabular-nums">{total}</span>
        <span>{total === 1 ? 'element' : 'elements'}</span>
      </div>

      {/* The only thing here that can worry you, so the only thing allowed
          to take a colour. */}
      <div className={cn(CELL, 'border-l border-[hsl(var(--studio-line))]')}>
        <span
          className={cn('h-1.5 w-1.5 rounded-full',
            saved ? 'bg-[hsl(var(--studio-ok))]' : 'bg-[hsl(var(--studio-warn))]')}
          aria-hidden
        />
        <span className={saved ? undefined : 'text-[hsl(var(--studio-ink-2))]'}>
          {saved ? 'Saved' : 'Unsaved changes'}
        </span>
      </div>

      <div className={cn(CELL, 'border-l border-[hsl(var(--studio-line))] pr-3')}>
        <Command className="h-3 w-3" />
        <span>K</span>
      </div>
    </footer>
  );
});

export default EditorStatusBar;
