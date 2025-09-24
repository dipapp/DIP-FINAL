'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

interface Assignment {
  id: string;
  requestId: string;
  providerId: string;
  providerName: string;
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
  adminNotes?: string;
}

interface Provider {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  specialties: string[];
  serviceAreas: string[];
  status: string;
}

interface Request {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vehicleInfo: string;
  issueDescription: string;
  location: string;
  priority: string;
  status: string;
  createdAt: Date;
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch assignments
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        orderBy('assignedAt', 'desc')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Assignment[];

      // Fetch approved providers
      const providersQuery = query(
        collection(db, 'provider_profiles'),
        where('status', '==', 'active')
      );
      const providersSnapshot = await getDocs(providersQuery);
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[];

      // Fetch pending requests
      const requestsQuery = query(
        collection(db, 'claims'),
        where('status', '==', 'Pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Request[];

      setAssignments(assignmentsData);
      setProviders(providersData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!selectedRequest || !selectedProvider) return;

    try {
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) return;

      await addDoc(collection(db, 'assignments'), {
        requestId: selectedRequest.id,
        providerId: selectedProvider,
        providerName: provider.businessName,
        customerName: selectedRequest.userName,
        customerPhone: selectedRequest.userPhone,
        customerEmail: selectedRequest.userEmail,
        vehicleInfo: selectedRequest.vehicleInfo,
        issueDescription: selectedRequest.issueDescription,
        location: selectedRequest.location,
        priority: selectedRequest.priority || 'medium',
        status: 'assigned',
        assignedAt: new Date(),
        notes: assignmentNotes,
        adminNotes: '',
      });

      // Update request status
      await updateDoc(doc(db, 'claims', selectedRequest.id), {
        status: 'Assigned',
        assignedTo: selectedProvider,
        assignedAt: new Date(),
      });

      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedProvider('');
      setAssignmentNotes('');
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: Assignment['status']) => {
    try {
      await updateDoc(doc(db, 'assignments', assignmentId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const getPriorityColor = (priority: Assignment['priority']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusColor = (status: Assignment['status']) => {
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
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Assignment Management</h1>
          <p className="text-gray-600 mt-2">Manage service provider assignments and track progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {assignments.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Providers</p>
                <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Assignment
          </button>
        </div>

        {/* Assignments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">Create your first assignment to get started.</p>
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
                      Provider
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
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.customerName}</div>
                          <div className="text-sm text-gray-500">{assignment.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{assignment.providerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{assignment.issueDescription}</div>
                        <div className="text-sm text-gray-500">{assignment.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignedAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {assignment.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                          {assignment.status === 'completed' && (
                            <span className="text-green-600">Completed</span>
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

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Assignment</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Request</label>
                  <select
                    value={selectedRequest?.id || ''}
                    onChange={(e) => {
                      const request = requests.find(r => r.id === e.target.value);
                      setSelectedRequest(request || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a request...</option>
                    {requests.map(request => (
                      <option key={request.id} value={request.id}>
                        {request.userName} - {request.issueDescription}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a provider...</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.businessName} - {provider.contactPerson}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any special instructions..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createAssignment}
                    disabled={!selectedRequest || !selectedProvider}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

