import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import DistrictGrid, { type DistrictSummaryData } from '../components/DistrictGrid';
import DistrictPopup from '../components/DistrictPopup';

interface OverviewStats {
  total_cases: number;
  pending_cases: number;
  status_breakdown: Record<string, number>;
  difficulty_breakdown: Record<string, number>;
  top_congested_districts: Record<string, number>;
}

interface CaseItem {
  id: number;
  case_number: string;
  district_name: string;
  court_name: string;
  case_category: string;
  crime_type: string | null;
  case_status: string;
  chargesheet_status: string;
  difficulty_tier: 'low' | 'medium' | 'high' | 'critical';
  filed_date: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [summaries, setSummaries] = useState<DistrictSummaryData[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch District Summaries (for the Grid)
        const summaryRes = await api.get('/districts/summary/');
        setSummaries(summaryRes.data);

        // 2. Fetch role-specific details
        if (user.role === 'judge') {
          // Fetch overall overview stats
          const overviewRes = await api.get('/analytics/overview/');
          setOverview(overviewRes.data);

          // Fetch recent cases list
          const casesRes = await api.get('/cases/');
          setCases(casesRes.data.slice(0, 5)); // Take top 5 recent cases
        } else if (user.role === 'lawyer') {
          // Fetch lawyer's assigned cases
          const casesRes = await api.get('/cases/');
          setCases(casesRes.data);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to synchronize caseload analytics. Please check backend connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null;

  // Selected summary for Popup
  const activeSummary = summaries.find(s => s.id === selectedSummaryId);

  // Stats computation for Judge
  const judgeTotal = overview?.total_cases ?? 0;
  const judgePending = overview?.pending_cases ?? 0;
  const judgeDisposed = judgeTotal - judgePending;
  const judgeRate = judgeTotal > 0 ? ((judgeDisposed / judgeTotal) * 100).toFixed(0) + "%" : "0%";
  const criticalDistrictsCount = summaries.filter(s => s.severity_tier === 'critical').length;

  // Stats computation for Lawyer
  const lawyerTotal = cases.length;
  const lawyerPending = cases.filter(c => c.case_status === 'Pending').length;
  const lawyerDisposed = cases.filter(c => c.case_status === 'Disposed').length;
  const lawyerStayed = cases.filter(c => c.case_status === 'Stayed').length;

  return (
    <div className="main-content">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <span className="subtitle">Judicial Analytics Workspace</span>
        {user.role === 'judge' ? (
          <h1>Hon'ble Judge {user.full_name}</h1>
        ) : (
          <h1>Advocate {user.full_name}</h1>
        )}
        <p className="scope-info text-muted">
          {user.role === 'judge' 
            ? `Jurisdiction scope: ${user.district_scope ? `${user.district_scope} District Courts` : 'All Gujarat Courts'}`
            : `Bar Registration: ${user.username.toUpperCase()} | Authorized Practitioner Panel`
          }
        </p>
      </div>

      <hr className="divider" />

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container" style={{ margin: 'auto' }}>
          <div className="spinner"></div>
          <p>Syncing court aggregates and predictive difficulty mapping...</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {user.role === 'judge' ? (
            /* ==========================================
               JUDGE DASHBOARD
               ========================================== */
            <>
              {/* Stat Cards */}
              <div className="stat-grid">
                <StatCard label="Total Monitored Cases" value={judgeTotal} />
                <StatCard label="Active Pending Caseload" value={judgePending} />
                <StatCard label="Overall Disposal Rate" value={judgeRate} />
                <StatCard label="Critical Backlog Districts" value={criticalDistrictsCount} />
              </div>

              {/* Gujarat clickable severity grid */}
              <div className="jw-card">
                <DistrictGrid 
                  summaries={summaries} 
                  onSelectDistrict={(id) => setSelectedSummaryId(id)} 
                  interactive={true}
                />
              </div>

              {/* High-priority cases list */}
              <div className="jw-card">
                <div className="card-header-row">
                  <h3>Recent High-Priority Pendencies</h3>
                  <button className="btn-brass" onClick={() => navigate('/search')}>Search Cases</button>
                </div>
                {cases.length === 0 ? (
                  <p className="no-cases text-muted">No pending cases found in your jurisdiction.</p>
                ) : (
                  <div className="jw-table-container" style={{ border: 'none', margin: '1rem 0 0 0' }}>
                    <table className="jw-table">
                      <thead>
                        <tr>
                          <th>Case CNR Number</th>
                          <th>District</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Caseload Severity</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((c) => (
                          <tr key={c.id}>
                            <td className="case-no-mono">{c.case_number}</td>
                            <td>{c.district_name}</td>
                            <td>{c.case_category}</td>
                            <td>{c.case_status}</td>
                            <td>
                              <span className={`badge badge-${c.difficulty_tier}`}>{c.difficulty_tier}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn-brass" 
                                style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                                onClick={() => navigate(`/cases/${c.id}`)}
                              >
                                View File
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ==========================================
               LAWYER DASHBOARD
               ========================================== */
            <>
              {/* Stat Cards */}
              <div className="stat-grid">
                <StatCard label="Assigned Litigations" value={lawyerTotal} />
                <StatCard label="Active Pending Trials" value={lawyerPending} />
                <StatCard label="Disposed Files" value={lawyerDisposed} />
                <StatCard label="Stayed Procedures" value={lawyerStayed} />
              </div>

              {/* Gujarat static grid */}
              <div className="jw-card">
                <DistrictGrid 
                  summaries={summaries} 
                  onSelectDistrict={() => {}} 
                  interactive={false}
                />
              </div>

              {/* Assigned Cases List */}
              <div className="jw-card">
                <div className="card-header-row">
                  <h3>My Active Caseload Assignments</h3>
                  <button className="btn-brass" onClick={() => navigate('/search')}>Search Files</button>
                </div>
                {cases.length === 0 ? (
                  <p className="no-cases text-muted">You are not currently assigned representing counsel on any active cases.</p>
                ) : (
                  <div className="jw-table-container" style={{ border: 'none', margin: '1rem 0 0 0' }}>
                    <table className="jw-table">
                      <thead>
                        <tr>
                          <th>Case CNR Number</th>
                          <th>Court</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Complexity Tier</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((c) => (
                          <tr key={c.id}>
                            <td className="case-no-mono">{c.case_number}</td>
                            <td>{c.court_name}</td>
                            <td>{c.case_category}</td>
                            <td>{c.case_status}</td>
                            <td>
                              <span className={`badge badge-${c.difficulty_tier}`}>{c.difficulty_tier}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn-brass" 
                                style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                                onClick={() => navigate(`/cases/${c.id}`)}
                              >
                                Access Brief
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Selected District Breakdown Popup */}
      {activeSummary && (
        <DistrictPopup
          summaryId={activeSummary.id}
          districtName={activeSummary.district_name}
          severityTier={activeSummary.severity_tier}
          pendingCount={activeSummary.pending_count}
          disposedCount={activeSummary.disposed_count}
          disposalRate={activeSummary.disposal_rate}
          onClose={() => setSelectedSummaryId(null)}
        />
      )}

      <style>{`
        .dashboard-header h1 {
          font-size: 2.25rem;
          margin-bottom: 0.25rem;
        }
        
        .dashboard-header .subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        
        .scope-info {
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-muted);
          padding-bottom: 0.5rem;
        }
        
        .card-header-row h3 {
          font-size: 1rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
        }
        
        .no-cases {
          text-align: center;
          padding: 2rem 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
