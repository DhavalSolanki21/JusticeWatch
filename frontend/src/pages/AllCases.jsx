import React, { useState, useEffect } from 'react';
import api from '../services/api';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AllCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchCases(selectedDistrict, page);
  }, [selectedDistrict, page]);

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts/list/');
      setDistricts(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = async (districtId = '', currentPage = 1) => {
    setLoading(true);
    try {
      let url = '/cases/all/';
      const params = { page: currentPage };
      if (districtId) {
        params.district = districtId;
      }
      const response = await api.get(url, { params });
      
      if (response.data.results) {
        setCases(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 50));
      } else {
        setCases(response.data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to load cases", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setSelectedDistrict(e.target.value);
    setPage(1); // reset to first page on filter change
  };

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="page-header-info">
            <h1>All Registry Cases</h1>
            <p className="page-header-meta">Public Case Ledger (Brief Views)</p>
          </div>
          <div>
            <select className="form-control" value={selectedDistrict} onChange={handleFilterChange} style={{ minWidth: '200px' }}>
              <option value="">All Districts</option>
              {districts.map((d) =>
              <option key={d.id} value={d.id}>{d.name}</option>
              )}
            </select>
          </div>
        </div>

        <div className="jw-card">
          {loading ?
          <div className="loading-container"><div className="spinner"></div></div> :
          cases.length === 0 ?
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No cases found in the registry.
            </div> :

          <>
              <div className="table-responsive">
                <table className="jw-table">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>District</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Filed Date</th>
                      <th>Predicted Diff.</th>
                      {user?.role === 'judge' && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) =>
                  <tr key={c.id}>
                        <td><strong>{c.case_number}</strong></td>
                        <td>{c.district_name}</td>
                        <td>{c.case_category}</td>
                        <td>
                          <span className={`badge badge-${c.case_status === 'Pending' ? 'critical' : c.case_status === 'Stayed' ? 'medium' : 'low'}`}>
                            {c.case_status}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.filed_date}</td>
                        <td>
                          {c.difficulty_tier ?
                      <span className={`badge badge-${c.difficulty_tier === 'high' || c.difficulty_tier === 'critical' ? 'critical' : c.difficulty_tier === 'medium' ? 'medium' : 'low'}`}>
                              {c.difficulty_tier.toUpperCase()}
                            </span> :

                      <span style={{ color: 'var(--text-muted)' }}>Unassessed</span>
                      }
                        </td>
                        {user?.role === 'judge' &&
                    <td>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate(`/cases/${c.id}`)}>
                              Full View
                            </button>
                          </td>
                    }
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 &&
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-main)' }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous Page
                </button>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next Page
                </button>
              </div>
              }
            </>
          }
        </div>
      </div>
    </div>);

};

export default AllCases;