import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { adminAPI, projectAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), projectAPI.getAll(), adminAPI.getUsers()])
      .then(([s, p, u]) => {
        setStats(s.data);
        setProjects(p.data.slice(0, 5));
        setUsers(u.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const statusData = [
    { name: 'Planning', value: projects.filter(p => p.status === 'PLANNING').length },
    { name: 'Active', value: projects.filter(p => p.status === 'IN_PROGRESS').length },
    { name: 'On Hold', value: projects.filter(p => p.status === 'ON_HOLD').length },
    { name: 'Done', value: projects.filter(p => p.status === 'COMPLETED').length },
  ].filter(d => d.value > 0);

  const roleData = stats ? [
    { name: 'Admins', value: stats.admins || 0 },
    { name: 'Managers', value: stats.managers || 0 },
    { name: 'Employees', value: stats.employees || 0 },
  ] : [];

  const priorityLabel = (p) => ({ 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }[p] || 'Medium');
  const priorityBadge = (p) => ({ 1: 'badge-gray', 2: 'badge-blue', 3: 'badge-yellow', 4: 'badge-red' }[p] || 'badge-blue');
  const statusBadge = (s) => ({
    PLANNING: 'badge-gray', IN_PROGRESS: 'badge-blue', ON_HOLD: 'badge-yellow',
    COMPLETED: 'badge-green', CANCELLED: 'badge-red'
  }[s] || 'badge-gray');

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }} className="pulse">⬡</div>
          <p>Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  const deptLabel = user?.department?.replace('_', ' ');

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <span style={{ color: 'var(--accent-primary)' }}>{deptLabel}</span> Dashboard
            </h1>
            <p className="page-subtitle">Welcome back, {user?.fullName} · Department Head</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>👥 Manage Users</button>
            <button className="btn btn-primary" onClick={() => navigate('/admin/projects')}>+ New Project</button>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem',
          color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)',
            display: 'inline-block', boxShadow: '0 0 8px var(--accent-emerald)' }} className="pulse" />
          LIVE MONITORING — {new Date().toLocaleString()}
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Members', value: stats?.total || 0, icon: '👥', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Projects', value: stats?.projects || 0, icon: '📁', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
            { label: 'Managers', value: stats?.managers || 0, icon: '🎯', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
            { label: 'Employees', value: stats?.employees || 0, icon: '🛠', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              </div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Team Composition</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roleData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Project Status Breakdown</h3>
            {statusData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {statusData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-state-icon">📊</div><p className="empty-state-text">No project data yet</p></div>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent Projects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/projects')}>View All</button>
          </div>
          {projects.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Manager</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description?.slice(0, 40)}...</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {p.manager?.fullName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                      </td>
                      <td><span className={`badge ${priorityBadge(p.priority)}`}>{priorityLabel(p.priority)}</span></td>
                      <td><span className={`badge ${statusBadge(p.status)}`}>{p.status?.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {p.endDate || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📁</div><p className="empty-state-text">No projects yet. Create your first project!</p></div>
          )}
        </div>

        {/* Team Members */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Department Members</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/users')}>Manage</button>
          </div>
          <div className="grid grid-3">
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 10,
                border: '1px solid var(--border)' }}>
                <div className="user-avatar" style={{ width: 38, height: 38, fontSize: '0.8rem',
                  background: `hsl(${(u.id * 47) % 360}, 60%, 40%)` }}>
                  {u.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ minWidth: 0 }}>inde
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.designation || u.role?.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
