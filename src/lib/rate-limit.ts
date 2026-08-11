/**
 * Rate limiting for the lead actions.
 *
 * WHY IT EXISTS. Every accepted submission spends two Resend sends. The account
 * is on the free tier — 100 emails a day, 3,000 a month — so about fifty POSTs
 * exhausts a day's allowance. After that every genuine enquiry fails and the
 * customer is shown "That did not send, ring us", while the decorator never
 * learns the lead existed. A few seconds of a for-loop costs the business a
 * day of leads, and there was nothing in front of it: the honeypot and the
 * four-second dwell test are both driven by values the caller supplies, and a
 * Server Action is an ordinary POST endpoint that curl can call directly.
 *
 * BE HONEST ABOUT WHAT THIS IS. The counters live in the module scope of one
 * serverless instance. That is genuinely useful — it bounds a naive flood from
 * a single source, which is the attack that actually happens to a decorator's
 * website — but it is NOT a distributed rate limiter:
 *
 *   - Vercel may run several instances, so a determined attacker gets the limit
 *     multiplied by however many are warm.
 *   - An idle instance is recycled and its counters go with it.
 *
 * The honest fix for a site under real attack is a Vercel Firewall rate-limit
 * rule on POST to /quote and /contact (no code, no dependency), or Upstash
 * Redis behind @upstash/ratelimit. Both need an account and a dashboard, so
 * neither can be committed here. This is the part that CAN be committed, it
 * closes the trivial version of the attack, and it costs nothing.
 *
 * THE GLOBAL CAP IS THE ONE THAT PROTECTS THE BUSINESS. Per-IP limits are
 * bypassed by rotating IPs; the daily ceiling is not, because it counts sends
 * rather than callers. It is set below the Resend allowance on purpose: if
 * something does get through, the site stops sending BEFORE the provider cuts
 * it off, so the failure is one we control and can see in the logs rather than
 * a silent bounce at the provider.
 */

type Bucket = { count: number; resetAt: number };

const perIp = new Map<string, Bucket>();
const perEmail = new Map<string, Bucket>();
let globalDay: Bucket = { count: 0, resetAt: 0 };

/** Sends per address per day. A person asking twice is fine; forty is not. */
const EMAIL_PER_DAY = 3;
/** Submissions per IP per hour. A household behind one NAT can still enquire. */
const IP_PER_HOUR = 5;
/**
 * Site-wide submissions per day. Two sends each, so 40 is 80 emails against a
 * 100/day allowance — the remaining headroom is deliberate.
 */
const GLOBAL_PER_DAY = 40;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Drops expired buckets so a long-lived instance cannot grow unboundedly. */
function sweep(map: Map<string, Bucket>, now: number) {
  if (map.size < 5000) return;
  for (const [key, bucket] of map) if (bucket.resetAt <= now) map.delete(key);
}

function take(map: Map<string, Bucket>, key: string, limit: number, window: number, now: number) {
  sweep(map, now);
  const bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + window });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export type RateVerdict = { ok: true } | { ok: false; reason: "ip" | "email" | "global" };

/**
 * Consumes one unit of allowance. Call once per accepted submission, AFTER
 * validation and the bot checks — a request that was never going to send an
 * email should not use up a real customer's budget.
 */
export function consumeLeadAllowance(ip: string, email: string, now = Date.now()): RateVerdict {
  if (globalDay.resetAt <= now) globalDay = { count: 0, resetAt: now + DAY };
  if (globalDay.count >= GLOBAL_PER_DAY) return { ok: false, reason: "global" };

  if (!take(perIp, ip, IP_PER_HOUR, HOUR, now)) return { ok: false, reason: "ip" };
  if (!take(perEmail, email.toLowerCase(), EMAIL_PER_DAY, DAY, now)) {
    return { ok: false, reason: "email" };
  }

  globalDay.count += 1;
  return { ok: true };
}

/** Test seam — the buckets are module state and would otherwise leak between runs. */
export function resetLeadAllowance() {
  perIp.clear();
  perEmail.clear();
  globalDay = { count: 0, resetAt: 0 };
}
