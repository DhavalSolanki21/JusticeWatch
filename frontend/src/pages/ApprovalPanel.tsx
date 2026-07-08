import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { PendingLawyer } from '../types';


const ApprovalPanel: React.FC = () => {
  const [pendingLawyers, setPendingLawyers] = useState<PendingLawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingLawyers();
  }, []);

  const fetchPendingLawyers = async () => {
    try {
      const response = await api.get('/auth/pending-lawyers/');
      setPendingLawyers(response.data.results || response.data);
      setError(null);
    } catch {
      setError('Failed to fetch pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/auth/approve-lawyer/${id}/`);
      setPendingLawyers(prev => prev.filter(lawyer => lawyer.id !== id));
    } catch {
      alert('Failed to approve lawyer.');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-info">
            <h1>Registry Approvals</h1>
            <p className="page-header-meta">Review and approve new lawyer registrations</p>
          </div>
        </div>

        {error && (
          <div className="notice notice-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="jw-card">
          {pendingLawyers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No pending approvals at this time.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="jw-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Bar Council ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLawyers.map(lawyer => (
                    <tr key={lawyer.id}>
                      <td>
                        <strong>{lawyer.full_name}</strong>
                      </td>
                      <td>{lawyer.email}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {lawyer.bar_council_id || 'N/A'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} 
                          onClick={() => handleApprove(lawyer.id)}
                        >
                          Approve Registration
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalPanel;
