'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

interface Provider {
  id: string;
  businessName: string;
  legalEntityName: string;
  ein: string;
  barNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialties: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  licenseNumber?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  yearsInBusiness: number;
  serviceAreas: string[];
  certifications: string[];
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const providersSnapshot = await getDocs(collection(db, 'providers'));
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Provider[];
      
      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProviderStatus = async (providerId: string, newStatus: Provider['status']) => {
    try {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;

      // Update provider status
      await updateDoc(doc(db, 'providers', providerId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      setProviders(prev => 
        prev.map(provider => 
          provider.id === providerId 
            ? { ...provider, status: newStatus, updatedAt: new Date() }
            : provider
        )
      );

      // Show success message
      if (newStatus === 'approved') {
        alert(`Provider "${provider.businessName}" has been approved successfully!\n\nNext steps:\n1. Contact the provider to set up their account\n2. They can use the provider login portal\n3. You can assign service requests to them`);
      } else if (newStatus === 'rejected') {
        alert(`Provider "${provider.businessName}" has been rejected.`);
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
      alert('Error updating provider status. Please try again.');
    }
  };


  const deleteProvider = async (providerId: string) => {
    if (confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'providers', providerId));
        setProviders(prev => prev.filter(provider => provider.id !== providerId));
      } catch (error) {
        console.error('Error deleting provider:', error);
      }
    }
  };

  const filteredProviders = providers.filter(provider => 
    filter === 'all' || provider.status === filter
  );

  const getStatusColor = (status: Provider['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="card">Loading providers...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Provider Management</h1>
            <p className="text-muted">Manage approved service providers and their information</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{providers.length}</div>
            <div className="text-sm text-muted">Total Providers</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{providers.filter(p => p.status === 'approved').length}</div>
            <div className="text-sm text-blue-800">Approved</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-lg font-bold text-yellow-600">{providers.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm text-yellow-800">Pending</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-lg font-bold text-red-600">{providers.filter(p => p.status === 'rejected').length}</div>
            <div className="text-sm text-red-800">Rejected</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-bold text-gray-600">{providers.filter(p => p.status === 'suspended').length}</div>
            <div className="text-sm text-gray-800">Suspended</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex space-x-1 mb-4">
          {[
            { id: 'all', label: 'All Providers', count: providers.length },
            { id: 'pending', label: 'Pending', count: providers.filter(p => p.status === 'pending').length },
            { id: 'approved', label: 'Approved', count: providers.filter(p => p.status === 'approved').length },
            { id: 'rejected', label: 'Rejected', count: providers.filter(p => p.status === 'rejected').length },
            { id: 'suspended', label: 'Suspended', count: providers.filter(p => p.status === 'suspended').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer border ${
                filter === tab.id 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Providers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Provider</th>
                <th className="text-left py-3 px-4 font-semibold">Contact</th>
                <th className="text-left py-3 px-4 font-semibold">Legal Info</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold">{provider.businessName}</div>
                      <div className="text-sm text-muted">{provider.legalEntityName}</div>
                      <div className="text-sm text-muted">EIN: {provider.ein}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium">{provider.contactPerson}</div>
                      <div className="text-sm text-muted">{provider.email}</div>
                      <div className="text-sm text-muted">{provider.phone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      {provider.barNumber && (
                        <div className="text-sm">Bar #: {provider.barNumber}</div>
                      )}
                      {provider.licenseNumber && (
                        <div className="text-sm">License: {provider.licenseNumber}</div>
                      )}
                      <div className="text-sm text-muted">{provider.yearsInBusiness} years in business</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(provider.status)}`}>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {provider.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateProviderStatus(provider.id, 'approved')}
                            className="btn btn-primary text-xs px-3 py-1"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateProviderStatus(provider.id, 'rejected')}
                            className="btn btn-secondary text-xs px-3 py-1"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {provider.status === 'approved' && (
                        <button
                          onClick={() => updateProviderStatus(provider.id, 'suspended')}
                          className="btn btn-secondary text-xs px-3 py-1"
                        >
                          Suspend
                        </button>
                      )}
                      {provider.status === 'suspended' && (
                        <button
                          onClick={() => updateProviderStatus(provider.id, 'approved')}
                          className="btn btn-primary text-xs px-3 py-1"
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => deleteProvider(provider.id)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-8 text-muted">
            No providers found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}



