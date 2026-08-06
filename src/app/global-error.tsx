"use client";

import { useEffect } from "react";

/**
 * The last line of defence: an error thrown in the root layout itself.
 *
 * This replaces <html> and <body>, so it cannot use the site's layout, fonts or
 * components — none of them have mounted. Everything is inline, deliberately,
 * and it stays legible if the stylesheet never arrived either. It should never
 * be seen; a site without one shows Next's stock white error page instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#fafaf8",
          color: "#1a1a18",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6b6b64",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ margin: "1rem 0 0", fontSize: "2rem", lineHeight: 1.1, fontWeight: 600 }}>
            The site failed to load.
          </h1>
          <p style={{ margin: "1rem 0 0", fontSize: "1.0625rem", lineHeight: 1.6, color: "#4a4a44" }}>
            This is our fault and usually temporary. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              height: "3.25rem",
              padding: "0 1.75rem",
              border: 0,
              borderRadius: "999px",
              background: "#b8430b",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "2.5rem", fontSize: "0.8125rem", color: "#6b6b64" }}>
              Reference {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
