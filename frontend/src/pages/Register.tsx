import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGavel, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'judge' | 'lawyer'>('lawyer');
  
  // Extra fields
  const [designation, setDesignation] = useState('');
  const [districtScope, setDistrictScope] = useState('');
  const [barId, setBarId] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  // Gujarat Districts static list for dropdown
  const gujaratDistricts = [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 
    'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 
    'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 
    'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 
    'Tapi', 'Vadodara', 'Valsad'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username || !fullName || !email || !password) {
      setLocalError("Please fill in all standard credentials fields.");
      return;
    }

    if (role === 'judge') {
      if (!designation) {
        setLocalError("Please enter your official judicial designation.");
        return;
      }
      if (!districtScope) {
        setLocalError("Please select your district jurisdiction scope.");
        return;
      }
    } else {
      if (!barId) {
        setLocalError("Please enter your State Bar Council registration ID.");
        return;
      }
    }

    const payload = {
      username,
      email,
      password,
      role,
      full_name: fullName,
      designation: role === 'judge' ? designation : undefined,
      district_scope: role === 'judge' ? districtScope : undefined,
      bar_council_id: role === 'lawyer' ? barId : undefined,
    };

    const res = await register(payload);
    if (res) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card success-card">
          <div className="success-header">
            <FaCheckCircle className="success-icon" />
            <h2>Credentials Requested</h2>
          </div>
          <p className="success-msg">
            Your registration request for Hon'ble Court access as a **{role.toUpperCase()}** has been successfully submitted to the State Administrative Panel.
          </p>
          <p className="success-note">
            Note: Accounts require manual review and verification of credentials (Bar Council ID or judicial designation) before simplejwt token release. You will receive access approval soon.
          </p>
          <button className="btn-brass-filled w-full" onClick={() => navigate('/login')}>
            Return to Login
          </button>
        </div>
        <style>{`
          .success-card {
            text-align: center;
          }
          .success-icon {
            color: var(--color-disposed);
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .success-header h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          .success-msg {
            font-size: 0.95rem;
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          .success-note {
            font-size: 0.8rem;
            color: var(--text-muted);
            background-color: var(--bg-main);
            padding: 1rem;
            margin-bottom: 2rem;
            border-left: 2px solid var(--accent-brass);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <FaGavel className="auth-logo-icon" />
          <h2>JusticeWatch</h2>
          <span className="auth-subtitle">Judicial Registrar Credentials Form</span>
        </div>

        {(error || localError) && (
          <div className="alert alert-danger">
            <FaExclamationTriangle className="alert-icon" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-toggle-group">
            <span className="form-label" style={{ marginBottom: '0.25rem' }}>Practitioner Scope</span>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${role === 'lawyer' ? 'active' : ''}`}
                onClick={() => setRole('lawyer')}
                disabled={loading}
              >
                Lawyer / Advocate
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'judge' ? 'active' : ''}`}
                onClick={() => setRole('judge')}
                disabled={loading}
              >
                Judge / Magistrate
              </button>
            </div>
          </div>

          <div className="grid-2col" style={{ gap: '1rem', marginBottom: '0px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="advocate_smith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="name@courts.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Professional Name</label>
            <input
              type="text"
              id="fullName"
              className="form-control"
              placeholder="Hon'ble Justice / Advocate Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Security Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Conditional Role-Based Fields */}
          {role === 'judge' ? (
            <div className="grid-2col" style={{ gap: '1rem', marginBottom: '0px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="designation">Judicial Designation</label>
                <input
                  type="text"
                  id="designation"
                  className="form-control"
                  placeholder="e.g. Chief Judicial Magistrate"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="districtScope">District Scope (Jurisdiction)</label>
                <select
                  id="districtScope"
                  className="form-control select-control"
                  value={districtScope}
                  onChange={(e) => setDistrictScope(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Choose District --</option>
                  {gujaratDistricts.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="barId">Bar Council Registration ID</label>
              <input
                type="text"
                id="barId"
                className="form-control"
                placeholder="e.g. GBC/1402/2014"
                value={barId}
                onChange={(e) => setBarId(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="btn-brass-filled w-full" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? "Submitting Request..." : "Request Access Credentials"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have verified credentials?{' '}
            <span className="register-link" onClick={() => navigate('/login')}>
              Sign In Here
            </span>
          </p>
        </div>
      </div>

      <style>{`
        .role-toggle-group {
          margin-bottom: 1.5rem;
        }
        
        .role-buttons {
          display: flex;
          border: 1px solid var(--border-muted);
        }
        
        .role-btn {
          flex: 1;
          padding: 0.65rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        .role-btn:first-of-type {
          border-right: 1px solid var(--border-muted);
        }
        
        .role-btn.active {
          background-color: var(--accent-brass);
          color: var(--bg-main);
          font-weight: 600;
        }
        
        .select-control {
          background-image: linear-gradient(45deg, transparent 50%, var(--accent-brass) 50%), linear-gradient(135deg, var(--accent-brass) 50%, transparent 50%);
          background-position: calc(100% - 20px) 16px, calc(100% - 15px) 16px;
          background-size: 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          appearance: none;
        }
        
        .select-control option {
          background-color: var(--bg-card);
          color: var(--text-main);
        }
      `}</style>
    </div>
  );
};

export default Register;
