'use client';
import { useEffect, useState } from 'react';
import { subscribeMyProfile, updateMyProfile } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

// Info Modal Component
function InfoModal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showAbout, setShowAbout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const unsub = subscribeMyProfile((p) => {
      setProfile(p);
      setFirstName(p?.firstName || '');
      setLastName(p?.lastName || '');
      setPhone(p?.phoneNumber || '');
      setEmail(p?.email || '');
    });
    return () => { try { (unsub as any)?.(); } catch {} };
  }, []);

  async function save() {
    setSaving(true);
    await updateMyProfile({ firstName, lastName, phoneNumber: phone, email });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
          <p className="text-gray-600">Update your personal information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number" 
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={save} 
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>

      {/* App Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App</h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">About DIP</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setShowSupport(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">Support</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setShowTerms(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">Terms & Privacy</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* About DIP Modal */}
      <InfoModal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About dip">
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            dip is a digital auto wallet and membership platform.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            dip helps drivers organize vehicle information, document incidents, and navigate next steps using simple digital tools — all in one place.
          </p>

          <p className="text-gray-700 leading-relaxed">
            dip is also a car marketplace that connects you with buyers and sellers.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            dip does not provide insurance, roadside assistance, towing services, or motor club benefits.
          </p>
          
          <div className="mt-4">
            <p className="font-semibold text-gray-900 mb-3">With dip, you can:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Securely store your driver&apos;s license, vehicle registration, and insurance information</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Document vehicle incidents in real time using guided tools</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use coordination features to connect with independent third-party service providers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Access discounts or promotional offers from participating, independent repair facilities</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Buy and sell vehicles, parts, and accessories through our marketplace</span>
              </li>
            </ul>
          </div>
          
          <p className="text-gray-700 leading-relaxed mt-4">
            All services accessed through dip are provided by independent third-party providers. Selection of any service provider is entirely at the member&apos;s discretion.
          </p>
          
          <p className="text-gray-600 text-sm mt-4">
            dip is not an insurance company and does not provide coverage, reimbursement, or guaranteed services.
          </p>
        </div>
      </InfoModal>

      {/* Support Modal */}
      <InfoModal isOpen={showSupport} onClose={() => setShowSupport(false)} title="Support">
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Have questions or need assistance? Our support team is here to help you.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href="mailto:support@dipmembers.com" className="text-blue-600 font-medium hover:underline">
                    support@dipmembers.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">When Contacting Support</h4>
            <p className="text-gray-700 text-sm">
              Please include your full name and any relevant details such as vehicle information or claim reference numbers. This helps us assist you more quickly.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Response Time</h4>
            <p className="text-gray-700 text-sm">
              We typically respond to all inquiries within 24-48 business hours. For urgent matters related to active claims, please include &quot;URGENT&quot; in your email subject line.
            </p>
          </div>
        </div>
      </InfoModal>

      {/* Terms & Privacy Modal */}
      <InfoModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms & Privacy">
        <div className="space-y-6 text-sm text-gray-700">
          {/* TERMS OF SERVICE */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">DIP – Terms of Service</h3>
            <p className="text-gray-600 text-xs mb-4">
              <strong>Effective Date:</strong> January 15, 2026 | <strong>Last Updated:</strong> January 15, 2026
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <h4 className="font-bold text-red-800 mb-1 text-sm">IMPORTANT LEGAL NOTICE</h4>
              <p className="text-red-700 text-xs leading-relaxed">
                By downloading, accessing, registering for, or using the DIP application (&quot;App&quot;), you agree to be bound by these Terms of Service. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE APP.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 1: Eligibility and Account Requirements</h4>
                <p className="text-xs leading-relaxed mb-2">You must be at least 18 years of age to use the DIP App. You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-bold text-yellow-800 mb-1 text-sm">Section 2: DIP IS NOT INSURANCE</h4>
                <p className="text-yellow-800 text-xs leading-relaxed mb-2">DIP is a digital membership platform and vehicle management tool. DIP IS NOT AN INSURANCE COMPANY, INSURANCE BROKER, OR INSURANCE AGENT.</p>
                <ul className="list-disc pl-4 text-yellow-800 text-xs space-y-1">
                  <li>DIP does NOT sell, provide, or administer insurance of any kind</li>
                  <li>DIP does NOT provide coverage, reimbursement, indemnification, or financial protection</li>
                  <li>DIP membership is NOT a substitute for legally required automobile insurance</li>
                  <li>DIP does NOT pay for vehicle repairs or reimburse any costs</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 3: Membership and Subscription</h4>
                <p className="text-xs leading-relaxed mb-2">DIP membership may include access to:</p>
                <ul className="list-disc pl-4 text-xs space-y-1 mb-2">
                  <li>Digital vehicle wallet and document storage tools</li>
                  <li>Incident and accident documentation features</li>
                  <li>Referral and coordination tools for independent third-party providers</li>
                  <li>Promotional coupons offered by participating DIP-approved collision centers</li>
                  <li>Vehicle marketplace for buying and selling vehicles</li>
                </ul>
                <p className="text-xs leading-relaxed">Membership fees are billed on a recurring basis and are NON-REFUNDABLE except where required by applicable law. Your membership will automatically renew unless you cancel before the renewal date.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 4: Coupon Program</h4>
                <p className="text-xs leading-relaxed">Coupons are available ONLY to active, paid DIP members and are valid ONLY at DIP-approved collision center locations. Coupon values, availability, and terms are determined by participating providers. DIP does not guarantee coupon availability or acceptance.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 5: Digital Wallet and Document Storage</h4>
                <p className="text-xs leading-relaxed">DIP allows you to store digital copies of driver&apos;s license, vehicle registration, insurance cards, and vehicle photos. You are solely responsible for the accuracy and legality of documents you upload. DIP-stored documents may not be accepted by law enforcement or government agencies.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 6: Marketplace</h4>
                <p className="text-xs leading-relaxed">DIP provides a peer-to-peer marketplace for users to buy and sell vehicles. DIP is a platform only and is NOT a party to any transaction. DIP does NOT guarantee any marketplace transaction, verify vehicle titles, or mediate disputes between buyers and sellers.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 7: Third-Party Service Providers</h4>
                <p className="text-xs leading-relaxed">All collision centers, repair facilities, towing companies, and other service providers accessible through DIP are INDEPENDENT THIRD PARTIES. DIP does not employ, supervise, control, or guarantee their services.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 8: Limitation of Liability</h4>
                <p className="text-xs leading-relaxed">THE DIP APP IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, DIP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 9: Dispute Resolution</h4>
                <p className="text-xs leading-relaxed">Any dispute not resolved informally shall be resolved by BINDING ARBITRATION in Los Angeles County, California. YOU AGREE TO RESOLVE DISPUTES ON AN INDIVIDUAL BASIS ONLY AND WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 10: Governing Law</h4>
                <p className="text-xs leading-relaxed">These Terms are governed by the laws of the State of California.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6">
            {/* PRIVACY POLICY */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">DIP – Privacy Policy</h3>
            <p className="text-gray-600 text-xs mb-4">
              <strong>Effective Date:</strong> January 15, 2026 | <strong>Last Updated:</strong> January 15, 2026
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 1: Information We Collect</h4>
                <p className="text-xs leading-relaxed mb-2"><strong>Information You Provide:</strong></p>
                <ul className="list-disc pl-4 text-xs space-y-1 mb-2">
                  <li>Account Information: Name, email address, phone number, password</li>
                  <li>Identity Documents: Driver&apos;s license images</li>
                  <li>Vehicle Information: VIN, make, model, year, license plate, photos</li>
                  <li>Insurance & Registration Documents</li>
                  <li>Payment Information (processed by Stripe)</li>
                  <li>Marketplace Content: Listings, descriptions, photos, messages</li>
                </ul>
                <p className="text-xs leading-relaxed"><strong>Information Collected Automatically:</strong> Device information, usage data, log data, IP address.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 2: How We Use Your Information</h4>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  <li>Create and manage your account</li>
                  <li>Process membership payments and subscriptions</li>
                  <li>Provide digital wallet and document storage features</li>
                  <li>Facilitate marketplace listings and transactions</li>
                  <li>Process coupon requests and coordinate with service providers</li>
                  <li>Verify identity and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 3: How We Share Your Information</h4>
                <p className="text-xs leading-relaxed mb-2">We share information with service providers (Stripe, Firebase), collision centers when you request services, and other marketplace users for listings. We may disclose information to comply with legal requirements.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-green-800 text-xs font-semibold">WE DO NOT SELL YOUR PERSONAL INFORMATION.</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 4: Data Security</h4>
                <p className="text-xs leading-relaxed">We implement reasonable security measures including encryption of data in transit and at rest, secure authentication systems, and access controls. No system is 100% secure.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 5: Data Retention</h4>
                <p className="text-xs leading-relaxed">We retain your information while your account is active. Upon account deletion request, most data is deleted within 30 days. Some data may be retained for legal compliance.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 6: Your Privacy Rights</h4>
                <p className="text-xs leading-relaxed">You may request access to, correction of, or deletion of your personal information. You may opt out of marketing communications. To exercise your rights, contact support@dipmembers.com.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 7: California Privacy Rights (CCPA/CPRA)</h4>
                <p className="text-xs leading-relaxed">California residents have additional rights including the right to know, delete, correct, and opt-out. DIP does not sell personal information. We will not discriminate against you for exercising your privacy rights.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Section 8: Contact Us</h4>
                <p className="text-xs leading-relaxed">
                  <strong>DIP Member Support</strong><br />
                  Email: support@dipmembers.com
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-xs text-center">
              By using DIP, you acknowledge that you have read, understood, and agree to these Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </InfoModal>
    </div>
  );
}



