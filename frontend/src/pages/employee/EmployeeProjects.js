// EmployeeProjects.js
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { projectAPI } from '../../api/api';

export default function EmployeeProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { projectAPI.getAll().then(r => setProjects(r.data)).finally(() => setLoading(false)); }, []);

  const statusBadge = { PLANNING: 'badge-gray', IN_PROGRESS: 'badge-blue', ON_HOLD: 'badge-yellow', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">Projects you are assigned to</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="pulse" style={{ fontSize: '2rem' }}>⬡</div><p>Loading...</p></div>
        ) : projects.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📁</div><p>No projects assigned yet</p></div></div>
        ) : (
          <div className="grid grid-2">
            {projects.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</h3>
                  <span className={`badge ${statusBadge[p.status]}`}>{p.status?.replace('_', ' ')}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {p.description || 'No description'}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {p.manager && <span>👤 {p.manager.fullName}</span>}
                  {p.endDate && <span>🏁 {p.endDate}</span>}
                  {p.department && <span>🏢 {p.department.replace('_', ' ')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
