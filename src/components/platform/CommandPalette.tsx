import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { destinationsForRole, type Destination } from './navRegistry';

/**
 * ⌘K — jump anywhere, trigger nothing the app can't already do. Purely
 * client-side: the registry is built from the live sidebar menus plus the
 * full-screen apps, filtered by the role the shell already knows. Recent
 * destinations are remembered locally.
 */
const RECENT_KEY = 'platform:recent-destinations';
const MAX_RECENT = 5;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recents just don't persist */
  }
}

export function CommandPalette({
  open,
  onOpenChange,
  role,
  extraActions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string | null | undefined;
  /** Screen-local actions the host shell already exposes elsewhere. */
  extraActions?: { id: string; label: string; run: () => void; keywords?: string }[];
}) {
  const navigate = useNavigate();
  const destinations = useMemo(() => destinationsForRole(role), [role]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecentIds(readRecent());
  }, [open]);

  const go = useCallback(
    (d: Destination) => {
      pushRecent(d.id);
      onOpenChange(false);
      navigate(d.path);
    },
    [navigate, onOpenChange],
  );

  const recent = recentIds
    .map((id) => destinations.find((d) => d.id === id))
    .filter((d): d is Destination => !!d);

  const groups = useMemo(() => {
    const order: Destination['group'][] = ['Lounge', 'Quooro Office', 'Apps & studios', 'Admin'];
    return order
      .map((g) => ({ name: g, items: destinations.filter((d) => d.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [destinations]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Where to?" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No matches. Try a screen name, like billing.</CommandEmpty>

        {recent.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recent.map((d) => (
                <CommandItem key={`recent-${d.id}`} value={`recent ${d.label}`} onSelect={() => go(d)}>
                  <span className="flex-1">{d.label}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {d.group}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {extraActions && extraActions.length > 0 && (
          <>
            <CommandGroup heading="On this screen">
              {extraActions.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.label} ${a.keywords ?? ''}`}
                  onSelect={() => {
                    onOpenChange(false);
                    a.run();
                  }}
                >
                  <span className="flex-1">{a.label}</span>
                  <CornerDownLeft className="h-3 w-3 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groups.map((g) => (
          <CommandGroup key={g.name} heading={g.name}>
            {g.items.map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.label} ${d.keywords ?? ''} ${d.group}`}
                onSelect={() => go(d)}
              >
                <span className="flex-1">{d.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Global keys for a shell: ⌘K / Ctrl+K opens the palette, ? opens the
 * shortcut overlay (never while typing in a field).
 */
export function usePlatformKeys({
  onPalette,
  onShortcuts,
}: {
  onPalette: () => void;
  onShortcuts: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onPalette();
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = e.target as HTMLElement | null;
        const typing =
          el &&
          (el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.tagName === 'SELECT' ||
            el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          onShortcuts();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPalette, onShortcuts]);
}
