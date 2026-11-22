import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Preparation from './pages/Preparation';
import ScriptLearning from './pages/ScriptLearning';
import PreparationHistory from './pages/PreparationHistory';
import MockInterviewConfig from './pages/MockInterviewConfig';
import ActiveInterview from './pages/ActiveInterview';
import InterviewReport from './pages/InterviewReport';
import InterviewHistory from './pages/InterviewHistory';
import PerformanceAnalytics from './pages/PerformanceAnalytics';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Onboarding (Protected, standalone full page) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Main SaaS Platform with Sidebar Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/preparation" element={<Preparation />} />
        <Route path="/script-learning" element={<ScriptLearning />} />
        <Route path="/history" element={<PreparationHistory />} />

        {/* Phase 2 Mock Interview & Analytics Routes */}
        <Route path="/interview/new" element={<MockInterviewConfig />} />
        <Route path="/interview/:id" element={<ActiveInterview />} />
        <Route path="/interview/:id/report" element={<InterviewReport />} />
        <Route path="/interview/history" element={<InterviewHistory />} />
        <Route path="/analytics" element={<PerformanceAnalytics />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
