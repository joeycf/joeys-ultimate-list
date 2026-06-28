import { ImageResponse } from "next/og";
import { getCollectionBySlug } from "@/db/queries";
import { SITE_NAME } from "@/lib/site";

export const alt = "Joey's Ultimate List collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  const isTop = collection?.type === "top";
  const accent = isTop ? "#e8b65c" : "#9c7bf4";
  const badgeBg = isTop ? "rgba(232,182,92,0.16)" : "rgba(156,123,244,0.16)";
  const title = collection?.title ?? "Not found";
  const count = collection?.items.length ?? 0;

  let subline = "This collection doesn't exist.";
  if (collection && isTop) {
    const top = [...collection.items].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    )[0];
    subline = top
      ? `${count} ranked  ·  #1 ${top.title}`
      : `${count} ${count === 1 ? "item" : "items"}  ·  ranked`;
  } else if (collection) {
    subline = `${count} ${count === 1 ? "pick" : "picks"}`;
  }
  const badge = !collection ? "404" : isTop ? "TOP" : "FAVORITES";

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#2dd4a8",
                borderRadius: "6px",
                transform: "rotate(45deg)",
                boxShadow: "0 0 28px #2dd4a8",
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                letterSpacing: "7px",
                textTransform: "uppercase",
                color: "#71717a",
              }}
            >
              {SITE_NAME}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 22px",
              fontSize: "22px",
              letterSpacing: "4px",
              borderRadius: "8px",
              background: badgeBg,
              border: `2px solid ${accent}`,
              color: accent,
            }}
          >
            {badge}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? "54px" : "70px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              color: "#f4f4f5",
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
            {subline}
          </div>
        </div>

        <div style={{ display: "flex", width: "96px", height: "6px", background: accent }} />
      </div>
    ),
    { ...size }
  );
}
