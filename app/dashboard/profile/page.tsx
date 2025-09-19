'use client';
import React, { useEffect, useState } from 'react';
import { subscribeMyProfile, updateMyProfile } from '@/lib/firebase/memberActions';
import BackButton from '@/components/BackButton';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

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
      
      <section className="card max-w-xl">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="grid gap-3">
        <div>
          <label className="label">First name</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input 
            type="email" 
            className="input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
          />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
    </section>
    </div>
  );
}







