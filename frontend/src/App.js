import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminAiInsight from './pages/admin/AdminAiInsight';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerProjects from './pages/manager/ManagerProjects';
import MilestonePlanner from './pages/manager/MilestonePlanner';
import TaskManager from './pages/manager/TaskManager';
import ManagerAiInsight from './pages/manager/ManagerAiInsight';
import ManagerReminders from './pages/manager/ManagerReminders';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyTasks from './pages/employee/MyTasks';
import TaskDetail from './pages/employee/TaskDetail';
import EmployeeProjects from './pages/employee/EmployeeProjects';
import EmployeeAiInsight from './pages/employee/EmployeeAiInsight';
import EmployeeReminders from './pages/employee/EmployeeReminders';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f0f1a',color:'#a78bfa',fontSize:'1.2rem'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" />;
  if (user.role === 'PROJECT_MANAGER') return <Navigate to="/manager" />;
  return <Navigate to="/employee" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e1b4b', color: '#e2e8f0', border: '1px solid #4f46e5' }}} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/ai-insight" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAiInsight /></ProtectedRoute>} />

          {/* MANAGER ROUTES */}
          <Route path="/manager" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/projects" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><ManagerProjects /></ProtectedRoute>} />
          <Route path="/manager/milestones/:projectId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><MilestonePlanner /></ProtectedRoute>} />
          <Route path="/manager/tasks/:projectId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><TaskManager /></ProtectedRoute>} />
          <Route path="/manager/reminders" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><ManagerReminders /></ProtectedRoute>} />
          <Route path="/manager/ai-insight" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER']}><ManagerAiInsight /></ProtectedRoute>} />

          {/* EMPLOYEE ROUTES */}
          <Route path="/employee" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/tasks" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><MyTasks /></ProtectedRoute>} />
          <Route path="/employee/tasks/:id" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><TaskDetail /></ProtectedRoute>} />
          <Route path="/employee/projects" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeProjects /></ProtectedRoute>} />
          <Route path="/employee/reminders" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeReminders /></ProtectedRoute>} />
          <Route path="/employee/ai-insight" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeAiInsight /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
