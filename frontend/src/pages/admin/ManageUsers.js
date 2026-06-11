import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { adminAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = ['PROJECT_MANAGER', 'EMPLOYEE'];
const DEPTS = ['HR', 'PROJECT_DEVELOPMENT', 'ADMINISTRATION', 'CYBERSECURITY'];

const roleColor = { ADMIN: 'badge-red', PROJECT_MANAGER: 'badge-purple', EMPLOYEE: 'badge-cyan' };

export default function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', role: 'EMPLOYEE', designation: '', phone: '', department: user?.department || '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', fullName: '', role: 'EMPLOYEE', designation: '', phone: '', department: user?.department || '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, password: '', fullName: u.fullName, role: u.role, designation: u.designation || '', phone: u.phone || '', department: u.department || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.email) return toast.error('Full name and email are required');
    if (!editUser && !form.password) return toast.error('Password is required for new users');
    setSaving(true);
    try {
      if (editUser) {
        await adminAPI.updateUser(editUser.id, form);
        toast.success('User updated successfully');
      } else {
        await adminAPI.createUser(form);
        toast.success('User created successfully');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.fullName}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(u.id);
      toast.success('User removed');
      load();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleBadge = (r) => roleColor[r] || 'badge-gray';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">{users.length} members in {user?.department?.replace('_', ' ')} department</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Member</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <input className="form-input" placeholder="🔍 Search by name, email, username..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth: 340 }} />
          <select className="form-select" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Roles</option>
            {['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="empty-state"><div className="pulse" style={{ fontSize: '2rem' }}>⬡</div><p>Loading users...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👥</div><p className="empty-state-text">No users found</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.75rem',
                            background: `hsl(${(u.id * 47) % 360}, 60%, 35%)` }}>
                            {u.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{u.username}</td>
                      <td><span className={`badge ${roleBadge(u.role)}`}>{u.role?.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.department?.replace('_', ' ') || '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.designation || '—'}</td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                          {u.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {u.role !== 'ADMIN' && (
                            <>
                              <button className="btn btn-secondary btn-xs" onClick={() => openEdit(u)}>Edit</button>
                              <button className="btn btn-danger btn-xs" onClick={() => handleDelete(u)}>Remove</button>
                            </>
                          )}
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
                <h3 className="modal-title">{editUser ? 'Edit User' : 'Add New Member'}</h3>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="john_doe" />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{editUser ? 'New Password (optional)' : 'Password *'}</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Developer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 xxxxx xxxxx" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : editUser ? '✓ Update User' : '+ Create User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
