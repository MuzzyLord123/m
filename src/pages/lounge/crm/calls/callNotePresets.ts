/**
 * Quick notes for calls. Tapping one drops its text into the note so a
 * call can be written up in a second between dials; the text stays
 * editable afterwards for anything worth spelling out.
 *
 * Two per tier, and each carries the outcome it usually implies so the
 * outcome is set in the same tap.
 */

export type NoteTier = 'good' | 'decent' | 'bad' | 'very_bad';

export interface NotePreset {
  id: string;
  tier: NoteTier;
  label: string;
  text: string;
  outcome?: string;
}

export const NOTE_TIERS: { tier: NoteTier; label: string; tone: 'ok' | 'attend' | 'risk' | 'neutral' }[] = [
  { tier: 'good', label: 'Good', tone: 'ok' },
  { tier: 'decent', label: 'Decent', tone: 'neutral' },
  { tier: 'bad', label: 'Bad', tone: 'attend' },
  { tier: 'very_bad', label: 'Very bad', tone: 'risk' },
];

export const NOTE_PRESETS: NotePreset[] = [
  {
    id: 'good-preview',
    tier: 'good',
    label: 'Wants a preview',
    text: 'Keen. Agreed to a live preview, building it and calling back with the link.',
    outcome: 'connected',
  },
  {
    id: 'good-booked',
    tier: 'good',
    label: 'Booked a call back',
    text: 'Interested. Booked a proper call back to walk through the site and pricing.',
    outcome: 'callback',
  },
  {
    id: 'decent-thinking',
    tier: 'decent',
    label: 'Thinking it over',
    text: 'Warm but not ready. Sending details over and following up next week.',
    outcome: 'connected',
  },
  {
    id: 'decent-timing',
    tier: 'decent',
    label: 'Wrong time',
    text: 'Likes the idea, timing is wrong. Asked to be called back later in the year.',
    outcome: 'callback',
  },
  {
    id: 'bad-noanswer',
    tier: 'bad',
    label: 'No answer',
    text: 'No answer. Trying again at a different time of day.',
    outcome: 'no_answer',
  },
  {
    id: 'bad-gatekeeper',
    tier: 'bad',
    label: 'Could not get through',
    text: 'Could not get past reception. Need the owner by name before calling again.',
    outcome: 'no_answer',
  },
  {
    id: 'verybad-notinterested',
    tier: 'very_bad',
    label: 'Not interested',
    text: 'Not interested, happy as they are. Do not call again.',
    outcome: 'connected',
  },
  {
    id: 'verybad-wrong',
    tier: 'very_bad',
    label: 'Wrong number',
    text: 'Wrong number for this business. Details need correcting on the record.',
    outcome: 'wrong_number',
  },
];

export const OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'callback', label: 'Callback booked' },
  { value: 'wrong_number', label: 'Wrong number' },
];

export const OUTCOME_TONE: Record<string, 'ok' | 'attend' | 'risk' | 'neutral'> = {
  connected: 'ok', callback: 'attend', voicemail: 'neutral', no_answer: 'attend', wrong_number: 'risk',
};

export const outcomeLabel = (o: string | null | undefined) =>
  o ? o.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : 'Not set';

/** Append a preset to whatever is already written, never replacing it. */
export function applyPreset(existing: string, preset: NotePreset): string {
  const current = existing.trim();
  if (!current) return preset.text;
  if (current.includes(preset.text)) return existing;
  return `${current}\n${preset.text}`;
}
