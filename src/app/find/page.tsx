import FindProfessional from "@/components/FindProfessional";

export const metadata = {
  title: "Find a professional — Kindred Path",
  description: "Nearby lawyers, CPAs, funeral homes, and grief support, with tips for vetting anyone before you hire them.",
};

export default async function FindPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  return <FindProfessional initialCategory={category} />;
}
