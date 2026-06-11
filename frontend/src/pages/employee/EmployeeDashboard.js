// EmployeeDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { taskAPI, projectAPI, reminderAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskAPI.getMyStats(), taskAPI.getMyTasks(), projectAPI.getAll(), reminderAPI.getAll()])
      .then(([s, t, p, r]) => {
        setStats(s.data);
        setTasks(t.data.slice(0, 5));
        setProjects(p.data.slice(0, 4));
        setReminders((r.data || []).sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
    { name: 'In Progress', value: stats.inProgress, color: '#6366f1' },
    { name: 'Blocked', value: stats.blocked, color: '#f43f5e' },
    { name: 'Todo', value: (stats.totalTasks - stats.completedTasks - stats.inProgress - stats.blocked), color: '#64748b' },
  ].filter(d => d.value > 0) : [];
  const unreadReminders = reminders.filter(r => !r.read);
  const dueSoonReminders = reminders.filter(r => (r.daysUntilDue ?? 99) <= 3).slice(0, 3);

  const statusBadge = (s) => ({ TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', IN_REVIEW: 'badge-yellow', COMPLETED: 'badge-green', BLOCKED: 'badge-red' }[s] || 'badge-gray');

  if (loading) return <div className="layout"><Sidebar /><main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>⬡</div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Workspace</h1>
            <p className="page-subtitle">Welcome, {user?.fullName} · {user?.designation || 'Employee'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} className="pulse" />
            LIVE TRACKING
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: '✅', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Completed', value: stats?.completedTasks || 0, icon: '🏆', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'In Progress', value: stats?.inProgress || 0, icon: '⚡', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
            { label: 'Blocked', value: stats?.blocked || 0, icon: '🚧', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span></div>
              <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Task Distribution</h3>
            {pieData.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="empty-state"><div className="empty-state-icon">📊</div><p>No tasks yet</p></div>}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>My Progress</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Overall Completion</span>
                  <span style={{ fontWeight: 700 }}>{stats?.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${stats?.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/employee/tasks')} style={{ flex: 1, justifyContent: 'center' }}>View All Tasks</button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/projects')} style={{ flex: 1, justifyContent: 'center' }}>My Projects</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reminder Inbox</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/reminders')}>Open</button>
            </div>
            <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unread</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{unreadReminders.length}</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'rgba(6,182,212,0.08)', borderRadius: 10, border: '1px solid rgba(6,182,212,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Due soon</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22d3ee' }}>{dueSoonReminders.length}</div>
              </div>
            </div>
            {dueSoonReminders.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>
                <div className="empty-state-icon">🔔</div>
                <p>No active reminders right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {dueSoonReminders.map(reminder => (
                  <div key={reminder.id} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: reminder.type === 'EMPLOYEE_REMINDER' ? '#818cf8' : '#fb7185', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {reminder.type === 'EMPLOYEE_REMINDER' ? 'Your reminder' : 'Manager alert'}
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.2rem' }}>{reminder.task?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reminder.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent Tasks</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/tasks')}>View All</button>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>No tasks assigned yet</p></div>
          ) : tasks.map(t => (
            <div key={t.id} onClick={() => navigate(`/employee/tasks/${t.id}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{t.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.projectName} {t.dueDate ? `· Due ${t.dueDate}` : ''}</div>
              </div>
              <span className={`badge ${statusBadge(t.status)}`}>{t.status?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
