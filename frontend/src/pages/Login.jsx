import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ScaleIcon = () =>
<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.1.3-.3.5-.6.5h-4.8c-.3 0-.5-.2-.6-.5z" />
    <path d="m2 16 3-8 3 8c-.1.3-.3.5-.6.5H2.6c-.3 0-.5-.2-.6-.5z" />
    <path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h18" />
  </svg>;


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!username || !password) {
      setLocalError('Please fill in all security fields.');
      return;
    }

    setSubmitting(true);
    const success = await login(username, password);
    setSubmitting(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-bg-grid" />

      {/* Back button */}
      <Link to="/" className="back-link" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
        </svg>
        <span>Back</span>
      </Link>

      <div className="auth-form-container animate-fadeInUp">
        {/* Brand */}
        <div className="auth-brand">
          <ScaleIcon />
          <h2>JusticeWatch</h2>
          <p>Judicial Records Entry Point</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <div className="form-icon-wrapper">
              <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                id="login-username"
                className="form-control form-control--with-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required />
              
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Access Password</label>
            <div className="form-icon-wrapper">
              <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                id="login-password"
                className="form-control form-control--with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required />
              
            </div>
          </div>

          {/* Error */}
          {displayError &&
          <div className="notice notice-error animate-fadeIn" style={{ marginBottom: '1rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              <span>{displayError}</span>
            </div>
          }

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
            id="login-submit-btn">
            
            {submitting ? 'Authenticating...' : 'Authenticate Credentials'}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            New to the judiciary analytics system?{' '}
            <Link to="/register" className="btn-link" id="goto-register-btn">Register here</Link>
          </p>
        </div>
      </div>
    </div>);

};

export default Login;