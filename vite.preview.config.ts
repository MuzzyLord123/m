import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

/**
 * Single-file build used only to publish a shareable visual preview.
 *
 * Not a deployment target: everything (JS, CSS, images, fonts) is inlined into one
 * HTML document so the page can be hosted somewhere that serves a single file and
 * blocks outbound requests. That means no code splitting and no caching - the
 * opposite of what `vite.config.ts` does for production. Use `npm run build` for
 * anything real.
 */
function inlineEverything(): Plugin {
  return {
    name: "inline-everything",
    enforce: "post",
    generateBundle(_options, bundle) {
      const htmlKey = Object.keys(bundle).find((k) => k.endsWith(".html"));
      if (!htmlKey) return;
      const html = bundle[htmlKey];
      if (html.type !== "asset") return;

      let source = String(html.source);

      // Fold each emitted chunk/stylesheet into the document, then drop the file
      // so the output really is one artifact.
      for (const [key, item] of Object.entries(bundle)) {
        if (key === htmlKey) continue;

        if (item.type === "chunk" && key.endsWith(".js")) {
          const tag = new RegExp(
            `<script[^>]*src="[^"]*${key.split("/").pop()}"[^>]*></script>`
          );
          if (tag.test(source)) {
            // A `</script` anywhere in the bundle - inside a string literal, a
            // regex, whatever - would close the tag early and dump the rest of
            // the JS into the document as text.
            const safe = item.code.replace(/<\/script/gi, "<\\/script");
            source = source.replace(
              tag,
              () => `<script type="module">\n${safe}\n</script>`
            );
            delete bundle[key];
          }
        }

        if (item.type === "asset" && key.endsWith(".css")) {
          const tag = new RegExp(
            `<link[^>]*href="[^"]*${key.split("/").pop()}"[^>]*>`
          );
          if (tag.test(source)) {
            const safe = String(item.source).replace(/<\/style/gi, "<\\/style");
            source = source.replace(tag, () => `<style>\n${safe}\n</style>`);
            delete bundle[key];
          }
        }
      }

      // Preload hints point at files that no longer exist once inlined.
      source = source.replace(/<link[^>]*rel="modulepreload"[^>]*>\s*/g, "");

      // The production CSP has no 'unsafe-inline' in script-src - correct for the
      // real deploy, fatal here, where the whole bundle is now an inline <script>.
      // The host serving this preview applies its own CSP.
      source = source.replace(
        /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>\s*/gi,
        ""
      );

      html.source = source;
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineEverything()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: "dist-preview",
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
