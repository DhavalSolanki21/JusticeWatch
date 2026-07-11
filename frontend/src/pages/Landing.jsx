import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScaleIcon = () =>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.1.3-.3.5-.6.5h-4.8c-.3 0-.5-.2-.6-.5z" />
    <path d="m2 16 3-8 3 8c-.1.3-.3.5-.6.5H2.6c-.3 0-.5-.2-.6-.5z" />
    <path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h18" />
  </svg>;


const ArrowRightIcon = () =>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>;


const Landing = () => {
  const navigate = useNavigate();

  // Decorative heatmap: generate 33 cells with varied severities
  const cells = Array.from({ length: 33 }, (_, i) => {
    if (i === 4 || i === 9 || i === 18 || i === 29) return 'heatmap-cell--high';
    if (i === 6 || i === 14 || i === 25) return 'heatmap-cell--critical';
    if (i % 3 === 0) return 'heatmap-cell--medium';
    return 'heatmap-cell--low';
  });

  return (
    <div className="auth-page" style={{ justifyContent: 'space-between' }}>
      <div className="auth-bg-grid" />

      {/* Top Bar */}
      <header className="landing-topbar">
        <div className="landing-brand">
          <ScaleIcon />
          <span className="landing-brand-name">JusticeWatch</span>
          <span className="landing-brand-divider" />
          <span className="landing-brand-sub">Gujarat Judiciary System</span>
        </div>
        <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(16,185,129,0.5)' }}>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
          </svg>
          <span>Secure Portal v2.1</span>
        </div>
      </header>

      {/* Hero */}
      <main className="landing-hero animate-fadeInUp">
        <h1>
          Case analytics and monitoring for{' '}
          <em>Gujarat's District Judiciary</em>
        </h1>
        <p>
          A centralized platform providing judges a state-wide strategic view and legal professionals
          enhanced case-management capabilities within a unified, data-driven environment.
        </p>

        <button className="btn btn-primary" onClick={() => navigate('/login')} id="landing-signin-btn">
          <span>Access Court System</span>
          <ArrowRightIcon />
        </button>
        <p className="landing-cta-help">Secure portal for verified legal staff</p>

        {/* Decorative Heatmap */}
        <div className="landing-heatmap">
          <div className="landing-heatmap-label">
            State Pending Load Distribution
          </div>
          <div className="landing-heatmap-grid">
            {cells.map((cls, idx) =>
            <div key={idx} className={`heatmap-cell ${cls}`} title={`District ${idx + 1}`} />
            )}
          </div>
          <div className="landing-heatmap-legend">
            <span>Low Backlog</span>
            <div className="landing-heatmap-legend-colors">
              <div className="legend-swatch" style={{ backgroundColor: '#2D5A27' }} />
              <div className="legend-swatch" style={{ backgroundColor: '#B58B00' }} />
              <div className="legend-swatch" style={{ backgroundColor: '#B3541E' }} />
              <div className="legend-swatch" style={{ backgroundColor: '#8B0000' }} />
            </div>
            <span>Critical Load</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <span>Gujarat District Courts — Judicial Administration System</span>
        <span>Session: UTC+5:30</span>
        <span className="accent">Predictive Analytics Platform</span>
      </footer>
    </div>);

};

export default Landing;