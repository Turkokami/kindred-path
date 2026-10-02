import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <span className="font-serif text-2xl text-ink">Kindred Path</span>
        <Link href="/guide?mode=prepare" className="text-sm text-muted hover:text-ink">
          Plan ahead
        </Link>
      </header>

      <section className="grid items-center gap-10 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
        <div>
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
            A gentle guide for life&apos;s hardest paperwork.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Talk with Wren, our AI guide, about what to do after someone dies, or how to protect your family before
            you need to. Wren explains each step in plain language and tells you which kind of attorney can help.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/guide?mode=navigate"
              className="group rounded-3xl border border-line bg-card p-6 transition hover:border-sage hover:shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-clay">I recently lost someone</p>
              <p className="mt-2 font-serif text-xl text-ink">Help me with what comes next</p>
              <p className="mt-2 text-sm text-muted">
                The first days, the paperwork, and the people to call — one step at a time.
              </p>
            </Link>
            <Link
              href="/guide?mode=prepare"
              className="group rounded-3xl border border-line bg-card p-6 transition hover:border-sage hover:shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-sage">I want to plan ahead</p>
              <p className="mt-2 font-serif text-xl text-ink">Help me protect my family</p>
              <p className="mt-2 text-sm text-muted">
                Wills, trusts, powers of attorney, and how to get started with the right lawyer.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-card p-8">
          <Avatar state="idle" mouthOpen={0} />
          <p className="mt-3 text-center text-sm text-muted">Hi, I&apos;m Wren. I&apos;m here whenever you&apos;re ready.</p>
        </div>
      </section>

      <section className="grid gap-6 border-t border-line py-12 md:grid-cols-3">
        {[
          ["Talk or type", "Speak out loud and Wren answers in a calm voice, or type if you prefer."],
          ["A checklist that remembers", "Your steps are saved so you can stop and come back anytime."],
          ["The right professional", "Wren explains when you need a probate, estate planning, or elder law attorney."],
        ].map(([t, d]) => (
          <div key={t}>
            <h2 className="font-serif text-lg text-ink">{t}</h2>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-line py-8 text-xs leading-relaxed text-muted">
        Kindred Path provides general information and organization tools. It is not a law firm and does not provide
        legal, tax, or financial advice. Wren is an AI. If you are in crisis, call or text 988 in the US.
      </footer>
    </main>
  );
}
