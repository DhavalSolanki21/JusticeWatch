import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const endpoint = user?.role === 'judge' ? '/auth/judge-history/' : '/cases/my-history/';
        const response = await api.get(endpoint);
        setCases(response.data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };

    if (user) {
      setDisplayName(user.display_name || '');
      setEmail(user.email || '');
      fetchHistory();
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('email', email);
      if (photo) {
        formData.append('photo', photo);
      }
      await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchUser();
      alert("Profile updated successfully");
    } catch {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
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

        <div className="jw-card" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{
                width: '100px', height: '100px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent)',
                overflow: 'hidden', borderRadius: '4px'
              }}>
                {user.photo ?
                <img src={user.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :

                user.full_name[0].toUpperCase()
                }
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{user.full_name}</h2>
                <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {user.role === 'judge' ? 'District & Sessions Judge' : 'Bar Registered Advocate'}
                </p>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${user.is_verified ? 'badge-low' : 'badge-critical'}`}>
                    {user.is_verified ? 'Verified Active' : 'Pending Verification'}
                  </span>
                  {user.district_name &&
                  <span className="badge" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-main)' }}>
                      📍 {user.district_name}
                    </span>
                  }
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input type="text" className="form-control" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Update Photo</label>
                <input type="file" className="form-control" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
                }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" className="btn btn-outline" style={{ color: 'var(--severity-critical)', borderColor: 'var(--severity-critical)' }} onClick={handleLogout}>
                Sign Out Securely
              </button>
            </div>
          </form>
        </div>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          {user.role === 'judge' ? 'My Handled Cases' : 'My Case History'}
        </h2>
        
        {cases.length === 0 ?
        <div className="jw-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No cases found in your history.
          </div> :

        <div className="table-responsive">
            <table className="jw-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) =>
              <tr key={c.id}>
                    <td>
                      <strong>{c.case_number}</strong>
                    </td>
                    <td>{c.case_category}</td>
                    <td>
                      <span className={`badge badge-${c.case_status === 'Pending' ? 'critical' : c.case_status === 'Stayed' ? 'medium' : 'low'}`}>
                        {c.case_status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.filed_date}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate(`/cases/${c.id}`)}>
                        View Details
                      </button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>);

};

export default Profile;