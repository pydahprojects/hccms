import React from 'react';
import { Construction } from 'lucide-react';

const StudentPage = () => {
  return (
    <div className="p-6 h-full flex items-center justify-center">
      <div className="text-center">
        <Construction className="w-16 h-16 text-[#F27528] mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Feature Coming Soon!</h2>
        <p className="text-gray-600 text-lg">
          We're working hard to bring you the student management features.
        </p>
        <p className="text-gray-500 mt-2">
          Check back later for updates.
        </p>
      </div>
    </div>
  );
};

export default StudentPage; 