// Core guidance content for Kindred Path.
// IMPORTANT: All content here must be reviewed by a licensed estate planning
// attorney before public launch (Blueprint, Phase 1 gate).

export type Mode = "navigate" | "prepare";

export interface Step {
  id: string;
  title: string;
  detail: string;
}

export interface Stage {
  id: string;
  title: string;
  steps: Step[];
}

export const NAVIGATE_JOURNEY: Stage[] = [
  {
    id: "first-48",
    title: "First 48 hours",
    steps: [
      { id: "pronounce", title: "Get a legal pronouncement of death", detail: "If the death happened at home, call hospice (if enrolled), the doctor, or 911. A medical professional must officially pronounce the death." },
      { id: "funeral-home", title: "Contact a funeral home", detail: "Ask whether there is a pre-paid funeral plan or written wishes about burial or cremation." },
      { id: "secure", title: "Secure the home, vehicles, pets, and mail", detail: "Lock the home, care for pets, and keep an eye on mail, which will help identify accounts and bills." },
      { id: "find-docs", title: "Look for a will, trust, or letter of instruction", detail: "Check home files, a safe, a safe-deposit box, or ask their attorney or financial advisor." },
    ],
  },
  {
    id: "first-2-weeks",
    title: "First two weeks",
    steps: [
      { id: "death-certs", title: "Order certified death certificates", detail: "Most families need 10–15. Banks, insurers, and agencies each usually want an original." },
      { id: "notify", title: "Notify Social Security, employer, pension, and life insurers", detail: "Funeral homes often notify Social Security, but confirm. Ask the employer about final pay and benefits." },
      { id: "executor", title: "Identify the executor or successor trustee", detail: "The will names an executor; a trust names a successor trustee. If there is no will, a court appoints an administrator." },
      { id: "attorney", title: "Decide whether you need an attorney", detail: "Real estate, a business, debts larger than assets, no will, or family disagreement are strong signs to talk to a probate attorney." },
    ],
  },
  {
    id: "1-3-months",
    title: "One to three months",
    steps: [
      { id: "probate", title: "Open probate if needed, or administer the trust", detail: "Assets in a trust usually avoid probate. Many states offer a simplified process for small estates." },
      { id: "ein", title: "Get an EIN and open an estate bank account", detail: "The executor gets a tax ID for the estate from the IRS and uses a separate account for estate money." },
      { id: "inventory", title: "Inventory assets and debts", detail: "List accounts, property, vehicles, retirement plans, insurance, and debts. Your state may require notice to creditors." },
      { id: "claims", title: "Claim life insurance and payable-on-death accounts", detail: "These go directly to named beneficiaries and generally do not pass through the will." },
      { id: "close", title: "Close accounts and protect identity", detail: "Cancel cards and subscriptions, handle digital accounts, and ask the credit bureaus to flag the record as deceased." },
    ],
  },
  {
    id: "3-12-months",
    title: "Three to twelve months",
    steps: [
      { id: "taxes", title: "File final tax returns", detail: "A final personal return and possibly estate or trust returns. A CPA familiar with estates is strongly recommended." },
      { id: "pay-debts", title: "Pay valid debts, then distribute assets", detail: "Debts are generally paid from the estate before heirs receive their share. Family members usually are not personally liable." },
      { id: "titles", title: "Transfer titles", detail: "House, vehicles, and investment accounts are retitled to heirs or beneficiaries." },
      { id: "close-estate", title: "Close the estate and keep records", detail: "Keep copies of everything for several years." },
    ],
  },
];

export const PREPARE_JOURNEY: Stage[] = [
  {
    id: "picture",
    title: "Your situation",
    steps: [
      { id: "family", title: "Map your family picture", detail: "Spouse or partner, minor children, blended family, dependents with special needs, and your state of residence." },
      { id: "business", title: "Note any business ownership", detail: "LLCs, partnerships, and corporations need succession planning." },
    ],
  },
  {
    id: "assets",
    title: "What you own",
    steps: [
      { id: "inventory", title: "List your assets", detail: "Home, bank and investment accounts, retirement plans, life insurance, vehicles, business interests, and digital assets." },
      { id: "beneficiaries", title: "Check beneficiary designations", detail: "Retirement accounts, life insurance, and payable-on-death accounts pass by beneficiary form, not by your will. Keep them current." },
    ],
  },
  {
    id: "documents",
    title: "Core documents",
    steps: [
      { id: "will-vs-trust", title: "Understand will vs. trust", detail: "A will goes through probate; a funded revocable living trust usually avoids it and keeps details private. Many people use both." },
      { id: "core-set", title: "Know the core document set", detail: "Will (or pour-over will), revocable trust, durable financial power of attorney, healthcare directive, HIPAA release, and guardian nomination for minor children." },
      { id: "trust-steps", title: "How a trust gets started", detail: "Choose a trustee and successors, an attorney drafts it, you sign it, then you fund it by retitling assets into the trust." },
    ],
  },
  {
    id: "action",
    title: "Take action",
    steps: [
      { id: "attorney", title: "Meet an estate planning attorney", detail: "Bring your asset list, family picture, and questions. Kindred Path can prepare a summary for you." },
      { id: "review", title: "Review every few years or after life events", detail: "Marriage, divorce, a birth, a move, buying a home, or selling a business." },
    ],
  },
];

export const LAWYER_TYPES = [
  { type: "Estate planning attorney", when: "Wills, trusts, powers of attorney, healthcare directives, minor children, blended families." },
  { type: "Probate / estate administration attorney", when: "Real estate in the deceased's name, no will, executor duties, court filings." },
  { type: "Elder law attorney", when: "Long-term care, nursing homes, Medicaid planning, guardianship of a parent." },
  { type: "Trust & estate litigation attorney", when: "Family disputes, contested wills, undue influence, a trustee not acting." },
  { type: "Special needs planning attorney", when: "A dependent on SSI or Medicaid; supplemental needs trusts." },
  { type: "Business succession attorney", when: "Owns an LLC or corporation, partners, buy-sell agreements." },
  { type: "Real estate attorney", when: "Selling or transferring a house, out-of-state property, deeds." },
  { type: "CPA / tax professional", when: "Final income tax return, estate or trust tax returns, inherited retirement accounts." },
];

export function journeyFor(mode: Mode): Stage[] {
  return mode === "navigate" ? NAVIGATE_JOURNEY : PREPARE_JOURNEY;
}

export function journeyAsText(mode: Mode): string {
  return journeyFor(mode)
    .map(
      (s) =>
        `${s.title}:\n` +
        s.steps.map((st) => `- [${st.id}] ${st.title} — ${st.detail}`).join("\n"),
    )
    .join("\n\n");
}
