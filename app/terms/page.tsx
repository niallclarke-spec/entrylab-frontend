import type { Metadata } from "next";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "EntryLab terms of service, disclaimer, and privacy policy.",
  openGraph: { title: "Terms & Conditions | EntryLab", description: "EntryLab terms of service, disclaimer, and privacy policy.", url: `${SITE_URL}/terms` },
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#111827" }}>Terms & Conditions</h1>
        <div className="rounded-xl p-6 md:p-10 prose max-w-none" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2>Disclaimer</h2>
          <p>EntryLab provides information for educational purposes only. Trading forex and CFDs carries a high level of risk and may not be suitable for all investors. You should consider whether you can afford to take the high risk of losing your money.</p>
          <p>The content on this site does not constitute financial advice. Always do your own research and consult a qualified financial advisor before making trading decisions.</p>

          <h2>Affiliate Disclosure</h2>
          <p>EntryLab may receive compensation from brokers and prop firms featured on this site. This does not influence our reviews or ratings. We maintain editorial independence regardless of commercial relationships.</p>

          <h2>Privacy</h2>
          <p>We collect minimal personal data. Email addresses provided for newsletters are stored securely and never shared with third parties. We use analytics cookies to improve the site experience.</p>

          <h2>Content Accuracy</h2>
          <p>We strive to keep all broker and prop firm information accurate and up to date. However, terms and conditions change frequently. Always verify details directly with the broker or prop firm before opening an account.</p>

          <h2>Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:support@entrylab.io">support@entrylab.io</a>.</p>
        </div>
      </div>
    </section>
  );
}
