import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> January 1, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("Member," "you," or "your") and DIP, Inc. ("DIP," "we," "us," or "our"), a California corporation. By accessing or using our services, you agree to be bound by these Terms.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> DIP is a membership program, not an insurance company. We do not provide insurance coverage, but rather membership-based services to assist with vehicle-related incidents and provide member benefits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Membership Services</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Service Description</h3>
            <p className="text-gray-700 mb-4">
              DIP provides membership-based services including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Accident support and assistance services</li>
              <li>Vehicle membership programs</li>
              <li>Emergency support services</li>
              <li>Member benefits and discounts</li>
              <li>Claims processing assistance</li>
              <li>24/7 member support</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Membership Requirements</h3>
            <p className="text-gray-700 mb-4">
              To become a member, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain valid vehicle registration and insurance</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Pay all required membership fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Terms</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Membership Fees</h3>
            <p className="text-gray-700 mb-4">
              Membership fees are charged in advance and are non-refundable except as required by law. All fees are subject to applicable taxes and may be changed with 30 days' notice.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              We use third-party payment processors to handle payments. By providing payment information, you authorize us to charge your payment method for all applicable fees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Member Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              As a member, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Use our services only for lawful purposes</li>
              <li>Not engage in fraudulent or deceptive practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Limitations</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 No Insurance Coverage</h3>
            <p className="text-gray-700 mb-4">
              <strong>DIP is not an insurance company and does not provide insurance coverage.</strong> Our services are membership-based assistance programs that do not replace or substitute for proper insurance coverage.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Service Availability</h3>
            <p className="text-gray-700 mb-4">
              While we strive to provide continuous service, we do not guarantee uninterrupted access to our services. We reserve the right to modify, suspend, or discontinue services at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content, trademarks, and intellectual property rights in our services are owned by DIP or our licensors. You may not use our intellectual property without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DIP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING FROM OR RELATING TO YOUR USE OF OUR SERVICES.
            </p>
            <p className="text-gray-700 mb-4">
              Our total liability to you for any claims arising from these Terms or your use of our services shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless DIP and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of our services or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">10.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your membership at any time by contacting us or through your account settings. Termination does not entitle you to a refund of prepaid fees.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">10.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your membership immediately if you violate these Terms or engage in fraudulent or illegal activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">11.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">11.2 Arbitration</h3>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. General Provisions</h2>
            <h3 className="text-xl font-medium text-gray-900 mb-3">12.1 Entire Agreement</h3>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and DIP regarding your use of our services.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">12.2 Modifications</h3>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. We will notify you of material changes by email or through our services. Your continued use of our services after such modifications constitutes acceptance of the updated Terms.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">12.3 Severability</h3>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>DIP, Inc.</strong><br />
                Email: legal@dipapp.com<br />
                Phone: 1-800-DIP-HELP<br />
                Address: [Company Address]
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
