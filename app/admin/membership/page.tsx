'use client';
import React, { useEffect, useState } from 'react';
import { subscribeUsers, subscribeVehicles } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';

export default function AdminMembershipPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubUsers = subscribeUsers(setUsers);
    const unsubVehicles = subscribeVehicles(setVehicles);
    setLoading(false);
    
    return () => {
      unsubUsers();
      unsubVehicles();
    };
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getUserVehicleCount = (userId: string) => {
    return vehicles.filter(v => v.ownerId === userId).length;
  };

  const getUserActiveVehicleCount = (userId: string) => {
    return vehicles.filter(v => v.ownerId === userId && v.isActive).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading membership data...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
          <p className="text-gray-600 mt-1">Manage member accounts and their membership status</p>
        </div>
        
        <div className="card-body">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search members by name or email..."
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
              <option value="all">All Members</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{users.length}</div>
              <div className="text-gray-700 text-sm">Total Members</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {users.filter(u => u.isActive).length}
              </div>
              <div className="text-gray-700 text-sm">Active</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {users.filter(u => !u.isActive).length}
              </div>
              <div className="text-gray-700 text-sm">Inactive</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {vehicles.filter(v => v.isActive).length}
              </div>
              <div className="text-gray-700 text-sm">Protected Vehicles</div>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Vehicles</th>
                  <th>Status</th>
                  <th>Member Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="table-row">
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.displayName || 'No Name'
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="text-gray-900">{user.phoneNumber || 'No phone'}</div>
                        <div className="text-gray-500">ID: {user.uid.slice(-8)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {getUserVehicleCount(user.uid)} total
                        </div>
                        <div className="text-green-600">
                          {getUserActiveVehicleCount(user.uid)} active
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-gray">Inactive</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-500">
                      {user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Unknown'}
                    </td>
                    <td>
                      <a
                        href={`/admin/users/${user.uid}`}
                        className="btn btn-secondary text-sm"
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Members Found</h3>
              <p className="text-gray-600">No members match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}