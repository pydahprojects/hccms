import React from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react';

interface ComplaintDetailsModalProps {
  complaint: {
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
    attachmentUrls?: string[];
  };
  onClose: () => void;
}

const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({ complaint, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'almost-done':
        return 'bg-purple-100 text-purple-800';
      case 'solved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
            <p className="text-sm text-gray-500 mt-1">Token: {complaint.token}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
              {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
            </span>
          </div>

          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Student Information</h3>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-medium">Name:</span> {complaint.name}</p>
                <p className="text-gray-700"><span className="font-medium">Student ID:</span> {complaint.studentId}</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span>{complaint.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>{complaint.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Complaint Information</h3>
              <div className="space-y-3">
                <p className="text-gray-700"><span className="font-medium">Category:</span> {complaint.category}</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{complaint.locationType}</p>
                    <p className="text-sm">{complaint.locationDetail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>{complaint.createdAt.toDate().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>{complaint.createdAt.toDate().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachmentUrls && complaint.attachmentUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Attachments</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.attachmentUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity"
                  >
                    {url.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">View Attachment {index + 1}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ComplaintDetailsModal; 