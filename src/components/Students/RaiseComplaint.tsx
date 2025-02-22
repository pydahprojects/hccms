import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
const storage = getStorage(app);

interface ComplaintData {
  name: string;
  studentId: string;
  mobile: string;
  email: string;
  category: string;
  customCategory?: string;
  locationType: string;
  locationDetail: string;
  description: string;
  attachments?: FileList | null;
  token?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  attachmentUrls?: string[];
}

const RaiseComplaint = () => {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    mobile: '',
    email: '',
    category: '',
    customCategory: '',
    locationType: '',
    locationDetail: '',
    description: '',
    attachments: null as FileList | null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedToken, setSubmittedToken] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is registered
    const registeredMobile = localStorage.getItem('studentMobile');
    if (registeredMobile) {
      // Fetch user data from previous complaints
      fetchUserData(registeredMobile);
    }
  }, []);

  const fetchUserData = async (mobile: string) => {
    try {
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setFormData(prev => ({
          ...prev,
          name: userData.name,
          studentId: userData.studentId,
          mobile: userData.mobile,
          email: userData.email
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const generateComplaintToken = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `HCCMS-${timestamp}-${random}`;
  };

  const uploadFiles = async (files: FileList, complaintId: string) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const storageRef = ref(storage, `complaints/${complaintId}/${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const complaintToken = generateComplaintToken();
      setSubmittedToken(complaintToken);
      const timestamp = new Date();

      // Use custom category if category is "others"
      const finalCategory = formData.category === 'others' ? formData.customCategory : formData.category;

      // Prepare complaint data
      const complaintData: ComplaintData = {
        name: formData.name,
        studentId: formData.studentId,
        mobile: formData.mobile,
        email: formData.email,
        category: finalCategory,
        locationType: formData.locationType,
        locationDetail: formData.locationDetail,
        description: formData.description,
        token: complaintToken,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        attachmentUrls: []
      };

      // Add complaint to Firestore
      const docRef = await addDoc(collection(db, 'complaints'), complaintData);

      // Upload files if any
      if (formData.attachments && formData.attachments.length > 0) {
        const fileUrls = await uploadFiles(formData.attachments, docRef.id);
        
        // Update the document with file URLs
        await updateDoc(doc(db, 'complaints'), {
          id: docRef.id,
          attachmentUrls: fileUrls,
          updatedAt: new Date(),
        });
      }

      // Store mobile number in localStorage if not already stored
      if (!localStorage.getItem('studentMobile')) {
        localStorage.setItem('studentMobile', formData.mobile);
      }

      // Reset form except for user details if registered
      const registeredMobile = localStorage.getItem('studentMobile');
      if (registeredMobile) {
        setFormData(prev => ({
          ...prev,
          category: '',
          customCategory: '',
          locationType: '',
          locationDetail: '',
          description: '',
          attachments: null
        }));
      } else {
      setFormData({
        name: '',
        studentId: '',
        mobile: '',
        email: '',
        category: '',
        customCategory: '',
        locationType: '',
        locationDetail: '',
        description: '',
        attachments: null
      });
      }

      // Show success modal
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      setSubmitError('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset custom category when category changes and it's not "others"
      ...(name === 'category' && value !== 'others' && { customCategory: '' })
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: e.target.files
      }));
    }
  };

  const generateTokenPDF = (token: string) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Add HCCMS logo/header
    doc.setFillColor(242, 117, 40); // #F27528
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('HCCMS', doc.internal.pageSize.width/2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Hostel & Campus Complaint Management System', doc.internal.pageSize.width/2, 30, { align: 'center' });

    // Add token information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Complaint Token', doc.internal.pageSize.width/2, 60, { align: 'center' });
    
    // Add token in a box
    doc.setDrawColor(242, 117, 40);
    doc.setLineWidth(0.5);
    doc.rect(20, 70, doc.internal.pageSize.width - 40, 30);
    
    doc.setFontSize(20);
    doc.setTextColor(242, 117, 40);
    doc.text(token, doc.internal.pageSize.width/2, 88, { align: 'center' });

    // Add footer text
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Please keep this token safe for tracking your complaint status.', doc.internal.pageSize.width/2, 120, { align: 'center' });
    doc.text('Visit the Track Complaint page to check your complaint status.', doc.internal.pageSize.width/2, 126, { align: 'center' });

    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, doc.internal.pageSize.width/2, 140, { align: 'center' });

    // Save the PDF
    doc.save(`HCCMS-Complaint-Token-${token}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="overflow-hidden whitespace-nowrap mb-8">
          <motion.h1 
            className="text-3xl font-bold text-[#F27528] inline-block"
            animate={{
              x: ["100%", "-100%"]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            Raise a Complaint In HCCMS Portal
          </motion.h1>
        </div>
        
        {/* Add Profile Link for Registered Users */}
        {localStorage.getItem('studentMobile') && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 flex justify-between items-center">
            <p className="text-blue-700">
              Welcome back! You are raising a complaint as a registered user.
            </p>
            <button
              onClick={() => navigate('/student-profile')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Profile
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {submitError && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {submitError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Student ID Field */}
            <div>
              <label htmlFor="studentId" className="block text-gray-700 font-medium mb-2">
                Student ID *
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                required
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter your student ID"
              />
            </div>

            {/* Mobile Field */}
            <div>
              <label htmlFor="mobile" className="block text-gray-700 font-medium mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter your mobile number"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            {/* Category Field */}
            <div className="space-y-6">
              <div>
                <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                  Complaint Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="maintenance">Room Maintenance</option>
                  <option value="food">Food Quality & Hygiene</option>
                  <option value="wifi">Wi-Fi and Network</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="security">Safety and Security</option>
                  <option value="hostel">Hostel Room Issues</option>
                  <option value="utilities">Water and Power Supply</option>
                  <option value="academic">Academic Concerns</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {/* Custom Category Input - Shows only when "Others" is selected */}
              {formData.category === 'others' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="customCategory" className="block text-gray-700 font-medium mb-2">
                    Specify Category *
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    name="customCategory"
                    required
                    value={formData.customCategory}
                    onChange={handleInputChange}
                    placeholder="Enter your complaint category"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                  />
                </motion.div>
              )}
            </div>

            {/* Location Type Field */}
            <div>
              <label htmlFor="locationType" className="block text-gray-700 font-medium mb-2">
                Location Type *
              </label>
              <select
                id="locationType"
                name="locationType"
                required
                value={formData.locationType}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
              >
                <option value="">Select location type</option>
                <option value="hostel">Hostel</option>
                <option value="college">College</option>
              </select>
            </div>

            {/* Location Detail Field */}
            <div>
              <label htmlFor="locationDetail" className="block text-gray-700 font-medium mb-2">
                Location Details *
              </label>
              <input
                type="text"
                id="locationDetail"
                name="locationDetail"
                required
                value={formData.locationDetail}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter specific location (e.g., Room number, Floor, Block)"
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Provide detailed description of your complaint"
              ></textarea>
            </div>

            {/* Attachments Field */}
            <div>
              <label htmlFor="attachments" className="block text-gray-700 font-medium mb-2">
                Attachments (Photo/Video) - Optional
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                onChange={handleFileChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                accept="image/*,video/*"
                multiple
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: Images (JPG, PNG) and Videos (MP4)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-300 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#F27528] hover:bg-[#d65a0f] text-white'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">Your complaint has been registered with token:</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-xl font-mono font-bold text-[#F27528]">{submittedToken}</p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Please save this token number for tracking your complaint status.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => generateTokenPDF(submittedToken)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F27528] text-white rounded-md hover:bg-[#d65a0f] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Download Token
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setFormData({
                        name: '',
                        studentId: '',
                        mobile: '',
                        email: '',
                        category: '',
                        customCategory: '',
                        locationType: '',
                        locationDetail: '',
                        description: '',
                        attachments: null
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaiseComplaint; 