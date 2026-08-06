import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — painter and decorator in ${site.town}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card, generated at build time by next/og. No external image service
 * and nothing to pay for. Uses the brand's own ground and accent rather than a
 * screenshot, so it reads at thumbnail size in a message thread.
 *
 * Kept in step with the site by hand — Satori cannot read the CSS custom
 * properties, so these hexes mirror the @theme block in globals.css. It had
 * already drifted twice: still Wet Paint Blue after the orange rebrand, and
 * still a literal "PAINT MAN" after the business became The Paint Men. The
 * wordmark is now interpolated from site.name so at least that half cannot
 * drift again.
 *
 * Satori requires an explicit display on every element with more than one
 * child, hence the flex declarations throughout.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0c0e",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30 }}>
          <span style={{ color: "#8b8983", letterSpacing: 2 }}>THE</span>
          <span
            style={{
              color: "#f7f6f4",
              fontWeight: 700,
              letterSpacing: 2,
              borderBottom: "6px solid #f26522",
              paddingBottom: 4,
            }}
          >
            {site.name.replace(/^The /, "").toUpperCase()}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 96,
              fontWeight: 700,
              color: "#f7f6f4",
              letterSpacing: -4,
              lineHeight: 1.02,
            }}
          >
            <span>Decorating,</span>
            <span style={{ fontStyle: "italic" }}>done properly.</span>
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#b8b6b1" }}>
            {`Painter & decorator · ${site.serviceArea}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#f26522",
              color: "#0c0c0e",
              fontSize: 26,
              fontWeight: 600,
              padding: "18px 34px",
              borderRadius: 999,
            }}
          >
            Get a Free Quote
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#b8b6b1" }}>{site.phone}</div>
        </div>
      </div>
    ),
    size,
  );
}
