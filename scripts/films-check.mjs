/**
 * Checks that every shape of YouTube link resolves to the right video ID.
 *
 *   npm run audit:films
 *
 * This is the one piece of the film gallery that a non-developer touches. When
 * James sends a link it will arrive from the phone app, the Share button, the
 * address bar or a Short, each with a different URL shape and a different set
 * of tracking parameters bolted on. If the parser drops one of them the film
 * simply does not appear, with no error anywhere — so it is worth a test.
 *
 * Also asserts the negatives: a Vimeo link or a bare channel URL must return
 * null and fail the BUILD, rather than silently producing an embed that 404s
 * in front of a customer.
 */
import { youTubeId, youTubePoster } from "../src/lib/youtube.ts";

const ID = "aqz-KE-bpKQ";

const shouldResolve = [
  ["address bar", `https://www.youtube.com/watch?v=${ID}`],
  ["address bar, no www", `https://youtube.com/watch?v=${ID}`],
  ["with playlist and timestamp", `https://www.youtube.com/watch?v=${ID}&list=PL9tY&index=2&t=15s`],
  ["v= not first", `https://www.youtube.com/watch?list=PL9tY&v=${ID}`],
  ["share button", `https://youtu.be/${ID}`],
  ["share button with si", `https://youtu.be/${ID}?si=Ab1_Cd2Ef3`],
  ["short", `https://www.youtube.com/shorts/${ID}`],
  ["short with query", `https://www.youtube.com/shorts/${ID}?feature=share`],
  ["live", `https://www.youtube.com/live/${ID}`],
  ["embed", `https://www.youtube.com/embed/${ID}`],
  ["nocookie embed", `https://www.youtube-nocookie.com/embed/${ID}`],
  ["legacy /v/", `https://www.youtube.com/v/${ID}`],
  ["m. subdomain", `https://m.youtube.com/watch?v=${ID}`],
  ["no scheme", `youtu.be/${ID}`],
  ["no scheme, www", `www.youtube.com/watch?v=${ID}`],
  ["bare id", ID],
  ["bare id with whitespace", `  ${ID}  `],
  ["uppercase host", `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`],
];

const shouldFail = [
  ["empty", ""],
  ["whitespace", "   "],
  ["not a url", "ask James for the link"],
  ["vimeo", "https://vimeo.com/123456789"],
  ["a channel", "https://www.youtube.com/@thepaintmen"],
  ["a channel's videos tab", "https://www.youtube.com/@thepaintmen/videos"],
  ["youtube home", "https://www.youtube.com"],
  ["id too short", "https://www.youtube.com/watch?v=abc"],
  ["id too long", `https://www.youtube.com/watch?v=${ID}EXTRA`],
  ["id with an illegal character", "https://www.youtube.com/watch?v=aqz-KE-bpK!"],
  ["youtu.be with no id", "https://youtu.be/"],
  ["a lookalike host", `https://youtube.com.evil.example/watch?v=${ID}`],
];

let failures = 0;

for (const [label, url] of shouldResolve) {
  const got = youTubeId(url);
  const ok = got === ID;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  resolves — ${label}${ok ? "" : `  (got ${got})`}`);
}

for (const [label, url] of shouldFail) {
  const got = youTubeId(url);
  const ok = got === null;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  rejects  — ${label}${ok ? "" : `  (got ${got})`}`);
}

/* The poster URL must stay inside the host next.config.mjs allows. A typo here
   means every poster 404s through the image optimiser at once. */
const poster = youTubePoster(ID);
const posterOk = poster === `https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`;
if (!posterOk) failures++;
console.log(`${posterOk ? "PASS" : "FAIL"}  poster url — ${poster}`);

const hq = youTubePoster(ID, "hq");
const hqOk = hq === `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`;
if (!hqOk) failures++;
console.log(`${hqOk ? "PASS" : "FAIL"}  poster url (fallback) — ${hq}`);

const total = shouldResolve.length + shouldFail.length + 2;
console.log(
  failures === 0
    ? `\n${total}/${total} checks pass. Any YouTube link James sends will work.`
    : `\n${failures} of ${total} checks FAILED.`,
);
process.exitCode = failures === 0 ? 0 : 1;
