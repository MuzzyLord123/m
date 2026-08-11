/**
 * The capability schedule.
 *
 * Services are a table because a table is what a buyer is going to compare
 * against their own schedule of works. Three cards with an icon each cannot
 * carry the fourth column, and the fourth column is the one that matters: what
 * can be put on a programme and what is priced as it arises.
 *
 * `programmed` is a statement about how the work is bought, not a claim about
 * accreditation. Nothing in this file asserts a qualification.
 */

export type ProgrammedAvailability =
  /** Sits on a cyclical programme with a fixed frequency. */
  | 'programmed'
  /** Goes on the programme, but the frequency comes out of the survey. */
  | 'by-survey'
  /** Found during programmed inspection, priced and done as it arises. */
  | 'as-arising';

export const PROGRAMMED_LABELS: Record<ProgrammedAvailability, string> = {
  programmed: 'Yes — cyclical',
  'by-survey': 'Yes — frequency by survey',
  'as-arising': 'As arising',
};

export type ServiceRow = {
  service: string;
  /** What it is actually applied to. Substrates and elements, not adjectives. */
  application: string;
  /** Short sector tags. Kept to three so the column stays readable at 360px. */
  sectors: string[];
  programmed: ProgrammedAvailability;
  /** Anchor on /capabilities for the rows that have a section written about them. */
  anchor?: string;
};

export const SERVICES: readonly ServiceRow[] = [
  {
    service: 'Internal decoration',
    application:
      'Walls, ceilings, joinery, doors and frames, handrails and balustrades, plant rooms and corridors',
    sectors: ['Education', 'Healthcare', 'Offices'],
    programmed: 'programmed',
  },
  {
    service: 'External decoration',
    application:
      'Render, masonry, cladding, windows and doors, fascias, soffits and rainwater goods',
    sectors: ['All sectors'],
    programmed: 'programmed',
  },
  {
    service: 'Steelwork painting',
    application:
      'Structural steel, portal frames, gantries, walkways, handrails, plant, tanks and pipework',
    sectors: ['Industrial', 'Warehousing'],
    programmed: 'by-survey',
    anchor: 'steelwork',
  },
  {
    service: 'Floor painting',
    application:
      'Warehouse, workshop and plant room floors; walkways, bay markings and hatched areas',
    sectors: ['Industrial', 'Warehousing', 'Retail'],
    programmed: 'by-survey',
    anchor: 'floors',
  },
  {
    service: 'Roof painting',
    application: 'Profiled metal sheet roofs, roof lights surrounds, flashings and gutters',
    sectors: ['Industrial', 'Warehousing'],
    programmed: 'by-survey',
    anchor: 'roofs',
  },
  {
    service: 'Wallpapering and wall coverings',
    application:
      'Feature walls, contract vinyls and hospitality interiors; lining before decoration',
    sectors: ['Hospitality', 'Offices', 'Residential'],
    programmed: 'as-arising',
  },
  {
    service: 'Joinery repairs',
    application:
      'Windows, doors, frames, cills, fascias and soffits made good before they are painted',
    sectors: ['Education', 'Residential', 'Offices'],
    programmed: 'as-arising',
    anchor: 'joinery',
  },
  {
    service: 'Rot repairs',
    application:
      'Cut-out and splice repairs to wet-rotted timber, resin repairs where the section allows',
    sectors: ['Education', 'Residential'],
    programmed: 'as-arising',
    anchor: 'joinery',
  },
  {
    service: 'Roof repairs',
    application:
      'Localised repairs found during external decoration or gutter work, before water gets behind the paint',
    sectors: ['Industrial', 'Residential'],
    programmed: 'as-arising',
  },
  {
    service: 'Gutter cleaning',
    application:
      'Gutters, hoppers and downpipes cleared and checked, on their own or as part of a cycle',
    sectors: ['All sectors'],
    programmed: 'programmed',
  },
  {
    service: 'Maintenance painting',
    application:
      'Reactive redecoration to a schedule of rates: damage, churn, lettings and hand-backs',
    sectors: ['Offices', 'Education', 'Retail'],
    programmed: 'programmed',
  },
  {
    service: 'Programmed painting contracts',
    application:
      'Multi-year cycles across a building or an estate, surveyed once and phased across the term',
    sectors: ['All sectors'],
    programmed: 'programmed',
    anchor: 'programmed',
  },
];
