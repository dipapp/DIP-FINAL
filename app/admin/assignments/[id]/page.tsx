'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import BackButton from '@/components/BackButton';

interface Assignment {
  id: string;
  requestId: string;
  assignmentNumber?: number;
  
  // Provider info
  providerId: string;
  providerDocId?: string;
  providerName: string;
  
  // Member info (matching iOS)
  userId?: string;
  customerName: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone: string;
  customerEmail: string;
  
  // Vehicle info
  vehicleId?: string;
  vehicleInfo: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleVin?: string;
  
  // Request details (matching iOS Claim)
  description?: string;
  amount?: number;
  photoURLs?: string[];
  anyInjuries?: boolean;
  
  // Dates
  requestDate?: Date;
  requestCreatedAt?: Date;
  assignedAt: Date;
  dueDate?: Date;
  
  // Status
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  
  // Notes
  notes?: string;
  adminNotes?: string;
}

interface Request {
  id: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhoneNumber: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleId: string;
  vin: string;
  licensePlate: string;
  issueDescription: string;
  description: string;
  location: string;
  priority: string;
  status: string;
  amount: number;
  photoURLs: string[];
  createdAt: Date;
  assignedTo?: string;
}

export default function AdminAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [vehicleVin, setVehicleVin] = useState<string | null>(null);
  const [requestDeleted, setRequestDeleted] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignment details
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) {
        console.error('Assignment not found');
        return;
      }
      
      const assignmentData = {
        id: assignmentDoc.id,
        ...assignmentDoc.data(),
        assignedAt: assignmentDoc.data().assignedAt?.toDate(),
        dueDate: assignmentDoc.data().dueDate?.toDate(),
      } as Assignment;
      
      setAssignment(assignmentData);
      
      // Try to fetch original request details - iOS uses 'requests' collection
      try {
        const requestDoc = await getDoc(doc(db, 'requests', assignmentData.requestId));
        if (requestDoc.exists()) {
          const requestData = {
            id: requestDoc.id,
            ...requestDoc.data(),
            createdAt: requestDoc.data().createdAt?.toDate(),
          } as Request;
          
          setRequest(requestData);
          
          // Load VIN for the vehicle
          if (requestData.vehicleId) {
            try {
              const vehicleDoc = await getDoc(doc(db, 'vehicles', requestData.vehicleId));
              if (vehicleDoc.exists()) {
                const vehicleData = vehicleDoc.data();
                setVehicleVin(vehicleData.vin || null);
              }
            } catch (error) {
              console.error('Error fetching vehicle VIN:', error);
            }
          }
        } else {
          console.log('Original request not found - may have been deleted by member');
          setRequestDeleted(true);
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        setRequestDeleted(true);
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (newStatus: Assignment['status']) => {
    if (!assignment) return;
    
    try {
      setSaving(true);
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      // Update the assignment state
      setAssignment({ ...assignment, status: newStatus });
    } catch (error) {
      console.error('Error updating assignment:', error);
    } finally {
      setSaving(false);
    }
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

  // Handle ESC key to close expanded photo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedPhoto) {
        setExpandedPhoto(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedPhoto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold mb-2">Assignment not found</h1>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800">
            Return to Assignments
          </button>
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
              <BackButton />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Assignment #{assignment.assignmentNumber || '—'}</h1>
                <p className="text-sm text-gray-600">ID: {assignment.id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/admin/assignments')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Assignment Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Assignment Status</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                {assignment.status.replace('_', ' ').charAt(0).toUpperCase() + assignment.status.replace('_', ' ').slice(1)}
              </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Assigned Date</div>
                <div className="font-semibold">{assignment.assignedAt.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Due Date</div>
                <div className="font-semibold">{assignment.dueDate ? assignment.dueDate.toLocaleDateString() : 'Not specified'}</div>
              </div>
              <div>
                <div className="text-gray-600">Amount</div>
                <div className="font-semibold">${request?.amount?.toFixed?.(2) || '0.00'}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              {assignment.status === 'assigned' && (
                <button
                  onClick={() => updateAssignmentStatus('cancelled')}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Cancel Assignment'}
                </button>
              )}
              {assignment.status === 'cancelled' && (
                <button
                  onClick={() => updateAssignmentStatus('assigned')}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Reassign'}
                </button>
              )}
              {assignment.status === 'completed' && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  ✅ Assignment Completed
                </span>
              )}
            </div>
          </div>

          {/* Request Deleted Warning - Only show when we can confirm the request was actually deleted */}
          {requestDeleted && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Original Request Deleted</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>The original service request was deleted by the member. Assignment data is preserved but some details may be incomplete.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Member Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Full Name</div>
                <div className="font-semibold text-gray-900">{assignment.customerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Email</div>
                <div className="font-semibold text-gray-900">{assignment.customerEmail}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                <div className="font-semibold text-gray-900">{assignment.customerPhone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Member ID</div>
                <div className="font-semibold text-gray-900">{request?.userId || 'Not available'}</div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Year, Make, Model</div>
                <div className="font-semibold text-gray-900">{assignment.vehicleInfo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">License Plate</div>
                <div className="font-semibold text-gray-900">{request?.licensePlate || 'Not available'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">VIN</div>
                <div className="font-semibold text-gray-900 font-mono text-sm">{assignment.vehicleVin || vehicleVin || request?.vin || 'Not available'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Vehicle ID</div>
                <div className="font-semibold text-gray-900 font-mono text-sm">{request?.vehicleId || 'Not available'}</div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="font-semibold text-gray-900">{assignment.description || 'No description provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="font-semibold text-gray-900">${assignment.amount?.toFixed?.(2) || request?.amount?.toFixed?.(2) || '0.00'}</div>
              </div>
              {assignment.anyInjuries && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center text-red-700">
                    <span className="mr-2">⚠️</span>
                    <span className="font-medium">Injuries reported in this incident</span>
                  </div>
                </div>
              )}
              {assignment.notes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Assignment Notes</div>
                  <div className="font-semibold text-gray-900">{assignment.notes}</div>
                </div>
              )}
              {assignment.adminNotes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Admin Notes</div>
                  <div className="font-semibold text-gray-900">{assignment.adminNotes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Provider Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Provider Name</div>
                <div className="font-semibold text-gray-900">{assignment.providerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Provider ID</div>
                <div className="font-semibold text-gray-900">{assignment.providerId}</div>
              </div>
            </div>
          </div>

          {/* Photos Section - Use photos from assignment or request */}
          {((assignment.photoURLs && assignment.photoURLs.length > 0) || (request?.photoURLs && request.photoURLs.length > 0)) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Photos ({(assignment.photoURLs || request?.photoURLs || []).length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(assignment.photoURLs || request?.photoURLs || []).map((photoUrl: string, index: number) => (
                  <div 
                    key={index} 
                    className="relative group cursor-pointer"
                    onClick={() => setExpandedPhoto(photoUrl)}
                  >
                    <img
                      src={photoUrl}
                      alt={`Request photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                        Click to expand
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Photo Modal */}
          {expandedPhoto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="relative max-w-full max-h-full">
                <img
                  src={expandedPhoto}
                  alt="Expanded photo"
                  className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  style={{ maxWidth: '95vw', maxHeight: '95vh' }}
                />
                <button
                  onClick={() => setExpandedPhoto(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
