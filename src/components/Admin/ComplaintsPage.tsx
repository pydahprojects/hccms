import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import AssignStaffModal from './AssignStaffModal';
import { Pencil } from 'lucide-react';

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
  email: string;
  mobile: string;
  locationType: string;
  locationDetail: string;
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
    number: string;
  };
  assignedAt?: any;
  solutionStatus?: 'pending_approval' | 'approved' | 'declined';
  solutionNote?: string;
  solvedAt?: any;
  declineFeedback?: string;
  statusUpdates?: {
    status: string;
    timestamp: any;
    message: string;
  }[];
}

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    pending: 0,
    'in-progress': 0,
    'almost-done': 0,
    solved: 0,
    rejected: 0
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintToAssign, setComplaintToAssign] = useState<Complaint | null>(null);
  const [solutionModal, setSolutionModal] = useState(false);
  const [selectedComplaintForSolution, setSelectedComplaintForSolution] = useState<Complaint | null>(null);
  const [solutionNote, setSolutionNote] = useState('');

  // Categories from RaiseComplaint
  const categories = [
    { value: 'maintenance', label: 'Room Maintenance' },
    { value: 'food', label: 'Food Quality & Hygiene' },
    { value: 'wifi', label: 'Wi-Fi and Network' },
    { value: 'cleanliness', label: 'Cleanliness' },
    { value: 'security', label: 'Safety and Security' },
    { value: 'hostel', label: 'Hostel Room Issues' },
    { value: 'utilities', label: 'Water and Power Supply' },
    { value: 'academic', label: 'Academic Concerns' },
    { value: 'others', label: 'Others' }
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, selectedCategory, selectedStatus]);

  const fetchComplaints = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'complaints'));
      const complaintsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];

      setComplaints(complaintsData);

      // Calculate status counts
      const counts = {
        total: complaintsData.length,
        pending: complaintsData.filter(c => c.status === 'pending').length,
        'in-progress': complaintsData.filter(c => c.status === 'in-progress').length,
        'almost-done': complaintsData.filter(c => c.status === 'almost-done').length,
        solved: complaintsData.filter(c => c.status === 'solved').length,
        rejected: complaintsData.filter(c => c.status === 'rejected').length
      };
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (selectedCategory) {
      filtered = filtered.filter(complaint => complaint.category === selectedCategory);
    }

    if (selectedStatus) {
      filtered = filtered.filter(complaint => complaint.status === selectedStatus);
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    
    setFilteredComplaints(filtered);
  };

  // Add helper function to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add function to group complaints by date
  const getComplaintsByDate = () => {
    const groups: { [key: string]: typeof filteredComplaints } = {};
    
    filteredComplaints.forEach(complaint => {
      const date = formatDate(complaint.createdAt.toDate());
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(complaint);
    });
    
    return groups;
  };

  const getNextStatuses = (currentStatus: string) => {
    if (currentStatus === 'rejected') {
      return ['solved'];
    }
    const statusFlow = ['pending', 'in-progress', 'almost-done', 'solved'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return statusFlow.slice(currentIndex);
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string, currentStatus: string) => {
    const allowedStatuses = getNextStatuses(currentStatus);
    if (!allowedStatuses.includes(newStatus)) {
      alert('Cannot change to a previous status. Status can only move forward.');
      return;
    }

    if (newStatus === 'solved' || currentStatus === 'rejected') {
      setSelectedComplaintForSolution({ ...complaints.find(c => c.id === complaintId)! });
      setSolutionModal(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: newStatus,
        updatedAt: new Date()
      });
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  const submitSolution = async () => {
    if (!solutionNote.trim()) {
      alert('Please provide a solution note');
      return;
    }

    try {
      const newStatusUpdate = {
        status: 'solved',
        timestamp: new Date(),
        message: `New solution provided: ${solutionNote}`
      };

      const existingUpdates = selectedComplaintForSolution?.statusUpdates || [];

      await updateDoc(doc(db, 'complaints', selectedComplaintForSolution!.id), {
        status: 'solved',
        solutionStatus: 'pending_approval',
        solutionNote: solutionNote,
        solvedAt: new Date(),
        updatedAt: new Date(),
        statusUpdates: [...existingUpdates, newStatusUpdate]
      });
      setSolutionModal(false);
      setSolutionNote('');
      setSelectedComplaintForSolution(null);
      fetchComplaints();
      alert('Solution submitted for student approval');
    } catch (error) {
      console.error('Error submitting solution:', error);
      alert('Failed to submit solution. Please try again.');
    }
  };

  const getStatusBadgeClass = (status: string, solutionStatus?: string) => {
    if (status === 'solved') {
      switch (solutionStatus) {
        case 'pending_approval':
          return 'bg-yellow-100 text-yellow-800';
        case 'approved':
          return 'bg-green-100 text-green-800';
        case 'declined':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'almost-done':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Complaints Management</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Total Complaints</h3>
          <p className="text-3xl font-bold text-[#F27528]">{statusCounts.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-500">{statusCounts.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">In Progress</h3>
          <p className="text-3xl font-bold text-blue-500">{statusCounts['in-progress']}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Almost Done</h3>
          <p className="text-3xl font-bold text-purple-500">{statusCounts['almost-done']}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Solved</h3>
          <p className="text-3xl font-bold text-green-500">{statusCounts.solved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-500">{statusCounts.rejected}</p>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Complaints List</h3>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="almost-done">Almost Done</option>
              <option value="solved">Solved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(getComplaintsByDate()).map(([date, complaints]) => (
                <React.Fragment key={date}>
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="px-6 py-3">
                      <h3 className="text-sm font-bold text-gray-900">{date}</h3>
                    </td>
                  </tr>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{complaint.token}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{complaint.name}</p>
                          <p className="text-xs text-gray-500">{complaint.studentId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{complaint.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{complaint.locationType}</p>
                          <p className="text-xs text-gray-500">{complaint.locationDetail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {complaint.status === 'rejected' ? (
                            <>
                              <div className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(complaint.status, complaint.solutionStatus)} flex items-center justify-between`}>
                                <span>{complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ')}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedComplaintForSolution(complaint);
                                  setSolutionModal(true);
                                }}
                                className="text-xs bg-[#F27528] text-white px-2 py-1 rounded-full hover:bg-[#d65a0f] transition-colors mt-1 flex items-center justify-center"
                              >
                                Send New Solution
                              </button>
                            </>
                          ) : (
                            <select
                              value={complaint.status}
                              onChange={(e) => updateComplaintStatus(complaint.id, e.target.value, complaint.status)}
                              className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(complaint.status, complaint.solutionStatus)}`}
                              disabled={complaint.status === 'solved' && complaint.solutionStatus === 'pending_approval'}
                            >
                              {getNextStatuses(complaint.status).map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {complaint.status === 'solved' && (
                            <span className="text-xs">
                              {complaint.solutionStatus === 'pending_approval' && '(Waiting for approval)'}
                              {complaint.solutionStatus === 'approved' && '(Approved)'}
                              {complaint.solutionStatus === 'declined' && '(Declined)'}
                            </span>
                          )}
                          
                          {complaint.declineFeedback && complaint.solutionStatus === 'declined' && (
                            <div className="relative group">
                              <div className="cursor-help text-xs text-red-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Student Feedback</span>
                              </div>
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <div className="text-sm text-gray-700">
                                  <strong className="block mb-1">Decline Feedback:</strong>
                                  {complaint.declineFeedback}
                                </div>
                                <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {complaint.createdAt.toDate().toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {complaint.assignedStaff ? (
                          <div className="text-sm">
                            <p className="font-medium mb-1">{complaint.assignedStaff.name}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{complaint.assignedStaff.number}</span>
                              <button
                                onClick={() => setComplaintToAssign(complaint)}
                                className="text-blue-600 hover:text-blue-800 ml-2"
                                title="Edit/Reassign Staff"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setComplaintToAssign(complaint)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Assign Staff
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-[#F27528] hover:text-[#d65a0f] mr-3"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {/* Assign Staff Modal */}
      {complaintToAssign && (
        <AssignStaffModal
          complaintId={complaintToAssign.id}
          category={complaintToAssign.category}
          onClose={() => {
            setComplaintToAssign(null);
            fetchComplaints(); // Refresh the complaints list after assignment
          }}
        />
      )}

      {/* Solution Modal */}
      {solutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedComplaintForSolution?.status === 'rejected' 
                ? 'Submit New Solution for Approval'
                : 'Submit Solution'}
            </h3>
            
            {selectedComplaintForSolution?.status === 'rejected' && (
              <div className="mb-4 bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">Previous Rejection Feedback:</h4>
                <p className="text-sm text-red-700">{selectedComplaintForSolution.declineFeedback}</p>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-4">
              {selectedComplaintForSolution?.status === 'rejected'
                ? 'Please provide an updated solution addressing the student\'s feedback. This will be sent directly for their approval.'
                : 'Please provide details about how the complaint was resolved. This will be sent to the student for approval.'}
            </p>

            {selectedComplaintForSolution?.statusUpdates && selectedComplaintForSolution.statusUpdates.length > 0 && (
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Solution History:</h4>
                <div className="space-y-2">
                  {selectedComplaintForSolution.statusUpdates
                    .filter(update => update.status === 'rejected' || update.message.includes('New solution provided'))
                    .map((update, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-600">
                          {update.timestamp.toDate().toLocaleDateString()} - {update.message}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <textarea
              value={solutionNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSolutionNote(e.target.value)}
              placeholder="Describe the solution..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent min-h-[120px]"
              required
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setSolutionModal(false);
                  setSolutionNote('');
                  setSelectedComplaintForSolution(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitSolution}
                className="px-4 py-2 text-sm font-medium text-white bg-[#F27528] hover:bg-[#d65a0f] rounded-md transition-colors"
              >
                {selectedComplaintForSolution?.status === 'rejected' ? 'Send for Approval' : 'Submit Solution'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage; 