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
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">DIP – Privacy Policy</h1>
        <p className="text-gray-600 mb-8">
          <strong>Effective Date:</strong> January 15, 2026 | <strong>Last Updated:</strong> January 15, 2026
        </p>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="text-lg mb-8">
            This Privacy Policy describes how DIP ("Company," "we," "us," or "our") collects, uses, discloses, and protects your personal information.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 1: Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
              <li><strong>Profile Information:</strong> Profile photo, preferences</li>
              <li><strong>Identity Documents:</strong> Driver's license images</li>
              <li><strong>Vehicle Information:</strong> VIN, make, model, year, license plate, photos</li>
              <li><strong>Insurance Documents:</strong> Insurance card images</li>
              <li><strong>Registration Documents:</strong> Vehicle registration images</li>
              <li><strong>Payment Information:</strong> Payment method details (processed by Stripe)</li>
              <li><strong>Marketplace Content:</strong> Listings, descriptions, photos, messages</li>
              <li><strong>Communications:</strong> Emails, support requests, feedback</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, unique identifiers</li>
              <li><strong>Usage Data:</strong> App interactions, features used, timestamps</li>
              <li><strong>Log Data:</strong> IP address, access times, error reports</li>
              <li><strong>Push Notification Tokens:</strong> For sending notifications</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Authentication Providers:</strong> Apple, Google sign-in data</li>
              <li><strong>Payment Processor:</strong> Transaction confirmations from Stripe</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.4 Biometric Information</h3>
            <p className="mb-4">If you enable Face ID or Touch ID, biometric data is processed locally on your device by Apple. DIP does not receive, store, or have access to your biometric data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 2: How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Create and manage your account</li>
              <li>Process membership payments and subscriptions</li>
              <li>Provide digital wallet and document storage features</li>
              <li>Facilitate marketplace listings and transactions</li>
              <li>Enable communication between marketplace users</li>
              <li>Process coupon requests and coordinate with service providers</li>
              <li>Send service-related communications and notifications</li>
              <li>Coordinate emergency assistance requests</li>
              <li>Verify identity and prevent fraud</li>
              <li>Improve and develop the App</li>
              <li>Comply with legal obligations</li>
              <li>Enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 3: How We Share Your Information</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 With Your Consent</h3>
            <p className="mb-4">We share information when you direct us to, such as contacting a service provider.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Service Providers</h3>
            <p className="mb-2">We share information with vendors who help us operate the App:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Stripe (payment processing)</li>
              <li>Google/Firebase (data storage, authentication)</li>
              <li>Email service providers (transactional emails)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Collision Centers and Service Providers</h3>
            <p className="mb-4">When you request a coupon or service, we share relevant information with the participating provider.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Marketplace Users</h3>
            <p className="mb-4">Your public profile and listing information are visible to other users. Messages are shared with the recipient.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.5 Legal Requirements</h3>
            <p className="mb-2">We may disclose information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>To comply with legal process</li>
              <li>To respond to lawful requests from authorities</li>
              <li>To protect our rights, safety, or property</li>
              <li>To investigate fraud or security issues</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-bold text-green-800 mb-2">3.6 No Sale of Personal Information</h3>
              <p className="text-green-800 mb-0 font-semibold">WE DO NOT SELL YOUR PERSONAL INFORMATION.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 4: Data Security</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Security Measures</h3>
            <p className="mb-2">We implement reasonable security measures including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication systems</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 No Guarantee</h3>
            <p className="mb-4">No system is 100% secure. We cannot guarantee absolute security of your data.</p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">4.3 Your Responsibility</h3>
            <p className="mb-4">You are responsible for maintaining the security of your account credentials and device.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 5: Data Retention</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Active Accounts</h3>
            <p className="mb-4">We retain your information while your account is active.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Retention Periods</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account data:</strong> Duration of account plus 3 years</li>
              <li><strong>Driver's license images:</strong> 2 years from upload</li>
              <li><strong>Vehicle registration:</strong> 2 years from upload</li>
              <li><strong>Insurance cards:</strong> 1 year from upload</li>
              <li><strong>Vehicle photos:</strong> 1 year from upload</li>
              <li><strong>Marketplace listings:</strong> 1 year after sale or removal</li>
              <li><strong>Messages:</strong> 2 years</li>
              <li><strong>Transaction records:</strong> 7 years (legal requirement)</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.3 Account Deletion</h3>
            <p className="mb-2">Upon account deletion request:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Most data deleted within 30 days</li>
              <li>Some data retained for legal compliance or fraud prevention</li>
              <li>Aggregated/anonymized data may be retained indefinitely</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 6: Your Privacy Rights</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Access and Portability</h3>
            <p className="mb-4">You may request a copy of your personal information.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Correction</h3>
            <p className="mb-4">You may request correction of inaccurate information.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 Deletion</h3>
            <p className="mb-4">You may request deletion of your personal information, subject to legal requirements.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.4 Opt-Out of Marketing</h3>
            <p className="mb-4">You may opt out of marketing communications via account settings.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.5 Exercising Your Rights</h3>
            <p className="mb-4">To exercise your rights, contact support@dipmembers.com.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 7: California Privacy Rights (CCPA/CPRA)</h2>
            <p className="mb-4">If you are a California resident, you have additional rights:</p>
            
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Right to Know:</strong> You may request information about the categories and specific pieces of personal information we collect.</li>
              <li><strong>Right to Delete:</strong> You may request deletion of your personal information.</li>
              <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
              <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the sale or sharing of personal information. DIP does not sell personal information.</li>
              <li><strong>Right to Limit:</strong> You may limit the use of sensitive personal information.</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 8: Data Breach Notification</h2>
            <p className="mb-2">In the event of a data breach affecting your personal information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>We will notify affected users within 72 hours when feasible</li>
              <li>Notification will include the nature of the breach and affected data</li>
              <li>We will provide guidance on protective steps you can take</li>
              <li>We will notify relevant authorities as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 9: Children's Privacy</h2>
            <p className="mb-4">DIP is not intended for users under 18. We do not knowingly collect information from minors. If we learn we have collected information from a minor, we will delete it promptly.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 10: International Users</h2>
            <p className="mb-4">DIP is operated in the United States. If you access the App from outside the US, your information will be transferred to and processed in the US.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 11: Changes to This Policy</h2>
            <p className="mb-4">We may update this Privacy Policy periodically. Material changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 12: Contact Us</h2>
            <p className="mb-4">For questions or to exercise your rights:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-0">
                <strong>DIP Member Support</strong><br />
                📧 Email: support@dipmembers.com
              </p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-center text-gray-600">
              By using DIP, you acknowledge that you have read, understood, and agree to this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
