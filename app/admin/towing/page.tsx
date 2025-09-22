'use client';
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

export default function AdminTowingPage() {
  const [towEvents, setTowEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'towEvents'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTowEvents(events);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredEvents = towEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.vehicleInfo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'towEvents', eventId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'dispatched':
        return <span className="badge badge-info">Dispatched</span>;
      case 'in-progress':
        return <span className="badge badge-info">In Progress</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return <span className="badge badge-gray">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading towing events...</p>
        </div>
      </div>
    );
  }

  const pendingEvents = towEvents.filter(e => e.status === 'pending');
  const activeEvents = towEvents.filter(e => ['dispatched', 'in-progress'].includes(e.status));
  const completedEvents = towEvents.filter(e => e.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Towing Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage accident support service requests</p>
        </div>
        
        <div className="card-body">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{pendingEvents.length}</div>
              <div className="text-gray-700 text-sm">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{activeEvents.length}</div>
              <div className="text-gray-700 text-sm">Active</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{completedEvents.length}</div>
              <div className="text-gray-700 text-sm">Completed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-600 mb-1">24/7</div>
              <div className="text-gray-700 text-sm">Support</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by member, location, or vehicle..."
                className="input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-48"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Towing Events Table */}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Vehicle</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="table-row">
                    <td>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{event.userEmail}</div>
                        <div className="text-gray-500">{event.userPhone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{event.vehicleInfo}</div>
                        <div className="text-gray-500">{event.licensePlate}</div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-900 max-w-xs truncate">
                      {event.location}
                    </td>
                    <td>
                      <span className="badge badge-info">{event.type}</span>
                    </td>
                    <td>
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="text-sm text-gray-500">
                      {event.createdAt?.toDate?.()?.toLocaleString?.()}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {event.status === 'pending' && (
                          <button
                            onClick={() => updateEventStatus(event.id, 'dispatched')}
                            className="btn btn-primary text-sm"
                          >
                            Dispatch
                          </button>
                        )}
                        {event.status === 'dispatched' && (
                          <button
                            onClick={() => updateEventStatus(event.id, 'completed')}
                            className="btn btn-success text-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => updateEventStatus(event.id, 'cancelled')}
                          className="btn btn-danger text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Towing Events</h3>
              <p className="text-gray-600">No towing events match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}