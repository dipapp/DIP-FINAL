'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import Link from 'next/link';

interface Applicant {
  id: string;
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleInfo: string;
  issueDescription: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignedAt: Date;
  dueDate?: Date;
  notes?: string;
}

export default function ProviderDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      // For now, get all applicants - in production, this should be filtered by provider ID
      // TODO: Implement proper authentication to get current provider ID
      const applicantsQuery = query(
        collection(db, 'applicants'),
        orderBy('assignedAt', 'desc')
      );
      
      const applicantsSnapshot = await getDocs(applicantsQuery);
      const applicantsData = applicantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Applicant[];
      
      setApplicants(applicantsData);
      
      // Calculate stats
      setStats({
        total: applicantsData.length,
        pending: applicantsData.filter(a => a.status === 'assigned').length,
        inProgress: applicantsData.filter(a => a.status === 'in_progress').length,
        completed: applicantsData.filter(a => a.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicantStatus = async (applicantId: string, newStatus: Applicant['status']) => {
    try {
      // Update applicant status
      // This would require a server-side function or admin SDK
      console.log(`Updating applicant ${applicantId} to ${newStatus}`);
      // For now, just refresh the data
      fetchApplicants();
    } catch (error) {
      console.error('Error updating applicant:', error);
    }
  };

  const getPriorityColor = (priority: Applicant['priority']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusColor = (status: Applicant['status']) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">DIP</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your service assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/provider/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">🔧</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Applicants</h3>
          </div>
          
          {applicants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants yet</h3>
              <p className="text-gray-600">You'll receive applicants here when they're assigned to you.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{applicant.customerName}</div>
                          <div className="text-sm text-gray-500">{applicant.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{applicant.issueDescription}</div>
                        <div className="text-sm text-gray-500">{applicant.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(applicant.priority)}`}>
                          {applicant.priority.charAt(0).toUpperCase() + applicant.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(applicant.status)}`}>
                          {applicant.status.replace('_', ' ').charAt(0).toUpperCase() + applicant.status.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {applicant.assignedAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {applicant.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => updateApplicantStatus(applicant.id, 'accepted')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateApplicantStatus(applicant.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {applicant.status === 'accepted' && (
                            <button
                              onClick={() => updateApplicantStatus(applicant.id, 'in_progress')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Start
                            </button>
                          )}
                          {applicant.status === 'in_progress' && (
                            <button
                              onClick={() => updateApplicantStatus(applicant.id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}