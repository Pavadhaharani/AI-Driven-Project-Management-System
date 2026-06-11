import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { milestoneAPI, projectAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PHASES = [
  { key: 'DOCUMENTS_AND_INFORMATION_COLLECTION', label: 'Documents & Information Collection', icon: '📄', color: '#22d3ee' },
  { key: 'DESIGN_THE_APPLICATION', label: 'Design the Application', icon: '🎨', color: '#a78bfa' },
  { key: 'DEVELOPMENT', label: 'Development', icon: '💻', color: '#818cf8' },
  { key: 'TESTING', label: 'Testing', icon: '🧪', color: '#fbbf24' },
  { key: 'REVIEW', label: 'Review', icon: '🔍', color: '#34d399' },
  { key: 'PUBLISH', label: 'Publish', icon: '🚀', color: '#fb7185' },
];

const statusColors = { PENDING: '#64748b', IN_PROGRESS: '#6366f1', COMPLETED: '#10b981', BLOCKED: '#f43f5e' };
const statusBadge = { PENDING: 'badge-gray', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', BLOCKED: 'badge-red' };

export default function MilestonePlanner() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMs, setEditMs] = useState(null);
  const [form, setForm] = useState({ phase: 'DOCUMENTS_AND_INFORMATION_COLLECTION', title: '', description: '', orderIndex: 1, dueDate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([projectAPI.getById(projectId), milestoneAPI.getByProject(projectId)])
      .then(([p, m]) => { setProject(p.data); setMilestones(m.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = (phase) => {
    setEditMs(null);
    const phaseData = PHASES.find(p => p.key === phase);
    const orderIndex = PHASES.findIndex(p => p.key === phase) + 1;
    setForm({ phase: phase || 'DOCUMENTS_AND_INFORMATION_COLLECTION', title: phaseData?.label || '', description: '', orderIndex, dueDate: '' });
    setShowModal(true);
  };

  const openEdit = (ms) => {
    setEditMs(ms);
    setForm({ phase: ms.phase, title: ms.title, description: ms.description || '', orderIndex: ms.orderIndex, dueDate: ms.dueDate || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editMs) {
        await milestoneAPI.update(editMs.id, form);
        toast.success('Milestone updated');
      } else {
        await milestoneAPI.create({ ...form, projectId });
        toast.success('Milestone created');
      }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this milestone?')) return;
    try { await milestoneAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const updateStatus = async (ms, status) => {
    try {
      await milestoneAPI.update(ms.id, { status });
      load();
      toast.success(`Milestone marked as ${status.replace('_', ' ')}`);
    } catch { toast.error('Failed to update status'); }
  };

  const getMsForPhase = (phaseKey) => milestones.filter(m => m.phase === phaseKey);
  const completedPhases = PHASES.filter(p => getMsForPhase(p.key).every(m => m.status === 'COMPLETED') && getMsForPhase(p.key).length > 0).length;

  if (loading) return <div className="layout"><Sidebar /><main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>⬡</div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-xs" onClick={() => navigate('/manager/projects')} style={{ marginBottom: '0.5rem' }}>← Back</button>
            <h1 className="page-title">{project?.name}</h1>
            <p className="page-subtitle">Milestone Planner · {completedPhases}/{PHASES.length} phases complete</p>
          </div>
          <button className="btn btn-primary" onClick={() => openCreate()}>+ Add Milestone</button>
        </div>

        {/* Phase progress bar */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Project Phase Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round((completedPhases / PHASES.length) * 100)}%</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', height: 12, borderRadius: 6, overflow: 'hidden' }}>
            {PHASES.map((ph, i) => {
              const msList = getMsForPhase(ph.key);
              const done = msList.length > 0 && msList.every(m => m.status === 'COMPLETED');
              const active = msList.some(m => m.status === 'IN_PROGRESS');
              return (
                <div key={ph.key} style={{ flex: 1, borderRadius: i === 0 ? '6px 0 0 6px' : i === 5 ? '0 6px 6px 0' : 0,
                  background: done ? ph.color : active ? ph.color + '60' : 'var(--bg-secondary)',
                  transition: 'all 0.3s' }} title={ph.label} />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem' }}>
            {PHASES.map(ph => <div key={ph.key} style={{ flex: 1, fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ph.icon}</div>)}
          </div>
        </div>

        {/* Phase cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {PHASES.map((phase, phaseIndex) => {
            const phaseMilestones = getMsForPhase(phase.key);
            const allDone = phaseMilestones.length > 0 && phaseMilestones.every(m => m.status === 'COMPLETED');
            const hasActive = phaseMilestones.some(m => m.status === 'IN_PROGRESS');

            return (
              <div key={phase.key} className="card" style={{ borderLeft: `3px solid ${phase.color}`, background: allDone ? `${phase.color}08` : 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: phaseMilestones.length > 0 ? '1rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${phase.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', border: `2px solid ${phase.color}` }}>
                      {allDone ? '✅' : phase.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phase {phaseIndex + 1}</span>
                        {allDone && <span style={{ fontSize: '0.72rem', color: phase.color, fontWeight: 700 }}>● COMPLETED</span>}
                        {hasActive && !allDone && <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }} className="pulse">● IN PROGRESS</span>}
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: phase.color }}>{phase.label}</h3>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{phaseMilestones.length} milestone{phaseMilestones.length !== 1 ? 's' : ''}</span>
                    <button className="btn btn-secondary btn-xs" onClick={() => openCreate(phase.key)}>+ Add</button>
                  </div>
                </div>

                {phaseMilestones.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: `1px dashed ${phase.color}40` }}>
                    {phaseMilestones.map(ms => (
                      <div key={ms.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ms.title}</span>
                            <span className={`badge ${statusBadge[ms.status]}`}>{ms.status?.replace('_', ' ')}</span>
                          </div>
                          {ms.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ms.description}</p>}
                          {ms.dueDate && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 Due: {ms.dueDate}</span>}
                          <div style={{ marginTop: '0.4rem' }}>
                            <div className="progress-bar" style={{ height: 4 }}>
                              <div className="progress-fill" style={{ width: `${ms.progressPercent || 0}%`, background: statusColors[ms.status] }} />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {ms.status !== 'IN_PROGRESS' && ms.status !== 'COMPLETED' && (
                            <button className="btn btn-secondary btn-xs" onClick={() => updateStatus(ms, 'IN_PROGRESS')}>▶ Start</button>
                          )}
                          {ms.status === 'IN_PROGRESS' && (
                            <button className="btn btn-secondary btn-xs" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }} onClick={() => updateStatus(ms, 'COMPLETED')}>✓ Complete</button>
                          )}
                          <button className="btn btn-secondary btn-xs" onClick={() => openEdit(ms)}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDelete(ms.id)}>Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editMs ? 'Edit Milestone' : 'Create Milestone'}</h3>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Phase</label>
                <select className="form-select" value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}>
                  {PHASES.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Milestone title" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Order Index</label>
                  <input className="form-input" type="number" min={1} max={99} value={form.orderIndex} onChange={e => setForm(f => ({ ...f, orderIndex: parseInt(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              {editMs && (
                <div className="form-group">
                  <label className="form-label">Progress %</label>
                  <input className="form-input" type="number" min={0} max={100} value={form.progressPercent || 0} onChange={e => setForm(f => ({ ...f, progressPercent: parseInt(e.target.value) }))} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳...' : editMs ? '✓ Update' : '+ Create'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
