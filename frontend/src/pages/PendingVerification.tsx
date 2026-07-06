import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PendingVerification: React.FC = () => {
  const location = useLocation();
  const state = location.state as { fullName?: string } | null;
  const name = state?.fullName || 'User';

  return (
    <div className="verification-container">
      <div className="verification-card animate-fadeInUp">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="M12 8v4" /><path d="M12 16h.01" />
        </svg>

        <h2>Registration Submitted</h2>

        <p>
          Thank you, <strong style={{ color: 'var(--accent)' }}>{name}</strong>. Your registration has been
          submitted to the court registry for verification. You will be able to sign in once an administrator
          approves your account.
        </p>

        <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Automated access is blocked to preserve records integrity
        </p>

        <Link to="/login" className="btn btn-outline" style={{ marginTop: '1.5rem' }}>
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

export default PendingVerification;
