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
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
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
    console.log('Component mounted, starting data fetch...');
    console.log('Firebase db available:', !!db);
    fetchData();
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log('showAssignModal state changed:', showAssignModal);
  }, [showAssignModal]);

  const fetchData = async () => {
    console.log('Starting fetchData...');
    try {
      console.log('Firebase db object:', db);
      
      // Test basic Firebase connection first
      console.log('Testing basic Firebase connection...');
      try {
        const testCollection = collection(db, 'test');
        const testSnapshot = await getDocs(testCollection);
        console.log('Firebase connection test successful');
      } catch (testError) {
        console.log('Firebase connection test failed (this is expected if test collection doesn\'t exist):', testError);
      }
      
      // Fetch assignments
      console.log('Fetching assignments...');
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        orderBy('assignedAt', 'desc')
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      console.log('Raw assignments snapshot:', assignmentsSnapshot.docs.length, 'docs');
      console.log('Raw assignment docs:', assignmentsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Assignment[];

      // Fetch approved providers from providers collection
      console.log('Fetching providers...');
      const providersQuery = query(
        collection(db, 'providers'),
        where('status', '==', 'approved')
      );
      const providersSnapshot = await getDocs(providersQuery);
      console.log('Raw providers snapshot:', providersSnapshot.docs.length, 'docs');
      console.log('Raw provider docs:', providersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[];

      // Fetch pending requests
      console.log('Fetching requests...');
      const requestsQuery = query(
        collection(db, 'claims'),
        where('status', '==', 'Pending')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      console.log('Raw requests snapshot:', requestsSnapshot.docs.length, 'docs');
      console.log('Raw request docs:', requestsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Request[];

      console.log('Final results:');
      console.log('- Assignments:', assignmentsData.length);
      console.log('- Providers:', providersData.length);
      console.log('- Requests:', requestsData.length);
      
      setAssignments(assignmentsData);
      setProviders(providersData);
      setRequests(requestsData);
      
      console.log('State updated successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const createAssignment = async () => {
    console.log('createAssignment called');
    console.log('selectedRequest:', selectedRequest);
    console.log('selectedProvider:', selectedProvider);
    
    if (!selectedRequest || !selectedProvider) {
      console.log('Missing required data - selectedRequest:', !!selectedRequest, 'selectedProvider:', !!selectedProvider);
      return;
    }

    try {
      const provider = providers.find(p => p.id === selectedProvider);
      console.log('Found provider:', provider);
      if (!provider) {
        console.log('Provider not found');
        return;
      }

      console.log('Selected request data:', selectedRequest);
      console.log('Available fields:', Object.keys(selectedRequest));
      console.log('Provider data:', provider);
      console.log('Provider providerId field:', provider.providerId);
      console.log('Selected provider ID:', selectedProvider);

      const finalProviderId = provider.providerId || selectedProvider;
      console.log('Final providerId to use in assignment:', finalProviderId);

      const assignmentData = {
        requestId: selectedRequest.id,
        providerId: finalProviderId, // Use providerId field if available, fallback to document ID
        providerName: provider.businessName,
        customerName: `${selectedRequest.userFirstName} ${selectedRequest.userLastName}`,
        customerPhone: selectedRequest.userPhone || 'Not provided',
        customerEmail: selectedRequest.userEmail || 'Not provided',
        vehicleInfo: `${selectedRequest.vehicleYear} ${selectedRequest.vehicleMake} ${selectedRequest.vehicleModel}`,
        issueDescription: selectedRequest.issueDescription || 'No description provided',
        location: selectedRequest.location || 'Not specified',
        priority: selectedRequest.priority || 'medium',
        status: 'assigned',
        assignedAt: new Date(),
        notes: assignmentNotes,
        adminNotes: '',
      };
      
      console.log('Creating assignment with data:', assignmentData);
      const assignmentRef = await addDoc(collection(db, 'assignments'), assignmentData);
      console.log('Assignment created with ID:', assignmentRef.id);

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

  const createTestAssignment = async () => {
    try {
      console.log('Creating test assignment...');
      const testAssignment = {
        requestId: 'test-request-' + Date.now(),
        providerId: '341169', // Use the provider ID that matches the logged-in provider
        providerName: 'Test Provider',
        customerName: 'Test Customer',
        customerPhone: '555-1234',
        customerEmail: 'test@example.com',
        vehicleInfo: '2020 Honda Civic',
        issueDescription: 'Test assignment for debugging',
        location: 'Test Location',
        priority: 'medium',
        status: 'assigned',
        assignedAt: new Date(),
        notes: 'This is a test assignment',
        adminNotes: 'Created for debugging purposes',
      };
      
      console.log('Test assignment data:', testAssignment);
      const assignmentRef = await addDoc(collection(db, 'assignments'), testAssignment);
      console.log('Test assignment created with ID:', assignmentRef.id);
      
      // Refresh the data
      fetchData();
    } catch (error) {
      console.error('Error creating test assignment:', error);
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
                <p className="text-xs text-gray-500">{requests.length} pending to assign</p>
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
          <div className="flex space-x-3">
            <button
              onClick={createTestAssignment}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Test Assignment
            </button>
            <button
              onClick={() => {
                console.log('Create Assignment button clicked');
                console.log('Current showAssignModal state:', showAssignModal);
                setShowAssignModal(true);
                console.log('setShowAssignModal(true) called');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Assignment
            </button>
          </div>
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
                        {request.userFirstName} {request.userLastName} - {request.vehicleYear} {request.vehicleMake} {request.vehicleModel}
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
                    onClick={() => {
                      console.log('Create Assignment button clicked in modal');
                      console.log('Button disabled state:', !selectedRequest || !selectedProvider);
                      createAssignment();
                    }}
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



