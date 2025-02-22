import React, { useState } from 'react';
import ImageCarousel from '../components/ImageCarousel';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  UtensilsCrossed, 
  Wifi, 
  Trash2, 
  Shield, 
  BedDouble, 
  Droplets,
  GraduationCap,
  BellRing
} from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';
import { motion } from 'framer-motion';
import AnnouncementModal from '../components/Students/AnnouncementModal';

const features = [
  {
    icon: Wrench,
    title: 'Room Maintenance Issues',
    description: 'Students can report problems such as broken furniture, faulty plumbing, or electrical issues in their hostel rooms.'
  },
  {
    icon: UtensilsCrossed,
    title: 'Food Quality & Hygiene',
    description: 'Complaints related to unclean dining areas, poor food quality, or insufficient meal options can be raised.'
  },
  {
    icon: Wifi,
    title: 'Wi-Fi and Network Connectivity',
    description: 'Students often face issues with slow or no Wi-Fi connection in hostels or on campus.'
  },
  {
    icon: Trash2,
    title: 'Cleanliness and Sanitation',
    description: 'Reports about unclean toilets, garbage accumulation, or lack of housekeeping services can be made.'
  },
  {
    icon: Shield,
    title: 'Safety and Security Concerns',
    description: 'Any concerns related to personal safety, unauthorized entries, or lack of security personnel can be raised.'
  },
  {
    icon: BedDouble,
    title: 'Hostel Room Allocation Issues',
    description: 'Students may raise complaints about unfair room allotments or overcrowding in hostels.'
  },
  {
    icon: Droplets,
    title: 'Water and Power Supply Interruptions',
    description: 'Issues regarding water shortages or frequent power cuts can be addressed through complaints.'
  },
  {
    icon: GraduationCap,
    title: 'Academic Concerns and Facilities',
    description: 'Complaints regarding unavailability of classrooms, outdated equipment, or issues with teaching quality can be reported.'
  }
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gray-50 relative">
      {/* Bouncing Bell Icon */}
      <motion.button
        className="fixed bottom-8 right-8 bg-[#F27528] text-white p-4 rounded-full shadow-lg hover:bg-[#d65a0f] transition-colors z-50"
        initial={{ y: 0 }}
        animate={{ y: [-10, 0] }}
        transition={{ 
          y: {
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }
        }}
        onClick={() => setIsAnnouncementModalOpen(true)}
      >
        <BellRing className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          1
        </div>
      </motion.button>

      {/* Announcement Modal */}
      <AnnouncementModal 
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />

      <div className="w-[90%] md:w-[80%] mx-auto">
        {/* Image Carousel Section */}
        <div className="w-full py-6 md:py-8">
          <ImageCarousel autoSlide={true} autoSlideInterval={3000} />
        </div>

        {/* Welcome Message and Features Section */}
        <div className="w-full bg-white rounded-lg shadow-md p-8 my-8">
          {/* Welcome Message */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-[#F27528] mb-6 text-center">
              <span className="block md:hidden">
                <TypeAnimation
                  sequence={[
                    'Welcome to HCCMS',
                    1000,
                    'Welcome to HCCMS',
                    2000,
                  ]}
                  wrapper="span"
                  speed={40}
                  repeat={Infinity}
                />
              </span>
              <span className="hidden md:block">
                <TypeAnimation
                  sequence={[
                    'Welcome to HCCMS',
                    1000,
                    'Welcome to Hostel Campus Complaint Management System',
                    2000,
                  ]}
                  wrapper="span"
                  speed={40}
                  repeat={Infinity}
                />
              </span>
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed font-medium text-center md:text-left">
              Welcome to HCCMS (Hostel and Campus Complaint Management System), a platform designed to streamline communication and resolve issues faced by students within college and hostel environments. Whether it's a maintenance concern, an academic inquiry, or any other issue, our system ensures quick and efficient solutions. With easy reporting, transparent tracking, and prompt responses, HCCMS empowers students to raise concerns while providing authorities with a seamless way to address them, improving overall campus life.
            </p>
          </div>

          {/* Categories Section */}
          <div className="mb-12">
            <h3 className="text-xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">
              <u> Categories of Complaints</u>
            </h3>
            <p className="text-gray-600 text-center mb-8">
              Below are the various types of complaints that can be registered through our system
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#F27528]/30"
              >
                <feature.icon 
                  className="w-12 h-12 text-[#F27528] mb-4" 
                  strokeWidth={1.5}
                />
                <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 italic text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6">
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-[#F27528] text-white rounded-lg font-semibold text-lg hover:bg-[#d65a0f] transition-colors duration-300 shadow-md flex items-center justify-center gap-2"
              onClick={() => navigate('/raise-complaint')}
            >
              <span>Raise Complaint</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#F27528] border-2 border-[#F27528] rounded-lg font-semibold text-lg hover:bg-[#F27528] hover:text-white transition-colors duration-300 shadow-md flex items-center justify-center gap-2"
              onClick={() => navigate('/track-complaint')}
            >
              <span>Track Complaint</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;