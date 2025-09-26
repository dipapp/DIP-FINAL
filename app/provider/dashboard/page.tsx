'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

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

export default function ProviderDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerInfo, setProviderInfo] = useState<{
    businessName: string;
    providerId: string;
    contactPerson: string;
  } | null>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProviderInfo(user);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch assignments when providerId changes
  useEffect(() => {
    if (currentProviderId) {
      fetchAssignments();
    }
  }, [currentProviderId]);

  const fetchProviderInfo = async (user: any) => {
    try {
      if (!user) return;
      
      // Get provider profile from provider_profiles collection using user UID
      const providerProfileDoc = await getDoc(doc(db, 'provider_profiles', user.uid));
      
      if (providerProfileDoc.exists()) {
        const providerData = providerProfileDoc.data();
        console.log('Provider profile data:', providerData);
        const providerId = providerData.providerId || 'Unknown ID';
        setCurrentProviderId(providerId);
        setProviderInfo({
          businessName: providerData.businessName || providerData.legalEntityName || 'Unknown Business',
          providerId: providerId,
          contactPerson: providerData.contactPerson || 'Unknown Contact',
        });
      } else {
        // Fallback: try to get from users collection
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data:', userData);
          
          // If we have a providerId, try to get more info from providers collection
          if (userData.providerId) {
            const providersQuery = query(
              collection(db, 'providers'),
              where('providerId', '==', userData.providerId)
            );
            const providersSnapshot = await getDocs(providersQuery);
            
            if (!providersSnapshot.empty) {
              const providerData = providersSnapshot.docs[0].data();
              console.log('Provider data from providers collection:', providerData);
              const providerId = providerData.providerId || userData.providerId || 'Unknown ID';
              setCurrentProviderId(providerId);
              setProviderInfo({
                businessName: providerData.businessName || userData.businessName || 'Unknown Business',
                providerId: providerId,
                contactPerson: providerData.contactPerson || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown Contact',
              });
            } else {
              const providerId = userData.providerId || 'Unknown ID';
              setCurrentProviderId(providerId);
              setProviderInfo({
                businessName: userData.businessName || 'Unknown Business',
                providerId: providerId,
                contactPerson: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown Contact',
              });
            }
          } else {
            const providerId = userData.providerId || 'Unknown ID';
            setCurrentProviderId(providerId);
            setProviderInfo({
              businessName: userData.businessName || 'Unknown Business',
              providerId: providerId,
              contactPerson: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown Contact',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log('fetchAssignments called with currentProviderId:', currentProviderId);
      if (!currentProviderId) {
        console.log('No provider ID available yet, skipping assignment fetch');
        return;
      }

      // Filter assignments by the current provider's ID
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('providerId', '==', currentProviderId),
        orderBy('assignedAt', 'desc')
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      console.log('Fetched assignments count for provider', currentProviderId, ':', assignmentsSnapshot.docs.length);
      
      // Debug: Let's also fetch ALL assignments to see what's in the database
      const allAssignmentsQuery = query(collection(db, 'assignments'));
      const allAssignmentsSnapshot = await getDocs(allAssignmentsQuery);
      console.log('All assignments in database:', allAssignmentsSnapshot.docs.length);
      console.log('All assignment data:', allAssignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        providerId: doc.data().providerId,
        customerName: doc.data().customerName,
        status: doc.data().status
      })));
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: doc.data().assignedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
      })) as Assignment[];
      
      console.log('Assignments data:', assignmentsData);
      setAssignments(assignmentsData);
      
      // Calculate stats
      setStats({
        total: assignmentsData.length,
        pending: assignmentsData.filter(a => a.status === 'assigned').length,
        inProgress: assignmentsData.filter(a => a.status === 'in_progress').length,
        completed: assignmentsData.filter(a => a.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: Assignment['status']) => {
    try {
      // Update assignment status in the assignments collection
      await updateDoc(doc(db, 'assignments', assignmentId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      console.log(`Updated assignment ${assignmentId} to ${newStatus}`);
      // Refresh the data
      fetchAssignments();
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
                {providerInfo && (
                  <div className="mt-2 text-sm text-blue-600">
                    <span className="font-medium">{providerInfo.businessName}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-500">ID: {providerInfo.providerId}</span>
                  </div>
                )}
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
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
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

        {/* Assignments Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Assignments</h3>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600">You'll receive assignments here when they're assigned to you.</p>
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
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.customerName}</div>
                          <div className="text-sm text-gray-500">{assignment.customerPhone}</div>
                        </div>
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
                          <Link
                            href={`/provider/assignment/${assignment.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                          {assignment.status === 'assigned' && (
                            <>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'accepted')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateAssignmentStatus(assignment.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {assignment.status === 'accepted' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Start
                            </button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <button
                              onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
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