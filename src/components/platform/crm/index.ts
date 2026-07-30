/** CRM extensions to the platform kit — see CRM briefs and FEATURE-GAP.md. */
export { LeadCard } from './LeadCard';
export type { LeadCardData } from './LeadCard';
export { useSavedViews, SavedViewsBar } from './SavedViews';
export type { SavedView } from './SavedViews';
export { FilterBuilder, BulkBar, applyFilters } from './FilterBuilder';
export type { FilterCondition, FilterFieldDef, FilterOp } from './FilterBuilder';
export { RecordHeader, RecordTimeline } from './RecordSurface';
export type { TimelineEvent } from './RecordSurface';
export { PipelineBoard, ReportTiles } from './PipelineBoard';
export type { PipelineItem, PipelineStage } from './PipelineBoard';
export { ImportDropzone, ImportProgress, ImportReceipt, receiptSummaryText, useCountUp } from './ImportShell';
export { BottomSheet, TagChips } from './BottomSheet';
