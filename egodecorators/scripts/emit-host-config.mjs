#!/usr/bin/env node
/**
 * Writes the redirect map into the config files a static host understands.
 *
 *   node scripts/emit-host-config.mjs        after a STATIC_EXPORT build
 *
 * Next applies redirects and headers in its own server. The static-export
 * bundle has no server, so those rules have to be restated in whatever the host
 * reads instead — .htaccess on Apache and cPanel, _redirects/_headers on
 * Netlify and Cloudflare Pages.
 *
 * They are generated, never hand-written, from the same arrays next.config.mjs
 * uses. Two copies of a redirect map is one copy too many: the whole point of
 * the migration is that every old URL lands somewhere, and a hand-kept second
 * list is how one of them quietly stops.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, RECENT_WORK, BLOG, CATCH_ALLS } from '../next.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out');

if (!fs.existsSync(out)) {
  console.error('No out/ directory. Run: STATIC_EXPORT=1 npx next build');
  process.exit(1);
}

const NAMED = [...PAGES, ...RECENT_WORK, ...BLOG];

/**
 * Turn a Next source pattern into the two things a host needs: an Apache
 * regular expression and a Netlify-style path with a splat.
 */
function translate(source) {
  // /:year(\d{4})/:month(\d{2})/:day(\d{2})/:slug*  — dated WordPress permalinks
  if (source.includes('\\d{4}')) {
    return { apache: '^[0-9]{4}/[0-9]{2}/[0-9]{2}/.*$', netlify: '/:year/:month/:day/*' };
  }
  // /recent_work/:slug*  — everything under a retired prefix
  const prefix = source.match(/^\/([^:]+)\/:[a-z]+\*$/i);
  if (prefix) {
    return { apache: `^${prefix[1]}(/.*)?$`, netlify: `/${prefix[1]}/*` };
  }
  // A literal path.
  const literal = source.replace(/^\//, '');
  return { apache: `^${literal}/?$`, netlify: `/${literal}` };
}

/* ------------------------------------------------------------- .htaccess -- */
/* Apache and cPanel — the likeliest home for a site moving off WordPress on
   shared hosting. */

const htaccess = `# GENERATED — do not edit by hand.
# Written by scripts/emit-host-config.mjs from the map in next.config.mjs.
# Regenerate after any change there.

Options -MultiViews
RewriteEngine On

# --- 301s from the old WordPress site -------------------------------------
# Every one of these ends in a slash on the old site, so each pattern accepts
# the URL with or without it and answers in a single hop.

${NAMED.map((r) => `RewriteRule ${translate(r.source).apache} ${r.destination} [R=301,L]`).join('\n')}

# --- Catch-alls, so no old link can dead-end ------------------------------

${CATCH_ALLS.map((r) => `RewriteRule ${translate(r.source).apache} ${r.destination} [R=301,L]`).join('\n')}

# --- Trailing slashes ------------------------------------------------------
# Everything else that arrives with one loses it. Directories are left alone.
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.+)/$ /$1 [R=301,L]

# --- Serve the exported .html for extensionless URLs -----------------------
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^(.*)$ /$1.html [L]

ErrorDocument 404 /404.html

# --- The sharing card ------------------------------------------------------
# Next exports it without a file extension, so a static host guesses the type
# and Facebook, WhatsApp and iMessage all silently refuse to show the preview.
<Files "opengraph-image">
  ForceType image/png
</Files>

# --- Headers ---------------------------------------------------------------
# The same set next.config.mjs sends on the Node deployment.
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>

# --- Caching ---------------------------------------------------------------
# Hashed build assets are immutable; pages are not.
<IfModule mod_expires.c>
  ExpiresActive On
  <FilesMatch "\\.(js|css|woff2|avif|webp|jpg|jpeg|png|svg)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>
`;

/* ------------------------------------------------------------ _redirects -- */
/* Netlify and Cloudflare Pages. */

const redirects = `# GENERATED — do not edit by hand.
# Written by scripts/emit-host-config.mjs from the map in next.config.mjs.

# Old WordPress URLs. Each is listed with and without its trailing slash so it
# resolves in one hop rather than two.
${NAMED.flatMap((r) => {
  const p = translate(r.source).netlify;
  return [`${p.padEnd(46)} ${r.destination}  301`, `${(p + '/').padEnd(46)} ${r.destination}  301`];
}).join('\n')}

# Catch-alls, so no old link can dead-end.
${CATCH_ALLS.map((r) => `${translate(r.source).netlify.padEnd(46)} ${r.destination}  301`).join('\n')}
`;

const headers = `# GENERATED — do not edit by hand.
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN

# Exported without a file extension, so the type has to be stated or the
# sharing preview silently fails everywhere it matters.
/opengraph-image
  Content-Type: image/png
`;

fs.writeFileSync(path.join(out, '.htaccess'), htaccess);
fs.writeFileSync(path.join(out, '_redirects'), redirects);
fs.writeFileSync(path.join(out, '_headers'), headers);

const rules = NAMED.length * 2 + CATCH_ALLS.length;
console.log(`Wrote out/.htaccess, out/_redirects and out/_headers — ${rules} redirect rules.`);
