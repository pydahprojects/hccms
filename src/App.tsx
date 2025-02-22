import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import RaiseComplaint from './components/Students/RaiseComplaint';
import TrackComplaint from './components/Students/TrackComplaint';
import StudentLogin from './components/Students/StudentLogin';
import StudentProfile from './components/Students/StudentProfile';

function App() {
  return (
    <Router>
      <div className="bg-gray-50">
        <Layout>
          <Routes>
            {/* Redirect root to student dashboard */}
            <Route path="/" element={<Navigate to="/student" replace />} />
            
            {/* Student Routes */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student-profile" element={<StudentProfile />} />
            <Route path="/raise-complaint" element={<RaiseComplaint />} />
            <Route path="/track-complaint" element={<TrackComplaint />} />
            
            {/* Admin Dashboard Route */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Catch all route - redirect to student dashboard */}
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;