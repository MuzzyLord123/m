import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Latin-only subsets: the UI ships no non-latin copy, and pulling the full subset set
// adds ~50KB of @font-face rules to the critical CSS for glyphs that are never requested.
import "./styles/fonts.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "@fontsource/jetbrains-mono/latin-600.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
