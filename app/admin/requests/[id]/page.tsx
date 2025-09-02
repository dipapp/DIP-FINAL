'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscribeClaims, updateClaimStatus, subscribeClaimMessages, logClaimMessage, type ClaimMessage } from '@/lib/firebase/adminActions';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [vehicleVin, setVehicleVin] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClaimMessage[]>([]);
  const [textBody, setTextBody] = useState('');
  const [sendingText, setSendingText] = useState(false);

  const allStatuses = ['Pending', 'In Review', 'Approved', 'Denied'] as const;

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    try {
      setSaving(true);
      // Optimistic UI update
      setRequest({ ...request, status: newStatus });
      await updateClaimStatus(request.id, newStatus as any);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    // Reuse subscribeClaims and pick the one we need
    const unsub = subscribeClaims((all) => {
      const found = all.find((r) => r.id === requestId) || null;
      setRequest(found);
      setLoading(false);
    });
    return () => { try { (unsub as any)(); } catch {} };
  }, [requestId]);

  // Handle ESC key to close expanded photo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedPhoto) {
        setExpandedPhoto(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto]);

  // Load VIN for the vehicle on this request
  useEffect(() => {
    const loadVin = async () => {
      try {
        if (!request?.vehicleId) return;
        const snap = await getDoc(doc(db, 'vehicles', request.vehicleId));
        const vin = (snap.data() as any)?.vin || null;
        setVehicleVin(vin);
      } catch {
        setVehicleVin(null);
      }
    };
    loadVin();
  }, [request?.vehicleId]);

  // Subscribe to messages timeline
  useEffect(() => {
    if (!requestId) return;
    const unsub = subscribeClaimMessages(requestId, (rows) => setMessages(rows));
    return () => { try { (unsub as any)(); } catch {} };
  }, [requestId]);

  const quickTemplates = [
    'We have received your request and it\'s in review.',
    'Your request has been approved. We\'ll follow up with next steps shortly.',
    'Your request is pending. We need additional photos to proceed.',
    'Your request has been denied. Please check your email for details.',
  ];

  async function handleSendText() {
    if (!request?.userPhoneNumber || !textBody.trim()) return;
    setSendingText(true);
    try {
      const response = await fetch('/api/send-claim-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: request.userPhoneNumber, body: textBody.trim() }),
      });
      const data = await response.json();
      const status: ClaimMessage['status'] = data?.skipped ? 'skipped' : response.ok ? 'sent' : 'failed';
      const ok = await logClaimMessage(request.id, {
        body: textBody.trim(),
        direction: 'outbound',
        to: request.userPhoneNumber,
        status,
      });
      if (!ok) {
        alert('SMS sent, but failed to log message history due to permissions. Update your Firestore rules to allow admin writes to claims/{id}/messages.');
      }
      setTextBody('');
    } finally {
      setSendingText(false);
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading request...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold mb-2">Request not found</h1>
        <button onClick={() => router.back()} className="btn btn-secondary">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">Request #{request.id?.slice(-8)}</h1>
          <button onClick={() => router.back()} className="btn btn-secondary">Back</button>
        </div>
        <p className="text-muted">Submitted on {request.createdAt?.toDate?.()?.toLocaleString?.() || request.date?.toDate?.()?.toLocaleString?.() || '—'}</p>
      </div>

      <div className="card grid md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Member</h2>
          <div>{request.userFirstName} {request.userLastName}</div>
          <div className="text-sm text-muted">{request.userEmail}</div>
          {request.userPhoneNumber && (
            <div className="text-sm">{request.userPhoneNumber}</div>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Vehicle</h2>
          <div className="font-medium">{request.vehicleYear} {request.vehicleMake} {request.vehicleModel}</div>
          <div className="text-sm text-muted">{request.vehicleVin || vehicleVin || request.vin || '—'}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Details</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted">Amount</div>
            <div className="font-semibold">${request.amount?.toFixed?.(2) || '0.00'}</div>
          </div>
          <div>
            <div className="text-muted">Status</div>
            <div className="flex items-center gap-3">
              <span className={`badge ${
                request.status === 'Approved' ? 'badge-success' :
                request.status === 'Denied' ? 'badge-error' :
                request.status === 'In Review' ? 'badge-info' : 'badge-warning'
              }`}>{request.status}</span>
              <select
                className="input max-w-xs"
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving}
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-muted">{saving ? 'Updating…' : ''}</span>
            </div>
          </div>
          <div>
            <div className="text-muted">Updated</div>
            <div>{request.updatedAt?.toDate?.()?.toLocaleString?.() || '—'}</div>
          </div>
        </div>
        {request.description && (
          <div className="mt-4">
            <div className="text-muted mb-1">Description</div>
            <p>{request.description}</p>
          </div>
        )}
      </div>

      {/* Text Updates */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Text Updates</h2>
          <div className="text-sm text-muted">To: {request.userPhoneNumber || '—'}</div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((t) => (
              <button
                key={t}
                className="btn btn-secondary btn-xs"
                onClick={() => setTextBody((prev) => (prev ? prev + ' ' : '') + t)}
              >
                {t.length > 40 ? t.slice(0, 40) + '…' : t}
              </button>
            ))}
          </div>
          <textarea
            className="input w-full"
            rows={3}
            placeholder="Type a message to send via SMS..."
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              className="btn btn-primary"
              onClick={handleSendText}
              disabled={!request.userPhoneNumber || textBody.trim().length === 0 || sendingText}
            >
              {sendingText ? 'Sending…' : 'Send Text'}
            </button>
            {!process.env.NEXT_PUBLIC_TWILIO_ENABLED && (
              <span className="text-xs text-muted">Configure Twilio env vars to actually send SMS</span>
            )}
          </div>
        </div>
      </div>

      {/* Message Timeline */}
      {messages.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Message History</h2>
          <div className="space-y-2 text-sm">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start justify-between">
                <div>
                  <span className={`badge ${m.direction === 'outbound' ? 'badge-info' : 'badge-success'} mr-2`}>
                    {m.direction === 'outbound' ? 'Admin → Member' : 'Member → Admin'}
                  </span>
                  <span>{m.body}</span>
                </div>
                <div className="text-xs text-muted ml-4">
                  {m.status ? m.status : ''} · {m.createdAt?.toDate?.()?.toLocaleString?.() || new Date(m.createdAt).toLocaleString?.()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Section */}
      {request.photoURLs && request.photoURLs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Photos ({request.photoURLs.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {request.photoURLs.map((photoUrl: string, index: number) => (
              <div 
                key={index} 
                className="relative group cursor-pointer"
                onClick={() => {
                  console.log('Photo clicked:', photoUrl);
                  setExpandedPhoto(photoUrl);
                }}
              >
                <img
                  src={photoUrl}
                  alt={`Request photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                    Click to expand
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={expandedPhoto}
              alt="Expanded photo"
              className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxWidth: '95vw', maxHeight: '95vh' }}
            />
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


