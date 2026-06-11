// ManagerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Sidebar from '../../components/Sidebar';
import { projectAPI, taskAPI, reminderAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectAPI.getAll(), taskAPI.getMyStats(), reminderAPI.getAll()])
      .then(([p, s, r]) => {
        setProjects(p.data);
        setMyStats(s.data);
        setReminders((r.data || []).sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return (a.daysUntilDue ?? 999) - (b.daysUntilDue ?? 999);
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => ({ PLANNING: 'badge-gray', IN_PROGRESS: 'badge-blue', ON_HOLD: 'badge-yellow', COMPLETED: 'badge-green' }[s] || 'badge-gray');

  const taskData = myStats ? [
    { name: 'Total', value: myStats.totalTasks, fill: '#6366f1' },
    { name: 'Done', value: myStats.completedTasks, fill: '#10b981' },
    { name: 'Active', value: myStats.inProgress, fill: '#06b6d4' },
    { name: 'Blocked', value: myStats.blocked, fill: '#f43f5e' },
  ] : [];
  const unreadReminders = reminders.filter(r => !r.read);
  const urgentReminders = reminders.filter(r => (r.daysUntilDue ?? 99) <= 3).slice(0, 3);

  if (loading) return <div className="layout"><Sidebar /><main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>⬡</div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manager Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.fullName} · Managing {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', display: 'inline-block' }} className="pulse" />
              LIVE
            </div>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'My Projects', value: projects.length, icon: '📁', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'My Tasks', value: myStats?.totalTasks || 0, icon: '✅', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
            { label: 'Completed', value: myStats?.completedTasks || 0, icon: '🏆', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Blocked', value: myStats?.blocked || 0, icon: '🚧', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}><span style={{ fontSize: '1.3rem' }}>{s.icon}</span></div>
              <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>My Task Overview</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={taskData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {taskData.map((entry, i) => (
                    <React.Fragment key={i}>
                      <rect fill={entry.fill} />
                    </React.Fragment>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>My Active Tasks</h3>
            {myStats?.inProgress > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(6,182,212,0.08)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.2)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Progress</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22d3ee' }}>{myStats.inProgress}</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completion Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
                    {myStats.totalTasks > 0 ? Math.round((myStats.completedTasks / myStats.totalTasks) * 100) : 0}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-state-icon">✅</div><p>No active tasks assigned to you</p></div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reminder Inbox</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manager/reminders')}>Open</button>
            </div>
            <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unread reminders</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{unreadReminders.length}</div>
              </div>
              <div style={{ padding: '0.85rem', background: 'rgba(244,63,94,0.08)', borderRadius: 10, border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Urgent reminders</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{reminders.filter(r => (r.daysUntilDue ?? 99) <= 1).length}</div>
              </div>
            </div>
            {urgentReminders.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem' }}>
                <div className="empty-state-icon">🔔</div>
                <p>No active deadline alerts right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {urgentReminders.map(reminder => (
                  <div key={reminder.id} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: reminder.type === 'MANAGER_ALERT' ? '#fb7185' : '#818cf8', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {reminder.type === 'MANAGER_ALERT' ? 'Manager alert' : 'Employee reminder'}
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.2rem' }}>{reminder.task?.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {reminder.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>My Projects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manager/projects')}>View All</button>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📁</div><p>No projects assigned yet</p></div>
          ) : (
            <div className="grid grid-2">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => navigate(`/manager/milestones/${p.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</h4>
                    <span className={`badge ${statusBadge(p.status)}`}>{p.status?.replace('_', ' ')}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{p.description?.slice(0, 60)}...</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-xs" onClick={e => { e.stopPropagation(); navigate(`/manager/milestones/${p.id}`); }}>🏁 Milestones</button>
                    <button className="btn btn-secondary btn-xs" onClick={e => { e.stopPropagation(); navigate(`/manager/tasks/${p.id}`); }}>✅ Tasks</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
