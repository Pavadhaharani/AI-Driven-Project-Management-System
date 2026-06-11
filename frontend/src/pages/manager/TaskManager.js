import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { taskAPI, milestoneAPI, projectAPI, reminderAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = { TODO: 'badge-gray', IN_PROGRESS: 'badge-blue', IN_REVIEW: 'badge-yellow', COMPLETED: 'badge-green', BLOCKED: 'badge-red' };
const priorityLabel = { 1: 'Low', 2: 'Med', 3: 'High', 4: 'Critical' };
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

export default function TaskManager() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedToId: '', milestoneId: '', priority: 2, dueDate: '', estimatedHours: 0 });

  const load = useCallback(() => {
    Promise.all([
      projectAPI.getById(projectId),
      taskAPI.getByProject(projectId),
      milestoneAPI.getByProject(projectId),
      projectAPI.getTeam(projectId)
    ]).then(([p, t, m, team]) => {
      setProject(p.data);
      setTasks(t.data);
      setMilestones(m.data);
      setTeamMembers(team.data);
    }).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', assignedToId: '', milestoneId: '', priority: 2, dueDate: '', estimatedHours: 0 });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description || '', assignedToId: t.assignedTo?.id || '', milestoneId: t.milestoneId || '', priority: t.priority, dueDate: t.dueDate || '', estimatedHours: t.estimatedHours || 0, status: t.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return toast.error('Title required');
    setSaving(true);
    try {
      const payload = { ...form, projectId, assignedToId: form.assignedToId || null, milestoneId: form.milestoneId || null };
      if (editTask) { await taskAPI.update(editTask.id, payload); toast.success('Task updated'); }
      else { await taskAPI.create(payload); toast.success('Task created'); }
      await reminderAPI.scan().catch(() => {});
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete task?')) return;
    try { await taskAPI.delete(id); toast.success('Task deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const quickStatus = async (task, status) => {
    try {
      await taskAPI.update(task.id, { status });
      await reminderAPI.scan().catch(() => {});
      load();
      toast.success('Status updated');
    }
    catch { toast.error('Failed'); }
  };

  const filtered = tasks.filter(t => {
    const ms = !filterStatus || t.status === filterStatus;
    const ma = !filterAssignee || t.assignedTo?.id?.toString() === filterAssignee;
    return ms && ma;
  });

  const statCounts = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    blocked: tasks.filter(t => t.status === 'BLOCKED').length,
  };

  if (loading) return <div className="layout"><Sidebar /><main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="pulse" style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>⬡</div></main></div>;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-xs" onClick={() => navigate('/manager/projects')} style={{ marginBottom: '0.5rem' }}>← Back</button>
            <h1 className="page-title">{project?.name}</h1>
            <p className="page-subtitle">Task Management · {statCounts.completed}/{statCounts.total} completed</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/manager/milestones/${projectId}`)}>🏁 Milestones</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Create Task</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: statCounts.total, color: '#818cf8' },
            { label: 'In Progress', value: statCounts.inProgress, color: '#22d3ee' },
            { label: 'Completed', value: statCounts.completed, color: '#34d399' },
            { label: 'Blocked', value: statCounts.blocked, color: '#fb7185' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Statuses</option>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-select" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Assignees</option>
            {teamMembers.map(tm => <option key={tm.user.id} value={tm.user.id}>{tm.user.fullName}</option>)}
          </select>
        </div>

        {/* Task list */}
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><p>No tasks found. Create the first task!</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Milestone</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reminder</th>
                    <th>Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
                        {t.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.description.slice(0, 50)}...</div>}
                      </td>
                      <td>
                        {t.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.65rem', background: `hsl(${(t.assignedTo.id * 47) % 360}, 60%, 35%)` }}>
                              {t.assignedTo.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span style={{ fontSize: '0.82rem' }}>{t.assignedTo.fullName}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Unassigned</span>}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {t.milestoneName || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><span className={`badge ${priorityBadge[t.priority]}`}>{priorityLabel[t.priority]}</span></td>
                      <td>
                        <select value={t.status} onChange={e => quickStatus(t, e.target.value)}
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
                            color: 'var(--text-primary)', padding: '0.2rem 0.4rem', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${reminderState(t).badge}`}>{reminderState(t).label}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED' ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                        {t.dueDate || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-xs" onClick={() => openEdit(t)}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDelete(t.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editTask ? 'Edit Task' : 'Create Task'}</h3>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Create login page" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-select" value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {/* Self-assign option for manager */}
                    <option value={user?.id}>{user?.fullName} (Me)</option>
                    {teamMembers.filter(tm => tm.user.id !== user?.id).map(tm => <option key={tm.user.id} value={tm.user.id}>{tm.user.fullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Milestone</label>
                  <select className="form-select" value={form.milestoneId} onChange={e => setForm(f => ({ ...f, milestoneId: e.target.value }))}>
                    <option value="">No milestone</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))}>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                    <option value={4}>Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Hours</label>
                  <input className="form-input" type="number" min={0} value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: parseInt(e.target.value) }))} />
                </div>
                {editTask && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳...' : editTask ? '✓ Update' : '+ Create'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
