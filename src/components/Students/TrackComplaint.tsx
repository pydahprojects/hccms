import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, query, where, getDocs, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import ComplaintDetails from './ComplaintDetails';
import { Trash2, AlertCircle, ArrowLeft, Search, Circle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBBI_wnLhnjLer5fj_GX3g0O4XWf09wj8",
  authDomain: "hccms-60949.firebaseapp.com",
  projectId: "hccms-60949",
  storageBucket: "hccms-60949.firebasestorage.app",
  messagingSenderId: "1068287700605",
  appId: "1:1068287700605:web:a82b45ae0741c4076d4b14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Complaint {
  id: string;
  token: string;
  name: string;
  studentId: string;
  category: string;
  description: string;
  status: string;
  createdAt: any;
  locationType: string;
  locationDetail: string;
  attachmentUrls?: string[];
  solutionStatus?: 'pending_approval' | 'approved' | 'declined';
  solutionNote?: string;
  solvedAt?: any;
  declineFeedback?: string;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
    department: string;
    assignedAt: any;
  };
  statusUpdates?: {
    status: string;
    timestamp: any;
    message: string;
  }[];
}

const TrackComplaint = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trackingToken, setTrackingToken] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [complaintForApproval, setComplaintForApproval] = useState<Complaint | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [declineFeedback, setDeclineFeedback] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add effect to handle token from URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setTrackingToken(tokenFromUrl);
      handleTrackComplaint(null, tokenFromUrl);
    }
  }, [searchParams]);

  // Fetch recent solved complaints
  useEffect(() => {
    const fetchRecentSolvedComplaints = async () => {
      try {
        const q = query(
          collection(db, 'complaints'),
          where('status', '==', 'solved'),
          where('solutionStatus', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const complaints: Complaint[] = [];
        querySnapshot.forEach((doc) => {
          complaints.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        
        console.log('Fetched solved complaints:', complaints); // Debug log
        setRecentComplaints(complaints);
      } catch (error) {
        console.error('Error fetching recent complaints:', error);
      }
    };

    fetchRecentSolvedComplaints();
  }, []);

  // Modify handleTrackComplaint to accept optional event and token parameters
  const handleTrackComplaint = async (e?: React.FormEvent | null, tokenToTrack?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearchError(null);

    const tokenToSearch = tokenToTrack || trackingToken;

    try {
      const q = query(
        collection(db, 'complaints'),
        where('token', '==', tokenToSearch)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setSearchError('No complaint found with this tracking token');
        return;
      }

      const complaintData = { 
        id: querySnapshot.docs[0].id, 
        ...querySnapshot.docs[0].data() 
      } as Complaint;
      
      setSelectedComplaint(complaintData);
      setShowDetails(true);
    } catch (error) {
      console.error('Error tracking complaint:', error);
      setSearchError('Failed to track complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolutionResponse = async (approved: boolean) => {
    if (!selectedComplaint) return;

    if (!approved) {
      setShowFeedbackModal(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        solutionStatus: 'approved',
        updatedAt: new Date()
      });

      setSelectedComplaint({
        ...selectedComplaint,
        solutionStatus: 'approved' as const
      });

      alert('Solution approved successfully!');
    } catch (error) {
      console.error('Error updating solution status:', error);
      alert('Failed to update solution status. Please try again.');
    }
  };

  const handleDeclineWithFeedback = async () => {
    if (!selectedComplaint || !declineFeedback.trim()) {
      alert('Please provide feedback before declining');
      return;
    }

    try {
      const newStatusUpdate = {
        status: 'rejected',
        timestamp: new Date(),
        message: `Solution declined: ${declineFeedback}`
      };

      const existingUpdates = selectedComplaint.statusUpdates || [];

      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        status: 'rejected',
        solutionStatus: 'declined',
        declineFeedback: declineFeedback,
        updatedAt: new Date(),
        statusUpdates: [...existingUpdates, newStatusUpdate]
      });

      setSelectedComplaint({
        ...selectedComplaint,
        status: 'rejected',
        solutionStatus: 'declined',
        declineFeedback: declineFeedback,
        statusUpdates: [...existingUpdates, newStatusUpdate]
      });

      setShowFeedbackModal(false);
      setDeclineFeedback('');
      alert('Solution declined and feedback sent successfully!');
    } catch (error) {
      console.error('Error updating solution status:', error);
      alert('Failed to update solution status. Please try again.');
    }
  };

  const handleDeleteClick = (complaint: Complaint) => {
    setComplaintToDelete(complaint);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!complaintToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'complaints', complaintToDelete.id));
      
      setRecentComplaints(prev => prev.filter(c => c.id !== complaintToDelete.id));
      
      if (selectedComplaint?.id === complaintToDelete.id) {
        setSelectedComplaint(null);
        setShowDetails(false);
      }

      setShowDeleteModal(false);
      alert('Complaint deleted successfully!');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint. Please try again.');
    } finally {
      setIsDeleting(false);
      setComplaintToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600';
      case 'in-progress':
        return 'text-blue-600';
      case 'almost-done':
        return 'text-orange-600';
      case 'solved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    return (
      <div className={`absolute left-[-1.5rem] mt-1.5 w-4 h-4 rounded-full border-2 ${
        isActive 
          ? 'bg-green-500 border-green-500' 
          : 'bg-white border-gray-300'
      }`}>
        {isActive && <Circle className="w-full h-full text-white" />}
      </div>
    );
  };

  const renderStatusTimeline = (complaint: Complaint) => {
    // Create base stages array
    let stages = [
      {
        status: 'Pending',
        message: 'Your complaint has been registered and is pending review.',
        timestamp: complaint.createdAt,
        isActive: true
      },
      {
        status: 'In Progress',
        message: complaint.assignedStaff 
          ? `Assigned to ${complaint.assignedStaff.name} from ${complaint.assignedStaff.department} department.`
          : 'Your complaint is being processed by our staff.',
        timestamp: complaint.assignedStaff?.assignedAt || complaint.statusUpdates?.find(u => u.status === 'in-progress')?.timestamp || complaint.createdAt,
        isActive: ['in-progress', 'almost-done', 'solved', 'rejected'].includes(complaint.status.toLowerCase())
      },
      {
        status: 'Almost Done',
        message: 'Final review of your complaint resolution.',
        timestamp: complaint.statusUpdates?.find(u => u.status === 'almost-done')?.timestamp || complaint.createdAt,
        isActive: ['almost-done', 'solved', 'rejected'].includes(complaint.status.toLowerCase())
      }
    ];

    // Add rejection stages from status updates
    const rejectionUpdates = complaint.statusUpdates?.filter(update => update.status === 'rejected') || [];
    rejectionUpdates.forEach((rejection, index) => {
      stages.push({
        status: 'Rejected',
        message: `Solution declined: ${complaint.declineFeedback}`,
        timestamp: rejection.timestamp,
        isActive: true
      });
      
      // Add a new "Almost Done" stage after each rejection except the last one
      if (index < rejectionUpdates.length - 1) {
        stages.push({
          status: 'Almost Done',
          message: 'Reviewing updated solution.',
          timestamp: complaint.statusUpdates?.find(u => 
            u.timestamp > rejection.timestamp && u.status === 'almost-done'
          )?.timestamp,
          isActive: true
        });
      }
    });

    // Add final solved stage if complaint is solved
    if (complaint.status.toLowerCase() === 'solved') {
      stages.push({
        status: 'Solved',
        message: 'Your complaint has been successfully resolved.',
        timestamp: complaint.solvedAt || complaint.createdAt,
        isActive: true
      });
    }

    return (
      <div className="relative pl-8 mt-8">
        {stages.map((stage, index) => (
          <div key={index} className="mb-8 relative">
            {/* Status Circle */}
            <div className={`absolute left-[-1.5rem] mt-1.5 w-4 h-4 rounded-full border-2 ${
              stage.isActive 
                ? stage.status.toLowerCase() === 'rejected'
                  ? 'bg-red-500 border-red-500'
                  : 'bg-green-500 border-green-500'
                : 'bg-white border-gray-300'
            }`}>
              {stage.isActive && <Circle className="w-full h-full text-white" />}
            </div>
            
            {/* Connecting Line */}
            {index < stages.length - 1 && (
              <div className={`absolute left-[-1.3rem] top-4 h-[calc(100%+2rem)] w-0.5 ${
                stage.isActive
                  ? stage.status.toLowerCase() === 'rejected'
                    ? 'bg-red-500'
                    : 'bg-green-500'
                  : 'bg-gray-200'
              }`} />
            )}

            {/* Content */}
            <div className={`transition-colors ${stage.isActive ? 'opacity-100' : 'opacity-60'}`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-semibold ${
                  stage.isActive 
                    ? stage.status.toLowerCase() === 'rejected'
                      ? 'text-red-600'
                      : 'text-gray-900'
                    : 'text-gray-500'
                }`}>
                  {stage.status}
                </h3>
                {stage.timestamp && (
                  <span className="text-gray-500 text-sm font-normal">
                    {stage.timestamp?.toDate ? formatDate(stage.timestamp.toDate()) : ''}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                stage.isActive ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {stage.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => {
              setShowDetails(false);
              setSelectedComplaint(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold ml-2">Track Complaint</h1>
        </div>
        
        {!showDetails ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Search Form */}
            <form onSubmit={handleTrackComplaint} className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={trackingToken}
                  onChange={(e) => setTrackingToken(e.target.value)}
                  placeholder="Enter complaint tracking number"
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {searchError && (
                <p className="mt-2 text-red-600 text-sm">{searchError}</p>
              )}
            </form>

            {/* Recent Complaints Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Solved Complaints</h2>
              
              {recentComplaints.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="mb-4">
                    <svg 
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No Solved Complaints Yet
                  </h3>
                  <p className="text-gray-500">
                    There are no solved complaints to display at the moment.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{complaint.token}</h3>
                          <p className="text-sm text-gray-600">Category: {complaint.category}</p>
                        </div>
                        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                          Solved
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{complaint.description?.substring(0, 100)}...</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          {complaint.createdAt?.toDate().toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetails(true);
                          }}
                          className="text-[#F27528] hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleDeleteClick(complaint)}
                          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {selectedComplaint && (
              <>
                {/* Complaint Header */}
                <div className="border-b pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">
                        Complaint #{selectedComplaint.token}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        Filed on {selectedComplaint.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                      selectedComplaint.status === 'solved' 
                        ? 'bg-green-100 text-green-800'
                        : selectedComplaint.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student Name</h3>
                      <p className="mt-1 text-gray-900">{selectedComplaint.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Student ID</h3>
                      <p className="mt-1 text-gray-900">{selectedComplaint.studentId}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Category</h3>
                      <p className="mt-1 text-gray-900">{selectedComplaint.category}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location Type</h3>
                      <p className="mt-1 text-gray-900">{selectedComplaint.locationType}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location Detail</h3>
                      <p className="mt-1 text-gray-900">{selectedComplaint.locationDetail}</p>
                    </div>
                    {selectedComplaint.attachmentUrls && selectedComplaint.attachmentUrls.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Attachments</h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedComplaint.attachmentUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Attachment {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complaint Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>
                </div>

                {/* Staff Assignment Details */}
                {selectedComplaint.assignedStaff && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned Staff</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500 mb-1">Name</span>
                          <p className="text-gray-900">{selectedComplaint.assignedStaff.name}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500 mb-1">Department</span>
                          <p className="text-gray-900">{selectedComplaint.assignedStaff.department || 'Not specified'}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500 mb-1">Email</span>
                          <p className="text-gray-900">{selectedComplaint.assignedStaff.email}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500 mb-1">Assigned On</span>
                          <p className="text-gray-900">
                            {selectedComplaint.assignedStaff.assignedAt && typeof selectedComplaint.assignedStaff.assignedAt.toDate === 'function'
                              ? formatDate(selectedComplaint.assignedStaff.assignedAt.toDate())
                              : 'Date not available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Status Updates</h3>
                  {renderStatusTimeline(selectedComplaint)}
                </div>

                {/* Solution Details */}
                {selectedComplaint.status === 'solved' && (
                  <div className="space-y-4">
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Resolution Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-500">Status:</span>
                          <span className={`ml-2 ${getStatusColor(selectedComplaint.solutionStatus || '')}`}>
                            {selectedComplaint.solutionStatus}
                          </span>
                        </div>
                        {selectedComplaint.solutionNote && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Solution Note:</span>
                            <p className="mt-1 text-gray-900">{selectedComplaint.solutionNote}</p>
                          </div>
                        )}
                        {selectedComplaint.declineFeedback && (
                          <div className="mt-4">
                            <span className="text-sm font-medium text-gray-500">Decline Feedback:</span>
                            <p className="mt-1 text-gray-900">{selectedComplaint.declineFeedback}</p>
                          </div>
                        )}
                        {selectedComplaint.solvedAt && (
                          <div className="mt-4 text-sm text-gray-500">
                            Resolved on: {selectedComplaint.solvedAt.toDate().toLocaleDateString()}
                          </div>
                        )}

                        {/* Solution Approval Section */}
                        {selectedComplaint.solutionStatus === 'pending_approval' && (
                          <div className="mt-6 border-t pt-4">
                            <div className="flex items-center mb-4">
                              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
                              <p className="text-sm text-gray-700">
                                Please review the solution and approve or decline
                              </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => handleSolutionResponse(false)}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Decline Solution
                  </button>
                  <button
                    onClick={() => handleSolutionResponse(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Approve Solution
                  </button>
                </div>
              </div>
            )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Delete Option */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleDeleteClick(selectedComplaint)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Complaint
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Provide Feedback</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please explain why you are declining the solution. This will help the staff better address your concerns.
            </p>
            <textarea
              value={declineFeedback}
              onChange={(e) => setDeclineFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent min-h-[120px]"
              required
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setDeclineFeedback('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineWithFeedback}
                disabled={!declineFeedback.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500 w-6 h-6" />
              <h3 className="text-xl font-semibold text-gray-900">Delete Complaint</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this complaint? This action cannot be undone.
              <br />
              <span className="font-medium">Token: {complaintToDelete?.token}</span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setComplaintToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaint; 