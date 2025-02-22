import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader, ThumbsUp, User, Phone } from 'lucide-react';

interface ComplaintDetailsProps {
  complaint: {
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
    assignedStaff?: {
      name: string;
      number: string;
      email: string;
    };
  };
  onClose: () => void;
}

const statusSteps = [
  { status: 'pending', icon: Clock, label: 'Pending', color: 'text-yellow-500' },
  { status: 'in-progress', icon: Loader, label: 'In Progress', color: 'text-blue-500' },
  { status: 'almost-done', icon: ThumbsUp, label: 'Almost Done', color: 'text-purple-500' },
  { status: 'solved', icon: CheckCircle, label: 'Solved', color: 'text-green-500' }
];

const ComplaintDetails: React.FC<ComplaintDetailsProps> = ({ complaint, onClose }) => {
  const currentStepIndex = statusSteps.findIndex(step => step.status === complaint.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* Modified Progress Timeline */}
      <div className="mb-12 overflow-x-auto">
        <div className="relative min-w-[600px] md:min-w-full px-4 py-8">
          {/* Progress Bar with Numbers on Line */}
          <div className="relative h-12 mb-6">
            {/* Background Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
            
            {/* Progress Bar */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ 
                width: `${(currentStepIndex + 1) * (100 / statusSteps.length)}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/2 left-0 h-1 bg-[#F27528] -translate-y-1/2"
              style={{
                boxShadow: '0 0 10px rgba(242, 117, 40, 0.5)'
              }}
            />

            {/* Numbers on Line */}
            <div className="absolute top-0 left-0 right-0 h-full flex justify-between items-center">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div 
                    key={step.status}
                    className="relative"
                  >
                    <div 
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isCompleted ? 'bg-[#F27528] text-white' : 'bg-white text-gray-500 border-2 border-gray-300'}
                        ${isCurrent ? 'ring-4 ring-[#F27528]/30' : ''}
                        font-semibold text-sm
                      `}
                    >
                      {index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between px-4">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div 
                  key={step.status} 
                  className="flex flex-col items-center -ml-4 first:ml-0"
                  style={{ width: 'calc(100% / 4)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StepIcon 
                      className={`w-4 h-4 ${
                        isCompleted ? 'text-[#F27528]' : 'text-gray-400'
                      }`}
                    />
                    <span 
                      className={`text-sm font-medium whitespace-nowrap ${
                        isCompleted ? 'text-[#F27528]' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-[#F27528] text-white px-2 py-1 rounded-full mt-1"
                    >
                      Current
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaint Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-4">Basic Information</h3>
          <div className="space-y-3">
            <p><span className="font-medium">Token:</span> {complaint.token}</p>
            <p><span className="font-medium">Name:</span> {complaint.name}</p>
            <p><span className="font-medium">Student ID:</span> {complaint.studentId}</p>
            <p><span className="font-medium">Category:</span> {complaint.category}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                complaint.status === 'solved' ? 'bg-green-100 text-green-800' :
                complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {complaint.status}
              </span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-4">Location Details</h3>
          <div className="space-y-3">
            <p><span className="font-medium">Type:</span> {complaint.locationType}</p>
            <p><span className="font-medium">Location:</span> {complaint.locationDetail}</p>
            <p><span className="font-medium">Submitted:</span> {
              new Date(complaint.createdAt.toDate()).toLocaleString()
            }</p>
          </div>
        </div>

        {/* Assigned Staff Information */}
        {complaint.assignedStaff && (
          <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg mt-4">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Assigned Staff
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{complaint.assignedStaff.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <span>{complaint.assignedStaff.number}</span>
              </div>
              {complaint.assignedStaff.email && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <span className="font-medium">Email:</span>
                  <span>{complaint.assignedStaff.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Description</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {complaint.attachmentUrls && complaint.attachmentUrls.length > 0 && (
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4">Attachments</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {complaint.attachmentUrls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                >
                  {url.includes('.mp4') ? (
                    <video
                      src={url}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ComplaintDetails; 