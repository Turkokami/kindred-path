// The preview card shown when someone shares a Kindred Path link (texts, Facebook, LinkedIn, etc.).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Kindred Path: talk with Wren, an AI guide, after a loss or to plan ahead";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const wren = await readFile(join(process.cwd(), "src/assets/og-wren.jpg"));
  const wrenSrc = `data:image/jpeg;base64,${wren.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf6ef", padding: 56, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ fontSize: 28, color: "#5f7f68", fontWeight: 700, letterSpacing: 2 }}>KINDRED PATH</div>
          <div style={{ fontSize: 64, color: "#2c3a33", lineHeight: 1.1, marginTop: 20 }}>
            A gentle guide for life&apos;s hardest paperwork.
          </div>
          <div style={{ fontSize: 28, color: "#5f6b64", marginTop: 24, lineHeight: 1.35 }}>
            Talk with Wren, an AI guide, about what to do after a loss or how to plan ahead.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wrenSrc} width={460} height={460} style={{ borderRadius: 40, border: "6px solid #e5ece4" }} alt="" />
        </div>
      </div>
    ),
    size,
  );
}
