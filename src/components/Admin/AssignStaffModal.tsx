import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

interface AssignStaffModalProps {
  complaintId: string;
  category: string;
  onClose: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  category: string;
  department: string;
  email: string;
  number: string;
}

const AssignStaffModal: React.FC<AssignStaffModalProps> = ({ complaintId, category, onClose }) => {
  const [matchingStaff, setMatchingStaff] = useState<StaffMember[]>([]);
  const [otherStaff, setOtherStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    fetchAllStaffMembers();
  }, [category]);

  const fetchAllStaffMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const allStaffData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];

      // Separate staff into matching and other categories
      const matching = allStaffData.filter(staff => staff.category === category);
      const others = allStaffData.filter(staff => staff.category !== category);

      setMatchingStaff(matching);
      setOtherStaff(others);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff members:', error);
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaff) {
      alert('Please select a staff member');
      return;
    }

    try {
      const selectedMember = [...matchingStaff, ...otherStaff].find(staff => staff.id === selectedStaff);
      await updateDoc(doc(db, 'complaints', complaintId), {
        assignedStaff: {
          id: selectedStaff,
          name: selectedMember?.name,
          email: selectedMember?.email,
          number: selectedMember?.number
        },
        assignedAt: new Date()
      });
      onClose();
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff. Please try again.');
    }
  };

  const renderStaffOption = (staff: StaffMember) => (
    <option key={staff.id} value={staff.id}>
      {staff.name} - {staff.department} ({staff.category})
    </option>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Assign Staff Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">Loading staff members...</div>
          ) : matchingStaff.length === 0 && otherStaff.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              No staff members available
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Staff Member
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
                >
                  <option value="">Select a staff member</option>
                  {matchingStaff.length > 0 && (
                    <optgroup label={`${category} Category Staff`}>
                      {matchingStaff.map(renderStaffOption)}
                    </optgroup>
                  )}
                  {otherStaff.length > 0 && (
                    <optgroup label="Other Category Staff">
                      {otherStaff.map(renderStaffOption)}
                    </optgroup>
                  )}
                </select>
              </div>

              {selectedStaff && (
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Selected Staff Details</h3>
                  {[...matchingStaff, ...otherStaff]
                    .filter((staff) => staff.id === selectedStaff)
                    .map((staff) => (
                      <div key={staff.id} className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {staff.name}</p>
                        <p><span className="font-medium">Department:</span> {staff.department}</p>
                        <p><span className="font-medium">Category:</span> {staff.category}</p>
                        <p><span className="font-medium">Email:</span> {staff.email}</p>
                        <p><span className="font-medium">Contact:</span> {staff.number}</p>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedStaff || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#F27528] hover:bg-[#d65a0f] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Staff
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssignStaffModal; 