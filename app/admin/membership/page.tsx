'use client';
import { useEffect, useState } from 'react';
import { subscribeUsers, subscribeVehicles } from '@/lib/firebase/adminActions';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function AdminMembershipPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => setUsers(data));
    const unsubVehicles = subscribeVehicles((data) => setVehicles(data));
    
    setLoading(false);
    
    return () => {
      unsubUsers();
      unsubVehicles();
    };
  }, []);

  // Calculate membership statistics
  const membershipStats = {
    totalMembers: users.filter(u => u.isActive).length,
    totalSubscriptions: vehicles.filter(v => v.isActive).length,
    activeMemberships: vehicles.filter(v => v.isActive).length,
    pendingPayments: vehicles.filter(v => !v.isActive && v.ownerEmail).length, // Inactive vehicles with owners
    cancelledMemberships: 0, // No cancelled status in current system
    monthlyRevenue: vehicles.filter(v => v.isActive).length * 22.99,
    totalRevenue: users.filter(u => u.isActive).length * 22.99 * 6, // Assuming average 6 months
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'subscriptions', label: 'Active Subscriptions', icon: '💳' },
    { id: 'payments', label: 'Payment Issues', icon: '⚠️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expired' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center space-x-2">
            <div className="loading-spinner"></div>
            <span>Loading membership data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <BackButton />
      </div>
      
      <div className="card">
        <h1 className="text-2xl font-bold mb-2">Membership Tracking</h1>
        <p className="text-muted">Monitor subscriptions, payments, and membership analytics.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

                 {/* Overview Tab */}
         {activeTab === 'overview' && (
           <div className="space-y-8">
             {/* Stats Grid */}
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                 <div className="text-center">
                   <div className="text-3xl font-bold text-blue-600 mb-2">{membershipStats.totalMembers}</div>
                   <div className="text-sm font-medium text-blue-800">Total Members</div>
                   <div className="text-xs text-blue-600 mt-1">{membershipStats.activeMemberships} active</div>
                 </div>
               </div>
               <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                 <div className="text-center">
                   <div className="text-3xl font-bold text-green-600 mb-2">{membershipStats.totalSubscriptions}</div>
                   <div className="text-sm font-medium text-green-800">Total Subscriptions</div>
                   <div className="text-xs text-green-600 mt-1">{membershipStats.activeMemberships} active</div>
                 </div>
               </div>
               <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                 <div className="text-center">
                   <div className="text-3xl font-bold text-yellow-600 mb-2">${membershipStats.monthlyRevenue.toFixed(2)}</div>
                   <div className="text-sm font-medium text-yellow-800">Monthly Revenue</div>
                   <div className="text-xs text-yellow-600 mt-1">${membershipStats.totalRevenue.toFixed(2)} total</div>
                 </div>
               </div>
               <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                 <div className="text-center">
                   <div className="text-3xl font-bold text-red-600 mb-2">{membershipStats.pendingPayments}</div>
                   <div className="text-sm font-medium text-red-800">Payment Issues</div>
                   <div className="text-xs text-red-600 mt-1">{membershipStats.cancelledMemberships} cancelled</div>
                 </div>
               </div>
             </div>

             {/* Content Grid */}
             <div className="grid lg:grid-cols-2 gap-8">
               <div className="card">
                 <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
                 <div className="space-y-4">
                   {vehicles.slice(0, 5).map((vehicle) => (
                     <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                       <div className="flex items-center space-x-3">
                         <div className={`w-3 h-3 rounded-full ${vehicle.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <div>
                           <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                           <div className="text-sm text-muted">{vehicle.ownerEmail || 'Unknown'}</div>
                         </div>
                       </div>
                       {getStatusBadge(vehicle.isActive ? 'active' : 'pending')}
                     </div>
                   ))}
                   {vehicles.length === 0 && (
                     <div className="text-center py-8 text-muted">
                       <div className="text-4xl mb-2">🚗</div>
                       <p>No vehicles found</p>
                     </div>
                   )}
                 </div>
               </div>

               <div className="card">
                 <h3 className="text-lg font-semibold mb-6">Membership Health</h3>
                 <div className="space-y-6">
                   <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span>Active Memberships</span>
                     </div>
                     <span className="font-semibold text-green-600">{membershipStats.activeMemberships}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                       <span>Pending Payments</span>
                     </div>
                     <span className="font-semibold text-yellow-600">{membershipStats.pendingPayments}</span>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <span>Cancelled</span>
                     </div>
                     <span className="font-semibold text-red-600">{membershipStats.cancelledMemberships}</span>
                   </div>
                   <div className="pt-4 border-t">
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <span className="font-semibold">Total</span>
                       <span className="font-semibold">{membershipStats.totalSubscriptions}</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

                 {/* Subscriptions Tab */}
         {activeTab === 'subscriptions' && (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-semibold">Active Subscriptions ({membershipStats.activeMemberships})</h3>
             </div>
             <div className="card overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50 border-b">
                     <tr>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Member</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Vehicle</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Start Date</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Monthly Fee</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {vehicles
                       .filter(v => v.isActive)
                       .map((vehicle) => (
                         <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4">
                             <div>
                               <div className="font-medium text-gray-900">{vehicle.ownerEmail || 'Unknown'}</div>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                           </td>
                           <td className="px-6 py-4">
                             {getStatusBadge('active')}
                           </td>
                           <td className="px-6 py-4 text-gray-600">
                             {vehicle.lastUpdated ? new Date(vehicle.lastUpdated.seconds * 1000).toLocaleDateString() : 'N/A'}
                           </td>
                           <td className="px-6 py-4 text-gray-900">$22.99</td>
                           <td className="px-6 py-4">
                             <button 
                               className="btn btn-secondary btn-sm"
                               onClick={() => {
                                 setSelectedVehicle(vehicle);
                                 setShowDetailsModal(true);
                               }}
                             >
                               View Details
                             </button>
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
               </div>
               {vehicles.filter(v => v.isActive).length === 0 && (
                 <div className="text-center py-12">
                   <div className="text-4xl mb-4">💳</div>
                   <p className="text-gray-500">No active subscriptions found</p>
                 </div>
               )}
             </div>
           </div>
         )}

                 {/* Payment Issues Tab */}
         {activeTab === 'payments' && (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h3 className="text-xl font-semibold">Payment Issues ({membershipStats.pendingPayments})</h3>
             </div>
             <div className="card overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50 border-b">
                     <tr>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Member</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Vehicle</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Issue</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Last Updated</th>
                       <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {vehicles
                       .filter(v => !v.isActive && v.ownerEmail)
                       .map((vehicle) => (
                         <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-6 py-4">
                             <div>
                               <div className="font-medium text-gray-900">{vehicle.ownerEmail}</div>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                           </td>
                           <td className="px-6 py-4">
                             {getStatusBadge('pending')}
                           </td>
                           <td className="px-6 py-4 text-gray-600">
                             {vehicle.lastUpdated ? new Date(vehicle.lastUpdated.seconds * 1000).toLocaleDateString() : 'N/A'}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex space-x-2">
                               <button className="btn btn-success btn-sm">Activate</button>
                               <button className="btn btn-secondary btn-sm">Contact</button>
                             </div>
                           </td>
                         </tr>
                       ))}
                   </tbody>
                 </table>
               </div>
               {vehicles.filter(v => !v.isActive && v.ownerEmail).length === 0 && (
                 <div className="text-center py-12">
                   <div className="text-4xl mb-4">✅</div>
                   <p className="text-gray-500">No payment issues found</p>
                 </div>
               )}
             </div>
           </div>
         )}

                 {/* Analytics Tab */}
         {activeTab === 'analytics' && (
           <div className="space-y-8">
             <div className="grid lg:grid-cols-2 gap-8">
               <div className="card">
                 <h3 className="text-lg font-semibold mb-6">Revenue Overview</h3>
                 <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span>Monthly Recurring Revenue</span>
                     </div>
                     <span className="font-semibold text-green-600 text-lg">${membershipStats.monthlyRevenue.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span>Total Revenue (6 months)</span>
                     </div>
                     <span className="font-semibold text-blue-600 text-lg">${membershipStats.totalRevenue.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                       <span>Average Revenue Per User</span>
                     </div>
                     <span className="font-semibold text-purple-600 text-lg">$22.99</span>
                   </div>
                 </div>
               </div>

               <div className="card">
                 <h3 className="text-lg font-semibold mb-6">Membership Growth</h3>
                 <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                       <span>New Members This Month</span>
                     </div>
                     <span className="font-semibold text-blue-600 text-lg">{Math.floor(membershipStats.totalMembers * 0.1)}</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       <span>Inactive Vehicles</span>
                     </div>
                     <span className="font-semibold text-red-600 text-lg">{membershipStats.pendingPayments}</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                       <span>Retention Rate</span>
                     </div>
                     <span className="font-semibold text-green-600 text-lg">{membershipStats.totalSubscriptions > 0 ? ((membershipStats.activeMemberships / membershipStats.totalSubscriptions) * 100).toFixed(1) : '0'}%</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>

      {/* Vehicle Details Modal */}
      {showDetailsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Vehicle Subscription Details</h2>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Vehicle Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Year:</span>
                    <div className="font-medium">{selectedVehicle.year}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Make:</span>
                    <div className="font-medium">{selectedVehicle.make}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Model:</span>
                    <div className="font-medium">{selectedVehicle.model}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Color:</span>
                    <div className="font-medium">{selectedVehicle.color || 'N/A'}</div>
                  </div>
                  {selectedVehicle.vin && (
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">VIN:</span>
                      <div className="font-mono text-sm">{selectedVehicle.vin}</div>
                    </div>
                  )}
                  {selectedVehicle.licensePlate && (
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">License Plate:</span>
                      <div className="font-medium">{selectedVehicle.licensePlate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Owner Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <div className="font-medium">{selectedVehicle.ownerEmail || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Owner ID:</span>
                    <div className="font-mono text-sm">{selectedVehicle.ownerId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Subscription Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${selectedVehicle.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{selectedVehicle.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Monthly Fee:</span>
                    <div className="font-medium">$22.99</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <div className="font-medium">
                      {selectedVehicle.lastUpdated 
                        ? new Date(selectedVehicle.lastUpdated.seconds * 1000).toLocaleString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Photos:</span>
                    <div className="font-medium">{selectedVehicle.photos?.length || 0} uploaded</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                <button 
                  className={`btn ${selectedVehicle.isActive ? 'btn-danger' : 'btn-success'}`}
                  onClick={async () => {
                    try {
                      // Toggle vehicle active status
                      const newStatus = !selectedVehicle.isActive;
                      await updateVehicleAdmin(selectedVehicle.id, { isActive: newStatus });
                      setSelectedVehicle({ ...selectedVehicle, isActive: newStatus });
                      alert(`Vehicle ${newStatus ? 'activated' : 'deactivated'} successfully`);
                    } catch (error) {
                      console.error('Error toggling vehicle status:', error);
                      alert('Failed to update vehicle status');
                    }
                  }}
                >
                  {selectedVehicle.isActive ? 'Deactivate' : 'Activate'} Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
