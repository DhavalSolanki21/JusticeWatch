import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FaSearch, FaFilter, FaExternalLinkAlt } from 'react-icons/fa';

interface CaseItem {
  id: number;
  case_number: string;
  district_name: string;
  case_category: string;
  crime_type: string | null;
  case_status: string;
  chargesheet_status: string;
  difficulty_tier: 'low' | 'medium' | 'high' | 'critical';
  filed_date: string;
}

interface DistrictOption {
  id: number;
  name: string;
}

const CaseSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [districtName, setDistrictName] = useState(searchParams.get('district') || '');
  const [chargesheetStatus, setChargesheetStatus] = useState(searchParams.get('chargesheet') || '');

  // Data States
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Gujarat Districts static list
  const gujaratDistricts = [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 
    'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 
    'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 
    'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 
    'Tapi', 'Vadodara', 'Valsad'
  ];

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await api.get('/districts/summary/');
        const options = response.data.map((item: any) => ({
          id: item.id,
          name: item.district_name
        }));
        setDistricts(options);
      } catch (err) {
        console.error("Failed to load districts:", err);
      }
    };
    fetchDistricts();
  }, []);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct query parameters for the backend filter
        const params: Record<string, string> = {};
        if (query) params.search = query;
        if (category) params.case_category = category;
        if (status) params.case_status = status;
        if (chargesheetStatus) params.chargesheet_status = chargesheetStatus;

        // If districtName is selected, find the district option ID and pass it
        if (districtName) {
          const matched = districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
          if (matched) {
            params.district = matched.id.toString();
          } else {
            // If districts list is not loaded yet but we have districtName, we can search by text filter on case
            // Or we will wait. The district list matches will work.
          }
        }

        const response = await api.get('/cases/', { params });
        setCases(response.data);
        setCurrentPage(1); // Reset to page 1 on new filter
      } catch (err: any) {
        console.error("Failed to fetch cases:", err);
        setError("Error syncing litigation list. Please verify server connection.");
      } finally {
        setLoading(false);
      }
    };

    // Wait until districts are loaded if we have a districtName filter, to match the ID
    if (districts.length > 0 || !districtName) {
      fetchCases();
    }
  }, [query, category, status, districtName, chargesheetStatus, districts.length]);

  // Sync state with URL params
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);

    if (key === 'q') setQuery(value);
    if (key === 'category') setCategory(value);
    if (key === 'status') setStatus(value);
    if (key === 'district') setDistrictName(value);
    if (key === 'chargesheet') setChargesheetStatus(value);
  };

  // Client side Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCases = cases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(cases.length / itemsPerPage) || 1;

  return (
    <div className="main-content">
      {/* Title */}
      <div className="search-header">
        <span className="subtitle">State Judicial Databases</span>
        <h1>Litigation Register</h1>
        <p className="text-muted">Search CNR registry records and apply administrative scope filters.</p>
      </div>

      <hr className="divider" />

      {/* Filter Control Bar */}
      <div className="jw-card filter-card">
        <div className="search-input-group">
          <FaSearch className="search-bar-icon" />
          <input
            type="text"
            className="form-control search-control"
            placeholder="Search by CNR Case Number, FIR Number, or Legislative Sections..."
            value={query}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
        </div>

        <div className="filters-grid">
          <div className="form-group no-margin">
            <label className="form-label font-serif flex-label"><FaFilter className="icon" /> Category</label>
            <select
              className="form-control select-control"
              value={category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Civil">Civil</option>
              <option value="Criminal">Criminal</option>
              <option value="Appeal">Appeal</option>
            </select>
          </div>

          <div className="form-group no-margin">
            <label className="form-label font-serif flex-label"><FaFilter className="icon" /> Case Status</label>
            <select
              className="form-control select-control"
              value={status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Disposed">Disposed</option>
              <option value="Stayed">Stayed</option>
            </select>
          </div>

          <div className="form-group no-margin">
            <label className="form-label font-serif flex-label"><FaFilter className="icon" /> District</label>
            <select
              className="form-control select-control"
              value={districtName}
              onChange={(e) => handleFilterChange('district', e.target.value)}
            >
              <option value="">All Gujarat Districts</option>
              {gujaratDistricts.map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group no-margin">
            <label className="form-label font-serif flex-label"><FaFilter className="icon" /> Chargesheet</label>
            <select
              className="form-control select-control"
              value={chargesheetStatus}
              onChange={(e) => handleFilterChange('chargesheet', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Not Filed">Not Filed</option>
              <option value="Filed">Filed</option>
              <option value="Under Review">Under Review</option>
              <option value="Trial">Trial</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Results Table */}
      <div className="jw-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="table-header-row">
          <h3>CNR Records Match ({cases.length})</h3>
          <span className="page-indicator">Page {currentPage} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="loading-container" style={{ margin: 'auto' }}>
            <div className="spinner"></div>
            <p>Filtering case dossiers...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="no-cases text-muted" style={{ margin: 'auto' }}>
            <p>No court docket matches found for the specified criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="jw-table-container" style={{ border: 'none', flex: 1 }}>
              <table className="jw-table">
                <thead>
                  <tr>
                    <th>CNR Case Number</th>
                    <th>Jurisdiction District</th>
                    <th>Category</th>
                    <th>Case Status</th>
                    <th>Chargesheet Status</th>
                    <th>Complexity</th>
                    <th>Filed Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCases.map((c) => (
                    <tr key={c.id}>
                      <td className="case-no-mono">{c.case_number}</td>
                      <td>{c.district_name}</td>
                      <td>{c.case_category}</td>
                      <td>{c.case_status}</td>
                      <td>{c.chargesheet_status}</td>
                      <td>
                        <span className={`badge badge-${c.difficulty_tier}`}>{c.difficulty_tier}</span>
                      </td>
                      <td>{c.filed_date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-brass" 
                          style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          Open Dossier <FaExternalLinkAlt style={{ marginLeft: '0.25rem', fontSize: '0.65rem' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, cases.length)} of {cases.length} Records</span>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .search-header h1 {
          font-size: 2.25rem;
          margin-bottom: 0.25rem;
        }
        
        .search-header .subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        
        .filter-card {
          padding: 1.5rem;
        }
        
        .search-input-group {
          display: flex;
          align-items: center;
          background-color: var(--bg-main);
          border: 1px solid var(--border-muted);
          padding: 0 1rem;
          margin-bottom: 1.25rem;
        }
        
        .search-bar-icon {
          color: var(--accent-brass);
          font-size: 1.1rem;
          margin-right: 0.75rem;
        }
        
        .search-control {
          background-color: transparent !important;
          border: none !important;
          width: 100%;
          padding: 0.85rem 0 !important;
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        
        .no-margin {
          margin-bottom: 0px !important;
        }
        
        .flex-label {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem !important;
        }
        
        .flex-label .icon {
          font-size: 0.65rem;
        }
        
        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-muted);
          padding-bottom: 0.5rem;
        }
        
        .table-header-row h3 {
          font-size: 0.95rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
        }
        
        .page-indicator {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        
        .pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border-muted);
        }
        
        .pagination-info {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        @media (max-width: 900px) {
          .filters-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 600px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CaseSearch;
