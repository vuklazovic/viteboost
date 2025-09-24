import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. 14-Day Money-Back Guarantee</h2>
            <p>
              We offer a 14-day money-back guarantee for all new subscriptions. If you're not satisfied with VibeBoost within the first 14 days of your initial subscription, you can request a full refund.
            </p>
            <p className="mt-4">
              <strong>Important:</strong> This guarantee applies only to your first subscription period and does not apply to subscription renewals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility for Refunds</h2>
            <p>Refunds are available under the following conditions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request made within 14 days of your initial subscription purchase</li>
              <li>First-time subscribers only (one refund per customer)</li>
              <li>You have not violated our Terms of Service</li>
              <li>You have not used more than 50% of your monthly credits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Non-Refundable Items</h2>
            <p>The following are NOT eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription renewals (charges after the initial 14-day period)</li>
              <li>One-time credit purchases</li>
              <li>Enterprise or custom plans (separate terms apply)</li>
              <li>Accounts terminated for Terms of Service violations</li>
              <li>Charges more than 14 days old</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. How to Request a Refund</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Email us at <a href="mailto:support@vibeboost.com" className="text-primary hover:underline">support@vibeboost.com</a></li>
              <li>Include your account email and reason for refund</li>
              <li>We will process your request within 3-5 business days</li>
              <li>Refunds are issued to the original payment method</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Refund Processing Time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund approval: 3-5 business days</li>
              <li>Credit card refunds: 5-10 business days</li>
              <li>PayPal refunds: 3-5 business days</li>
              <li>Bank transfers may take longer depending on your financial institution</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Subscription Cancellations</h2>
            <p>
              You can cancel your subscription at any time from your account settings. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain access until the end of your billing period</li>
              <li>No refund is provided for the remaining time</li>
              <li>Unused credits expire at the end of the period</li>
              <li>You will not be charged for subsequent periods</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Chargebacks</h2>
            <p>
              If you file a chargeback or payment dispute with your bank instead of contacting us, your account will be immediately suspended pending resolution. Please contact us first to resolve any billing issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Technical Issues</h2>
            <p>
              If you experience technical issues preventing you from using the service, please contact support before requesting a refund. We will make every effort to resolve technical problems promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Fair Use Policy</h2>
            <p>
              We reserve the right to deny refunds if we detect abuse of our refund policy, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Multiple accounts requesting refunds</li>
              <li>Excessive credit usage before refund request</li>
              <li>Pattern of subscription and refund cycling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Special Circumstances</h2>
            <p>
              We understand that exceptional circumstances may arise. If you believe you deserve a refund outside of our standard policy, please contact us at <a href="mailto:support@vibeboost.com" className="text-primary hover:underline">support@vibeboost.com</a>. We review requests on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
            <p>
              For refund requests or questions about this policy:
              <br />
              Email: <a href="mailto:support@vibeboost.com" className="text-primary hover:underline">support@vibeboost.com</a>
              <br />
              We aim to respond within 24 hours during business days.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;