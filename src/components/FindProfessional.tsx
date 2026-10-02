"use client";

import { useState } from "react";
import Link from "next/link";
import { PROVIDER_CATEGORIES, TRUSTED_DIRECTORIES, categoryById } from "@/lib/providers";
import type { PlaceResult } from "@/app/api/places/route";

type Status = "idle" | "loading" | "done" | "error" | "off";

export default function FindProfessional({ initialCategory }: { initialCategory?: string }) {
  const [category, setCategory] = useState(categoryById(initialCategory ?? "")?.id ?? PROVIDER_CATEGORIES[0].id);
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searched, setSearched] = useState(categoryById(category)!);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categoryById(category)!;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/places?${new URLSearchParams({ category, location })}`);
      const data = await res.json();
      if (res.status === 503 && data.error === "not_configured") {
        setStatus("off");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error === "search_failed" ? "The search didn't work just now. Please try again." : data.error);
        return;
      }
      setResults(data.results);
      setSearched(cat);
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("The search didn't work just now. Please try again.");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="font-serif text-2xl text-ink">
          Kindred Path
        </Link>
        <Link href="/guide?mode=navigate" className="text-sm text-muted hover:text-ink">
          Talk with Wren
        </Link>
      </header>

      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Find a professional near you</h1>
      <p className="mt-2 text-muted">Lawyers, CPAs, funeral homes, and grief support in your area.</p>

      <section
        aria-labelledby="vet-heading"
        className="mt-6 rounded-3xl border-2 border-clay bg-clay-soft p-5 text-ink sm:p-6"
      >
        <h2 id="vet-heading" className="font-serif text-xl sm:text-2xl">
          Please fully vet anyone before you hire them
        </h2>
        <p className="mt-2">
          These are nearby listings, not recommendations. Kindred Path does not screen, endorse, rank, or get paid
          by any provider shown here, and nobody pays to be listed. The results and their order come from a Google
          Maps search.
        </p>
        <p className="mt-3 font-semibold">Before you choose someone:</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Check their license (your state bar for attorneys, CPAverify for CPAs, your state funeral board for funeral homes).</li>
          <li>Ask what they charge and what it covers, and get it in writing.</li>
          <li>Talk with more than one if you can, and read recent reviews.</li>
          <li>Make sure they regularly handle matters like yours, in your state.</li>
        </ul>
      </section>

      <form onSubmit={search} className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm text-muted">
          What kind of help
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 text-ink"
          >
            {PROVIDER_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          Where
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City and state, or ZIP"
            required
            minLength={2}
            maxLength={80}
            autoComplete="postal-code"
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-sage px-6 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      <section aria-live="polite" className="mt-6">
        {status === "off" && (
          <p className="rounded-2xl border border-line bg-card p-4 text-muted">
            Nearby listings aren&apos;t switched on yet. The trusted directories below can help you find someone in
            the meantime.
          </p>
        )}
        {status === "error" && <p className="rounded-2xl border border-line bg-card p-4 text-muted">{message}</p>}
        {status === "done" && (
          <>
            <p className="text-sm text-muted">
              <strong className="text-ink">How to check a {searched.label.toLowerCase()}:</strong> {searched.vet}
            </p>
            {results.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-line bg-card p-4 text-muted">
                No listings found. Try a nearby city, or use the directories below.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {results.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line bg-card p-4">
                    <p className="font-serif text-lg text-ink">{r.name}</p>
                    <p className="text-sm text-muted">{r.address}</p>
                    {r.rating !== undefined && (
                      <p className="mt-1 text-sm text-muted">
                        Google rating {r.rating.toFixed(1)} ({r.ratingCount ?? 0} reviews)
                      </p>
                    )}
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="text-sage underline">
                          {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a href={r.website} target="_blank" rel="noopener noreferrer nofollow" className="text-sage underline">
                          Website
                        </a>
                      )}
                      {r.mapsUrl && (
                        <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sage underline">
                          View on Google Maps
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Listings from Google Maps. Not an endorsement.</p>
          </>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-serif text-xl text-ink">Trusted directories</h2>
        <p className="mt-1 text-sm text-muted">Free, independent places to find and check professionals.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {TRUSTED_DIRECTORIES.map((d) => (
            <li key={d.href} className="rounded-2xl border border-line bg-card p-4">
              <a href={d.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-sage underline">
                {d.name}
              </a>
              <p className="mt-1 text-sm text-muted">{d.what}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        Kindred Path provides general information and organization tools. It is not a law firm, does not provide
        legal, tax, or financial advice, and does not refer you to any provider. If you are in crisis, call or text 988
        in the US.
      </footer>
    </main>
  );
}
