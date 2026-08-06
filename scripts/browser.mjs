/**
 * Launches Chromium for the audits.
 *
 * The path used to be hard-coded to this build container's copy, so every
 * browser-driven audit failed anywhere else with "Executable doesn't exist" —
 * which meant the client could not run the checks the README tells them to run.
 * Playwright's own resolution is tried first; CHROMIUM_PATH overrides it, and
 * the container path is only a last resort.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const CANDIDATES = [
  process.env.CHROMIUM_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
].filter(Boolean);

export async function launchBrowser(extra = {}) {
  const args = ["--no-sandbox", ...(extra.args ?? [])];
  // Playwright's own download is the normal case; try it before any path.
  try {
    return await chromium.launch({ ...extra, args });
  } catch {
    for (const executablePath of CANDIDATES) {
      if (!fs.existsSync(executablePath)) continue;
      try {
        return await chromium.launch({ ...extra, args, executablePath });
      } catch {
        /* try the next candidate */
      }
    }
    throw new Error(
      "Could not launch Chromium. Run `npx playwright install chromium`, or set CHROMIUM_PATH.",
    );
  }
}
