'use client';
import { useEffect, useState } from 'react';
import { subscribeUsers, subscribeVehicles, subscribeClaims, subscribeTowEvents } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [towEvents, setTowEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams?.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => setUsers(data));
    const unsubVehicles = subscribeVehicles((data) => setVehicles(data));
    const unsubRequests = subscribeClaims((data) => setRequests(data));
    const unsubTowEvents = subscribeTowEvents((data) => setTowEvents(data));
    
    setLoading(false);
    
    return () => {
      unsubUsers();
      unsubVehicles();
      unsubRequests();
      unsubTowEvents();
    };
  }, []);

  // Keep activeTab in sync with URL so refresh preserves the current tab
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.isActive).length,
    totalRequests: requests.length,
    pendingRequests: requests.filter(c => c.status === 'Pending').length,
    approvedRequests: requests.filter(c => c.status === 'Approved').length,
    totalTowRequests: towEvents.length,
    pendingTowRequests: towEvents.filter(t => !t.status || t.status === 'pending').length,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥', count: users.length },
    { id: 'requests', label: 'Requests', icon: '📋', count: requests.length },
    { id: 'towing', label: 'Towing', icon: '🚛', count: towEvents.length },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      'Pending': { className: 'badge-warning', icon: '⏳' },
      'In Review': { className: 'badge-info', icon: '👀' },
      'Approved': { className: 'badge-success', icon: '✅' },
      'Denied': { className: 'badge-error', icon: '❌' },
      'Paid': { className: 'badge-success', icon: '💰' }
    };
    const badge = badges[status as keyof typeof badges] || { className: 'badge-info', icon: '📋' };
    return (
      <span className={`badge ${badge.className}`}>
        {badge.icon} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-muted">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Admin Console</h1>
                  <p className="text-muted">Manage users, vehicles, requests, and system settings.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Update the URL without adding a new history entry
                router.replace(`/admin?tab=${tab.id}`);
              }}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-blue-800">Total Users</div>
                <div className="text-xs text-blue-600">{stats.activeUsers} active</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600">{stats.totalVehicles}</div>
                <div className="text-sm text-green-800">Total Vehicles</div>
                <div className="text-xs text-green-600">{stats.activeVehicles} active</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalRequests}</div>
                <div className="text-sm text-yellow-800">Total Requests</div>
                <div className="text-xs text-yellow-600">{stats.pendingRequests} pending</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{stats.approvedRequests}</div>
                <div className="text-sm text-purple-800">Approved Requests</div>
                <div className="text-xs text-purple-600">This month</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/vehicles" className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <h3 className="font-semibold">Manage Vehicles</h3>
                    <p className="text-sm text-muted">View and manage all vehicles</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/towing" className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚛</span>
                  <div>
                    <h3 className="font-semibold">Towing Requests</h3>
                    <p className="text-sm text-muted">Manage roadside assistance</p>
                    {stats.pendingTowRequests > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 mt-1">
                        {stats.pendingTowRequests} pending
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <Link href="/admin/membership" className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="font-semibold">Membership Tracking</h3>
                    <p className="text-sm text-muted">Monitor subscriptions & payments</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/settings" className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h3 className="font-semibold">System Settings</h3>
                    <p className="text-sm text-muted">Configure system preferences</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Users ({users.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted border-b">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 25).map((user) => (
                                         <tr key={user.uid} className="table-row cursor-pointer hover:bg-gray-200" onClick={() => window.location.href = `/admin/users/${user.uid}`}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                      </td>
                      <td className="py-3 pr-4">{user.email}</td>
                      <td className="py-3 pr-4">{user.phoneNumber || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? '✓ Active' : '✖ Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {user.createdAt?.toDate?.()?.toLocaleDateString?.() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length > 25 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted">Showing 25 of {users.length} users</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vehicles ({vehicles.length})</h3>
              <Link href="/admin/vehicles" className="btn btn-primary">
                Manage All Vehicles
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted border-b">
                  <tr>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">VIN</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.slice(0, 10).map((vehicle) => (
                    <tr key={vehicle.id} className="table-row">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                        <div className="text-xs text-muted">{vehicle.licensePlate || 'No plate'}</div>
                      </td>
                      <td className="py-3 pr-4">{vehicle.ownerEmail}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs">{vehicle.vin || '—'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${vehicle.isActive ? 'badge-success' : 'badge-error'}`}>
                          {vehicle.isActive ? '✓ Active' : '✖ Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {vehicle.lastUpdated?.toDate?.()?.toLocaleDateString?.() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vehicles.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted">Showing 10 of {vehicles.length} vehicles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Requests ({requests.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted border-b">
                  <tr>
                    <th className="py-2 pr-4">Request ID</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 10).map((claim) => (
                    <tr
                      key={claim.id}
                      className="table-row cursor-pointer hover:bg-gray-200"
                      onClick={() => (window.location.href = `/admin/requests/${claim.id}`)}
                    >
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs">#{claim.id.slice(-8)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{claim.userFirstName} {claim.userLastName}</div>
                        <div className="text-xs text-muted">{claim.userEmail}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold">${claim.amount?.toFixed?.(2) || '0.00'}</span>
                      </td>
                      <td className="py-3 pr-4">{getStatusBadge(claim.status)}</td>
                      <td className="py-3 pr-4">
                        {claim.date?.toDate?.()?.toLocaleDateString?.() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted">Showing 10 of {requests.length} requests</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Towing Tab */}
        {activeTab === 'towing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Towing Requests ({towEvents.length})</h3>
              <Link href="/admin/towing" className="btn btn-primary">
                Manage All Requests
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted border-b">
                  <tr>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {towEvents.slice(0, 10).map((event) => (
                    <tr key={event.id} className="table-row">
                      <td className="py-3 pr-4">
                        {event.timestamp?.toDate?.()?.toLocaleString?.() || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <div>{event.user_first_name} {event.user_last_name}</div>
                        <div className="text-xs text-muted">{event.user_email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <a href={`tel:${event.user_phone}`} className="text-blue-600 hover:underline">
                          {event.user_phone}
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${
                          !event.status || event.status === 'pending' ? 'badge-warning' :
                          event.status === 'contacted' || event.status === 'dispatched' ? 'badge-info' :
                          event.status === 'completed' ? 'badge-success' : 'badge-error'
                        }`}>
                          {!event.status ? 'Pending' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs">{event.dispatcher_notes || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {towEvents.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted">Showing 10 of {towEvents.length} requests</p>
                </div>
              )}
              {towEvents.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🚛</div>
                  <p className="text-muted">No towing requests yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






