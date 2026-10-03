import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Privacy — Kindred Path" };

// DRAFT for attorney review. Bracketed items need the owner's details. Keep this in step with the code:
// /api/chat (Anthropic), /api/tts (ElevenLabs), /api/places (Google), /api/summary/email (Resend), localStorage keys.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 3, 2026">
      <p>
        Kindred Path is operated by [Company legal name] (&quot;we&quot;). This policy explains what happens to the
        information you share while using Kindred Path and its AI guide, Wren. We wrote it in plain language because
        you may be reading it during a hard time.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You don&apos;t need an account, and we don&apos;t ask for your name.</li>
        <li>We don&apos;t keep your conversations with Wren on our servers.</li>
        <li>To answer you, your messages are sent to the AI and voice providers listed below.</li>
        <li>Please don&apos;t share Social Security numbers, account numbers, or passwords. We try to remove them automatically before anything reaches the AI.</li>
        <li>We don&apos;t sell your information or use it for advertising.</li>
      </ul>

      <h2>What you share and where it goes</h2>
      <ul>
        <li>
          <strong>Your conversation with Wren.</strong> Each message, along with the recent conversation, is sent to
          Anthropic, which provides the Claude AI model that writes Wren&apos;s replies. Before sending, we replace
          anything that looks like a Social Security number, account or card number, or a written-out password with a
          placeholder.
        </li>
        <li>
          <strong>Wren&apos;s voice.</strong> When voice is on, the text of Wren&apos;s replies (not your messages) is
          sent to ElevenLabs to turn it into speech. If you turn voice off, nothing is sent to ElevenLabs.
        </li>
        <li>
          <strong>Talking to Wren with the microphone.</strong> Speech-to-text is handled by your own browser. Depending
          on your browser, it may send audio to its maker (for example Google or Apple) to transcribe it.
        </li>
        <li>
          <strong>The optional intake questions.</strong> Your answers (such as your state and whether there is a will)
          are kept on your device and sent along with your messages so Wren can personalize her help.
        </li>
        <li>
          <strong>Your summary PDF.</strong> To build it, your conversation is sent to Anthropic once more. The PDF is
          created in your browser and is not stored by us. If you choose to email it to yourself, your email address and
          the PDF are sent through our email provider, Resend, only to deliver that message. We don&apos;t keep your
          address.
        </li>
        <li>
          <strong>Finding a professional.</strong> The type of help and the location you type are sent to Google to find
          nearby listings.
        </li>
      </ul>
      <p>
        Each provider handles data under its own terms and privacy policy, which may include keeping it for a limited
        time for safety and abuse monitoring. [List current provider data-retention terms after attorney review.]
      </p>

      <h2>What stays on your device</h2>
      <p>
        Your checklist progress, your intake answers, and your voice choice are saved in your browser&apos;s local
        storage so they&apos;re there when you come back. They don&apos;t leave your device except as described above.
        Clearing your browser data removes them.
      </p>

      <h2>What we collect automatically</h2>
      <ul>
        <li>
          <strong>Hosting logs.</strong> Our host, Vercel, records basic technical information such as IP address, browser
          type, and the pages and services requested, to run and secure the site. Error logs may include technical
          details of a failed request but are not used to store conversations.
        </li>
        <li>
          <strong>Analytics.</strong> We use Vercel Web Analytics to count page views. It doesn&apos;t use cookies.
        </li>
        <li>
          <strong>Bot protection.</strong> We use Vercel BotID, which runs an invisible check in your browser to keep
          automated abuse away from the AI services.
        </li>
      </ul>

      <h2>Children</h2>
      <p>Kindred Path is meant for adults. It is not directed to children under 13, and we don&apos;t knowingly collect information from them.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Skip the intake questions, turn voice off, or type instead of speaking.</li>
        <li>Clear your browser data to remove your saved checklist and answers.</li>
        <li>Contact us at [contact email] with any privacy question or request.</li>
      </ul>
      <p>
        Depending on where you live, you may have additional rights under state privacy laws. [Attorney to confirm
        which state laws apply and add required disclosures.]
      </p>

      <h2>Changes</h2>
      <p>If we change how we handle information, we&apos;ll update this page and the date at the top.</p>
    </LegalPage>
  );
}
