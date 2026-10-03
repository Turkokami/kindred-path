import Link from "next/link";

/** Shared shell for /privacy and /terms, with the "draft, pending attorney review" banner. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="font-serif text-2xl text-ink">
          Kindred Path
        </Link>
        <Link href="/guide?mode=navigate" className="text-sm text-muted hover:text-ink">
          Talk with Wren
        </Link>
      </header>
      <p className="rounded-2xl border-2 border-clay bg-clay-soft p-3 text-sm text-ink">
        <strong>Draft, pending attorney review.</strong> This page has not yet been reviewed by a lawyer and may change
        before launch.
      </p>
      <h1 className="mt-6 font-serif text-3xl text-ink sm:text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated {updated}</p>
      <div className="legal mt-6 space-y-4 text-ink [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
