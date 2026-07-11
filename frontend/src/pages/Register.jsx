import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [extraField, setExtraField] = useState('');
  const [localError, setLocalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!fullName || !username || !email || !password || !confirmPassword) {
      setLocalError('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    const payload = {
      username,
      email,
      password,
      role: 'lawyer',
      full_name: fullName
    };

    if (extraField) {
      payload.bar_council_id = extraField;
    }

    setSubmitting(true);
    const success = await register(payload);
    setSubmitting(false);

    if (success) {
      alert("Your registration has been submitted. Please wait 24–48 hours for a judge to approve your account.");
      navigate('/pending-verification', { state: { fullName } });
    }
  };

  const displayError = localError || error;

  return (
    <div className="auth-page" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="auth-bg-grid" />

      {/* Back */}
      <Link to="/login" className="back-link" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
        </svg>
        <span>Back to Sign In</span>
      </Link>

      <div className="auth-form-container auth-form-container--wide animate-fadeInUp">
        {/* Brand */}
        <div className="auth-brand">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 16 3-8 3 8c-.1.3-.3.5-.6.5h-4.8c-.3 0-.5-.2-.6-.5z" />
            <path d="m2 16 3-8 3 8c-.1.3-.3.5-.6.5H2.6c-.3 0-.5-.2-.6-.5z" />
            <path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h18" />
          </svg>
          <h2>Create Account</h2>
          <p>Official Registrar Enrollment</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-fullname">Full Official Name</label>
            <input type="text" id="reg-fullname" className="form-control" value={fullName}
            onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Mr. Alok K. Sanghavi" required />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <input type="text" id="reg-username" className="form-control" value={username}
            onChange={(e) => setUsername(e.target.value)} placeholder="e.g. advocate_sanghavi" required />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Bar Council Email</label>
            <input type="email" id="reg-email" className="form-control" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. advocate@barcouncil.in" required />
          </div>

          {/* Bar Council ID field */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-extra">
              Bar Council Identification Number
            </label>
            <input type="text" id="reg-extra" className="form-control" value={extraField}
            onChange={(e) => setExtraField(e.target.value)}
            placeholder="e.g. GJ/2384/2016" />
          </div>

          {/* Passwords */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password</label>
              <input type="password" id="reg-pass" className="form-control" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input type="password" id="reg-confirm" className="form-control" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>

          {/* Error */}
          {displayError &&
          <div className="notice notice-error animate-fadeIn" style={{ marginBottom: '1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              <span>{displayError}</span>
            </div>
          }

          {/* Verification notice */}
          <div className="notice notice-info" style={{ marginBottom: '1.25rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <strong style={{ display: 'block', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Verification Mandate</strong>
              Your account will need to be verified by the court registry before you can sign in.
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting} id="register-submit-btn">
            {submitting ? 'Submitting...' : 'Submit for Registry Review'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an active credential?{' '}
            <Link to="/login" className="btn-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>);

};

export default Register;