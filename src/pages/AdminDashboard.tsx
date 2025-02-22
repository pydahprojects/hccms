import React, { useState } from 'react';
import { Users, FileText, UserCog, BellRing } from 'lucide-react';
import StudentPage from '../components/Admin/StudentPage';
import ComplaintsPage from '../components/Admin/ComplaintsPage';
import StaffPage from '../components/Admin/StaffPage';
import AnnouncementsPage from '../components/Admin/AnnouncementsPage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');

  const navigation = [
    { id: 'students', name: 'Student Page', icon: Users },
    { id: 'complaints', name: 'Complaints', icon: FileText },
    { id: 'staff', name: 'Staff', icon: UserCog },
    { id: 'announcements', name: 'Announcements', icon: BellRing },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentPage />;
      case 'complaints':
        return <ComplaintsPage />;
      case 'staff':
        return <StaffPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      default:
        return <StudentPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold text-[#F27528]">Admin Panel</h2>
        </div>
        <nav className="mt-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2 px-4 py-3 text-gray-600 hover:bg-[#F27528]/10 hover:text-[#F27528] transition-colors ${
                  activeTab === item.id ? 'bg-[#F27528]/10 text-[#F27528] border-r-4 border-[#F27528]' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;