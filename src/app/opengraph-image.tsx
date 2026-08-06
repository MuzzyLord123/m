import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} — painter and decorator in ${site.town}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card — what appears when the site is sent on WhatsApp, Instagram,
 * Snapchat, Facebook or in a text message. Generated at build time by next/og,
 * so there is no image service and nothing to pay for.
 *
 * It carries the CLIENT'S OWN LOGO, read off disk and inlined as a data URI.
 * Satori cannot fetch a URL during the build, and it cannot read CSS custom
 * properties either, so the hexes below mirror the @theme block in globals.css
 * by hand. This card had already drifted twice — still Wet Paint Blue after the
 * orange rebrand, and still a literal "PAINT MAN" after the business became The
 * Paint Men — so the wordmark is the real artwork now rather than typed text,
 * and it cannot drift again.
 *
 * The photograph behind it is the strongest frame in the gallery: a share is
 * usually the first thing anyone sees of the business, and a finished room
 * argues better than a headline does.
 */
function inline(relativePath: string): string {
  const file = fs.readFileSync(path.join(process.cwd(), "public", relativePath));
  const mime = relativePath.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${file.toString("base64")}`;
}

export default function OpenGraphImage() {
  const logo = inline("brand/logo.png");
  const background = inline("brand/og-bg.jpg");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0c0c0e",
        }}
      >
        {/* The work with the scrim already burnt in — see
            scripts/make-og-bg.mjs. Done there rather than as a gradient div
            here because Satori ignores the `background` shorthand for
            gradients AND does not honour `inset: 0`, so the overlay silently
            collapsed and the type sat on a brightly lit kitchen. */}
        <img
          src={background}
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0 }}
          alt=""
        />

        {/* A band of brand orange down the left edge — the same gesture the site
            uses to mark a section. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            display: "flex",
            backgroundColor: "#f26522",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "62px 74px",
            width: "100%",
          }}
        >
          <img src={logo} height={100} style={{ objectFit: "contain" }} alt="" />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 80,
                fontWeight: 700,
                color: "#f7f6f4",
                letterSpacing: -3,
                lineHeight: 1.04,
              }}
            >
              <span>Decorating,</span>
              <span style={{ fontStyle: "italic" }}>done properly.</span>
            </div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 27, color: "#b8b6b1" }}>
              {`${site.years} years · ${site.serviceArea}`}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#f26522",
                color: "#0c0c0e",
                fontSize: 25,
                fontWeight: 700,
                padding: "17px 32px",
                borderRadius: 999,
              }}
            >
              Get a Free Quote
            </div>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 600, color: "#f7f6f4" }}>
              {site.phone}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
