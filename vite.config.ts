import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
}));