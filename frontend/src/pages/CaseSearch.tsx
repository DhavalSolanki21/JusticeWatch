import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import type { CaseListItem } from '../types';
import DifficultyBadge from '../components/DifficultyBadge';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const CaseSearch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse initial district from URL query params (e.g. from DistrictModal "Audit Cases")
  const queryParams = new URLSearchParams(location.search);
  const initialDistrict = queryParams.get('district') || '';

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState(initialDistrict);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page };
      if (search) params.search = search;
      if (category) params.case_category = category;
      if (status) params.case_status = status;
      if (district) params.district__name = district; // Assumes backend supports this filter

      const res = await api.get('/cases/', { params });
      
      // DRF PageNumberPagination returns { count, next, previous, results }
      if (res.data.results) {
        setCases(res.data.results);
        setTotalCount(res.data.count);
        // Assuming page_size is 10 (DRF default if not specified)
        setTotalPages(Math.ceil(res.data.count / 10));
      } else {
        setCases(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      setError('Failed to retrieve case registry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page]); // Re-fetch on page change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchCases();
  };



  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-info">
            <h1>Case Registry Search</h1>
            <p className="page-header-meta">Gujarat State Judicial Records Database</p>
          </div>
        </div>

        {/* Filters */}
        <div className="jw-card">
          <form onSubmit={handleSearch}>
            <div className="search-bar">
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label">Search Query</label>
                <div className="form-icon-wrapper">
                  <SearchIcon />
                  <input
                    type="text"
                    className="form-control form-control--with-icon"
                    placeholder="Search by Case No, FIR, or Sections..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Appeal">Appeal</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Stayed">Stayed</option>
                </select>
              </div>
            </div>

            <div className="filter-row" style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">District Filter</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ahmedabad"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                  Execute Query
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {error && (
          <div className="notice notice-error mb-3">
            <span>{error}</span>
          </div>
        )}

        <div className="jw-card">
          <div className="jw-card-header">
            <div>
              <h2 className="jw-card-title">Registry Results</h2>
              <p className="jw-card-subtitle">
                {totalCount > 0 ? `Found ${totalCount.toLocaleString()} matching records` : 'Awaiting query execution'}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : cases.length === 0 ? (
            <div className="empty-state">
              <SearchIcon />
              <p>No registry records matched your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="jw-table-wrapper">
                <table className="jw-table">
                  <thead>
                    <tr>
                      <th>Case No.</th>
                      <th>District</th>
                      <th>Category</th>
                      <th>Filed Date</th>
                      <th>Status</th>
                      <th>Complexity</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id} className="clickable" onClick={() => navigate(`/cases/${c.id}`)}>
                        <td>
                          <span className="td-case-no"><FileTextIcon /> {c.case_number}</span>
                        </td>
                        <td>{c.district_name}</td>
                        <td className="td-mono">{c.case_category}</td>
                        <td className="td-mono">{c.filed_date}</td>
                        <td>
                          <span className={`badge ${c.case_status === 'Disposed' ? 'badge-disposed' : 'badge-pending'}`}>
                            {c.case_status}
                          </span>
                        </td>
                        <td><DifficultyBadge tier={c.difficulty_tier} /></td>
                        <td className="text-right">
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}>
                            View <ChevronRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-main)' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous Page
                  </button>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next Page
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseSearch;
