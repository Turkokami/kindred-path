// Categories for the "Find a professional" page, and the free directories shown under the listings.
// Listings are neutral search results: nobody pays to appear, and Kindred Path does not rank or endorse them.

export type ProviderCategory = {
  id: string;
  label: string;
  /** Search phrase sent to Google Places, followed by "near <location>". */
  query: string;
  /** One-line "how to check them" tip shown with the results. */
  vet: string;
};

const BAR = "Confirm the license with your state bar, and ask for the fee and what it covers in writing.";

export const PROVIDER_CATEGORIES: ProviderCategory[] = [
  { id: "probate", label: "Probate attorney", query: "probate attorney", vet: BAR },
  { id: "estate-planning", label: "Estate planning attorney", query: "estate planning attorney", vet: BAR },
  { id: "elder-law", label: "Elder law attorney", query: "elder law attorney", vet: BAR },
  { id: "trust-litigation", label: "Trust & estate litigation attorney", query: "trust and estate litigation attorney", vet: BAR },
  { id: "special-needs", label: "Special needs planning attorney", query: "special needs planning attorney", vet: BAR },
  { id: "real-estate", label: "Real estate attorney", query: "real estate attorney", vet: BAR },
  {
    id: "cpa",
    label: "CPA / estate tax preparer",
    query: "CPA estate and trust tax",
    vet: "Look the CPA up on CPAverify.org, and ask whether they prepare estate and trust returns (Form 1041).",
  },
  {
    id: "funeral-home",
    label: "Funeral home",
    query: "funeral home",
    vet: "Under the FTC Funeral Rule you can ask for an itemized price list, by phone or in person, and buy only what you want.",
  },
  {
    id: "cremation",
    label: "Cremation service",
    query: "cremation service",
    vet: "Ask for the itemized price list and check the provider's license with your state funeral board.",
  },
  {
    id: "grief",
    label: "Grief counseling or support group",
    query: "grief counseling",
    vet: "Ask about the counselor's license and whether they take your insurance. Hospices often run free groups too.",
  },
];

export function categoryById(id: string): ProviderCategory | undefined {
  return PROVIDER_CATEGORIES.find((c) => c.id === id);
}

export const TRUSTED_DIRECTORIES = [
  {
    name: "Your state bar's lawyer referral service",
    href: "https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/",
    what: "The American Bar Association's list of state and local bar referral services and license lookups.",
  },
  {
    name: "NAELA: find an elder law attorney",
    href: "https://www.naela.org/findlawyer",
    what: "The National Academy of Elder Law Attorneys' member directory.",
  },
  {
    name: "CPAverify",
    href: "https://cpaverify.org/",
    what: "Check that a CPA is licensed in your state.",
  },
  {
    name: "Funeral Consumers Alliance",
    href: "https://www.funerals.org/",
    what: "A nonprofit that helps families compare funeral prices and know their rights.",
  },
  {
    name: "The FTC Funeral Rule",
    href: "https://consumer.ftc.gov/articles/ftc-funeral-rule",
    what: "Your legal right to itemized prices and to buy only the goods and services you want.",
  },
];
