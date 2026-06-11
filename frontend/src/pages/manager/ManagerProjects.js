import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { projectAPI } from '../../api/api';

const statusBadge = { PLANNING: 'badge-gray', IN_PROGRESS: 'badge-blue', ON_HOLD: 'badge-yellow', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };
const priorityLabel = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };

export default function ManagerProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectAPI.getAll().then(async r => {
      setProjects(r.data);
      const statsMap = {};
      for (const p of r.data) {
        try {
          const s = await projectAPI.getStats(p.id);
          statsMap[p.id] = s.data;
        } catch {}
      }
      setStats(statsMap);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">{projects.length} projects under management</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="pulse" style={{ fontSize: '2rem' }}>⬡</div><p>Loading...</p></div>
        ) : projects.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📁</div><p>No projects assigned to you yet</p></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projects.map(p => {
              const s = stats[p.id] || {};
              const progress = s.progressPercent || 0;
              return (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</h3>
                        <span className={`badge ${statusBadge[p.status]}`}>{p.status?.replace('_', ' ')}</span>
                        <span className="badge badge-gray">{priorityLabel[p.priority]} Priority</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                        {p.description || 'No description provided'}
                      </p>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        {p.startDate && <span>📅 Start: {p.startDate}</span>}
                        {p.endDate && <span>🏁 End: {p.endDate}</span>}
                        <span>✅ {s.completedTasks || 0}/{s.totalTasks || 0} tasks</span>
                        {s.blocked > 0 && <span style={{ color: 'var(--accent-rose)' }}>🚧 {s.blocked} blocked</span>}
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          <span>Overall Progress</span>
                          <span style={{ fontWeight: 700, color: progress >= 80 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{progress}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/manager/milestones/${p.id}`)}>🏁 Milestones</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/manager/tasks/${p.id}`)}>✅ Manage Tasks</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
