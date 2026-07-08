import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { CaseBrief } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AllCases: React.FC = () => {
  const [cases, setCases] = useState<CaseBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<{id: number, name: string}[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDistricts();
    fetchCases();
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts/list/');
      setDistricts(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = async (districtId: string = '') => {
    setLoading(true);
    try {
      let url = '/cases/all/';
      if (districtId) {
        url += `?district=${districtId}`;
      }
      const response = await api.get(url);
      setCases(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load cases", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
    fetchCases(e.target.value);
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
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="jw-card">
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : cases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No cases found in the registry.
            </div>
          ) : (
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
                  {cases.map((c) => (
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
                        {c.difficulty_tier ? (
                          <span className={`badge badge-${c.difficulty_tier === 'high' || c.difficulty_tier === 'critical' ? 'critical' : c.difficulty_tier === 'medium' ? 'medium' : 'low'}`}>
                            {c.difficulty_tier.toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassessed</span>
                        )}
                      </td>
                      {user?.role === 'judge' && (
                        <td>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate(`/cases/${c.id}`)}>
                            Full View
                          </button>
                        </td>
                      )}
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

export default AllCases;
