import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { CaseListItem, SystemOverview } from '../types';
import StatCard from '../components/StatCard';
import DistrictGrid from '../components/DistrictGrid';
import DistrictModal from '../components/DistrictModal';
import DifficultyBadge from '../components/DifficultyBadge';
import type { DistrictSummary } from '../types';

const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [escalationCases, setEscalationCases] = useState<CaseListItem[]>([]);
  const [myCases, setMyCases] = useState<CaseListItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const isJudge = user?.role === 'judge';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isJudge) {
          // Judge: fetch analytics overview + top critical cases
          const [overviewRes, districtRes, casesRes] = await Promise.all([
            api.get('/analytics/overview/'),
            api.get('/districts/summary/'),
            api.get('/cases/', { params: { case_status: 'Pending', ordering: '-difficulty_score', page_size: 5 } })
          ]);
          setOverview(overviewRes.data);
          setDistricts(districtRes.data);
          setEscalationCases(casesRes.data.results || casesRes.data);
        } else {
          // Lawyer: fetch their own cases
          const [casesRes, districtRes] = await Promise.all([
            api.get('/cases/'),
            api.get('/districts/summary/')
          ]);
          const cases = casesRes.data.results || casesRes.data;
          setMyCases(cases);
          setDistricts(districtRes.data);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isJudge]);

  if (loading) {
    return (
      <div className="main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Compute lawyer stats
  const lawyerCaseCount = myCases.length;
  const hearingsCount = myCases.filter(c => c.case_status === 'Pending').length;
  const highComplexity = myCases.filter(c => c.difficulty_tier === 'critical' || c.difficulty_tier === 'high').length;
  const pendingChargesheet = myCases.filter(c => c.chargesheet_status === 'Not Filed' || c.chargesheet_status === 'Under Review').length;

  // Compute judge stats
  const criticalDistricts = districts.filter(d => d.severity_tier === 'critical').length;

  const getChargesheetBadge = (status: string) => {
    switch (status) {
      case 'Filed':
      case 'Trial':
        return 'badge badge-filed';
      case 'Not Filed':
        return 'badge badge-not-filed';
      default:
        return 'badge badge-pending';
    }
  };

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-info">
            <h1 id="dashboard-title">
              {isJudge ? 'State Caseload Command Center' : 'Advocate Caseload Workbench'}
            </h1>
            <p className="page-header-meta">
              {isJudge
                ? 'Gujarat District Courts — Aggregate pendency and escalation monitoring'
                : 'Bar Council Registry — Assigned cases, scheduling, and litigation filings'}
            </p>
          </div>
          <div className="notice notice-info" style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem' }}>
            Welcome, {isJudge ? 'Hon\'ble Justice' : 'Advocate'} {user?.full_name?.split(' ').slice(-1)[0]}
          </div>
        </div>

        {/* ======================== JUDGE VIEW ======================== */}
        {isJudge && overview && (
          <>
            {/* Stats */}
            <div className="stat-grid">
              <StatCard
                label="Total Pending Cases"
                value={overview.pending_cases}
                footer="State Aggregate"
                valueClass="stat-value--accent"
              />
              <StatCard
                label="Total Disposed"
                value={overview.total_cases - overview.pending_cases}
                footer="Confirmed Closures"
                valueClass="stat-value--success"
              />
              <StatCard
                label="Districts Monitored"
                value={districts.length}
                footer="Active Court Zones"
              />
              <StatCard
                label="Critical Backlog Zones"
                value={criticalDistricts}
                footer="Requires Urgent Action"
                valueClass="stat-value--danger"
              />
            </div>

            {/* District Grid */}
            <div className="jw-card" style={{ marginBottom: '2rem' }}>
              <div className="jw-card-header">
                <div>
                  <h2 className="jw-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />
                    </svg>
                    Gujarat Districts — Severity Heatmap
                  </h2>
                  <p className="jw-card-subtitle">Click any district tile for case breakdown</p>
                </div>
              </div>
              <DistrictGrid
                interactive={true}
                onDistrictClick={(d) => setSelectedDistrict(d)}
              />
            </div>

            {/* Critical Escalation Watch */}
            <div className="jw-card">
              <div className="jw-card-header">
                <div>
                  <h2 className="jw-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
                    </svg>
                    Critical Backlog Escalation Watch
                  </h2>
                  <p className="jw-card-subtitle">Top 5 highest-difficulty pending cases in the state</p>
                </div>
                <button className="btn btn-ghost" onClick={() => navigate('/search')} id="view-all-cases-btn">
                  View All Cases <ChevronRight />
                </button>
              </div>

              {escalationCases.length === 0 ? (
                <div className="empty-state"><p>No pending cases found.</p></div>
              ) : (
                <div className="jw-table-wrapper">
                  <table className="jw-table">
                    <thead>
                      <tr>
                        <th>Case Reference</th>
                        <th>District</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Complexity</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escalationCases.map((c) => (
                        <tr key={c.id} className="clickable" onClick={() => navigate(`/cases/${c.id}`)}>
                          <td>
                            <span className="td-case-no"><FileTextIcon /> {c.case_number}</span>
                          </td>
                          <td>{c.district_name}</td>
                          <td>{c.case_category}</td>
                          <td><span className="badge badge-pending">{c.case_status}</span></td>
                          <td><DifficultyBadge tier={c.difficulty_tier} /></td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}>
                              Inspect <ChevronRight />
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

        {/* ======================== LAWYER VIEW ======================== */}
        {!isJudge && (
          <>
            {/* Stats */}
            <div className="stat-grid">
              <StatCard label="Cases Assigned to Me" value={lawyerCaseCount} footer="Active Advocacy Records" valueClass="stat-value--accent" />
              <StatCard label="Pending Hearings" value={hearingsCount} footer="Required Court Appearances" />
              <StatCard label="Complexity Flags" value={highComplexity} footer="High Complexity Trials" valueClass="stat-value--warning" />
              <StatCard label="Pending Chargesheets" value={pendingChargesheet} footer="Required Procedural Actions" valueClass="stat-value--danger" />
            </div>

            {/* Static District Grid (Read-Only for Lawyers) */}
            <div className="jw-card" style={{ marginBottom: '2rem' }}>
              <div className="jw-card-header">
                <div>
                  <h2 className="jw-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" />
                    </svg>
                    Gujarat Courts Reference Matrix (Read-Only)
                  </h2>
                  <p className="jw-card-subtitle">Caseload density of the court districts. Contact the registrar for transfers.</p>
                </div>
              </div>
              <DistrictGrid interactive={false} />
            </div>

            {/* My Cases Table */}
            <div className="jw-card">
              <div className="jw-card-header">
                <div>
                  <h2 className="jw-card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                    Assigned Litigation Cases
                  </h2>
                  <p className="jw-card-subtitle">Select any file to update statuses, hearings, or case folders</p>
                </div>
              </div>

              {myCases.length === 0 ? (
                <div className="empty-state">
                  <FileTextIcon />
                  <p>No active assignments identified under your Bar Council ID.</p>
                </div>
              ) : (
                <div className="jw-table-wrapper">
                  <table className="jw-table">
                    <thead>
                      <tr>
                        <th>Case Reference</th>
                        <th>District</th>
                        <th>Crime Type</th>
                        <th>Chargesheet</th>
                        <th>Complexity</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCases.map((c) => (
                        <tr key={c.id} className="clickable" onClick={() => navigate(`/cases/${c.id}`)}>
                          <td>
                            <span className="td-case-no"><FileTextIcon /> {c.case_number}</span>
                          </td>
                          <td>{c.district_name}</td>
                          <td className="td-mono">{c.crime_type || '—'}</td>
                          <td><span className={getChargesheetBadge(c.chargesheet_status)}>{c.chargesheet_status}</span></td>
                          <td><DifficultyBadge tier={c.difficulty_tier} /></td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}>
                              Manage <ChevronRight />
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

      {/* District Modal */}
      {selectedDistrict && (
        <DistrictModal
          district={selectedDistrict}
          onClose={() => setSelectedDistrict(null)}
          onAuditCases={(districtName) => {
            setSelectedDistrict(null);
            navigate(`/search?district=${encodeURIComponent(districtName)}`);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
