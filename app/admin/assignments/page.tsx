'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: string;
  requestId: string;
  assignmentNumber?: number; // Sequential assignment number (#1, #2, etc.)
  providerId: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleInfo: string;
  vehicleVin?: string; // VIN stored in assignment
  vehicleId?: string;
  photoURLs?: string[]; // Photos stored in assignment
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
      
      // iOS uses 'requests' collection
      const allClaimsQuery = query(collection(db, 'requests'));
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
      console.log('Selected provider ID (document ID):', selectedProvider);

      // Use providerId field if it exists, otherwise use the document ID
      // Also store the document ID separately for backup matching
      const finalProviderId = provider.providerId || selectedProvider;
      console.log('Final providerId to use in assignment:', finalProviderId);

      // Get the next assignment number by counting existing assignments
      const allAssignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      const nextAssignmentNumber = allAssignmentsSnapshot.docs.length + 1;
      console.log('Next assignment number:', nextAssignmentNumber);

      // Try to get VIN and photos from the request or vehicle
      let vehicleVin = (selectedRequest as any).vin || '';
      let photoURLs: string[] = (selectedRequest as any).photoURLs || [];
      
      // If we have a vehicleId, try to fetch the VIN from the vehicles collection
      if ((selectedRequest as any).vehicleId && !vehicleVin) {
        try {
          const vehicleDoc = await getDoc(doc(db, 'vehicles', (selectedRequest as any).vehicleId));
          if (vehicleDoc.exists()) {
            vehicleVin = vehicleDoc.data().vin || '';
          }
        } catch (err) {
          console.log('Could not fetch vehicle VIN:', err);
        }
      }

      const assignmentData = {
        requestId: selectedRequest.id,
        assignmentNumber: nextAssignmentNumber, // Sequential assignment number
        providerId: finalProviderId, // Use providerId field if available, fallback to document ID
        providerDocId: selectedProvider, // Also store document ID for backup matching
        providerName: provider.businessName,
        customerName: `${selectedRequest.userFirstName} ${selectedRequest.userLastName}`,
        customerPhone: selectedRequest.userPhone || 'Not provided',
        customerEmail: selectedRequest.userEmail || 'Not provided',
        vehicleInfo: `${selectedRequest.vehicleYear} ${selectedRequest.vehicleMake} ${selectedRequest.vehicleModel}`,
        vehicleVin: vehicleVin, // Store VIN in assignment
        vehicleId: (selectedRequest as any).vehicleId || '',
        photoURLs: photoURLs, // Store photos in assignment
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

      // Update request status - iOS uses 'requests' collection
      await updateDoc(doc(db, 'requests', selectedRequest.id), {
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

  const moveAssignmentBackToPending = async (assignment: Assignment) => {
    try {
      console.log('Moving assignment back to pending requests:', assignment);
      
      // Update the original request back to "Pending" status - iOS uses 'requests' collection
      await updateDoc(doc(db, 'requests', assignment.requestId), {
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
            <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Vehicle / VIN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Assigned
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment, index) => (
                    <tr 
                      key={assignment.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/assignments/${assignment.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">
                          #{assignment.assignmentNumber || (assignments.length - index)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate">{assignment.customerName}</div>
                          <div className="text-xs text-gray-500 truncate">{assignment.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate">{assignment.providerName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate">{assignment.issueDescription}</div>
                        <div className="text-xs text-gray-500 truncate">{assignment.location}</div>
                        {assignment.photoURLs && assignment.photoURLs.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">📷 {assignment.photoURLs.length} photo(s)</div>
                        )}
                        {assignment.requestDeleted && (
                          <div className="text-xs text-red-600 mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            <span className="truncate">Original request may have been deleted by member</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 truncate">{assignment.vehicleInfo}</div>
                        {assignment.vehicleVin && (
                          <div className="text-xs text-gray-500 font-mono truncate">VIN: {assignment.vehicleVin}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignedAt.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Show action buttons for all assignments except completed ones */}
                          {assignment.status !== 'completed' && (
                            <>
                              {assignment.status === 'assigned' && (
                                <button
                                  onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900 text-xs px-1 py-0.5 rounded hover:bg-red-50"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => moveAssignmentBackToPending(assignment)}
                                className="text-orange-600 hover:text-orange-900 text-xs px-1 py-0.5 rounded hover:bg-orange-50"
                              >
                                Move to Pending
                              </button>
                              <button
                                onClick={() => deleteAssignment(assignment)}
                                className="text-red-600 hover:text-red-900 text-xs px-1 py-0.5 rounded hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {assignment.status === 'completed' && (
                            <span className="text-green-600 text-xs">Completed</span>
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

        {/* Assignment Modal - Enhanced with request cards */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create Assignment</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step 1: Select Request */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Step 1: Select a Request ({requests.length} pending)
                </label>
                {requests.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No pending requests available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {requests.map((request) => {
                      const userName = request.userFirstName && request.userLastName 
                        ? `${request.userFirstName} ${request.userLastName}`
                        : request.userFirstName || request.userLastName || request.userEmail;
                      const requestDate = request.createdAt?.toDate?.() || request.date?.toDate?.();
                      const isSelected = selectedRequest?.id === request.id;

                      return (
                        <div
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-blue-100'}`}>
                                <svg className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{userName}</p>
                                <p className="text-xs text-gray-500">
                                  Filed {requestDate ? requestDate.toLocaleDateString() : '—'}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Selected</span>
                            )}
                          </div>

                          {/* Vehicle info */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</p>
                            <p className="font-medium text-gray-900 text-sm">
                              {request.vehicleYear} {request.vehicleMake} {request.vehicleModel}
                            </p>
                          </div>

                          {/* Description */}
                          {(request.description || request.issueDescription) && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                              <p className="text-gray-700 text-sm line-clamp-2">{request.description || request.issueDescription}</p>
                            </div>
                          )}

                          {/* Photos indicator */}
                          {request.photoURLs && request.photoURLs.length > 0 && (
                            <div className="flex items-center text-blue-600 text-xs">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {request.photoURLs.length} photo{request.photoURLs.length === 1 ? '' : 's'} attached
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Select Provider */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 2: Assign to Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a provider...</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.businessName} - {provider.contactPerson}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 3: Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any special instructions for the provider..."
                />
              </div>

              {/* Selected Summary */}
              {selectedRequest && selectedProvider && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Ready to assign: <span className="font-bold">{selectedRequest.userFirstName} {selectedRequest.userLastName}</span>'s 
                    request to <span className="font-bold">{providers.find(p => p.id === selectedProvider)?.businessName}</span>
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRequest(null);
                    setSelectedProvider('');
                    setAssignmentNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



