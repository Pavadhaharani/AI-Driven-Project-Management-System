// MyTasks.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { taskAPI } from '../../api/api';

const statusBadge = { TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', IN_REVIEW: 'badge-yellow', COMPLETED: 'badge-green', BLOCKED: 'badge-red' };
const priorityLabel = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
const priorityBadge = { 1: 'badge-gray', 2: 'badge-blue', 3: 'badge-yellow', 4: 'badge-red' };
const reminderState = (task) => {
  if (!task.dueDate || task.status === 'COMPLETED') return { label: 'Clear', badge: 'badge-green' };
  const due = new Date(task.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Overdue ${Math.abs(diffDays)}d`, badge: 'badge-red' };
  if (diffDays <= 1) return { label: 'Reminder now', badge: 'badge-red' };
  if (diffDays <= 3) return { label: 'Reminder soon', badge: 'badge-yellow' };
  return { label: 'On track', badge: 'badge-green' };
};

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { taskAPI.getMyTasks().then(r => setTasks(r.data)).finally(() => setLoading(false)); }, []);

  const filtered = tasks.filter(t => !filterStatus || t.status === filterStatus);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Tasks</h1>
            <p className="page-subtitle">{tasks.length} tasks assigned to you</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}>
              {s || 'All'} {s && `(${tasks.filter(t => t.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <div className="empty-state"><div className="pulse" style={{ fontSize: '2rem' }}>⬡</div><p>Loading tasks...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>No tasks in this category</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map(t => (
                <div key={t.id} onClick={() => navigate(`/employee/tasks/${t.id}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 10,
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.title}</span>
                      {t.status === 'BLOCKED' && <span style={{ fontSize: '0.9rem' }}>🚧</span>}
                      {t.status === 'COMPLETED' && <span style={{ fontSize: '0.9rem' }}>✅</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>📁 {t.projectName}</span>
                      {t.milestoneName && <span>🏁 {t.milestoneName}</span>}
                      {t.dueDate && <span style={{ color: new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' ? 'var(--accent-rose)' : 'inherit' }}>📅 {t.dueDate}</span>}
                      {t.estimatedHours > 0 && <span>⏱ {t.estimatedHours}h est.</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${reminderState(t).badge}`}>{reminderState(t).label}</span>
                    <span className={`badge ${priorityBadge[t.priority]}`}>{priorityLabel[t.priority]}</span>
                    <span className={`badge ${statusBadge[t.status]}`}>{t.status?.replace('_', ' ')}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
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
