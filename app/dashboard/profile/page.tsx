'use client';
import React, { useEffect, useState } from 'react';
import { subscribeMyProfile, updateMyProfile } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeMyProfile((profile) => {
      setProfile(profile);
      if (profile) {
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setPhone(profile.phoneNumber || '');
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          <p className="text-gray-600 mt-1">Update your personal information and contact details</p>
        </div>
        
        <div className="card-body">
          {message && (
            <div className={`alert mb-6 ${
              message.type === 'success' ? 'alert-success' : 'alert-error'
            }`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {message.type === 'success' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                {message.text}
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="form-row">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
              <p className="text-xs text-gray-500 mt-1">Used for emergency communications and service requests</p>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input bg-gray-50"
                value={profile.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Membership Details</h3>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Member Since</div>
              <div className="font-medium text-gray-900">
                {profile.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Membership Status</div>
              <span className="badge badge-success">Active</span>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Member ID</div>
              <div className="font-mono text-sm text-gray-900">{profile.uid?.slice(-8)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Account Type</div>
              <div className="font-medium text-gray-900">
                {profile.isAdmin ? 'Administrator' : 'Standard Member'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}