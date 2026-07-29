/**
 * The greeting layer — deterministic, data-honest, no runtime AI.
 * Pure functions; the full matrix lives in GREETINGS.md. Inputs are
 * exactly the fields the home screens already fetch. Variants rotate by
 * day-of-year so repeat visits vary without randomness at render time.
 */

export function salutation(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 18) return 'Good afternoon';
  return 'Good evening';
}

function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function pick(variants: string[], now: Date): string {
  return variants[dayOfYear(now) % variants.length];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export interface PortalGreetingData {
  firstName?: string | null;
  billingOverdue?: boolean;
  /** Items awaiting the client's action (approvals, feedback). */
  needsYouCount?: number;
  websiteStatus?: string | null;
  /** Content delivered in the last 7 days. */
  deliveredThisWeek?: number;
  /** Any project activity in the last 7 days. */
  hasRecentActivity?: boolean;
}

export interface Greeting {
  salutation: string;
  /** One contextual line; claims only what the data supports. */
  line: string;
}

export function composePortalGreeting(
  data: PortalGreetingData,
  now: Date = new Date(),
): Greeting {
  const name = (data.firstName || '').trim().split(/\s+/)[0];
  const sal = name ? `${salutation(now)}, ${name}.` : `${salutation(now)}.`;

  const n = data.needsYouCount ?? 0;
  let line: string;

  if (data.billingOverdue) {
    line = pick(
      [
        'An invoice is overdue. Billing has the details.',
        "There's an overdue invoice waiting in Billing.",
      ],
      now,
    );
  } else if (n > 0) {
    line = pick(
      [
        `${n} ${plural(n, 'thing needs', 'things need')} your eye today.`,
        `We're waiting on you for ${n} ${plural(n, 'item', 'items')}.`,
        `Your review unblocks ${n} ${plural(n, 'piece', 'pieces')} of work.`,
      ],
      now,
    );
  } else if (data.websiteStatus === 'review') {
    line = pick(
      [
        "Your build is in review. Take a look when you're ready.",
        "Your build moved to review. It's ready for your eyes.",
      ],
      now,
    );
  } else if (data.websiteStatus === 'development' && data.hasRecentActivity) {
    line = pick(
      ['Your build moved forward this week.', 'Progress on your build since your last visit.'],
      now,
    );
  } else if ((data.deliveredThisWeek ?? 0) > 0) {
    const d = data.deliveredThisWeek!;
    line = pick(
      [
        `${d} ${plural(d, 'piece', 'pieces')} delivered this week.`,
        'New work landed in your library this week.',
      ],
      now,
    );
  } else if (data.websiteStatus === 'live') {
    line = pick(['Your site is live and healthy.', 'All quiet. Your site is live.'], now);
  } else {
    line = pick(
      [
        "Nothing needs you right now. We're on it.",
        "All quiet. We'll flag anything that needs you.",
      ],
      now,
    );
  }

  return { salutation: sal, line };
}

export interface OfficeBriefingData {
  firstName?: string | null;
  approvalsWaiting?: number;
  urgentTickets?: number;
  dueThisWeek?: number;
  newEnquiries?: number;
  unreadMessages?: number;
}

export function composeOfficeBriefing(
  data: OfficeBriefingData,
  now: Date = new Date(),
): Greeting {
  const name = (data.firstName || '').trim().split(/\s+/)[0];
  const sal = name ? `${salutation(now)}, ${name}.` : `${salutation(now)}.`;

  const clauses: string[] = [];
  const a = data.approvalsWaiting ?? 0;
  const u = data.urgentTickets ?? 0;
  const d = data.dueThisWeek ?? 0;
  const e = data.newEnquiries ?? 0;
  const m = data.unreadMessages ?? 0;

  if (a > 0) clauses.push(`${a} ${plural(a, 'approval', 'approvals')} waiting`);
  if (u > 0) clauses.push(`${u} urgent ${plural(u, 'ticket', 'tickets')}`);
  if (d > 0) clauses.push(`${d} ${plural(d, 'project', 'projects')} due this week`);
  if (e > 0) clauses.push(`${e} new ${plural(e, 'enquiry', 'enquiries')} overnight`);
  if (m > 0) clauses.push(`${m} unread client ${plural(m, 'message', 'messages')}`);

  const top = clauses.slice(0, 2).join(', ');
  const line = top ? `${top.charAt(0).toUpperCase()}${top.slice(1)}.` : 'The board is clear.';

  return { salutation: sal, line };
}
