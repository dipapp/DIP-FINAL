'use client';
import { useEffect, useState, Suspense } from 'react';
import { subscribeUsers, subscribeVehicles, subscribeClaims, subscribeTowEvents } from '@/lib/firebase/adminActions';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [towEvents, setTowEvents] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams?.get('tab') || 'overview');
  const [loading, setLoading] = useState(true);
  
  // Requests tab state - matching iOS Coupon Requests Management
  const [requestSearchText, setRequestSearchText] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestSortBy, setRequestSortBy] = useState<string>('newest');
  const [showRequestFilters, setShowRequestFilters] = useState(false);

  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => setUsers(data));
    const unsubVehicles = subscribeVehicles((data) => setVehicles(data));
    const unsubRequests = subscribeClaims((data) => setRequests(data));
    const unsubTowEvents = subscribeTowEvents((data) => setTowEvents(data));
    
    // Fetch providers data
    const fetchProviders = async () => {
      try {
        const providersSnapshot = await getDocs(collection(db, 'providers'));
        const providersData = providersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        setProviders(providersData);
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };
    
    fetchProviders();
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

  // Request management functions (matching iOS)
  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'requests', requestId));
      } catch (error) {
        console.error('Error deleting request:', error);
      }
    }
  };

  // Debug: Log all request statuses to see what's actually in the database
  console.log('Admin Dashboard - All requests:', requests.length);
  console.log('Admin Dashboard - Request statuses:', requests.map(r => ({ id: r.id, status: r.status, userFirstName: r.userFirstName, userLastName: r.userLastName })));
  
  // Group by status to see what status values exist
  const statusGroups = requests.reduce((acc, request) => {
    const status = request.status || 'undefined';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(request);
    return acc;
  }, {} as Record<string, any[]>);
  
  console.log('Admin Dashboard - Requests grouped by status:', statusGroups);

  const pendingRequestsCount = requests.filter(c => 
    c.status === 'Pending' || 
    c.status === 'pending' || 
    c.status === 'In Review' || 
    c.status === 'in_review' ||
    c.status === 'Approved' ||  // Approved requests should be available for assignment
    !c.status ||  // Include requests without status
    !c.assignedTo  // Include requests not assigned to a provider
  ).length;
  const approvedRequestsCount = requests.filter(c => c.status === 'Approved').length;
  
  console.log('Admin Dashboard - Pending requests count:', pendingRequestsCount);
  console.log('Admin Dashboard - Approved requests count:', approvedRequestsCount);
  
  // Debug assignment-related stats
  const inProgressCount = requests.filter(r => r.status === 'In Progress' || r.status === 'in_progress' || r.status === 'Assigned').length;
  const completedCount = requests.filter(r => r.status === 'Completed' || r.status === 'completed').length;
  console.log('Admin Dashboard - In Progress requests count:', inProgressCount);
  console.log('Admin Dashboard - Completed requests count:', completedCount);
  console.log('Admin Dashboard - All request statuses:', requests.map(r => ({ id: r.id, status: r.status, userFirstName: r.userFirstName, assignedTo: r.assignedTo })));

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.isActive).length,
    totalRequests: requests.length,
    pendingRequests: pendingRequestsCount,
    approvedRequests: approvedRequestsCount,
    totalTowRequests: towEvents.length,
    pendingTowRequests: towEvents.filter(t => !t.status || t.status === 'pending').length,
    totalProviders: providers.length,
    approvedProviders: providers.filter(p => p.status === 'approved').length,
    pendingProviders: providers.filter(p => p.status === 'pending').length,
    // Assignment-related stats
    inProgressRequests: requests.filter(r => r.status === 'In Progress' || r.status === 'in_progress' || r.status === 'Assigned').length,
    completedRequests: requests.filter(r => r.status === 'Completed' || r.status === 'completed').length,
  };

  const approvedProvidersList = providers.filter(p => p.status === 'approved');

  // Filter and sort requests for the Requests tab (matching iOS Coupon Requests Management)
  const filteredAndSortedRequests = requests
    .filter(req => {
      // Status filter
      if (requestStatusFilter !== 'all') {
        const status = (req.status || '').toLowerCase();
        if (requestStatusFilter === 'pending' && status !== 'pending') return false;
        if (requestStatusFilter === 'inReview' && status !== 'in review' && status !== 'in_review') return false;
        if (requestStatusFilter === 'approved' && status !== 'approved') return false;
        if (requestStatusFilter === 'denied' && status !== 'denied') return false;
      }
      // Search filter
      if (requestSearchText.trim()) {
        const searchLower = requestSearchText.toLowerCase();
        const userName = `${req.userFirstName || ''} ${req.userLastName || ''}`.toLowerCase();
        const email = (req.userEmail || '').toLowerCase();
        const vehicle = `${req.vehicleYear || ''} ${req.vehicleMake || ''} ${req.vehicleModel || ''}`.toLowerCase();
        const description = (req.description || '').toLowerCase();
        return userName.includes(searchLower) || email.includes(searchLower) || vehicle.includes(searchLower) || description.includes(searchLower);
      }
      return true;
    })
    .sort((a, b) => {
      if (requestSortBy === 'newest') {
        const dateA = a.createdAt?.toDate?.() || a.date?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.date?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      } else if (requestSortBy === 'oldest') {
        const dateA = a.createdAt?.toDate?.() || a.date?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || b.date?.toDate?.() || new Date(0);
        return dateA.getTime() - dateB.getTime();
      } else if (requestSortBy === 'amount') {
        return (b.amount || 0) - (a.amount || 0);
      }
      return 0;
    });
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥', count: users.length },
    { id: 'service-providers', label: 'Service Providers', icon: '🏢', count: approvedProvidersList.length },
    { id: 'requests', label: 'Requests', icon: '📋', count: requests.length },
    { id: 'towing', label: 'Towing', icon: '🚛', count: towEvents.length },
    { id: 'providers', label: 'Provider Applications', icon: '📝', count: providers.filter(p => p.status === 'pending').length },
    { id: 'applicants', label: 'Service Assignments', icon: '🔧', count: 0 },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      'Pending': { className: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full', icon: '⏳' },
      'In Review': { className: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full', icon: '👀' },
      'Approved': { className: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full', icon: '✅' },
      'Denied': { className: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full', icon: '❌' },
      'Paid': { className: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full', icon: '💰' }
    };
    const badge = badges[status as keyof typeof badges] || { className: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full', icon: '📋' };
    return (
      <span className={badge.className}>
        {badge.icon} {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-gray-600">Manage users, vehicles, requests, and system settings</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Update the URL without adding a new history entry
                router.replace(`/admin?tab=${tab.id}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer border ${
                activeTab === tab.id 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
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
              <Link href="/admin/vehicles" className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Vehicles</h3>
                    <p className="text-sm text-gray-600">View and manage all vehicles</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/towing" className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Towing Requests</h3>
                    <p className="text-sm text-gray-600">Manage accident support services</p>
                    {stats.pendingTowRequests > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        {stats.pendingTowRequests} pending
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <Link href="/admin/membership" className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Membership Tracking</h3>
                    <p className="text-sm text-gray-600">Monitor subscriptions & payments</p>
                  </div>
                </div>
              </Link>
              <Link href="/admin/settings" className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">System Settings</h3>
                    <p className="text-sm text-gray-600">Configure system preferences</p>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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

        {/* Service Providers Tab */}
        {activeTab === 'service-providers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active Service Providers ({approvedProvidersList.length})</h3>
            </div>
            {approvedProvidersList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Service Providers</h3>
                <p className="text-gray-600">Approved providers will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted border-b">
                    <tr>
                      <th className="py-2 pr-4">Business Name</th>
                      <th className="py-2 pr-4">Contact</th>
                      <th className="py-2 pr-4">Location</th>
                      <th className="py-2 pr-4">Provider ID</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedProvidersList.map((provider) => (
                      <tr key={provider.id} className="table-row hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{provider.businessName}</div>
                          <div className="text-xs text-muted">{provider.legalEntityName}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div>{provider.contactPerson}</div>
                          <div className="text-xs text-muted">{provider.email}</div>
                          <div className="text-xs text-muted">{provider.phone}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div>{provider.city}, {provider.state}</div>
                          <div className="text-xs text-muted">{provider.zipCode}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {provider.providerId || '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ✓ Active
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {provider.updatedAt?.toLocaleDateString?.() || provider.createdAt?.toLocaleDateString?.() || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vehicles ({vehicles.length})</h3>
              <Link href="/admin/vehicles" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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

        {/* Requests Tab - Matching iOS Coupon Requests Management */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Header with title and filter toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Coupon Requests Management</h2>
              <button
                onClick={() => setShowRequestFilters(!showRequestFilters)}
                className={`p-2 rounded-lg transition-colors ${showRequestFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                value={requestSearchText}
                onChange={(e) => setRequestSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters panel */}
            {showRequestFilters && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <select
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="inReview">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={requestSortBy}
                    onChange={(e) => setRequestSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Highest Amount</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results count */}
            <p className="text-sm text-gray-500">
              {filteredAndSortedRequests.length} request{filteredAndSortedRequests.length === 1 ? '' : 's'}
            </p>

            {/* Request cards */}
            {filteredAndSortedRequests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {requestSearchText || requestStatusFilter !== 'all' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  )}
                </svg>
                <p className="text-gray-600 font-medium">
                  {requestSearchText || requestStatusFilter !== 'all' ? 'No requests match your filters' : 'No requests submitted yet'}
                </p>
                {(requestSearchText || requestStatusFilter !== 'all') && (
                  <button
                    onClick={() => { setRequestSearchText(''); setRequestStatusFilter('all'); }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedRequests.map((claim) => {
                  const userName = claim.userFirstName && claim.userLastName 
                    ? `${claim.userFirstName} ${claim.userLastName}`
                    : claim.userFirstName || claim.userLastName || claim.userEmail;
                  const claimDate = claim.createdAt?.toDate?.() || claim.date?.toDate?.();
                  const status = (claim.status || 'pending').toLowerCase();
                  const isPending = status === 'pending';
                  const isInReview = status === 'in review' || status === 'in_review';

                  return (
                    <div
                      key={claim.id}
                      className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow"
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer flex-1"
                          onClick={() => router.push(`/admin/requests/${claim.id}`)}
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500">
                              Filed {claimDate ? claimDate.toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>

                      <hr className="border-gray-100 my-3" />

                      {/* Vehicle info */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {claim.vehicleYear} {claim.vehicleMake} {claim.vehicleModel}
                        </p>
                      </div>

                      {/* Description */}
                      {claim.description && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                          <p className="text-gray-700 line-clamp-3">{claim.description}</p>
                        </div>
                      )}

                      {/* Photos indicator */}
                      {claim.photoURLs && claim.photoURLs.length > 0 && (
                        <div className="flex items-center text-blue-600 text-sm mb-3">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {claim.photoURLs.length} photo{claim.photoURLs.length === 1 ? '' : 's'} attached
                        </div>
                      )}

                      {/* Action buttons for pending/in-review requests */}
                      {(isPending || isInReview) && (
                        <>
                          <hr className="border-gray-100 my-3" />
                          <div className="flex items-center space-x-2">
                            {isPending && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(claim.id, 'In Review'); }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Review</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(claim.id, 'Approved'); }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(claim.id, 'Denied'); }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Deny</span>
                            </button>
                            <div className="flex-1" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteRequest(claim.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete request"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}

                      {/* For completed/denied requests, just show delete button */}
                      {!isPending && !isInReview && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRequest(claim.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete request"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600">🏢</span>
                <h3 className="font-semibold text-blue-900">Provider Applications</h3>
              </div>
              <p className="text-blue-800 text-sm mb-3">
                Review and approve service provider applications. New providers can sign up through our dedicated portal.
              </p>
              <div className="flex space-x-3">
                <a 
                  href="/admin/providers" 
                  className="btn btn-primary text-sm px-4 py-2"
                >
                  Review Applications
                </a>
                <a 
                  href="/provider/signup" 
                  className="btn btn-secondary text-sm px-4 py-2"
                  target="_blank"
                >
                  Provider Signup Portal
                </a>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Approved Providers</div>
                    <div className="text-2xl font-bold text-green-600">{stats.approvedProviders}</div>
                    <div className="text-sm text-gray-500">Active providers</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⏳</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Pending Review</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingProviders}</div>
                    <div className="text-sm text-gray-500">Awaiting approval</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📋</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Total Applications</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalProviders}</div>
                    <div className="text-sm text-gray-500">All time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Provider Application Process</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Process:</span>
                  <span className="font-medium">4-step application</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Information:</span>
                  <span className="font-medium">Business, Legal, Contact, Service</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verification Required:</span>
                  <span className="font-medium">EIN, License, Insurance</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Review Process:</span>
                  <span className="font-medium">3-5 business days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-600">📝</span>
                <h3 className="font-semibold text-green-900">Service Request Assignments</h3>
              </div>
              <p className="text-green-800 text-sm mb-3">
                Assign customer service requests to approved providers and track their progress through completion.
              </p>
              <div className="flex space-x-3">
                <Link 
                  href="/admin/assignments" 
                  className="btn btn-primary text-sm px-4 py-2"
                >
                  Assign Requests
                </Link>
                <Link 
                  href="/admin/providers" 
                  className="btn btn-secondary text-sm px-4 py-2"
                >
                  View Approved Providers
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📋</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Pending Requests</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.pendingRequests}</div>
                    <div className="text-sm text-gray-500">Need assignment</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⏳</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">In Progress</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.inProgressRequests}</div>
                    <div className="text-sm text-gray-500">Being worked on</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✅</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{stats.completedRequests}</div>
                    <div className="text-sm text-gray-500">Finished today</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🏢</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Available Providers</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.approvedProviders}</div>
                    <div className="text-sm text-gray-500">Ready to assign</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Assignment Process</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Step 1:</span>
                  <span className="font-medium">Review pending service requests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Step 2:</span>
                  <span className="font-medium">Select appropriate provider</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Step 3:</span>
                  <span className="font-medium">Assign and track progress</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Step 4:</span>
                  <span className="font-medium">Monitor completion</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Towing Tab */}
        {activeTab === 'towing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Towing Requests ({towEvents.length})</h3>
              <Link href="/admin/towing" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !event.status || event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          event.status === 'contacted' || event.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

export default function AdminHome() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminHomeContent />
    </Suspense>
  );
}






