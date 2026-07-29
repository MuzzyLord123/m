/**
 * The platform kit — one design system, two temperaments.
 * See PLATFORM-DIRECTION.md and PLATFORM-COMPONENTS.md.
 */
export { TemperamentProvider, useTemperament, densityPreset } from './temperament';
export type { Temperament } from './temperament';
export { StatusDot, StatusBadge, statusTone, statusLabel } from './StatusDot';
export type { Tone } from './StatusDot';
export { RelativeTime, Money } from './RelativeTime';
export { AvatarID, initialsOf } from './AvatarID';
export { Panel, PanelHeader, PanelRow, SectionHeader } from './Panel';
export { EmptyState, ErrorState, SkeletonLedger, SkeletonTable, SkeletonBlock, SkeletonForm } from './states';
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { DetailDrawer } from './DetailDrawer';
export { ConfirmDialog } from './ConfirmDialog';
export { CommandPalette, usePlatformKeys } from './CommandPalette';
export { ShortcutOverlay } from './ShortcutOverlay';
export { GreetingHeader, PageHeader } from './PageHeader';
export { DESTINATIONS, destinationsForRole } from './navRegistry';
export type { Destination } from './navRegistry';
export { FIELD, FIELD_LABEL, FIELD_ERROR, FIELD_HELP, CHIP_ON, CHIP_OFF } from './formStyles';
