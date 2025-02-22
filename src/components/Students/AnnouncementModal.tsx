import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <BellRing className="w-12 h-12 text-[#F27528]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
              <p className="text-gray-600">
                The announcements feature is currently under development. Soon you'll be able to receive important updates and notifications here.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#F27528] text-white rounded-lg hover:bg-[#d65a0f] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementModal; 