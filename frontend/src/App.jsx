import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Sidebar } from './components/common/Sidebar.jsx';
import { Toast } from './components/common/Toast.jsx';

// Pages
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { StudentDashboard } from './pages/student/StudentDashboard.jsx';
import { AskDoubtPage } from './pages/student/AskDoubtPage.jsx';
import { MyDoubtsPage } from './pages/student/MyDoubtsPage.jsx';
import { DoubtDetailPage } from './pages/student/DoubtDetailPage.jsx';
import { MyClassesPage } from './pages/student/MyClassesPage.jsx';
import { BrowseSubjectsPage } from './pages/student/BrowseSubjectsPage.jsx';

import { FacultyDashboard } from './pages/faculty/FacultyDashboard.jsx';
import { DoubtQueuePage } from './pages/faculty/DoubtQueuePage.jsx';
import { GroupManagementPage } from './pages/faculty/GroupManagementPage.jsx';

import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { UsersPage } from './pages/admin/UsersPage.jsx';
import { AcademicHierarchyPage } from './pages/admin/AcademicHierarchyPage.jsx';
import { FacultyAssignmentsPage } from './pages/admin/FacultyAssignmentsPage.jsx';
import { AuditLogsPage } from './pages/admin/AuditLogsPage.jsx';

import { LiveChatPage } from './pages/shared/LiveChatPage.jsx';
import { KnowledgeBasePage } from './pages/shared/KnowledgeBasePage.jsx';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized home
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
              {/* Public Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/ask"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AskDoubtPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/doubts"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyDoubtsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/doubts/:id"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <DoubtDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/classes"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyClassesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/subjects"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <BrowseSubjectsPage />
                  </ProtectedRoute>
                }
              />

              {/* Faculty Routes */}
              <Route
                path="/faculty"
                element={
                  <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/queue"
                element={
                  <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                    <DoubtQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty/groups"
                element={
                  <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                    <GroupManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hierarchy"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AcademicHierarchyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <FacultyAssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Authenticated Routes */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <LiveChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  <ProtectedRoute>
                    <KnowledgeBasePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base/:id"
                element={
                  <ProtectedRoute>
                    <KnowledgeBasePage />
                  </ProtectedRoute>
                }
              />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
