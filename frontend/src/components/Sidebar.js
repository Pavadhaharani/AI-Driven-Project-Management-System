import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: '⬡',
  users: '👥',
  projects: '📁',
  milestones: '🏁',
  tasks: '✅',
  reminders: '🔔',
  ai: '🤖',
  logout: '→',
};

const adminNav = [
  { label: 'Overview', path: '/admin', icon: icons.dashboard, end: true },
  { label: 'Manage Users', path: '/admin/users', icon: icons.users },
  { label: 'Projects', path: '/admin/projects', icon: icons.projects },
  { label: 'AI Insight', path: '/admin/ai-insight', icon: icons.ai },
];

const managerNav = [
  { label: 'Overview', path: '/manager', icon: icons.dashboard, end: true },
  { label: 'My Projects', path: '/manager/projects', icon: icons.projects },
  { label: 'Reminders', path: '/manager/reminders', icon: icons.reminders },
  { label: 'AI Insight', path: '/manager/ai-insight', icon: icons.ai },
];

const employeeNav = [
  { label: 'Overview', path: '/employee', icon: icons.dashboard, end: true },
  { label: 'My Tasks', path: '/employee/tasks', icon: icons.tasks },
  { label: 'Reminders', path: '/employee/reminders', icon: icons.reminders },
  { label: 'My Projects', path: '/employee/projects', icon: icons.projects },
  { label: 'AI Insight', path: '/employee/ai-insight', icon: icons.ai },
];

const deptColors = { HR: '#10b981', PROJECT_DEVELOPMENT: '#6366f1', ADMINISTRATION: '#f59e0b', CYBERSECURITY: '#f43f5e' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = user?.role === 'ADMIN' ? adminNav : user?.role === 'PROJECT_MANAGER' ? managerNav : employeeNav;
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??';
  const roleLabel = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'PROJECT_MANAGER' ? 'Project Manager' : 'Employee';
  const deptColor = deptColors[user?.department] || '#6366f1';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⬡</div>
        <div>
          <div className="sidebar-logo-text">ProjectMS</div>
          <div className="sidebar-logo-sub">Live Monitoring System</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.fullName}</div>
          <div className="user-role">{roleLabel}</div>
        </div>
      </div>

      {user?.department && (
        <div style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: deptColor,
            background: `${deptColor}20`, padding: '0.2rem 0.6rem', borderRadius: '20px',
            border: `1px solid ${deptColor}40` }}>
            {user.department.replace('_', ' ')}
          </span>
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-logout">
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleLogout}>
          {icons.logout} Sign Out
        </button>
      </div>
    </div>
  );
}
