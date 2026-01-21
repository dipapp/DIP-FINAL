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
      <InfoModal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About DIP">
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">dip</span>
            </div>
            <p className="text-gray-500 text-sm">Version 1.0.0</p>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            DIP (Deductible Impact Protection) is a membership-based service that protects you from unexpected auto insurance deductibles.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            Add your vehicles, purchase coverage, and submit claims all in one place. Our trusted partner network ensures guaranteed quality repairs at certified shops.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Up to $1,000 deductible coverage
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 Claims Support
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No waiting period
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </li>
            </ul>
          </div>
          
          <p className="text-gray-500 text-xs text-center mt-4">
            © 1994–2025 DIP. All rights reserved.
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
        <div className="space-y-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">
            Effective Date: {profile?.createdAt?.toDate?.()?.toLocaleDateString?.() || new Date().toLocaleDateString()}
          </p>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">1. Membership Agreement</h4>
            <p className="leading-relaxed">
              By using DIP services, you agree to these terms. DIP is a membership program that provides deductible impact protection for registered vehicles. This is not an insurance product.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">2. Eligibility</h4>
            <p className="leading-relaxed">
              Members must be at least 18 years old with a valid driver&apos;s license. Vehicles must have active auto insurance coverage to be eligible for DIP membership.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">3. Coverage</h4>
            <p className="leading-relaxed">
              DIP covers up to $1,000 per incident for qualifying deductible expenses. Claims must be submitted within 30 days of the incident and repairs must be completed at a DIP-certified partner shop.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">4. Privacy Policy</h4>
            <p className="leading-relaxed">
              We collect identity information (name, email, phone), vehicle information (VIN, photos), and insurance details to set up your account, verify identity, assist with claims, and prevent fraud. We retain this data only as long as necessary for these purposes.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">5. Data Security</h4>
            <p className="leading-relaxed">
              Your data is securely protected using industry-standard encryption and security practices. We do not sell your personal information to third parties.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">6. Cancellation</h4>
            <p className="leading-relaxed">
              You may cancel your membership at any time. Cancellation takes effect at the end of your current billing period. No refunds are provided for partial months.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-xs">
              For the complete Terms of Service and Privacy Policy, visit{' '}
              <a href="/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </InfoModal>
    </div>
  );
}



