import { createContext, useContext, type ReactNode } from 'react';

/**
 * The platform has one design system and two temperaments:
 * the Client Portal is a concierge (density 5), Quooro Office is an
 * instrument (density 7). Components read the temperament from context so
 * a screen never has to thread density props through its tree.
 */
export type Temperament = 'portal' | 'office';

const TemperamentContext = createContext<Temperament>('portal');

export function TemperamentProvider({
  value,
  children,
}: {
  value: Temperament;
  children: ReactNode;
}) {
  return (
    <TemperamentContext.Provider value={value}>{children}</TemperamentContext.Provider>
  );
}

export function useTemperament(): Temperament {
  return useContext(TemperamentContext);
}

/** Row height + padding presets the kit components share. */
export function densityPreset(t: Temperament) {
  return t === 'office'
    ? { row: 'h-10', cellPad: 'px-3', panelPad: 'p-3', gap: 'gap-3', section: 'space-y-4' }
    : { row: 'h-11', cellPad: 'px-4', panelPad: 'p-4', gap: 'gap-4', section: 'space-y-6' };
}
