import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { TrendingUp, ArrowLeft } from "lucide-react";

function getFormattedDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 4);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function TermsConditions() {
  const lastUpdated = getFormattedDate();

  return (
    <div className="min-h-screen bg-[#1a1e1c]">
      <Helmet>
        <title>Terms & Conditions | EntryLab</title>
        <meta name="description" content="EntryLab Terms & Conditions - Read our terms of service, subscription policies, and legal information." />
        <link rel="canonical" href="https://entrylab.io/terms" />
      </Helmet>

      <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="w-8 h-8 bg-[#2bb32a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">EntryLab</span>
          </Link>
          <Link href="/signals" className="flex items-center gap-2 text-[#adb2b1] hover:text-white transition-colors" data-testid="link-back-signals">
            <ArrowLeft className="w-4 h-4" />
            Back to Signals
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
        <p className="text-[#adb2b1] mb-12">Last Updated: {lastUpdated}</p>

        <div className="space-y-10 text-[#c5c9c7]">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By subscribing to EntryLab's services, accessing our private Telegram channels, or using any content provided by EntryLab, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions.
            </p>
            <p className="leading-relaxed mt-3">
              If you do not agree with any part of these Terms, you must not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p className="leading-relaxed">
              You must be 18 years or older and legally permitted to enter contractual agreements in your country of residence.
            </p>
            <p className="leading-relaxed mt-3">
              EntryLab accepts no responsibility for unlawful use by minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Nature of Service – Educational Only</h2>
            <p className="leading-relaxed">
              EntryLab provides educational trading signals and market insights, primarily focused on XAU/USD, delivered through private Telegram channels.
            </p>
            <p className="leading-relaxed mt-4 font-medium text-white">We do not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Provide financial advice</li>
              <li>Manage funds or accounts</li>
              <li>Guarantee profits or accuracy</li>
              <li>Offer regulated investment services</li>
            </ul>
            <p className="leading-relaxed mt-4">
              All information is educational and informational only. You are solely responsible for all trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. No Financial Advice</h2>
            <p className="leading-relaxed">Nothing provided by EntryLab may be interpreted as:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Investment recommendations</li>
              <li>A suggestion to buy or sell any instrument</li>
              <li>Advice tailored to your financial circumstances</li>
            </ul>
            <p className="leading-relaxed mt-4">
              EntryLab and its operator, Squawk Media Ltd, are not regulated financial advisors or brokers. Your trading decisions are made entirely at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscription & Billing</h2>
            
            <h3 className="text-lg font-medium text-white mt-6 mb-3">5.1 Payments</h3>
            <p className="leading-relaxed">
              All subscriptions are processed securely through Stripe on a recurring basis. By subscribing, you authorize EntryLab to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Charge your selected payment method</li>
              <li>Automatically renew your subscription until cancelled</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">5.2 No Refund Policy</h3>
            <p className="leading-relaxed">
              All purchases are strictly non-refundable, including but not limited to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Trading losses</li>
              <li>Failure to access the Telegram channel</li>
              <li>Dissatisfaction with performance</li>
              <li>Forgetting to cancel</li>
              <li>Change of mind</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Digital access is considered "used" once your Telegram access is granted.
            </p>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">5.3 Cancellation</h3>
            <p className="leading-relaxed">
              You may cancel by emailing: <a href="mailto:support@entrylab.io" className="text-[#2bb32a] hover:underline">support@entrylab.io</a>
            </p>
            <p className="leading-relaxed mt-3">
              Cancellations must be sent at least 48 hours prior to your next billing date. You retain access until the end of the current paid period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Telegram Access Restrictions</h2>
            <p className="leading-relaxed">
              EntryLab grants personal, non-transferable access to private Telegram channels.
            </p>
            <p className="leading-relaxed mt-4 font-medium text-white">You may not:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Forward our signals</li>
              <li>Screenshot or share content</li>
              <li>Resell or redistribute any material</li>
              <li>Invite unauthorized users</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">Immediate Termination for Leaks</h3>
            <p className="leading-relaxed">
              If EntryLab detects or suspects leaking, distribution, or sharing of content, we may:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Terminate your access immediately</li>
              <li>Ban you permanently</li>
              <li>Deny any refunds</li>
              <li>Pursue damages for intellectual property violations</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Your subscription constitutes agreement to these enforcement rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All EntryLab content, including signals, analysis, strategies, and materials, is the exclusive property of EntryLab and Squawk Media Ltd. Subscribers receive a limited license to view the content. Unauthorized distribution is prohibited and may result in legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. No Guarantees of Performance</h2>
            <p className="leading-relaxed">EntryLab does not guarantee:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Accuracy of signals</li>
              <li>Profitability</li>
              <li>Consistency of results</li>
              <li>Future performance matching past results</li>
              <li>That signals align with your broker's pricing</li>
              <li>That execution will match recommendations</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Market volatility, latency, spreads, and execution differences may affect outcomes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Full Risk Disclosure</h2>
            <p className="leading-relaxed">
              Forex and commodity trading — including XAU/USD — involves substantial risk, including the potential loss of all invested capital.
            </p>
            <p className="leading-relaxed mt-4">By using EntryLab, you acknowledge that:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Leveraged trading magnifies gains and losses</li>
              <li>Markets can move rapidly and unpredictably</li>
              <li>Stop-loss and risk-mitigation orders may fail</li>
              <li>Technical issues can impact execution</li>
              <li>Emotional trading, overtrading, or poor management may cause losses</li>
              <li>Past performance is not indicative of future results</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Trading is not suitable for all investors. You should not trade money you cannot afford to lose. EntryLab assumes no responsibility for profits or losses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Technology & Third-Party Risks</h2>
            <p className="leading-relaxed">EntryLab is not liable for losses due to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Telegram outages</li>
              <li>Delayed notifications</li>
              <li>Internet or device failures</li>
              <li>Broker execution problems</li>
              <li>Market interruptions</li>
              <li>Software or hardware errors</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Signals may be delayed or inconsistent based on third-party systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Termination by EntryLab</h2>
            <p className="leading-relaxed">
              EntryLab may suspend or terminate your access at any time, with or without notice, for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Suspected content leaking</li>
              <li>Chargebacks or disputes</li>
              <li>Fraudulent or abusive behavior</li>
              <li>Violations of these Terms</li>
              <li>Misuse of the service</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Terminated accounts receive no refunds. EntryLab may pursue legal action in severe cases.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. No Broker Affiliation</h2>
            <p className="leading-relaxed">
              EntryLab has no affiliation with any brokerage. References to brokers are informational only and do not constitute endorsements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted under Irish law, EntryLab and Squawk Media Ltd are not liable for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Trading losses</li>
              <li>Lost profits</li>
              <li>Indirect or consequential damages</li>
              <li>Decisions made based on EntryLab content</li>
              <li>Technical failures</li>
              <li>Data inaccuracies</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Your use of EntryLab is entirely at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms & Conditions are governed exclusively by the laws of Ireland. Any disputes shall be resolved in the Irish courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Amendments</h2>
            <p className="leading-relaxed">
              EntryLab may update or modify these Terms at any time. Changes take effect immediately upon publication on our website. Continued use of the service constitutes acceptance of the updated Terms.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-[#2a2e2c] text-center">
          <p className="text-[#adb2b1] text-sm">
            Questions? Contact us at <a href="mailto:support@entrylab.io" className="text-[#2bb32a] hover:underline">support@entrylab.io</a>
          </p>
        </div>
      </main>
    </div>
  );
}
