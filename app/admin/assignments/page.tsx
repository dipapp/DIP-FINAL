'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';

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
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignedAt: Date;
  dueDate?: Date;
  notes?: string;
  adminNotes?: string;
  requestDeleted?: boolean; // Flag to track if original request was deleted
}

interface Provider {
  id: string;
  providerId?: string;
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
  assignedTo?: string; // Optional field for tracking provider assignment
}

export default function AdminAssignmentsPage() {
  const router = useRouter();
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

      // Fetch ALL requests (same approach as admin home page)
      console.log('Fetching ALL requests...');
      
      const allClaimsQuery = query(collection(db, 'claims'));
      const allClaimsSnapshot = await getDocs(allClaimsQuery);
      console.log('All claims in database:', allClaimsSnapshot.docs.length);
      console.log('All claims data:', allClaimsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        status: doc.data().status,
        userFirstName: doc.data().userFirstName,
        userLastName: doc.data().userLastName,
        assignedTo: doc.data().assignedTo
      })));
      
      // Group by status to see what status values exist
      const statusGroups = allClaimsSnapshot.docs.reduce((acc, doc) => {
        const status = doc.data().status || 'undefined';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(doc);
        return acc;
      }, {} as Record<string, any[]>);
      
      console.log('Claims grouped by status:', statusGroups);
      
      // Use all claims for filtering (same as admin home page)
      const requestsSnapshot = allClaimsSnapshot;
      
      console.log('Raw requests snapshot:', requestsSnapshot.docs.length, 'docs');
      console.log('Raw request docs:', requestsSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      // Debug: Show all request data before filtering
      console.log('=== ALL REQUESTS BEFORE FILTERING ===');
      requestsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Request ${index + 1}:`, {
          id: doc.id,
          status: data.status,
          userFirstName: data.userFirstName,
          userLastName: data.userLastName,
          assignedTo: data.assignedTo,
          createdAt: data.createdAt
        });
      });
      
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Request[];
      
      // Debug: Log all request statuses to understand what we're working with
      console.log('All request statuses found:', requestsData.map(r => ({ 
        id: r.id, 
        status: r.status, 
        assignedTo: r.assignedTo,
        userFirstName: r.userFirstName,
        userLastName: r.userLastName 
      })));
      
      // Filter for requests that can be assigned (same logic as admin home page)
      const pendingRequests = requestsData.filter(request => {
        console.log('Checking request:', {
          id: request.id,
          status: request.status,
          assignedTo: request.assignedTo
        });
        
        // Use the exact same filtering logic as admin home page
        const shouldInclude = 
          request.status === 'Pending' || 
          request.status === 'pending' || 
          request.status === 'In Review' || 
          request.status === 'in_review' ||
          request.status === 'Approved' ||  // Approved requests should be available for assignment
          !request.status ||  // Include requests without status
          !request.assignedTo;  // Include requests not assigned to a provider
        
        console.log('Should include:', shouldInclude, 'for request:', request.id);
        return shouldInclude;
      });
      
      console.log('=== FILTERING RESULTS ===');
      console.log('Final pending requests after filtering:', pendingRequests.length);
      console.log('Pending requests data:', pendingRequests);

      // Check for deleted requests - create a set of existing request IDs
      const existingRequestIds = new Set(requestsSnapshot.docs.map(doc => doc.id));
      console.log('Existing request IDs:', Array.from(existingRequestIds));
      
      // Update assignments to mark which ones have deleted original requests
      const assignmentsWithDeletedFlag = assignmentsData.map(assignment => {
        const requestDeleted = !existingRequestIds.has(assignment.requestId);
        console.log(`Assignment ${assignment.id} - Request ${assignment.requestId} - Deleted: ${requestDeleted}`);
        return {
          ...assignment,
          requestDeleted
        };
      });

      console.log('=== FINAL RESULTS ===');
      console.log('- Total Assignments:', assignmentsData.length);
      console.log('- Available Providers:', providersData.length);
      console.log('- Pending Requests (available for assignment):', pendingRequests.length);
      
      if (pendingRequests.length === 0) {
        console.log('⚠️  NO PENDING REQUESTS FOUND!');
        console.log('This could mean:');
        console.log('1. All requests are already assigned');
        console.log('2. All requests are in final states');
        console.log('3. Request statuses don\'t match expected values');
        console.log('4. assignedTo field is set on all requests');
      }
      
      setAssignments(assignmentsWithDeletedFlag);
      setProviders(providersData);
      setRequests(pendingRequests);
      
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

  const moveAssignmentBackToPending = async (assignment: Assignment) => {
    try {
      console.log('Moving assignment back to pending requests:', assignment);
      
      // Update the original claim back to "Pending" status
      await updateDoc(doc(db, 'claims', assignment.requestId), {
        status: 'Pending',
        assignedTo: null,
        assignedAt: null,
        updatedAt: new Date(),
      });
      
      // Delete the assignment from assignments collection
      await deleteDoc(doc(db, 'assignments', assignment.id));
      
      console.log('Successfully moved assignment back to pending requests');
      fetchData();
    } catch (error) {
      console.error('Error moving assignment back to pending:', error);
    }
  };

  const deleteAssignment = async (assignment: Assignment) => {
    try {
      console.log('Deleting assignment:', assignment);
      
      // Delete the assignment from assignments collection
      await deleteDoc(doc(db, 'assignments', assignment.id));
      
      console.log('Successfully deleted assignment');
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };


  const getStatusColor = (status: Assignment['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
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
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/admin/assignments/${assignment.id}`)}
                >
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                      {/* Customer */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{assignment.customerName}</div>
                        <div className="text-xs text-gray-500 truncate">{assignment.customerPhone}</div>
                      </div>
                      
                      {/* Provider */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Provider</div>
                        <div className="text-sm text-gray-900 truncate">{assignment.providerName}</div>
                      </div>
                      
                      {/* Service */}
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Service</div>
                        <div className="text-sm text-gray-900 truncate">{assignment.issueDescription}</div>
                        <div className="text-xs text-gray-500 truncate">{assignment.location}</div>
                        {assignment.requestDeleted && (
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            <span className="truncate">Original request may have been deleted by member</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vehicle</div>
                        <div className="text-sm text-gray-900 truncate">{assignment.vehicleInfo}</div>
                      </div>
                      
                      {/* Status */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>
                      
                      {/* Assigned Date */}
                      <div className="md:col-span-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Assigned</div>
                        <div className="text-sm text-gray-500">{assignment.assignedAt.toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {/* Actions Row */}
                    <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        {/* Show action buttons for all assignments except completed ones */}
                        {assignment.status !== 'completed' && (
                          <>
                            {assignment.status === 'assigned' && (
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded-md hover:bg-red-50 border border-red-200"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => moveAssignmentBackToPending(assignment)}
                              className="text-orange-600 hover:text-orange-900 text-sm px-3 py-1 rounded-md hover:bg-orange-50 border border-orange-200"
                            >
                              Move to Pending
                            </button>
                            <button
                              onClick={() => deleteAssignment(assignment)}
                              className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded-md hover:bg-red-50 border border-red-200"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {assignment.status === 'completed' && (
                          <span className="text-green-600 text-sm px-3 py-1 bg-green-50 rounded-md border border-green-200">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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



