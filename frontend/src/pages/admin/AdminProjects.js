import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { projectAPI, adminAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = { PLANNING: 'badge-gray', IN_PROGRESS: 'badge-blue', ON_HOLD: 'badge-yellow', COMPLETED: 'badge-green', CANCELLED: 'badge-red' };
const priorityLabel = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
const priorityBadge = { 1: 'badge-gray', 2: 'badge-blue', 3: 'badge-yellow', 4: 'badge-red' };

export default function AdminProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [team, setTeam] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', managerId: '', startDate: '', endDate: '', priority: 2, status: 'PLANNING' });
  const [saving, setSaving] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('Team Member');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([projectAPI.getAll(), adminAPI.getManagers(), adminAPI.getEmployees()])
      .then(([p, m, e]) => { setProjects(p.data); setManagers(m.data); setEmployees(e.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditProject(null);
    setForm({ name: '', description: '', managerId: '', startDate: '', endDate: '', priority: 2, status: 'PLANNING' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({ name: p.name, description: p.description || '', managerId: p.manager?.id || '', startDate: p.startDate || '', endDate: p.endDate || '', priority: p.priority, status: p.status });
    setShowModal(true);
  };

  const openTeam = async (p) => {
    setSelectedProject(p);
    const res = await projectAPI.getTeam(p.id);
    setTeam(res.data);
    setShowTeamModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Project name is required');
    setSaving(true);
    try {
      const payload = { ...form, managerId: form.managerId || null };
      if (editProject) { await projectAPI.update(editProject.id, payload); toast.success('Project updated'); }
      else { await projectAPI.create(payload); toast.success('Project created'); }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await projectAPI.delete(id); toast.success('Project deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const handleAddMember = async () => {
    if (!addMemberUserId) return toast.error('Select a user');
    try {
      await projectAPI.addMember(selectedProject.id, { userId: addMemberUserId, role: addMemberRole });
      toast.success('Member added');
      const res = await projectAPI.getTeam(selectedProject.id);
      setTeam(res.data);
      setAddMemberUserId(''); setAddMemberRole('Team Member');
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await projectAPI.removeMember(selectedProject.id, userId);
      const res = await projectAPI.getTeam(selectedProject.id);
      setTeam(res.data);
      toast.success('Member removed');
    } catch (e) { toast.error('Failed to remove member'); }
  };

  const allUsers = [...managers, ...employees];

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} projects in {user?.department?.replace('_', ' ')}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Create Project</button>
        </div>

        {loading ? (
          <div className="empty-state"><div className="pulse" style={{ fontSize: '2rem' }}>⬡</div><p>Loading...</p></div>
        ) : projects.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📁</div><p className="empty-state-text">No projects yet. Create your first!</p></div></div>
        ) : (
          <div className="grid grid-2">
            {projects.map(p => (
              <div key={p.id} className="card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{p.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {p.description?.slice(0, 80)}{p.description?.length > 80 ? '...' : ''}
                    </p>
                  </div>
                  <span className={`badge ${priorityBadge[p.priority]}`}>{priorityLabel[p.priority]}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${statusBadge[p.status]}`}>{p.status?.replace('_', ' ')}</span>
                  {p.manager && <span className="badge badge-purple">👤 {p.manager.fullName}</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {p.startDate && <span>📅 {p.startDate}</span>}
                  {p.endDate && <span>🏁 {p.endDate}</span>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openTeam(p)}>👥 Team</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Project Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{editProject ? 'Edit Project' : 'Create Project'}</h3>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. E-commerce Platform" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the project..." />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Assign Manager</label>
                  <select className="form-select" value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                    <option value="">Select Manager</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
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
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
                {editProject && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳ Saving...' : editProject ? '✓ Update' : '+ Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Team Modal */}
        {showTeamModal && selectedProject && (
          <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
            <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Team — {selectedProject.name}</h3>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowTeamModal(false)}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select className="form-select" value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)}>
                  <option value="">Select user to add...</option>
                  {allUsers.filter(u => !team.find(t => t.user.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.role?.replace('_', ' ')})</option>
                  ))}
                </select>
                <input className="form-input" style={{ maxWidth: 160 }} value={addMemberRole} onChange={e => setAddMemberRole(e.target.value)} placeholder="Role in project" />
                <button className="btn btn-primary btn-sm" onClick={handleAddMember}>Add</button>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {team.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon">👥</div><p>No team members yet</p></div>
                ) : team.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.75rem', background: `hsl(${(t.user.id * 47) % 360}, 60%, 35%)` }}>
                      {t.user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.user.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role} · {t.user.role?.replace('_', ' ')}</div>
                    </div>
                    <button className="btn btn-danger btn-xs" onClick={() => handleRemoveMember(t.user.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
