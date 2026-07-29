# PLATFORM-COMPONENTS.md
## The platform kit — `src/components/platform/`

One design system, two temperaments. Every component is token-only (no
raw hex), works in both modes, and ships its states. Screens compose
these instead of inventing surfaces. Density comes from
`TemperamentProvider` (`portal` = concierge, `office` = instrument),
mounted by the shell in Phases 3/4.

| Component | Job | States / notes |
|---|---|---|
| `Panel` / `PanelHeader` / `PanelRow` | The workhorse surface: hairline, raised tone, 10px radius; ledger rows with leading dot/avatar, title+meta, trailing value | Rows render a real `<button>` when clickable (keyboard + focus ring for free); hover `bg-foreground/[0.025]` |
| `SectionHeader` | Page-wash section titles with a right slot | — |
| `StatusDot` / `StatusBadge` + `statusTone()` / `statusLabel()` | THE status vocabulary: ok / attend / risk / neutral / accent, dot + label, never fills | `statusTone` maps every raw DB status string; replaces all rainbow maps. Accent = the one thing in motion |
| `DataTable<T>` | Sticky sunken header, mono column heads, 40/44px rows by temperament, honest sort arrows + `aria-sort`, right-aligned `tabular-nums`, bulk-select + action bar, row click | `loading` → `SkeletonTable`; `error` → `ErrorState` + retry; empty → `EmptyState`; phone: `mobileCard` render prop (card list) or `hideBelowMd` priority columns; header scrolls within `overflow-x-auto`, page never scrolls sideways |
| `DetailDrawer` | Right-side drawer for detail views (list stays visible); Radix focus trap; kicker + title + footer slots | `wide` for records; modals only for decisions |
| `ConfirmDialog` | Destructive confirm: states the consequence, verb on the button | `loading` disables confirm |
| `EmptyState` | Orients + at most one action; a single display-face moment with the ember tick | `compact` for in-panel use |
| `ErrorState` | What happened + how to recover + retry | `role="alert"` |
| `SkeletonLedger/Table/Form/Block` | Layout-matched loading; zero shift when data lands | Replace every bare spinner in Phases 3/4 |
| `RelativeTime` | "2 min ago", exact `EEE d MMM yyyy, HH:mm` on hover, re-renders each minute | en-GB |
| `Money` | £ en-GB, `tabular-nums`; `whole` drops pence on integers | — |
| `AvatarID` | Initials in brand tones (deterministic per name), photo when present | sm/md/lg/xl; no gradients, no icon eggs |
| `GreetingHeader` | The home screen's display moment: salutation + one contextual line (reserved height — no shift) + mono meta | Feed from `src/lib/greetings.ts` |
| `PageHeader` | Every other screen: mono kicker, 17px title, description, actions | One primary action per view |
| `CommandPalette` + `usePlatformKeys` | ⌘K jump-anywhere. Registry IMPORTED from the live sidebars (menus can never drift from the palette) + full-screen apps; role-filtered; recents in localStorage; client-side only | `extraActions` lets a screen expose its existing actions |
| `ShortcutOverlay` | `?` overlay listing only keys that are actually bound | — |
| `navRegistry` | Single source of truth for destinations; `destinationsForRole()` | Imports `ALL_NAV_ITEMS` + `ALL_TEAM_NAV_ITEMS` |
| `formStyles` | The elite field recipe as shared constants (`FIELD`, `FIELD_LABEL`, `FIELD_ERROR`, `FIELD_HELP`, chips) | Same classes the auth pages ship |
| `src/lib/greetings.ts` | `composePortalGreeting` / `composeOfficeBriefing` — pure, deterministic, day-rotated variants, exact counts, no em-dashes | Matrix in GREETINGS.md |

Token additions (see `src/index.css` app-semantic block + tailwind
`sunken`, `ink-2`, `ink-4`, `ok`, `attend`, `risk`).

Phase 3/4 wiring notes:
- Shells mount `TemperamentProvider`, `CommandPalette`, `ShortcutOverlay`
  and bind `usePlatformKeys`; sonner toasts move to bottom-right with the
  quiet styling inside platform shells.
- PortalSidebar keeps its collapse (desktop icon rail, saved preference),
  DnD folders, positions and every existing item; TeamSidebar likewise.
  Mobile keeps drawer + bottom nav. Menus are restyled, never pruned.
- The `page-enter` blur-rise is not used inside the platform; data
  renders instantly.
