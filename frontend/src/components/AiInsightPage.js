import React, { useState } from 'react';
import { aiAPI } from '../api/api';
import toast from 'react-hot-toast';

const severityColor = { HIGH: 'badge-red', MEDIUM: 'badge-yellow', LOW: 'badge-green' };
const riskSeverityStyle = { HIGH: { color: '#fb7185', icon: '🔴' }, MEDIUM: { color: '#fbbf24', icon: '🟡' }, LOW: { color: '#34d399', icon: '🟢' } };
const priorityStyle = { CRITICAL: { color: '#fb7185', bg: 'rgba(244,63,94,0.1)' }, HIGH: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' }, MEDIUM: { color: '#818cf8', bg: 'rgba(99,102,241,0.1)' } };
const phaseRiskStyle = { HIGH: 'badge-red', MEDIUM: 'badge-yellow', LOW: 'badge-green' };

const PHASE_ICONS = { 'Documents & Information Collection': '📄', 'Design the Application': '🎨', 'Development': '💻', 'Testing': '🧪', 'Review': '🔍', 'Publish': '🚀' };

export default function AiInsightPage({ role }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowed.includes(f.type)) return toast.error('Please upload a PDF, DOCX, or TXT file');
    if (f.size > 50 * 1024 * 1024) return toast.error('File too large (max 50MB)');
    setFile(f);
    setResult(null);
  };

  const analyze = async () => {
    if (!file) return toast.error('Please upload a document first');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await aiAPI.analyze(fd);
      setResult(res.data);
      setActiveTab('analysis');
      toast.success('Analysis complete!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed');
    } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'analysis', label: '📄 Analysis', count: null },
    { id: 'risks', label: '⚠ Risks', count: result?.risks?.length },
    { id: 'recommendations', label: '💡 Recommendations', count: result?.recommendations?.length },
    { id: 'roadmap', label: '🗺 Roadmap', count: result?.roadmap?.length },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          🤖 AI Project Insight Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Upload a project document — our ML engine analyzes risks, generates a roadmap, and provides actionable recommendations with 95% confidence.
          <span style={{ color: 'var(--accent-emerald)', marginLeft: '0.5rem', fontWeight: 600 }}>● No API key required</span>
        </p>
      </div>

      {/* Upload area */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('ai-file-input').click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-primary)' : file ? 'var(--accent-emerald)' : 'var(--border)'}`,
            borderRadius: 12, padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(99,102,241,0.05)' : file ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
            transition: 'all 0.2s'
          }}>
          <input id="ai-file-input" type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            {file ? '✅' : '📎'}
          </div>
          {file ? (
            <>
              <p style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{file.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drop your project document here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports PDF, DOCX, TXT (max 50MB)</p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={analyze} disabled={!file || loading}
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}>
            {loading ? (
              <><span className="pulse">⚙</span> Analyzing document...</>
            ) : '🔬 Run AI Analysis'}
          </button>
          {file && <button className="btn btn-secondary btn-sm" onClick={() => { setFile(null); setResult(null); }}>Clear</button>}
          {result && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {(result.confidenceScore * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }} className="pulse">🤖</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Analyzing your document...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Running TF-IDF analysis · Detecting risks · Generating roadmap
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            {['Extracting text', 'Computing TF-IDF', 'Risk detection', 'Building roadmap'].map((step, i) => (
              <span key={step} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 20,
                background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.3)',
                animationDelay: `${i * 0.3}s` }} className="pulse">{step}</span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="fade-in">
          {/* Meta info */}
          <div className="grid grid-3" style={{ marginBottom: '1.25rem' }}>
            {[
              { label: 'Document', value: result.documentName, icon: '📄', color: '#818cf8' },
              { label: 'Word Count', value: result.wordCount?.toLocaleString(), icon: '📝', color: '#22d3ee' },
              { label: 'Complexity', value: result.complexityLevel, icon: '📊', color: result.complexityLevel === 'HIGH' ? '#fb7185' : result.complexityLevel === 'MEDIUM' ? '#fbbf24' : '#34d399' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.label}</div>
                  <div style={{ fontWeight: 700, color: m.color, fontSize: '0.9rem' }}>{m.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '0.65rem 1.1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 600, borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                  background: 'transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {tab.label}
                {tab.count !== null && tab.count !== undefined && (
                  <span style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem', borderRadius: 10, fontWeight: 700 }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>📄 Document Analysis</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {result.analysis}
              </div>
            </div>
          )}

          {/* Risks Tab */}
          {activeTab === 'risks' && (
            <div>
              {result.risks?.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-state-icon">✅</div><p>No significant risks detected</p></div></div>
              ) : result.risks?.map((risk, i) => {
                const sStyle = riskSeverityStyle[risk.severity] || riskSeverityStyle.LOW;
                return (
                  <div key={i} className="card" style={{ marginBottom: '1rem', borderLeft: `3px solid ${sStyle.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{sStyle.icon}</span>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: sStyle.color }}>{risk.category}</h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${severityColor[risk.severity]}`}>{risk.severity}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sStyle.color }}>Score: {risk.score}/10</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{risk.description}</p>
                    {risk.indicators?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indicators:</span>
                        {risk.indicators.map(ind => (
                          <span key={ind} style={{ fontSize: '0.72rem', background: 'var(--bg-secondary)', padding: '0.15rem 0.5rem', borderRadius: 6, color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace' }}>{ind}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(risk.score / 10) * 100}%`, background: sStyle.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div>
              {result.recommendations?.map((rec, i) => {
                const pStyle = priorityStyle[rec.priority] || priorityStyle.MEDIUM;
                return (
                  <div key={i} className="card" style={{ marginBottom: '0.75rem', background: pStyle.bg, borderColor: pStyle.color + '40' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pStyle.color,
                          background: pStyle.bg, padding: '0.15rem 0.5rem', borderRadius: 6 }}>{rec.priority}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.category}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>💡</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>{rec.action}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{rec.rationale}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Roadmap Tab */}
          {activeTab === 'roadmap' && (
            <div>
              <div style={{ position: 'relative' }}>
                {result.roadmap?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Timeline connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%',
                        background: `hsl(${i * 55}, 70%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 800, flexShrink: 0, zIndex: 1 }}>
                        {PHASE_ICONS[item.phase] || '●'}
                      </div>
                      {i < result.roadmap.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 20, background: 'var(--border)', marginTop: 4 }} />
                      )}
                    </div>
                    <div className="card" style={{ flex: 1, marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{i + 1}. {item.phase}</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.startDate} → {item.endDate} · <strong>{item.estimatedDuration}</strong>
                          </p>
                        </div>
                        <span className={`badge ${phaseRiskStyle[item.riskLevel]}`}>{item.riskLevel} risk</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {item.keyActivities?.map(act => (
                          <span key={act} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem',
                            background: 'var(--bg-secondary)', borderRadius: 6, color: 'var(--text-secondary)',
                            border: '1px solid var(--border)' }}>✓ {act}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.3)', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  🎯 Estimated Total Duration: {result.roadmap?.reduce((sum, r) => sum + parseInt(r.estimatedDuration), 0)} weeks
                  &nbsp;·&nbsp; ML Confidence: {(result.confidenceScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
