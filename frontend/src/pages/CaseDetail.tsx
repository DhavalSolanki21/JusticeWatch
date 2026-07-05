import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FaArrowLeft, 
  FaRegFileAlt, 
  FaHistory, 
  FaUserShield, 
  FaEdit, 
  FaPlusCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

interface CaseDetailData {
  id: number;
  case_number: string;
  court_name: string;
  case_category: string;
  crime_type: string | null;
  applicable_sections: string;
  fir_number: string | null;
  fir_date: string | null;
  arrest_date: string | null;
  chargesheet_status: string;
  case_status: string;
  filed_date: string;
  disposed_date: string | null;
  num_parties: number;
  case_notes: string | null;
  difficulty_score: number | null;
  difficulty_tier: 'low' | 'medium' | 'high' | 'critical' | null;
  district: number;
  district_name?: string;
  judge: number | null;
  judge_name?: string;
  assigned_lawyers: Array<{
    id: number;
    lawyer: number;
    full_name: string;
    representing: string;
    assigned_date: string;
  }>;
}

interface DifficultyBreakdown {
  difficulty_score: number;
  difficulty_tier: 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: string[];
  disclaimer: string;
}

interface HearingItem {
  id: number;
  case: number;
  case_number: string;
  hearing_date: string;
  purpose: string;
  outcome_notes: string | null;
  next_hearing_date: string | null;
  logged_by: number;
  logged_by_name: string;
  created_at: string;
}

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [caseData, setCaseData] = useState<CaseDetailData | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyBreakdown | null>(null);
  const [hearings, setHearings] = useState<HearingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form States - Case Update (Lawyer only)
  const [editNotes, setEditNotes] = useState('');
  const [editChargesheet, setEditChargesheet] = useState('');
  const [updatingCase, setUpdatingCase] = useState(false);

  // Form States - Hearing Log
  const [hDate, setHDate] = useState('');
  const [hPurpose, setHPurpose] = useState('');
  const [hNotes, setHNotes] = useState('');
  const [hNextDate, setHNextDate] = useState('');
  const [loggingHearing, setLoggingHearing] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Case Details
      const caseRes = await api.get(`/cases/${id}/`);
      setCaseData(caseRes.data);
      setEditNotes(caseRes.data.case_notes || '');
      setEditChargesheet(caseRes.data.chargesheet_status);

      // 2. Fetch Difficulty Breakdown
      const diffRes = await api.get(`/cases/${id}/difficulty_breakdown/`);
      setDifficulty(diffRes.data);

      // 3. Fetch Hearings list for this case
      const hearingsRes = await api.get(`/timeline/?case=${id}`);
      setHearings(hearingsRes.data);
    } catch (err: any) {
      console.error("Dossier fetch error:", err);
      setError("Dossier record load error. Verify connection or judicial scope authorization.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (!user) return null;

  // Check if current user is an assigned lawyer on this case
  const isAssignedLawyer = caseData 
    ? caseData.assigned_lawyers.some(l => l.lawyer === user.id) 
    : false;

  // Check if current judge matches the district scope
  const isEligibleJudge = caseData && user.role === 'judge'
    ? (!user.district_scope || user.district_scope === caseData.district_name)
    : false;

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setUpdatingCase(true);
    setFormSuccess(null);
    try {
      await api.patch(`/cases/${id}/`, {
        chargesheet_status: editChargesheet,
        case_notes: editNotes,
      });
      setFormSuccess("Dossier aggregates saved successfully.");
      
      // Refresh case details to update UI
      const caseRes = await api.get(`/cases/${id}/`);
      setCaseData(caseRes.data);
    } catch (err: any) {
      console.error("Case update failed:", err);
      setError("Failed to save dossier amendments.");
    } finally {
      setUpdatingCase(false);
    }
  };

  const handleLogHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hDate || !hPurpose) {
      setError("Hearing date and purpose are required.");
      return;
    }

    setLoggingHearing(true);
    setFormSuccess(null);
    try {
      await api.post('/timeline/', {
        case: id,
        hearing_date: hDate,
        purpose: hPurpose,
        outcome_notes: hNotes,
        next_hearing_date: hNextDate || null,
      });
      
      setFormSuccess("Dossier hearing logged successfully.");
      
      // Clear hearing inputs
      setHDate('');
      setHPurpose('');
      setHNotes('');
      setHNextDate('');

      // Refresh data
      const hearingsRes = await api.get(`/timeline/?case=${id}`);
      setHearings(hearingsRes.data);
      const diffRes = await api.get(`/cases/${id}/difficulty_breakdown/`);
      setDifficulty(diffRes.data);
    } catch (err: any) {
      console.error("Hearing logging failed:", err);
      setError("Failed to log hearing: " + (err.response?.data?.detail || "Authorized role verification failure."));
    } finally {
      setLoggingHearing(false);
    }
  };

  return (
    <div className="main-content">
      {/* Return Button */}
      <div className="back-nav" onClick={() => navigate('/search')}>
        <FaArrowLeft /> <span>Back to litigation list</span>
      </div>

      {loading ? (
        <div className="loading-container" style={{ margin: 'auto' }}>
          <div className="spinner"></div>
          <p>Decrypting dockets and calculating difficulty index...</p>
        </div>
      ) : error || !caseData ? (
        <div className="alert alert-danger" style={{ margin: '2rem 0' }}>
          <span>{error || "Dossier not found."}</span>
        </div>
      ) : (
        <div className="detail-layout">
          {/* Header */}
          <div className="detail-header">
            <div className="header-info">
              <span className="case-no-mono font-serif" style={{ fontSize: '1.75rem', color: 'var(--accent-brass)' }}>
                {caseData.case_number}
              </span>
              <span className="district-info text-muted">
                {caseData.court_name} | {caseData.district_name || 'Gujarat District'}
              </span>
            </div>
            <div className="header-badges">
              <span className={`badge badge-${caseData.case_status.toLowerCase()}`}>{caseData.case_status}</span>
              {caseData.difficulty_tier && (
                <span className={`badge badge-${caseData.difficulty_tier}`} style={{ marginLeft: '0.5rem' }}>
                  Complexity: {caseData.difficulty_tier}
                </span>
              )}
            </div>
          </div>

          <hr className="divider" />

          {formSuccess && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem', borderColor: 'var(--color-disposed)', color: 'var(--color-disposed)' }}>
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid-2col" style={{ alignItems: 'start' }}>
            {/* Left Hand: Core Info Dossier */}
            <div className="jw-card">
              <div className="section-title">
                <FaRegFileAlt className="title-icon" />
                <h3>Case Dossier details</h3>
              </div>
              <div className="info-dossier-grid">
                <div className="info-item">
                  <span className="label">Jurisdiction State</span>
                  <span className="value">Gujarat</span>
                </div>
                <div className="info-item">
                  <span className="label">District Court</span>
                  <span className="value">{caseData.district_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Case Category</span>
                  <span className="value">{caseData.case_category}</span>
                </div>
                <div className="info-item">
                  <span className="label">Crime Type</span>
                  <span className="value">{caseData.crime_type || 'Civil / Not Applicable'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Applicable Sections</span>
                  <span className="value">{caseData.applicable_sections}</span>
                </div>
                <div className="info-item">
                  <span className="label">FIR Registry Number</span>
                  <span className="value">{caseData.fir_number || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">FIR Date</span>
                  <span className="value">{caseData.fir_date || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Arrest Registry Date</span>
                  <span className="value">{caseData.arrest_date || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Chargesheet Status</span>
                  <span className="value">{caseData.chargesheet_status}</span>
                </div>
                <div className="info-item">
                  <span className="label">Registry Filing Date</span>
                  <span className="value">{caseData.filed_date}</span>
                </div>
                <div className="info-item">
                  <span className="label">Disposed Date</span>
                  <span className="value">{caseData.disposed_date || 'Active Pending Litigation'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Number of Parties</span>
                  <span className="value">{caseData.num_parties}</span>
                </div>
                <div className="info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="label">Presiding Judicial Magistrate</span>
                  <span className="value">{caseData.judge_name || 'Vacant / Not Assigned'}</span>
                </div>
              </div>
            </div>

            {/* Right Hand: Complexity Analysis */}
            <div className="jw-card" style={{ borderLeft: '3px solid var(--accent-brass)' }}>
              <div className="section-title">
                <FaRegFileAlt className="title-icon" style={{ color: 'var(--accent-brass)' }} />
                <h3>Caseload Complexity Index</h3>
              </div>
              {difficulty ? (
                <div className="difficulty-panel">
                  <div className="score-header-box">
                    <div className="gauge-score">
                      <span className="num font-serif">{difficulty.difficulty_score.toFixed(2)}</span>
                      <span className="label">Score (0-1 Scale)</span>
                    </div>
                    <div className="gauge-tier">
                      <span className={`badge badge-${difficulty.difficulty_tier}`}>{difficulty.difficulty_tier}</span>
                      <span className="label">Calculated Tier</span>
                    </div>
                  </div>

                  <div className="factors-box">
                    <h4>Procedural Risk Factors Identified</h4>
                    {difficulty.contributing_factors.length === 0 ? (
                      <p className="no-factors text-muted">No high-risk procedural blockers found.</p>
                    ) : (
                      <ul className="factors-list">
                        {difficulty.contributing_factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="disclaimer-alert">
                    <FaExclamationTriangle className="icon" />
                    <p>{difficulty.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted">Complexity assessment models offline.</p>
              )}
            </div>
          </div>

          {/* Assigned Legal Counsels */}
          <div className="jw-card">
            <div className="section-title">
              <FaUserShield className="title-icon" />
              <h3>Assigned Representing Advocate Counsels</h3>
            </div>
            {caseData.assigned_lawyers.length === 0 ? (
              <p className="no-lawyers text-muted">Advocate briefs not yet filed. No counsel assigned representing parties.</p>
            ) : (
              <div className="lawyers-dossier-list">
                {caseData.assigned_lawyers.map((l, idx) => (
                  <div key={idx} className="lawyer-badge-card">
                    <span className="l-name font-serif">{l.full_name}</span>
                    <span className="l-representing">{l.representing} Counsel</span>
                    <span className="l-date font-mono text-muted">Joined: {l.assigned_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Hearings */}
          <div className="jw-card">
            <div className="section-title">
              <FaHistory className="title-icon" />
              <h3>Litigation Timeline & Procedural History</h3>
            </div>
            {hearings.length === 0 ? (
              <p className="no-hearings text-muted">No procedural hearings have been logged for this litigation.</p>
            ) : (
              <div className="timeline-trail">
                {hearings.map((h, idx) => (
                  <div key={idx} className="timeline-node">
                    <div className="node-marker font-mono">{idx + 1}</div>
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-date font-mono">{h.hearing_date}</span>
                        <span className="node-purpose">{h.purpose}</span>
                        <span className="node-logged-by">Logged by: {h.logged_by_name}</span>
                      </div>
                      <p className="node-notes">{h.outcome_notes || 'No outcome records logged.'}</p>
                      {h.next_hearing_date && (
                        <div className="node-footer font-mono">
                          Next Hearing Scheduled: {h.next_hearing_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Forms - Only visible to assigned Lawyer or scope Judge */}
          {(isAssignedLawyer || isEligibleJudge) && (
            <div className="grid-2col" style={{ alignItems: 'start' }}>
              {/* Lawyer Inline Edit Form */}
              {isAssignedLawyer && (
                <div className="jw-card">
                  <div className="section-title">
                    <FaEdit className="title-icon" />
                    <h3>Edit Dossier notes (Assigned Counsel only)</h3>
                  </div>
                  <form onSubmit={handleUpdateCase} className="edit-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="chargesheet">Advocacy Chargesheet Status</label>
                      <select
                        id="chargesheet"
                        className="form-control"
                        value={editChargesheet}
                        onChange={(e) => setEditChargesheet(e.target.value)}
                        disabled={updatingCase}
                      >
                        <option value="Not Filed">Not Filed</option>
                        <option value="Filed">Filed</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Trial">Trial</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="notes">Litigation Case Brief Notes</label>
                      <textarea
                        id="notes"
                        className="form-control"
                        rows={4}
                        placeholder="Advocate notes regarding pleadings, procedural motions, or evidence briefs..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        disabled={updatingCase}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <button type="submit" className="btn-brass-filled" disabled={updatingCase}>
                      {updatingCase ? "Saving Dossier..." : "Save Dossier Amendments"}
                    </button>
                  </form>
                </div>
              )}

              {/* Log Hearing Form */}
              <div className="jw-card">
                <div className="section-title">
                  <FaPlusCircle className="title-icon" />
                  <h3>Log Procedural Hearing</h3>
                </div>
                <form onSubmit={handleLogHearing} className="hearing-form">
                  <div className="grid-2col" style={{ gap: '1rem', marginBottom: '0px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="hDate">Hearing Date</label>
                      <input
                        type="date"
                        id="hDate"
                        className="form-control"
                        value={hDate}
                        onChange={(e) => setHDate(e.target.value)}
                        disabled={loggingHearing}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="hPurpose">Hearing Purpose</label>
                      <input
                        type="text"
                        id="hPurpose"
                        className="form-control"
                        placeholder="e.g. Framing of Charges, Evidence"
                        value={hPurpose}
                        onChange={(e) => setHPurpose(e.target.value)}
                        disabled={loggingHearing}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="hNotes">Hearing Outcome Notes</label>
                    <textarea
                      id="hNotes"
                      className="form-control"
                      rows={3}
                      placeholder="Notes regarding judicial orders, submissions, or adjournments..."
                      value={hNotes}
                      onChange={(e) => setHNotes(e.target.value)}
                      disabled={loggingHearing}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="hNextDate">Adjournment Date (Next Hearing)</label>
                    <input
                      type="date"
                      id="hNextDate"
                      className="form-control"
                      value={hNextDate}
                      onChange={(e) => setHNextDate(e.target.value)}
                      disabled={loggingHearing}
                    />
                  </div>

                  <button type="submit" className="btn-brass-filled" disabled={loggingHearing}>
                    {loggingHearing ? "Logging..." : "Log Hearing Event"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .back-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--accent-brass);
          text-transform: uppercase;
          font-family: var(--font-serif);
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
          transition: color 0.2s ease;
          width: fit-content;
        }
        
        .back-nav:hover {
          color: var(--accent-brass-hover);
        }
        
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .header-info {
          display: flex;
          flex-direction: column;
        }
        
        .district-info {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-muted);
          padding-bottom: 0.5rem;
        }
        
        .section-title h3 {
          font-size: 0.95rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
        }
        
        .title-icon {
          color: var(--accent-brass);
          font-size: 1.1rem;
        }
        
        /* Dossier layout */
        .info-dossier-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-item .label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        
        .info-item .value {
          font-size: 0.95rem;
          color: var(--text-main);
          font-weight: 500;
        }
        
        /* Difficulty panel */
        .score-header-box {
          display: flex;
          justify-content: space-around;
          background-color: var(--bg-main);
          padding: 1.25rem;
          border: 1px solid var(--border-muted);
          margin-bottom: 1.5rem;
        }
        
        .gauge-score, .gauge-tier {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .gauge-score .num {
          font-size: 2.25rem;
          font-weight: bold;
          color: var(--accent-brass);
        }
        
        .gauge-score .label, .gauge-tier .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-top: 0.25rem;
        }
        
        .factors-box h4 {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-main);
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        
        .factors-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 1.5rem;
        }
        
        .factors-list li {
          font-size: 0.85rem;
          color: var(--text-muted);
          position: relative;
          padding-left: 1.25rem;
          margin-bottom: 0.4rem;
        }
        
        .factors-list li::before {
          content: '•';
          position: absolute;
          left: 0.25rem;
          color: var(--accent-brass);
          font-size: 1.1rem;
        }
        
        .disclaimer-alert {
          background-color: rgba(210, 150, 60, 0.05);
          border: 1px solid rgba(210, 150, 60, 0.2);
          padding: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .disclaimer-alert .icon {
          color: var(--color-pending);
          font-size: 1.2rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        
        .disclaimer-alert p {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        
        /* Advocate List */
        .lawyers-dossier-list {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        
        .lawyer-badge-card {
          border: 1px solid var(--border-muted);
          background-color: rgba(28, 36, 47, 0.2);
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          min-width: 240px;
        }
        
        .lawyer-badge-card .l-name {
          font-size: 1.05rem;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        
        .lawyer-badge-card .l-representing {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        
        .lawyer-badge-card .l-date {
          font-size: 0.7rem;
        }
        
        /* Timeline */
        .timeline-trail {
          display: flex;
          flex-direction: column;
          position: relative;
          padding-left: 2rem;
        }
        
        .timeline-trail::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 14px;
          width: 1px;
          background-color: var(--border-brass);
        }
        
        .timeline-node {
          position: relative;
          margin-bottom: 2rem;
        }
        
        .timeline-node:last-of-type {
          margin-bottom: 0;
        }
        
        .node-marker {
          position: absolute;
          left: -2rem;
          top: 0;
          width: 30px;
          height: 30px;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--accent-brass);
          color: var(--accent-brass);
          font-size: 0.8rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        
        .node-content {
          background-color: rgba(28, 36, 47, 0.2);
          border: 1px solid var(--border-muted);
          padding: 1.25rem;
        }
        
        .node-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-muted);
          padding-bottom: 0.35rem;
        }
        
        .node-date {
          color: var(--accent-brass);
          font-size: 0.85rem;
          font-weight: bold;
        }
        
        .node-purpose {
          color: var(--text-main);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          font-weight: 500;
        }
        
        .node-logged-by {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .node-notes {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        
        .node-footer {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: var(--color-pending);
          background-color: var(--bg-main);
          padding: 0.35rem 0.75rem;
          width: fit-content;
        }
      `}</style>
    </div>
  );
};

export default CaseDetail;
