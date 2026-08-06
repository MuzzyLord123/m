import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — painter and decorator in ${site.town}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share card, generated at build time by next/og. No external image service
 * and nothing to pay for. Uses the brand's accent and layout rather than a
 * screenshot, so it reads at thumbnail size in a message thread.
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
          backgroundColor: "#fafaf8",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30 }}>
          <span style={{ color: "#6a6a64", letterSpacing: 2 }}>THE</span>
          <span
            style={{
              color: "#141414",
              fontWeight: 700,
              letterSpacing: 2,
              borderBottom: "6px solid #b8430b",
              paddingBottom: 4,
            }}
          >
            PAINT MAN
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 96,
              fontWeight: 700,
              color: "#141414",
              letterSpacing: -4,
              lineHeight: 1.02,
            }}
          >
            <span>Decorating,</span>
            <span style={{ fontStyle: "italic" }}>done properly.</span>
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#4b4b47" }}>
            {`Painter & decorator · ${site.serviceArea}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "#b8430b",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 600,
              padding: "18px 34px",
              borderRadius: 999,
            }}
          >
            Get a Free Quote
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#4b4b47" }}>{site.phone}</div>
        </div>
      </div>
    ),
    size,
  );
}
