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
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-radix": ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-tooltip", "@radix-ui/react-dropdown-menu"],
          "vendor-charts": ["recharts"],
          "vendor-3d": ["three"],
          "vendor-pdf": ["pdfjs-dist"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "vendor-editor": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-color", "@tiptap/extension-highlight", "@tiptap/extension-image", "@tiptap/extension-link", "@tiptap/extension-table", "@tiptap/extension-table-row", "@tiptap/extension-table-cell", "@tiptap/extension-table-header", "@tiptap/extension-task-list", "@tiptap/extension-task-item"],
        },
      },
    },
  },
}));