'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

type TowEvent = {
  id: string;
  event: string;
  timestamp: any;
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_phone: string;
  status?: 'pending' | 'contacted' | 'dispatched' | 'completed' | 'cancelled';
  dispatcher_notes?: string;
  completed_at?: any;
  tow_company?: string;
  eta?: string;
};

export default function AdminTowingPage() {
  const router = useRouter();
  const [towEvents, setTowEvents] = useState<TowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TowEvent>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'admin_events'),
      orderBy('timestamp', 'desc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TowEvent))
        .filter(event => event.event === 'tow_call');
      setTowEvents(events);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateEventStatus = async (eventId: string, updates: Partial<TowEvent>) => {
    setSaving(eventId);
    try {
      await updateDoc(doc(db, 'admin_events', eventId), {
        ...updates,
        updated_at: serverTimestamp(),
      });
      setEditingEvent(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating tow event:', error);
      alert('Failed to update tow event');
    } finally {
      setSaving(null);
    }
  };

  const startEditing = (event: TowEvent) => {
    setEditingEvent(event.id);
    setEditForm({
      status: event.status || 'pending',
      dispatcher_notes: event.dispatcher_notes || '',
      tow_company: event.tow_company || '',
      eta: event.eta || '',
    });
  };

  const saveChanges = (eventId: string) => {
    updateEventStatus(eventId, editForm);
  };

  const deleteEvent = async (eventId: string) => {
    const confirmDelete = window.confirm('Delete this towing request? This cannot be undone.');
    if (!confirmDelete) return;
    setSaving(eventId);
    try {
      await deleteDoc(doc(db, 'admin_events', eventId));
    } catch (error) {
      console.error('Error deleting tow event:', error);
      alert('Failed to delete tow event');
    } finally {
      setSaving(null);
    }
  };

  const quickStatusUpdate = (eventId: string, status: TowEvent['status']) => {
    const updates: Partial<TowEvent> = { status };
    if (status === 'completed') {
      updates.completed_at = serverTimestamp();
    }
    updateEventStatus(eventId, updates);
  };

  const getStatusBadge = (status?: string) => {
    const badges = {
      'pending': { className: 'badge-warning', icon: '⏳', text: 'Pending' },
      'contacted': { className: 'badge-info', icon: '📞', text: 'Contacted' },
      'dispatched': { className: 'badge-info', icon: '🚛', text: 'Dispatched' },
      'completed': { className: 'badge-success', icon: '✅', text: 'Completed' },
      'cancelled': { className: 'badge-error', icon: '❌', text: 'Cancelled' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const pendingEvents = towEvents.filter(e => !e.status || e.status === 'pending');
  const activeEvents = towEvents.filter(e => e.status === 'contacted' || e.status === 'dispatched');
  const completedEvents = towEvents.filter(e => e.status === 'completed');

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading towing requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Towing Management</h1>
            <p className="text-muted">Manage roadside assistance and towing requests</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{towEvents.length}</div>
            <div className="text-sm text-muted">Total Requests</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">{pendingEvents.length}</div>
            <div className="text-sm text-yellow-800">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{activeEvents.length}</div>
            <div className="text-sm text-blue-800">Active</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-lg font-bold text-green-600">{completedEvents.length}</div>
            <div className="text-sm text-green-800">Completed</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-lg font-bold text-purple-600">714-766-1669</div>
            <div className="text-sm text-purple-800">Tow Service</div>
          </div>
        </div>
      </div>

      {/* Towing Requests Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Towing Requests</h2>
          <div className="text-sm text-muted">
            Real-time updates from mobile app
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b">
              <tr>
                <th className="py-3 pr-4">Time</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Tow Company</th>
                <th className="py-3 pr-4">ETA</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {towEvents.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{formatDate(event.timestamp)}</div>
                    <div className="text-xs text-muted">
                      {event.completed_at && `Completed: ${formatDate(event.completed_at)}`}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{event.user_first_name} {event.user_last_name}</div>
                    <div className="text-xs text-muted">{event.user_email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <a 
                      href={`tel:${event.user_phone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {event.user_phone}
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="py-3 pr-4">
                    {editingEvent === event.id ? (
                      <input
                        type="text"
                        className="input text-xs"
                        placeholder="Tow company name"
                        value={editForm.tow_company || ''}
                        onChange={(e) => setEditForm({ ...editForm, tow_company: e.target.value })}
                      />
                    ) : (
                      <span className="text-xs">{event.tow_company || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {editingEvent === event.id ? (
                      <input
                        type="text"
                        className="input text-xs"
                        placeholder="ETA (e.g., 30 min)"
                        value={editForm.eta || ''}
                        onChange={(e) => setEditForm({ ...editForm, eta: e.target.value })}
                      />
                    ) : (
                      <span className="text-xs">{event.eta || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center space-x-1">
                      {editingEvent === event.id ? (
                        <>
                          <button
                            onClick={() => saveChanges(event.id)}
                            disabled={saving === event.id}
                            className="btn btn-success text-xs"
                          >
                            {saving === event.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingEvent(null)}
                            disabled={saving === event.id}
                            className="btn btn-secondary text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={saving === event.id}
                            className="btn btn-danger text-xs"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(event)}
                            className="btn btn-secondary text-xs"
                            disabled={saving === event.id}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            disabled={saving === event.id}
                            className="btn btn-danger text-xs"
                          >
                            Delete
                          </button>
                          {event.status !== 'completed' && event.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => quickStatusUpdate(event.id, 'contacted')}
                                disabled={saving === event.id}
                                className="btn btn-primary text-xs"
                              >
                                📞
                              </button>
                              <button
                                onClick={() => quickStatusUpdate(event.id, 'dispatched')}
                                disabled={saving === event.id}
                                className="btn btn-info text-xs"
                              >
                                🚛
                              </button>
                              <button
                                onClick={() => quickStatusUpdate(event.id, 'completed')}
                                disabled={saving === event.id}
                                className="btn btn-success text-xs"
                              >
                                ✅
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {towEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚛</div>
            <h3 className="text-lg font-semibold mb-2">No Towing Requests</h3>
            <p className="text-muted">Towing requests from the mobile app will appear here.</p>
          </div>
        )}
      </div>

      {/* Notes Section for Editing */}
      {editingEvent && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Dispatcher Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={editForm.status || 'pending'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TowEvent['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="dispatched">Dispatched</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add dispatcher notes..."
                value={editForm.dispatcher_notes || ''}
                onChange={(e) => setEditForm({ ...editForm, dispatcher_notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
