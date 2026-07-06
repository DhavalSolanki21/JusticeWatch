import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-info">
            <h1>User Profile</h1>
            <p className="page-header-meta">Registry Account Details</p>
          </div>
        </div>

        <div className="jw-card" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '80px', height: '80px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--accent)'
            }}>
              {user.full_name[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{user.full_name}</h2>
              <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {user.role === 'judge' ? 'District & Sessions Judge' : 'Bar Registered Advocate'}
              </p>
              <span className={`badge ${user.is_verified ? 'badge-low' : 'badge-critical'}`} style={{ marginTop: '0.5rem' }}>
                {user.is_verified ? 'Verified Active' : 'Pending Verification'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Username</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{user.username}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Official Email</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System ID</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{user.id}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" style={{ color: 'var(--severity-critical)', borderColor: 'var(--severity-critical)' }} onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out Securely
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
