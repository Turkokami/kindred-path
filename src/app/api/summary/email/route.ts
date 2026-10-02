// Emails a person their summary PDF through Resend. Off until RESEND_API_KEY and SUMMARY_EMAIL_FROM
// (an address on a domain verified in Resend) are set. The address is used once and not stored.

export const runtime = "nodejs";

const MAX_PDF_BYTES = 2_000_000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const configured = () => Boolean(process.env.RESEND_API_KEY && process.env.SUMMARY_EMAIL_FROM);

export async function GET() {
  return json({ enabled: configured() });
}

export async function POST(req: Request) {
  if (!configured()) return json({ error: "not_configured" }, 503);
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ error: "forbidden" }, 403);

  let body: { email?: unknown; pdf?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const pdf = typeof body.pdf === "string" ? body.pdf : "";
  if (body.consent !== true) return json({ error: "consent_required" }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "Please check the email address." }, 400);
  if (!pdf || pdf.length * 0.75 > MAX_PDF_BYTES || !pdf.startsWith("JVBER")) return json({ error: "bad_request" }, 400);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.SUMMARY_EMAIL_FROM,
        to: [email],
        subject: "Your Kindred Path summary",
        text:
          "Here is the personal summary you asked Wren for. It's attached as a PDF.\n\n" +
          "It's general information to help you stay organized, not legal, tax, or financial advice. Please confirm the details with a licensed professional in your state.\n\n" +
          "If you're struggling, you can call or text 988 any time (US).\n\n" +
          "Kindred Path",
        attachments: [{ filename: "kindred-path-summary.pdf", content: pdf }],
      }),
    });
    if (!res.ok) {
      console.error("summary email error", res.status, (await res.text()).slice(0, 300));
      return json({ error: "send_failed" }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error("summary email error", err);
    return json({ error: "send_failed" }, 502);
  }
}
