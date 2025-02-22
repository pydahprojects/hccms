import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

const db = getFirestore();

const StudentLogin = () => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Format the mobile number to ensure consistent matching
      const formattedMobile = mobile.trim();

      // Check if mobile number exists in complaints
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, where('mobile', '==', formattedMobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No student found with this mobile number. Please raise a complaint first.');
        setLoading(false);
        return;
      }

      // Store mobile number in localStorage
      localStorage.setItem('studentMobile', formattedMobile);
      
      // Navigate to profile
      navigate('/student-profile');
    } catch (error) {
      console.error('Error checking mobile number:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#F27528]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-[#F27528]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Student Login</h2>
            <p className="text-gray-600 mt-2">
              Enter your registered mobile number to access your profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                placeholder="Enter your mobile number"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-300 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#F27528] hover:bg-[#d65a0f] text-white'
              }`}
            >
              {loading ? 'Checking...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Haven't raised a complaint yet?{' '}
              <button
                onClick={() => navigate('/raise-complaint')}
                className="text-[#F27528] hover:text-[#d65a0f] font-medium"
              >
                Raise a Complaint
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentLogin; 