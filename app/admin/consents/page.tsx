"use client";
import React, { useEffect, useState } from 'react';
import { listConsentLogs } from '@/lib/firebase/adminActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

export default function AdminConsentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const data = await listConsentLogs();
      setRows(data);
      setLoading(false);
      // Build a unique set of user IDs and resolve names
      const uniqueIds = Array.from(new Set(data.map((d: any) => d.user_id).filter(Boolean)));
      const map: Record<string, string> = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            const u = snap.data() as any;
            map[id] = [u.firstName, u.lastName].filter(Boolean).join(' ') || (u.email || id);
          }
        } catch {}
      }));
      setUserNameMap(map);
    })();
  }, []);

  if (loading) return <div className="card">Loading consent logs...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Consent Logs</h1>
            <p className="text-muted">Review user consent history and compliance records</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{rows.length}</div>
            <div className="text-sm text-muted">Total Logs</div>
          </div>
        </div>
      </div>

      {/* Consent Logs Table */}
      <div className="card">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[color:var(--muted)]">
            <tr>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Event</th>
              <th className="py-2 pr-4">Presented</th>
              <th className="py-2 pr-4">Accepted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 pr-4">
                  <Link href={`/admin/users/${r.user_id}`} className="link">
                    {userNameMap[r.user_id] || r.user_id}
                  </Link>
                </td>
                <td className="py-2 pr-4">{r.event_type}</td>
                <td className="py-2 pr-4">{r.presented_at?.toDate?.().toLocaleString?.() || ''}</td>
                <td className="py-2 pr-4">{r.accepted_at?.toDate?.().toLocaleString?.() || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}







