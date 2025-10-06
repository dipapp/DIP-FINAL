import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> January 1, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              DIP, Inc. ("DIP," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our membership services.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Important:</strong> DIP is a membership program, not an insurance company. We collect and process personal information to provide membership services and member benefits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect the following types of personal information:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Identity Information:</strong> Name, date of birth, driver's license number and image, Social Security Number (for verification purposes only)</li>
              <li><strong>Contact Information:</strong> Email address, phone number, mailing address</li>
              <li><strong>Vehicle Information:</strong> Vehicle Identification Number (VIN), license plate number, vehicle photos, registration documents</li>
              <li><strong>Insurance Information:</strong> Insurance company name, policy number, insurance card images</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by third-party processors)</li>
              <li><strong>Usage Information:</strong> How you interact with our services, device information, IP address</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Sensitive Information</h3>
            <p className="text-gray-700 mb-4">
              We may collect sensitive personal information including driver's license images, insurance documents, and vehicle photos. This information is collected solely for the purpose of providing our membership services and is protected with enhanced security measures.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your personal information for the following purposes:</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To create and maintain your membership account</li>
              <li>To verify your identity and eligibility for services</li>
              <li>To process membership applications and renewals</li>
              <li>To provide accident support and assistance services</li>
              <li>To process claims and service requests</li>
              <li>To communicate with you about your membership</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Business Operations</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To process payments and billing</li>
              <li>To prevent fraud and ensure security</li>
              <li>To improve our services and develop new features</li>
              <li>To comply with legal and regulatory requirements</li>
              <li>To conduct analytics and research (in anonymized form)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Marketing and Communications</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>To send you important updates about your membership</li>
              <li>To provide customer support</li>
              <li>To send marketing communications (only with your consent)</li>
              <li>To notify you of new services and benefits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We may share your information with trusted third-party service providers who assist us in operating our business, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Payment processors for billing and payment processing</li>
              <li>Cloud storage providers for secure data storage</li>
              <li>Communication services for sending notifications</li>
              <li>Analytics providers for service improvement</li>
              <li>Customer support platforms</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information when required by law or to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Comply with legal processes or government requests</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or illegal activities</li>
              <li>Respond to emergency situations</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, subject to the same privacy protections.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement comprehensive security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard encryption protocols</li>
              <li><strong>Access Controls:</strong> Strict access controls limit who can view your information</li>
              <li><strong>Secure Infrastructure:</strong> We use secure cloud infrastructure with regular security audits</li>
              <li><strong>Employee Training:</strong> All employees receive privacy and security training</li>
              <li><strong>Regular Monitoring:</strong> We continuously monitor our systems for security threats</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Retained for the duration of your membership plus 7 years</li>
              <li><strong>Identity Documents:</strong> Retained for 2 years after account closure</li>
              <li><strong>Vehicle Information:</strong> Retained for 1 year after vehicle removal from account</li>
              <li><strong>Payment Information:</strong> Retained as required by financial regulations</li>
              <li><strong>Communication Records:</strong> Retained for 3 years for customer service purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Access and Correction</h3>
            <p className="text-gray-700 mb-4">
              You have the right to access, update, or correct your personal information. You can do this through your account settings or by contacting us.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Data Portability</h3>
            <p className="text-gray-700 mb-4">
              You can request a copy of your personal information in a structured, machine-readable format.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">7.3 Deletion Rights</h3>
            <p className="text-gray-700 mb-4">
              You can request deletion of your personal information, subject to legal and business requirements.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">7.4 Marketing Communications</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of marketing communications at any time by clicking the unsubscribe link in emails or contacting us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. California Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Right to know what personal information we collect and how we use it</li>
              <li>Right to delete personal information</li>
              <li>Right to opt out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your personal information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our services. Your continued use of our services after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>DIP, Inc.</strong><br />
                Privacy Officer<br />
                Email: privacy@dipapp.com<br />
                Phone: 1-800-DIP-HELP<br />
                Address: [Company Address]
              </p>
            </div>
            <p className="text-gray-700 mt-4">
              For privacy-related requests, please include "Privacy Request" in the subject line and provide your full name and membership ID.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
