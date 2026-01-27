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
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">DIP – Terms of Service</h1>
        <p className="text-gray-600 mb-8">
          <strong>Effective Date:</strong> January 15, 2026 | <strong>Last Updated:</strong> January 15, 2026
        </p>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-bold text-red-800 mb-2">IMPORTANT LEGAL NOTICE – PLEASE READ CAREFULLY</h2>
            <p className="text-red-700 mb-0">
              By downloading, accessing, registering for, or using the DIP application ("App"), you agree to be bound by these Terms of Service ("Terms"). These Terms constitute a legally binding agreement between you ("User," "Member," "you," or "your") and DIP ("Company," "we," "us," or "our").
            </p>
            <p className="text-red-700 font-bold mt-2 mb-0">IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE APP.</p>
          </div>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 1: Eligibility and Account Requirements</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.1 Age Requirement</h3>
            <p className="mb-4">You must be at least 18 years of age to use the DIP App. By using the App, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into this agreement.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.2 Account Registration</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must immediately notify us of any unauthorized use of your account</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">1.3 Account Security</h3>
            <p className="mb-4">You are solely responsible for safeguarding your password and any authentication methods (including biometric authentication such as Face ID or Touch ID). DIP is not liable for any loss or damage arising from your failure to protect your account credentials.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 2: Nature of Service (Non-Insurance Disclaimer)</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-bold text-yellow-800 mb-2">2.1 DIP IS NOT INSURANCE</h3>
              <p className="text-yellow-800 mb-2">DIP is a digital membership platform and vehicle management tool. DIP IS NOT AN INSURANCE COMPANY, INSURANCE BROKER, OR INSURANCE AGENT.</p>
              <ul className="list-disc pl-6 text-yellow-800">
                <li>DIP does NOT sell, provide, or administer insurance of any kind</li>
                <li>DIP does NOT provide coverage, reimbursement, indemnification, or financial protection</li>
                <li>DIP membership is NOT a substitute for legally required automobile insurance</li>
                <li>DIP does NOT guarantee any financial outcome or benefit</li>
            </ul>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 No Financial Coverage</h3>
            <p className="mb-2">DIP does not and will not:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Pay for vehicle repairs or any other expenses</li>
              <li>Reimburse any costs, losses, or damages</li>
              <li>Cover deductibles, claims, or any insurance-related expenses</li>
              <li>Guarantee discounts, coupons, or promotional offers</li>
              <li>Assume financial responsibility for any incident, accident, or repair</li>
              <li>Provide any form of warranty or guarantee</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 3: Membership and Subscription</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Membership Features</h3>
            <p className="mb-2">DIP membership may include access to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Digital vehicle wallet and document storage tools</li>
              <li>Incident and accident documentation features</li>
              <li>Referral and coordination tools for independent third-party providers</li>
              <li>Promotional coupons offered by participating DIP-approved collision centers</li>
              <li>Emergency assistance coordination tools</li>
              <li>Vehicle marketplace for buying and selling vehicles</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Membership Fees and Billing</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Membership fees are billed on a recurring basis as disclosed at sign-up</li>
              <li>All payments are processed through Stripe, a third-party payment processor</li>
              <li>By subscribing, you authorize us to charge your payment method on a recurring basis</li>
              <li>Membership fees are NON-REFUNDABLE except where required by applicable law</li>
              <li>Failure to pay may result in suspension or termination of membership</li>
              <li>We reserve the right to change pricing with 30 days' notice</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.3 Automatic Renewal</h3>
            <p className="mb-4">Your membership will automatically renew at the end of each billing period unless you cancel before the renewal date. You may cancel your membership at any time through your account settings.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">3.4 Cancellation</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You may cancel your membership at any time</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>No refunds will be provided for partial billing periods</li>
              <li>Upon cancellation, you will lose access to membership features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 4: Coupon Program</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 Coupon Eligibility</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Coupons are available ONLY to active, paid DIP members</li>
              <li>Coupons are valid ONLY at DIP-approved collision center locations</li>
              <li>Coupons CANNOT be used at non-DIP-approved service providers</li>
              <li>Members who choose non-DIP providers will NOT receive coupons, regardless of membership status</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Coupon Limitations</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Coupon values, availability, and terms are determined by participating providers</li>
              <li>DIP does not guarantee coupon availability or acceptance</li>
              <li>Coupons may have expiration dates, usage limits, and other restrictions</li>
              <li>DIP reserves the right to modify or discontinue the coupon program at any time</li>
              <li>Coupons have no cash value and cannot be exchanged for cash</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 5: Digital Wallet and Document Storage</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Document Storage</h3>
            <p className="mb-2">DIP allows you to store digital copies of:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Driver's license</li>
              <li>Vehicle registration</li>
              <li>Insurance cards</li>
              <li>Vehicle photos</li>
              <li>Other vehicle-related documents</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 User Responsibility</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>You are solely responsible for the accuracy and legality of documents you upload</li>
              <li>You must only upload documents that you own or have permission to upload</li>
              <li>Digital documents stored in DIP are for your convenience only</li>
              <li>DIP-stored documents may not be accepted by law enforcement or government agencies</li>
              <li>You must maintain original physical documents as required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 6: Marketplace</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Marketplace Overview</h3>
            <p className="mb-4">DIP provides a peer-to-peer marketplace for users to buy and sell vehicles and vehicle-related items. DIP is a platform only and is NOT a party to any transaction between buyers and sellers.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Seller Responsibilities</h3>
            <p className="mb-2">Sellers represent and warrant that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>They have legal ownership or authority to sell the listed item</li>
              <li>All listing information is accurate, complete, and not misleading</li>
              <li>The vehicle or item is free from undisclosed liens, encumbrances, or defects</li>
              <li>They will comply with all applicable laws regarding vehicle sales</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">6.3 No Transaction Guarantee</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>DIP does NOT guarantee any marketplace transaction</li>
              <li>DIP does NOT verify vehicle titles, ownership, or condition</li>
              <li>DIP does NOT mediate disputes between buyers and sellers</li>
              <li>DIP does NOT provide buyer or seller protection</li>
              <li>DIP is NOT responsible for fraud, misrepresentation, or failed transactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 7: Third-Party Service Providers</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Independent Providers</h3>
            <p className="mb-2">All collision centers, repair facilities, towing companies, attorneys, and other service providers accessible through DIP are INDEPENDENT THIRD PARTIES. DIP does not:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Employ, supervise, or control these providers</li>
              <li>Guarantee their services, quality, or availability</li>
              <li>Assume responsibility for their actions or omissions</li>
            </ul>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Payment Processing (Stripe)</h3>
            <p className="mb-2">DIP uses Stripe, Inc. as our payment processor. By using DIP:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You agree to Stripe's Terms of Service and Privacy Policy</li>
              <li>You authorize Stripe to process your payment information</li>
              <li>DIP does not store your full credit card numbers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 8: Limitation of Liability</h2>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-semibold mb-2">DISCLAIMER OF WARRANTIES</p>
              <p className="mb-4">THE DIP APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
              
              <p className="font-semibold mb-2">LIMITATION OF DAMAGES</p>
              <p className="mb-0">TO THE FULLEST EXTENT PERMITTED BY LAW, DIP SHALL NOT BE LIABLE FOR: Indirect, incidental, special, consequential, or punitive damages; Loss of profits, revenue, data, or business opportunities; Damages arising from third-party conduct or marketplace transactions; Any amount exceeding the total fees paid by you in the preceding 12 months.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 9: Dispute Resolution and Arbitration</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Informal Resolution</h3>
            <p className="mb-4">Before filing any claim, you agree to contact us at support@dipmembers.com to attempt informal resolution for at least 30 days.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 Binding Arbitration</h3>
            <p className="mb-4">Any dispute not resolved informally shall be resolved by BINDING ARBITRATION administered by JAMS in Los Angeles County, California, under JAMS Streamlined Arbitration Rules.</p>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">9.3 Class Action Waiver</h3>
            <p className="mb-4 font-semibold">YOU AGREE TO RESOLVE DISPUTES ON AN INDIVIDUAL BASIS ONLY. YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 10: Governing Law</h2>
            <p className="mb-4">These Terms are governed by the laws of the State of California, without regard to conflict of law principles.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Section 11: Contact Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-0">
                <strong>DIP Member Support</strong><br />
                📧 Email: support@dipmembers.com
              </p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-center text-gray-600">
              By using DIP, you acknowledge that you have read, understood, and agree to these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
