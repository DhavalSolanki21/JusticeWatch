import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle } from 'react-icons/fa';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="main-content">
      {/* Header */}
      <div className="profile-header">
        <span className="subtitle">User Space</span>
        <h1>Advocate / Judicial Profile</h1>
        <p className="text-muted">Manage your credentials and view official registry authorizations.</p>
      </div>

      <hr className="divider" />

      <div className="jw-card profile-card" style={{ maxWidth: '600px' }}>
        <div className="profile-top">
          <div className="profile-avatar">{user.full_name[0]}</div>
          <div className="profile-title-box">
            <h2>{user.full_name}</h2>
            <span className="badge badge-low" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content', marginTop: '0.25rem' }}>
              <FaCheckCircle /> Verified Practitioner
            </span>
          </div>
        </div>

        <hr className="divider" style={{ margin: '1.5rem 0' }} />

        <div className="info-dossier-grid">
          <div className="info-item">
            <span className="label">Username</span>
            <span className="value font-mono">{user.username}</span>
          </div>

          <div className="info-item">
            <span className="label">Registered Email</span>
            <span className="value">{user.email}</span>
          </div>

          <div className="info-item">
            <span className="label">Official Role</span>
            <span className="value" style={{ textTransform: 'uppercase', color: 'var(--accent-brass)', fontWeight: 'bold' }}>
              {user.role}
            </span>
          </div>

          {user.role === 'judge' ? (
            <>
              <div className="info-item">
                <span className="label">District Court Scope</span>
                <span className="value">{user.district_scope || 'All Gujarat State Courts'}</span>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <span className="label">Judicial Designation</span>
                <span className="value">{user.username.toUpperCase()} | District Magistrate</span>
              </div>
            </>
          ) : (
            <div className="info-item">
              <span className="label">Bar Council Registry ID</span>
              <span className="value font-mono">{user.username.toUpperCase() || 'Not Registered'}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-header h1 {
          font-size: 2.25rem;
          margin-bottom: 0.25rem;
        }
        
        .profile-header .subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        
        .profile-top {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .profile-avatar {
          width: 70px;
          height: 70px;
          background-color: var(--accent-brass);
          color: var(--bg-main);
          font-family: var(--font-serif);
          font-weight: bold;
          font-size: 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .profile-title-box h2 {
          font-size: 1.5rem;
          color: var(--text-main);
        }
      `}</style>
    </div>
  );
};

export default Profile;
