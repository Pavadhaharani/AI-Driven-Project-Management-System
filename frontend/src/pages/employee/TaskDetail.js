import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { taskAPI, reminderAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = { TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', IN_REVIEW: 'badge-yellow', COMPLETED: 'badge-green', BLOCKED: 'badge-red' };
const typeIcon = { PROGRESS_UPDATE: '📈', BLOCKER: '🚧', FEEDBACK: '💬', COMPLETION: '✅' };
const typeColor = { PROGRESS_UPDATE: '#818cf8', BLOCKER: '#fb7185', FEEDBACK: '#22d3ee', COMPLETION: '#34d399' };

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ content: '', progressPercent: 0, type: 'PROGRESS_UPDATE' });

  const load = useCallback(() => {
    Promise.all([taskAPI.getById(id), taskAPI.getUpdates(id)])
      .then(([t, u]) => { setTask(t.data); setUpdates(u.data); setForm(f => ({ ...f, progressPercent: 0 })); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmitUpdate = async () => {
    if (!form.content.trim()) return toast.error('Please write an update');
    setSubmitting(true);
    try {
      await taskAPI.addUpdate(id, form);
      await reminderAPI.scan().catch(() => {});
      toast.success('Update posted!');
      setForm(f => ({ ...f, content: '', type: 'PROGRESS_UPDATE' }));
      load();
    } catch (e) { toast.error('Failed to post update'); }
    finally { setSubmitting(false); }
  };

  const markComplete = async () => {
    if (!window.confirm('Mark this task as COMPLETED?')) return;
    try {
      await taskAPI.addUpdate(id, { content: 'Task completed successfully! All deliverables have been submitted.', progressPercent: 100, type: 'COMPLETION' });
      await taskAPI.update(id, { status: 'COMPLETED' });
      await reminderAPI.scan().catch(() => {});
      toast.success('🎉 Task marked as complete!');
      load();
    } catch { toast.error('Failed'); }
  };

  const markBlocked = async () => {
    if (!form.content.trim()) return toast.error('Please describe the blocker first');
    try {
      await taskAPI.addUpdate(id, { content: form.content, progressPercent: form.progressPercent, type: 'BLOCKER' });
      await taskAPI.update(id, { status: 'BLOCKED' });
      await reminderAPI.scan().catch(() => {});
      toast.success('Blocker reported to manager');
      setForm(f => ({ ...f, content: '' }));
      load();
    } catch { toast.error('Failed'); }
  };

  const startTask = async () => {
    try {
      await taskAPI.update(id, { status: 'IN_PROGRESS' });
      await taskAPI.addUpdate(id, { content: 'Started working on this task.', progressPercent: 5, type: 'PROGRESS_UPDATE' });
      await reminderAPI.scan().catch(() => {});
      toast.success('Task started!');
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="layout"><Sidebar /><main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>⬡</div></main></div>;
  if (!task) return <div className="layout"><Sidebar /><main className="main-content"><div className="empty-state"><p>Task not found</p></div></main></div>;

  const priorityLabel = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
  const priorityBadge = { 1: 'badge-gray', 2: 'badge-blue', 3: 'badge-yellow', 4: 'badge-red' };
  const latestProgress = updates.find(u => u.progressPercent > 0)?.progressPercent || 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn btn-secondary btn-xs" onClick={() => navigate('/employee/tasks')}>← Back to Tasks</button>
        </div>

        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {/* Left — Task Info */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, flex: 1, paddingRight: '1rem' }}>{task.title}</h1>
                <span className={`badge ${statusBadge[task.status]}`}>{task.status?.replace('_', ' ')}</span>
              </div>
              {task.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                  {task.description}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Project</span>
                  <span style={{ fontWeight: 600 }}>{task.projectName}</span>
                </div>
                {task.milestoneName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Milestone</span>
                    <span style={{ fontWeight: 600 }}>{task.milestoneName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                  <span className={`badge ${priorityBadge[task.priority]}`}>{priorityLabel[task.priority]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Due Date</span>
                  <span style={{ fontWeight: 600, color: isOverdue ? 'var(--accent-rose)' : 'inherit' }}>
                    {task.dueDate || '—'} {isOverdue && '⚠ Overdue'}
                  </span>
                </div>
                {task.estimatedHours > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated</span>
                    <span style={{ fontWeight: 600 }}>{task.estimatedHours}h</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned by</span>
                  <span style={{ fontWeight: 600 }}>{task.createdBy?.fullName || '—'}</span>
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 700 }}>{latestProgress}%</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${latestProgress}%` }} />
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                {task.status === 'TODO' && (
                  <button className="btn btn-primary btn-sm" onClick={startTask}>▶ Start Task</button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <>
                    <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }} onClick={markComplete}>
                      ✅ Mark Complete
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={markBlocked}>🚧 Report Blocker</button>
                  </>
                )}
                {task.status === 'BLOCKED' && (
                  <button className="btn btn-primary btn-sm" onClick={() => taskAPI.update(id, { status: 'IN_PROGRESS' }).then(() => { toast.success('Unblocked!'); load(); })}>
                    ▶ Resume
                  </button>
                )}
              </div>
            </div>

            {/* Post update form */}
            {task.status !== 'COMPLETED' && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>📝 Post an Update</h3>
                <div className="form-group">
                  <label className="form-label">Update Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['PROGRESS_UPDATE', 'FEEDBACK', 'BLOCKER'].map(type => (
                      <button key={type} onClick={() => setForm(f => ({ ...f, type }))}
                        style={{ padding: '0.3rem 0.75rem', borderRadius: 20, border: `1px solid ${form.type === type ? typeColor[type] : 'var(--border)'}`,
                          background: form.type === type ? `${typeColor[type]}20` : 'transparent',
                          color: form.type === type ? typeColor[type] : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        {typeIcon[type]} {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Update</label>
                  <textarea className="form-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={form.type === 'BLOCKER' ? 'Describe what is blocking you...' : 'What progress have you made?'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Progress: <strong>{form.progressPercent}%</strong></label>
                  <input type="range" min={0} max={100} value={form.progressPercent}
                    onChange={e => setForm(f => ({ ...f, progressPercent: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                </div>
                <button className="btn btn-primary" onClick={handleSubmitUpdate} disabled={submitting}>
                  {submitting ? '⏳ Posting...' : '📤 Post Update'}
                </button>
              </div>
            )}
          </div>

          {/* Right — Activity Feed */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
              📋 Activity Feed <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({updates.length} updates)</span>
            </h3>
            {updates.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📋</div><p>No updates yet. Post the first update!</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
                {updates.map(u => {
                  const tColor = typeColor[u.type] || '#818cf8';
                  return (
                    <div key={u.id} style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 10,
                      border: `1px solid var(--border)`, borderLeft: `3px solid ${tColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem' }}>{typeIcon[u.type]}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: tColor }}>{u.type?.replace('_', ' ')}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.4rem' }}>{u.content}</p>
                      {u.progressPercent > 0 && (
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Progress: {u.progressPercent}%</div>
                          <div className="progress-bar" style={{ height: 4 }}>
                            <div className="progress-fill" style={{ width: `${u.progressPercent}%`, background: tColor }} />
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        by {u.user?.fullName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
