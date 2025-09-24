import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using VibeBoost ("Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>
              VibeBoost provides AI-powered image enhancement and generation services. We use advanced artificial intelligence to transform and enhance product images for commercial and personal use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use this Service</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information</li>
              <li>One person or entity may maintain only one account</li>
              <li>You are responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload illegal, harmful, or infringing content</li>
              <li>Upload images containing minors without proper consent</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse engineer or exploit our AI technology</li>
              <li>Resell or redistribute our Service without permission</li>
              <li>Upload malicious code or spam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              <strong>Your Content:</strong> You retain all rights to images you upload. By uploading, you grant us a license to process and store your images to provide the Service.
            </p>
            <p className="mt-4">
              <strong>Generated Images:</strong> You own the AI-generated images created from your uploads. You may use them for commercial purposes.
            </p>
            <p className="mt-4">
              <strong>Our Technology:</strong> VibeBoost's AI technology, software, and branding are our property and protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Payment and Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>All fees are non-refundable except as stated in our Refund Policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Credits do not roll over to the next billing period</li>
              <li>You may cancel your subscription at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted service. We reserve the right to modify or discontinue the Service with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIBEBOOST SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
            </p>
            <p className="mt-4">
              Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Warranty Disclaimer</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee that generated images will meet your specific requirements or be error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Dispute Resolution</h2>
            <p>
              Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to a jury trial.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the United States and the State of Delaware, without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at:
              <br />
              Email: <a href="mailto:legal@vibeboost.com" className="text-primary hover:underline">legal@vibeboost.com</a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;