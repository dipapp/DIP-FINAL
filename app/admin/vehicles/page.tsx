'use client';
import React, { useEffect, useState } from 'react';
import { subscribeVehicles, uploadVehiclePhoto, updateVehicleAdmin } from '@/lib/firebase/adminActions';
import BackButton from '@/components/BackButton';

type AdminVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
  vin: string;
  color: string;
  ownerId: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  photos?: string[];
};

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsub = subscribeVehicles((vehicleData: any[]) => {
      setVehicles(vehicleData as AdminVehicle[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || 
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && vehicle.isActive) ||
      (filterStatus === 'inactive' && !vehicle.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleActive = async (vehicleId: string, currentStatus: boolean) => {
    try {
      await updateVehicleAdmin(vehicleId, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="text-gray-600">Manage all member vehicles and their protection status</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vehicles, plates, or owners..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Vehicles</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter(v => v.isActive).length}
            </div>
            <div className="text-green-700 text-sm font-medium">Active Vehicles</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {vehicles.filter(v => !v.isActive).length}
            </div>
            <div className="text-gray-700 text-sm font-medium">Inactive Vehicles</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(vehicles.map(v => v.ownerId)).size}
            </div>
            <div className="text-blue-700 text-sm font-medium">Total Owners</div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Owner</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">License Plate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vehicle.color} • VIN: {vehicle.vin.slice(-6)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-900">{vehicle.ownerEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-gray-900">
                      {vehicle.licensePlate}
                    </div>
                    <div className="text-sm text-gray-500">{vehicle.state}</div>
                  </td>
                  <td className="py-3 px-4">
                    {vehicle.isActive ? (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {vehicle.createdAt?.toDate?.()?.toLocaleDateString?.()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(vehicle.id, vehicle.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          vehicle.isActive 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {vehicle.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Vehicles Found</h3>
              <p className="text-gray-600">No vehicles match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}