import Link from "next/link";

export const metadata = {
  title: "Money you may be owed — Kindred Path",
  description:
    "Free official tools to find survivor benefits, burial benefits, lost life insurance, unclaimed property, pensions, and savings bonds after a death.",
};

// Every link is a free, official or nonprofit tool (checked 2026-10-02). Content needs attorney review before launch.
const RESOURCES: { title: string; href: string; source: string; what: string; who: string }[] = [
  {
    title: "Social Security survivor benefits",
    href: "https://www.ssa.gov/survivor",
    source: "Social Security Administration",
    what: "Monthly benefits for a surviving spouse, children, or dependent parents, and a one-time death payment for an eligible spouse or child.",
    who: "Anyone whose spouse, parent, or provider worked and paid into Social Security. Funeral homes often report the death, but you usually need to apply for benefits yourself.",
  },
  {
    title: "Life Insurance Policy Locator",
    href: "https://eapps.naic.org/life-policy-locator/#/welcome",
    source: "National Association of Insurance Commissioners",
    what: "Asks participating insurers to search for life insurance policies and annuities in the person's name.",
    who: "Beneficiaries, executors, and family who think there may be a policy but can't find the paperwork.",
  },
  {
    title: "Unclaimed property (MissingMoney)",
    href: "https://missingmoney.com/",
    source: "National Association of Unclaimed Property Administrators",
    what: "Searches state lists of forgotten bank accounts, uncashed checks, refunds, deposits, and insurance payouts.",
    who: "Everyone. Search the person's name in every state they lived in, and your own name too.",
  },
  {
    title: "VA burial and survivor benefits",
    href: "https://www.va.gov/burials-memorials/",
    source: "U.S. Department of Veterans Affairs",
    what: "Help with burial costs, a free headstone or marker, burial in a national cemetery, and survivor benefits.",
    who: "Families of veterans and service members.",
  },
  {
    title: "Unclaimed pensions",
    href: "https://www.pbgc.gov/search-unclaimed-pensions",
    source: "Pension Benefit Guaranty Corporation",
    what: "Searches for pension benefits from company plans that ended or were taken over.",
    who: "Families of anyone who had a pension from a past employer.",
  },
  {
    title: "Savings bonds (Treasury Hunt)",
    href: "https://www.treasurydirect.gov/savings-bonds/treasury-hunt/",
    source: "U.S. Department of the Treasury",
    what: "Finds matured savings bonds that were never cashed.",
    who: "Anyone whose loved one may have bought or been given savings bonds.",
  },
];

export default function BenefitsPage() {
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

      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Money and benefits you may be owed</h1>
      <p className="mt-2 max-w-2xl text-muted">
        After a death, families often miss benefits and forgotten money. These free tools come from government agencies
        and nonprofits. Each one takes a few minutes.
      </p>

      <section className="mt-6 rounded-3xl border-2 border-clay bg-clay-soft p-5 text-ink">
        <h2 className="font-serif text-xl">These searches are free</h2>
        <p className="mt-1">
          You never need to pay someone to search these for you. Be careful with anyone who contacts you offering to
          recover money for a fee or a percentage, and never give out a Social Security number to an unexpected caller.
        </p>
      </section>

      <ul className="mt-6 grid gap-4">
        {RESOURCES.map((r) => (
          <li key={r.href} className="rounded-2xl border border-line bg-card p-5">
            <a href={r.href} target="_blank" rel="noopener noreferrer" className="font-serif text-xl text-sage underline">
              {r.title}
            </a>
            <p className="text-xs text-muted">{r.source}</p>
            <p className="mt-2 text-ink">{r.what}</p>
            <p className="mt-1 text-sm text-muted">
              <strong className="text-ink">Who it&apos;s for:</strong> {r.who}
            </p>
          </li>
        ))}
        <li className="rounded-2xl border border-line bg-card p-5">
          <p className="font-serif text-xl text-ink">Their employer, if they were working or retired</p>
          <p className="mt-2 text-ink">
            Ask human resources about a final paycheck, unused vacation pay, group life insurance, and retirement plan
            accounts like a 401(k).
          </p>
          <p className="mt-1 text-sm text-muted">These often pay out to a named beneficiary rather than through the will.</p>
        </li>
      </ul>

      <p className="mt-8 text-sm text-muted">
        Not sure which apply? <Link href="/guide?mode=navigate" className="text-sage underline">Ask Wren</Link>, or bring
        this list to a probate attorney or CPA.
      </p>

      <footer className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-muted">
        Kindred Path provides general information and organization tools. It is not a law firm and does not provide
        legal, tax, or financial advice. Eligibility rules vary, so confirm with the agency. If you are in crisis, call
        or text 988 in the US.
      </footer>
    </main>
  );
}
