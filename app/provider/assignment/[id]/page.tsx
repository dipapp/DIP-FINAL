'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

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
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignedAt: Date;
  dueDate?: Date;
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

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = Array.isArray(params?.id) ? params?.id[0] : (params as any)?.id;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [vehicleVin, setVehicleVin] = useState<string | null>(null);
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProviderInfo(user);
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch assignment data once we have the ID - don't wait for provider ID
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId]);

  const fetchProviderInfo = async (user: any) => {
    try {
      if (!user) return;
      
      // Get provider profile from provider_profiles collection using user UID
      const providerProfileDoc = await getDoc(doc(db, 'provider_profiles', user.uid));
      
      if (providerProfileDoc.exists()) {
        const providerData = providerProfileDoc.data();
        const providerId = providerData.providerId || 'Unknown ID';
        setCurrentProviderId(providerId);
      } else {
        // Fallback: try to get from users collection
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const providerId = userData.providerId || 'Unknown ID';
          setCurrentProviderId(providerId);
        }
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
    }
  };

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
      
      // Fetch original request details - iOS uses 'requests' collection
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
          <Link href="/provider/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
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
              <Link href="/provider/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Details</h1>
                <p className="text-sm text-gray-600">{assignment.vehicleInfo || `${request?.vehicleYear || ''} ${request?.vehicleMake || ''} ${request?.vehicleModel || ''}`.trim()}</p>
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
                <>
                  <button
                    onClick={() => updateAssignmentStatus('accepted')}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Accept Assignment'}
                  </button>
                  <button
                    onClick={() => updateAssignmentStatus('cancelled')}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Decline Assignment
                  </button>
                </>
              )}
              {assignment.status === 'accepted' && (
                <button
                  onClick={() => updateAssignmentStatus('in_progress')}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Start Work'}
                </button>
              )}
              {assignment.status === 'in_progress' && (
                <button
                  onClick={() => updateAssignmentStatus('completed')}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Mark Complete'}
                </button>
              )}
              {assignment.status === 'completed' && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  ✅ Assignment Completed
                </span>
              )}
            </div>
          </div>

          {/* Member Contact Information - Prominent section for providers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Full Name</div>
                <div className="font-semibold text-gray-900 text-lg">{assignment.customerName || `${request?.userFirstName || ''} ${request?.userLastName || ''}`.trim() || 'Not available'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                {(assignment.customerPhone && assignment.customerPhone !== 'Not provided') || request?.userPhoneNumber ? (
                  <div className="flex items-center space-x-3">
                    <a 
                      href={`tel:${assignment.customerPhone || request?.userPhoneNumber}`}
                      className="font-semibold text-blue-600 text-lg hover:text-blue-800 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {assignment.customerPhone || request?.userPhoneNumber}
                    </a>
                    <a 
                      href={`sms:${assignment.customerPhone || request?.userPhoneNumber}`}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      Text
                    </a>
                  </div>
                ) : (
                  <div className="font-semibold text-red-600">No phone number provided</div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Email</div>
                {(assignment.customerEmail && assignment.customerEmail !== 'Not provided') || request?.userEmail ? (
                  <a 
                    href={`mailto:${assignment.customerEmail || request?.userEmail}`}
                    className="font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {assignment.customerEmail || request?.userEmail}
                  </a>
                ) : (
                  <div className="font-semibold text-gray-500">Not available</div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Year, Make, Model</div>
                <div className="font-semibold text-gray-900">{assignment.vehicleInfo || `${request?.vehicleYear || ''} ${request?.vehicleMake || ''} ${request?.vehicleModel || ''}`.trim() || 'Not available'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">License Plate</div>
                <div className="font-semibold text-gray-900">{request?.licensePlate || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">VIN</div>
                <div className="font-semibold text-gray-900 font-mono text-sm">{assignment.vehicleVin || vehicleVin || request?.vin || 'Not provided'}</div>
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
                <div className="text-sm text-gray-600 mb-1">Service Description</div>
                <div className="font-semibold text-gray-900">{assignment.issueDescription || request?.issueDescription || request?.description || 'No description provided'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Location</div>
                <div className="font-semibold text-gray-900">{assignment.location || request?.location || 'Not specified'}</div>
              </div>
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




























