import Guide from "@/components/Guide";
import type { Mode } from "@/lib/content";

export const metadata = { title: "Talk with Wren — Kindred Path" };

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const m: Mode = mode === "prepare" ? "prepare" : "navigate";
  return <Guide key={m} mode={m} />;
}
