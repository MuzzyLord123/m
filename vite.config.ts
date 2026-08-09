import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * A production build with no Supabase configuration used to succeed.
 *
 * Vite never evaluates app modules while bundling, so a missing
 * VITE_SUPABASE_URL went unnoticed at build time: it was inlined as the
 * literal string "undefined", the deploy went green, and the site then
 * white-screened on every route, because createClient throws during module
 * evaluation. A dead site behind a successful build is the worst failure
 * shape there is - nothing in the deploy log says anything is wrong.
 *
 * So the build asserts its own configuration instead. Missing variables
 * stop the build and name themselves, which a host surfaces as a failed
 * deploy with the previous version left serving.
 */
function requireSupabaseEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const missing = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
  ].filter((k) => !env[k] && !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Build stopped: missing ${missing.join(", ")}.\n` +
        "These are read at build time and inlined into the bundle; without them the " +
        "site builds cleanly and then fails to start in the browser.\n" +
        "Set them in your host's environment variables (Vercel: Project Settings -> " +
        "Environment Variables), or keep the committed .env in place.",
    );
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "production") requireSupabaseEnv(mode);
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // One site compiler, shared by the editor and the publish function.
      "@site": path.resolve(__dirname, "./supabase/functions/_shared/site"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Matched against the package's own directory rather than declared as
        // `{ name: [packages] }`. The object form also sweeps in each package's
        // transitive deps, so a small helper shared with the entry (recharts and
        // react-is, for one) dragged its whole vendor chunk into the initial
        // load. Matching only the package directory leaves shared deps for
        // Rollup to place where they are actually used.
        manualChunks(id: string) {
          // Rollup's CJS interop shims are a single shared module. Left alone it
          // gets parked inside whichever vendor chunk claims it first, and every
          // chunk needing interop - including the entry - then has to load that
          // whole vendor chunk. Isolating it keeps that edge weightless.
          // @babel/runtime belongs here for the same reason: drei consumes a single
          // 466-byte `_extends` helper, and with no home of its own Rollup parks it
          // in whichever vendor chunk claims it first - which made the globe chunk
          // pull all of recharts (115KB gzip) behind it.
          if (
            id.includes("commonjsHelpers") ||
            id.includes("commonjs-dynamic-modules") ||
            id.includes("node_modules/@babel/runtime/")
          )
            return "vendor-cjs-helpers";
          if (!id.includes("node_modules")) return;
          const inPkg = (...pkgs: string[]) =>
            pkgs.some((p) => id.includes(`node_modules/${p}/`));

          // Tiny helpers that the entry and several vendors all use. Without an
          // explicit home they land in whichever vendor chunk claims them first,
          // and the entry then pulls that whole chunk in for a few hundred bytes
          // (clsx alone was dragging recharts into the initial load). Parking
          // them beside React keeps them on a chunk that always loads anyway.
          if (inPkg("clsx", "tailwind-merge", "class-variance-authority", "tslib", "react-is", "prop-types", "object-assign", "use-sync-external-store"))
            return "vendor-react";
          if (inPkg("react", "react-dom", "react-router", "react-router-dom", "scheduler"))
            return "vendor-react";
          if (inPkg("@supabase/supabase-js", "@supabase/auth-js", "@supabase/postgrest-js", "@supabase/realtime-js", "@supabase/storage-js", "@supabase/functions-js", "@supabase/node-fetch"))
            return "vendor-supabase";
          if (inPkg("framer-motion", "motion-dom", "motion-utils")) return "vendor-motion";
          if (id.includes("node_modules/@radix-ui/")) return "vendor-radix";
          if (inPkg("recharts")) return "vendor-charts";
          if (inPkg("three")) return "vendor-3d";
          if (inPkg("pdfjs-dist")) return "vendor-pdf";
          if (id.includes("node_modules/@dnd-kit/")) return "vendor-dnd";
          if (id.includes("node_modules/@tiptap/")) return "vendor-editor";
        },
      },
    },
  },
  };
});