import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#050505",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
          {[52, 96, 120, 74, 40].map((h, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: h,
                borderRadius: 11,
                background: i % 2 === 0 ? "#1ed760" : "#0f9d58",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 96, letterSpacing: -3, lineHeight: 1 }}>
            {siteConfig.name}
          </div>
          <div style={{ fontSize: 40, color: "#a3a3a3", lineHeight: 1.2 }}>
            {`${siteConfig.tagline} · top artistes, top titres, toile des collaborations`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#737373" }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ffffff" }} />
          Analyse locale de vos archives Spotify
        </div>
      </div>
    ),
    size,
  );
}
