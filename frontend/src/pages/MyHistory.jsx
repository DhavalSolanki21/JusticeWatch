import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const MyHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const isJudge = user?.role === 'judge';

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const endpoint = isJudge ? '/auth/judge-history/' : '/cases/my-history/';
        const response = await api.get(endpoint);
        setCases(response.data.results || response.data);
      } catch (err) {
        console.error("Failed to load history cases", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user, isJudge]);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.crime_type && c.crime_type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter ? c.case_status === statusFilter : true;
    const matchesCategory = categoryFilter ? c.case_category === categoryFilter : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-info">
            <h1>{isJudge ? 'My Handled Cases' : 'My Case History'}</h1>
            <p className="page-header-meta">
              {isJudge 
                ? 'List of all litigations presided over by your honor' 
                : 'Advocate historical ledger of assignments and filings'}
            </p>
          </div>
        </div>

        <div className="jw-card" style={{ marginBottom: '1.5rem' }}>
          <div className="search-bar" style={{ gap: '1rem', display: 'flex', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">Search cases</label>
              <div className="form-icon-wrapper">
                <SearchIcon />
                <input
                  type="text"
                  className="form-control form-control--with-icon"
                  placeholder="Search by Case No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select 
                className="form-control" 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Civil">Civil</option>
                <option value="Criminal">Criminal</option>
                <option value="Appeal">Appeal</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-control" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Disposed">Disposed</option>
                <option value="Stayed">Stayed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="jw-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filteredCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No cases found in history.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="jw-table">
                <thead>
                  <tr>
                    <th>Case Number</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Filed Date</th>
                    <th>Complexity</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.case_number}</strong></td>
                      <td>{c.case_category}</td>
                      <td>
                        <span className={`badge badge-${c.case_status === 'Pending' ? 'critical' : c.case_status === 'Stayed' ? 'medium' : 'low'}`}>
                          {c.case_status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{c.filed_date}</td>
                      <td>
                        {c.difficulty_tier ? (
                          <span className={`badge badge-${c.difficulty_tier === 'high' || c.difficulty_tier === 'critical' ? 'critical' : c.difficulty_tier === 'medium' ? 'medium' : 'low'}`}>
                            {c.difficulty_tier.toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassessed</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          View Details
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

export default MyHistory;
