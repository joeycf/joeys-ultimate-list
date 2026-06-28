import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Joey's Ultimate List";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card for the site. On-brand (near-black bg, emerald mark,
// jewel accent rule). Uses the default sans — exact Space Grotesk would mean
// bundling the font file, a possible follow-up.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#2dd4a8",
              borderRadius: "8px",
              transform: "rotate(45deg)",
              boxShadow: "0 0 32px #2dd4a8",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              letterSpacing: "8px",
              textTransform: "uppercase",
              color: "#71717a",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "78px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: "#f4f4f5",
            }}
          >
            Everything I have opinions about.
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
            Favorites I love and Top lists I&apos;ve scored.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", width: "72px", height: "5px", background: "#2dd4a8" }} />
          <div style={{ display: "flex", width: "26px", height: "5px", background: "#9c7bf4" }} />
          <div style={{ display: "flex", width: "26px", height: "5px", background: "#e8b65c" }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
