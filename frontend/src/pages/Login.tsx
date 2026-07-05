import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGavel, FaExclamationTriangle } from 'react-icons/fa';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!username || !password) {
      setLocalError("Please enter both username and password.");
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <FaGavel className="auth-logo-icon" />
          <h2>JusticeWatch</h2>
          <span className="auth-subtitle"> Gujarat Judiciary Login</span>
        </div>

        {sessionExpired && (
          <div className="alert alert-info">
            <FaExclamationTriangle className="alert-icon" />
            <span>Session expired. Please log in again.</span>
          </div>
        )}

        {(error || localError) && (
          <div className="alert alert-danger">
            <FaExclamationTriangle className="alert-icon" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="e.g. judge0 or lawyer0"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-brass-filled w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Enter Portal"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            New practitioner?{' '}
            <span className="register-link" onClick={() => navigate('/register')}>
              Request Access Credentials
            </span>
          </p>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          background-color: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        
        .auth-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-brass);
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          position: relative;
        }
        
        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: var(--accent-brass);
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .auth-logo-icon {
          color: var(--accent-brass);
          font-size: 2.25rem;
          margin-bottom: 0.5rem;
        }
        
        .auth-header h2 {
          font-size: 1.5rem;
          color: var(--text-main);
        }
        
        .auth-subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.1em;
          display: block;
          margin-top: 0.25rem;
        }
        
        .alert {
          padding: 0.85rem 1rem;
          border-left: 3px solid;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .alert-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        
        .alert-danger {
          background-color: rgba(192, 57, 43, 0.1);
          border-color: var(--color-critical);
          color: #E74C3C;
        }
        
        .alert-info {
          background-color: rgba(210, 150, 60, 0.1);
          border-color: var(--color-pending);
          color: #F1C40F;
        }
        
        .auth-form {
          margin-bottom: 1.5rem;
        }
        
        .auth-footer {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-muted);
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .register-link {
          color: var(--accent-brass);
          cursor: pointer;
          font-weight: 500;
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        
        .register-link:hover {
          color: var(--accent-brass-hover);
        }
        
        .w-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Login;
