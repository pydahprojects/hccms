import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { Phone, User, Mail, FileText, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const db = getFirestore();

interface StudentData {
  name: string;
  studentId: string;
  mobile: string;
  email: string;
}

interface Complaint {
  id: string;
  token: string;
  category: string;
  description: string;
  status: string;
  createdAt: any;
  solutionStatus?: string;
}

const StudentProfile = () => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const mobileNumber = localStorage.getItem('studentMobile');
    if (!mobileNumber) {
      navigate('/student-login');
      return;
    }
    fetchStudentData(mobileNumber);
  }, [navigate]);

  const fetchStudentData = async (mobile: string) => {
    try {
      // Fetch student details
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        navigate('/student-login');
        return;
      }

      // Get student data from the first complaint
      const firstComplaint = querySnapshot.docs[0].data();
      setStudentData({
        name: firstComplaint.name,
        studentId: firstComplaint.studentId,
        mobile: firstComplaint.mobile,
        email: firstComplaint.email
      });

      // Get all complaints
      const complaintsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];

      // Sort complaints by date (newest first)
      complaintsData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
      
      setComplaints(complaintsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, solutionStatus?: string) => {
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentMobile');
    navigate('/student-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F27528]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Student Profile</h2>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>

          {studentData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#F27528]" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{studentData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#F27528]" />
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium">{studentData.studentId}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#F27528]" />
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-medium">{studentData.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#F27528]" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{studentData.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complaints Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Complaint History</h3>
          
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div className="mb-2 md:mb-0">
                      <Link 
                        to={`/track-complaint?token=${complaint.token}`}
                        className="font-medium text-[#F27528] hover:text-[#d65a0f] transition-colors"
                      >
                        {complaint.token}
                      </Link>
                      <p className="text-sm text-gray-500">Category: {complaint.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(complaint.status, complaint.solutionStatus)}`}>
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        {complaint.status === 'solved' && complaint.solutionStatus && (
                          ` (${complaint.solutionStatus.replace('_', ' ').charAt(0).toUpperCase() + complaint.solutionStatus.slice(1)}`
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{complaint.description.substring(0, 100)}...</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{complaint.createdAt.toDate().toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 