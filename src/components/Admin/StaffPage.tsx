import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { Pencil, Trash2, Plus, PhoneIcon, AlertTriangle } from 'lucide-react';

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

interface StaffMember {
  id: string;
  name: string;
  number: string;
  category: string;
  email: string;
  department: string;
}

const StaffPage = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [filters, setFilters] = useState({
    department: '',
    category: '',
    searchQuery: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    category: '',
    customCategory: '',
    email: '',
    department: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Add departments array
  const departments = [
    { value: 'ECE', label: 'ECE' },
    { value: 'CSE', label: 'CSE' },
    { value: 'MECH', label: 'MECH' },
    { value: 'AGRI', label: 'AGRI' }
  ];

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  useEffect(() => {
    filterStaffMembers();
  }, [staffMembers, filters]);

  const filterStaffMembers = () => {
    let filtered = [...staffMembers];

    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(staff => staff.department === filters.department);
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(staff => staff.category === filters.category);
    }

    // Filter by search query (name or email)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(staff => 
        staff.name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query)
      );
    }

    setFilteredStaff(filtered);
  };

  const fetchStaffMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'staff'));
      const staff = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMember[];
      setStaffMembers(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staffData = {
        name: formData.name,
        number: formData.number,
        category: formData.category === 'others' ? formData.customCategory : formData.category,
        email: formData.email,
        department: formData.department
      };

      if (isEditing && currentStaff) {
        await updateDoc(doc(db, 'staff', currentStaff.id), staffData);
      } else {
        await addDoc(collection(db, 'staff'), staffData);
      }
      
      setIsModalOpen(false);
      setIsEditing(false);
      setCurrentStaff(null);
      resetForm();
      fetchStaffMembers();
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const handleDelete = async (staff: StaffMember) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'staff', staffToDelete.id));
      fetchStaffMembers();
      setShowDeleteModal(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      number: staff.number,
      category: staff.category,
      customCategory: categories.some(c => c.value === staff.category) ? '' : staff.category,
      email: staff.email,
      department: staff.department
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      category: '',
      customCategory: '',
      email: '',
      department: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        <button
          onClick={() => {
            resetForm();
            setIsEditing(false);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#F27528] text-white px-4 py-2 rounded-md hover:bg-[#d65a0f] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Staff
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Staff
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by name or email..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#F27528] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Stats */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStaff.length} of {staffMembers.length} staff members
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{staff.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{staff.number}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{staff.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{staff.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{staff.department}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(staff)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredStaff.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No staff members found matching your filters</p>
              <button
                onClick={() => setFilters({ department: '', category: '', searchQuery: '' })}
                className="mt-2 text-[#F27528] hover:text-[#d65a0f]"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Number</label>
                <input
                  type="tel"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              {formData.category === 'others' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Specify Category</label>
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditing(false);
                    setCurrentStaff(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F27528] text-white rounded-md hover:bg-[#d65a0f]"
                >
                  {isEditing ? 'Update' : 'Add'} Staff
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Stylish Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-[90%] mx-4 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-red-50 p-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">
                    Confirm Deletion
                  </h3>
                  <p className="text-sm text-red-600/80">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600">
                Are you sure you want to delete the staff member:
              </p>
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-800">{staffToDelete?.name}</p>
                <p className="text-sm text-gray-500">Department: {staffToDelete?.department}</p>
                <p className="text-sm text-gray-500">Category: {staffToDelete?.category}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStaffToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Staff
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StaffPage; 