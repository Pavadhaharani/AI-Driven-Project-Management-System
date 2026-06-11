import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'PROJECT_MANAGER') navigate('/manager');
      else navigate('/employee');
    } catch {
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (username, password) => setForm({ username, password });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px' }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>⬡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>ProjectMS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Smart Project Management System
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sign in to your account</h2>

          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" type="text" placeholder="Enter username"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Enter password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        {/* Quick login for demo */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
            🧪 DEMO CREDENTIALS (click to fill)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { label: 'HR Admin', u: 'admin_hr', p: 'Admin@123', color: '#10b981' },
              { label: 'PD Admin', u: 'admin_pd', p: 'Admin@123', color: '#6366f1' },
              { label: 'Adm Admin', u: 'admin_adm', p: 'Admin@123', color: '#f59e0b' },
              { label: 'CS Admin', u: 'admin_cs', p: 'Admin@123', color: '#f43f5e' },
            ].map(d => (
              <button key={d.u} onClick={() => quickLogin(d.u, d.p)}
                style={{ background: `${d.color}15`, border: `1px solid ${d.color}30`, borderRadius: 8,
                  padding: '0.4rem 0.75rem', color: d.color, fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                {d.label}<br/>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{d.u}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
