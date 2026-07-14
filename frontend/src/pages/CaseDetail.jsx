import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import DifficultyBadge from '../components/DifficultyBadge';
import HearingTimeline from '../components/HearingTimeline';

const ShieldAlertIcon = () =>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" />
  </svg>;


const CaseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editChargesheet, setEditChargesheet] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const [newAppendText, setNewAppendText] = useState('');
  const [appending, setAppending] = useState(false);

  const [judgeHearingDate, setJudgeHearingDate] = useState(new Date().toISOString().split('T')[0]);
  const [judgePurpose, setJudgePurpose] = useState('');
  const [judgeOutcomeNotes, setJudgeOutcomeNotes] = useState('');
  const [judgeNextHearingDate, setJudgeNextHearingDate] = useState('');
  const [judgeCaseStatus, setJudgeCaseStatus] = useState('Pending');
  const [loggingHearing, setLoggingHearing] = useState(false);

  const [verifiedLawyers, setVerifiedLawyers] = useState([]);
  const [verifiedJudges, setVerifiedJudges] = useState([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [representingSide, setRepresentingSide] = useState('Petitioner');
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [isAssigningJudge, setIsAssigningJudge] = useState(false);
  const [isAssigningLawyer, setIsAssigningLawyer] = useState(false);

  useEffect(() => {
    const fetchAssignmentsLists = async () => {
      if (user?.role === 'judge') {
        try {
          const [lawyersRes, judgesRes] = await Promise.all([
            api.get('/auth/lawyers/'),
            api.get('/auth/judges/')
          ]);
          setVerifiedLawyers(lawyersRes.data.results || lawyersRes.data);
          setVerifiedJudges(judgesRes.data.results || judgesRes.data);
        } catch (err) {
          console.error("Failed to load active lawyers/judges", err);
        }
      }
    };
    fetchAssignmentsLists();
  }, [user]);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        // Try unscoped endpoint first so judges can view any district's case
        let caseRes;
        try {
          caseRes = await api.get(`/cases/${id}/`);
        } catch {
          caseRes = await api.get(`/cases/all/?id=${id}`);
          if (caseRes.data?.results?.length) {
            caseRes = { data: caseRes.data.results[0] };
          }
        }

        setCaseItem(caseRes.data);
        setEditChargesheet(caseRes.data.chargesheet_status);
        setEditNotes(caseRes.data.case_notes || '');
        setJudgeCaseStatus(caseRes.data.case_status);

        // Fetch prediction separately — non-blocking
        try {
          const diffRes = await api.get(`/cases/${id}/predict/`);
          setPrediction(diffRes.data);
        } catch (predErr) {
          console.warn('Prediction unavailable for this case:', predErr);
        }

        // Fetch hearings separately — non-blocking
        try {
          const hearingRes = await api.get(`/timeline/?case=${id}`);
          setHearings(hearingRes.data.results || hearingRes.data);
        } catch (hearingErr) {
          console.warn('Hearings unavailable for this case:', hearingErr);
        }

      } catch (err) {
        console.error('Failed to load case details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaseData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.patch(`/cases/${id}/`, {
        chargesheet_status: editChargesheet,
        case_notes: editNotes
      });
      setCaseItem(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update case:', err);
      alert('Failed to update case details.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAppendNote = async (e) => {
    e.preventDefault();
    if (!newAppendText.trim()) return;
    
    setAppending(true);
    const updatedNotes = caseItem.case_notes 
      ? `${caseItem.case_notes}\n\n[${new Date().toLocaleString()}] ${newAppendText}`
      : `[${new Date().toLocaleString()}] ${newAppendText}`;
      
    try {
      const res = await api.patch(`/cases/${id}/`, {
        case_notes: updatedNotes
      });
      setCaseItem(res.data);
      setNewAppendText('');
      alert('Note appended successfully!');
    } catch (err) {
      console.error('Failed to append note:', err);
      alert('Failed to append note.');
    } finally {
      setAppending(false);
    }
  };

  const handleLogHearing = async (e) => {
    e.preventDefault();
    if (!judgePurpose.trim() || !judgeOutcomeNotes.trim()) return;
    setLoggingHearing(true);
    try {
      // 1. Log the new hearing event
      await api.post('/timeline/', {
        case: parseInt(id),
        hearing_date: judgeHearingDate,
        purpose: judgePurpose,
        outcome_notes: judgeOutcomeNotes,
        next_hearing_date: judgeNextHearingDate || null
      });

      // 2. Modify case status
      const casePatchRes = await api.patch(`/cases/${id}/`, {
        case_status: judgeCaseStatus
      });

      // 3. Refresh data to instantly render updates
      const hearingRes = await api.get(`/timeline/?case=${id}`);
      setCaseItem(casePatchRes.data);
      setHearings(hearingRes.data.results || hearingRes.data);

      // Reset form fields (except date/status defaults)
      setJudgePurpose('');
      setJudgeOutcomeNotes('');
      setJudgeNextHearingDate('');
      alert('Hearing logged and case status updated successfully!');
    } catch (err) {
      console.error('Failed to log hearing / update case:', err);
      alert('Failed to log hearing or update case status.');
    } finally {
      setLoggingHearing(false);
    }
  };

  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!selectedJudgeId) return;
    setIsAssigningJudge(true);
    try {
      const res = await api.patch(`/cases/${id}/`, {
        judge: parseInt(selectedJudgeId)
      });
      setCaseItem(res.data);
      alert('Presiding Justice assigned successfully!');
    } catch (err) {
      console.error("Failed to assign judge", err);
      alert("Failed to assign Presiding Justice.");
    } finally {
      setIsAssigningJudge(false);
    }
  };

  const handleAssignLawyer = async (e) => {
    e.preventDefault();
    const targetLawyerId = isJudge ? selectedLawyerId : user.id;
    if (!targetLawyerId) return;
    
    setIsAssigningLawyer(true);
    try {
      await api.post(`/cases/${id}/assign_lawyer/`, {
        lawyer_id: parseInt(targetLawyerId),
        representing: representingSide
      });
      const caseRes = await api.get(`/cases/${id}/`);
      setCaseItem(caseRes.data);
      setSelectedLawyerId('');
      alert('Advocate Litigator assigned successfully!');
    } catch (err) {
      console.error("Failed to assign lawyer", err);
      alert("Failed to assign Advocate Litigator.");
    } finally {
      setIsAssigningLawyer(false);
    }
  };

  const handleUnassignLawyer = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to unassign this litigator?")) return;
    try {
      await api.post(`/cases/${id}/unassign_lawyer/`, {
        assignment_id: assignmentId
      });
      const caseRes = await api.get(`/cases/${id}/`);
      setCaseItem(caseRes.data);
      alert('Advocate Litigator unassigned successfully!');
    } catch (err) {
      console.error("Failed to unassign lawyer", err);
      alert("Failed to unassign Advocate Litigator.");
    }
  };

  if (loading) {
    return <div className="main-content"><div className="spinner" style={{ margin: 'auto' }} /></div>;
  }

  if (!caseItem) {
    return (
      <div className="main-content">
        <div className="empty-state"><p>Case record not found or access denied.</p></div>
      </div>);

  }

  const isAssignedLawyer = user?.role === 'lawyer' &&
  caseItem.assigned_lawyers &&
  caseItem.assigned_lawyers.some((l) => l.lawyer === user.id);
  const isJudge = user?.role === 'judge';
  const canEdit = isJudge || isAssignedLawyer;

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        
        {/* Back Link */}
        <button className="back-link" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Back to Directory
        </button>

        {/* Case Banner */}
        <div className="case-banner">
          <div>
            <div className="case-banner-id">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
              </svg>
              <h1>{caseItem.case_number}</h1>
              <DifficultyBadge tier={caseItem.difficulty_tier} />
            </div>
            <div className="case-banner-meta">
              <span>System ID: {caseItem.id}</span>
              <span>•</span>
              <span>{caseItem.district_name} Jurisdiction</span>
            </div>
          </div>
          
          {canEdit && !isEditing &&
          <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit Case
            </button>
          }
        </div>

        <div className="grid-2-1">
          {/* Left Column */}
          <div className="flex-col space-y-2">
            
            {/* Dossier Grid */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Judicial Case Information Dossier</h2>
              </div>
              <div className="case-info-grid">
                <div className="case-info-item">
                  <span className="case-info-label">Assigned Court Forum</span>
                  <span className="case-info-value">{caseItem.court_name}</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Presiding Justice</span>
                  <span className="case-info-value">
                    {caseItem.judge_name || 'Unassigned'}
                    {isJudge && (
                      <form onSubmit={handleAssignJudge} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <select 
                          className="form-control" 
                          style={{ padding: '0.25rem', fontSize: '0.75rem', height: '32px', minWidth: '150px' }}
                          value={selectedJudgeId}
                          onChange={(e) => setSelectedJudgeId(e.target.value)}
                          required
                        >
                          <option value="">Assign Judge...</option>
                          {verifiedJudges.map(j => (
                            <option key={j.id} value={j.id}>{j.full_name}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', height: '32px' }} disabled={isAssigningJudge}>
                          {isAssigningJudge ? '...' : 'Assign'}
                        </button>
                      </form>
                    )}
                  </span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Statutory Case Category</span>
                  <span className="case-info-value">{caseItem.case_category}</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Statutory Offence Type</span>
                  <span className="case-info-value">{caseItem.crime_type || 'N/A'}</span>
                </div>
                <div className="case-info-item full-width">
                  <span className="case-info-label">Applicable Penal/Civil Sections</span>
                  <span className="case-info-value case-info-value--mono">{caseItem.applicable_sections}</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Police FIR Code / Date</span>
                  <span className="case-info-value case-info-value--mono">
                    {caseItem.fir_number || 'N/A'} {caseItem.fir_date ? `(${caseItem.fir_date})` : ''}
                  </span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Arrest Date</span>
                  <span className="case-info-value case-info-value--mono">{caseItem.arrest_date || 'No Arrest Applicable'}</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Case Filing Date</span>
                  <span className="case-info-value case-info-value--mono">{caseItem.filed_date}</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Parties Count In Litigation</span>
                  <span className="case-info-value case-info-value--mono">{caseItem.num_parties} Parties</span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Active Litigation Status</span>
                  <span className={`case-info-value ${caseItem.case_status === 'Disposed' ? 'text-success' : 'case-info-value--warning'}`}>
                    {caseItem.case_status}
                  </span>
                </div>
                <div className="case-info-item">
                  <span className="case-info-label">Chargesheet Filing Status</span>
                  <span className="case-info-value case-info-value--accent">
                    {caseItem.chargesheet_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Case Notes Log */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Case Notes Log</h2>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                {caseItem.case_notes || 'No notes logged yet.'}
              </div>
              <form onSubmit={handleAppendNote} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ flex: 1 }}
                  placeholder="Type a new update to append to the log..."
                  value={newAppendText}
                  onChange={(e) => setNewAppendText(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={appending}>
                  {appending ? 'Logging...' : 'Append Note'}
                </button>
              </form>
            </div>

            {/* Hearing Timeline */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Judicial Hearing Timeline Log</h2>
              </div>
              <HearingTimeline hearings={hearings} />
            </div>
            
          </div>

          {/* Right Column */}
          <div className="flex-col space-y-2">
            
            {/* Case Predictions */}
            {prediction && !prediction.error &&
            <div className="jw-card jw-card--accent">
                <div className="jw-card-header">
                  <h2 className="jw-card-title">AI Case Prediction</h2>
                </div>
                
                <div className="grid-2-1" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div className="difficulty-meter">
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Duration Risk</div>
                    <div className={`difficulty-score difficulty-score--${prediction.duration_risk}`}>
                      {prediction.duration_risk.toUpperCase()}
                    </div>
                    <div className="progress-track mt-1 mb-1">
                      <div className={`progress-fill progress-fill--${prediction.duration_risk === 'critical' ? 'danger' : prediction.duration_risk === 'high' ? 'warning' : 'success'}`}
                    style={{ width: `${prediction.duration_confidence}%` }} />
                    </div>
                    <div className="difficulty-tier-label">Confidence: {prediction.duration_confidence}%</div>
                  </div>

                  <div className="difficulty-meter">
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Disposal within 12m</div>
                    <div className={`difficulty-score difficulty-score--${prediction.disposal_likelihood.includes('Likely') ? 'low' : 'critical'}`}>
                      {prediction.disposal_likelihood.includes('Likely') ? 'LIKELY' : 'UNLIKELY'}
                    </div>
                    <div className="progress-track mt-1 mb-1">
                      <div className={`progress-fill progress-fill--${prediction.disposal_likelihood.includes('Likely') ? 'success' : 'danger'}`}
                    style={{ width: `${prediction.disposal_confidence}%` }} />
                    </div>
                    <div className="difficulty-tier-label">Confidence: {prediction.disposal_confidence}%</div>
                  </div>
                </div>
                
                <div className="mb-2">
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>Key Risk Factors:</span>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                    {prediction.risk_factors?.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                
                <div className="disclaimer-box">
                  <div className="disclaimer-header">
                    <ShieldAlertIcon />
                    <span>Machine Learning Disclaimer</span>
                  </div>
                  <div className="disclaimer-text">These predictions are generated by a RandomForest classifier trained on historical judicial data. They assess procedural timelines and do NOT predict case outcomes, merits, or guilt.</div>
                </div>
              </div>
            }

            {/* Judge Actions: Log Hearing & Change Status */}
            {user?.role === 'judge' && (
              <div className="jw-card" style={{ border: '1px solid var(--accent-main)' }}>
                <div className="jw-card-header">
                  <h2 className="jw-card-title" style={{ color: 'var(--accent-main)' }}>Judge: Log New Hearing Event</h2>
                </div>
                <form onSubmit={handleLogHearing} className="animate-fadeIn">
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Hearing Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={judgeHearingDate}
                      onChange={(e) => setJudgeHearingDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Hearing Purpose</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Admission, Argument, Evidence"
                      value={judgePurpose}
                      onChange={(e) => setJudgePurpose(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Outcome Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Enter hearing outcome and details..."
                      value={judgeOutcomeNotes}
                      onChange={(e) => setJudgeOutcomeNotes(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Next Hearing Date (Optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={judgeNextHearingDate}
                      onChange={(e) => setJudgeNextHearingDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Modify Case Status</label>
                    <select
                      className="form-control"
                      value={judgeCaseStatus}
                      onChange={(e) => setJudgeCaseStatus(e.target.value)}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Disposed">Disposed</option>
                      <option value="Stayed">Stayed</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-full" disabled={loggingHearing}>
                    {loggingHearing ? 'Submitting Log...' : 'Commit Log & Status'}
                  </button>
                </form>
              </div>
            )}
            {/* Assigned Litigators */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Assigned Litigators</h2>
              </div>
              {(caseItem.assigned_lawyers || []).length === 0 ?
              <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>No litigators assigned.</div> :

              <div className="flex-col space-y-1" style={{ marginBottom: '0.5rem' }}>
                {(caseItem.assigned_lawyers || []).map((l) => {
                  const canRemove = isJudge || (user?.role === 'lawyer' && l.lawyer === user.id);
                  return (
                    <div key={l.id} className="lawyer-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="lawyer-card-name">{l.full_name}</div>
                        <div className="lawyer-card-bar">System ID: {l.lawyer} ({l.representing})</div>
                      </div>
                      {canRemove && (
                        <button 
                          className="btn-link" 
                          style={{ color: 'var(--severity-critical)', fontSize: '0.7rem', border: 'none', cursor: 'pointer', background: 'none' }}
                          onClick={() => handleUnassignLawyer(l.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              }

              {/* Judge Form: Assign Any Lawyer */}
              {isJudge && (
                <form onSubmit={handleAssignLawyer} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Assign New Advocate</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select 
                      className="form-control" 
                      style={{ padding: '0.25rem', fontSize: '0.75rem', height: '32px' }}
                      value={selectedLawyerId} 
                      onChange={(e) => setSelectedLawyerId(e.target.value)}
                      required
                    >
                      <option value="">Choose Lawyer...</option>
                      {verifiedLawyers.map(lawyer => (
                        <option key={lawyer.id} value={lawyer.id}>{lawyer.full_name}</option>
                      ))}
                    </select>
                    <select 
                      className="form-control" 
                      style={{ padding: '0.25rem', fontSize: '0.75rem', height: '32px' }}
                      value={representingSide} 
                      onChange={(e) => setRepresentingSide(e.target.value)}
                      required
                    >
                      <option value="Petitioner">Petitioner</option>
                      <option value="Respondent">Respondent</option>
                      <option value="Third Party">Third Party</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-full btn-sm" style={{ height: '32px', fontSize: '0.75rem' }} disabled={isAssigningLawyer}>
                    {isAssigningLawyer ? 'Assigning...' : 'Assign Advocate'}
                  </button>
                </form>
              )}

              {/* Lawyer Form: Self-Assign representation */}
              {user?.role === 'lawyer' && !isAssignedLawyer && (
                <form onSubmit={handleAssignLawyer} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Represent a Party</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select 
                      className="form-control" 
                      value={representingSide} 
                      onChange={(e) => setRepresentingSide(e.target.value)}
                      required
                      style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', height: '32px' }}
                    >
                      <option value="Petitioner">Petitioner</option>
                      <option value="Respondent">Respondent</option>
                      <option value="Third Party">Third Party</option>
                    </select>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ height: '32px', fontSize: '0.75rem', padding: '0 1rem' }} disabled={isAssigningLawyer}>
                      {isAssigningLawyer ? '...' : 'Represent'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Case Notes Editor */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Case Trial Notes</h2>
              </div>
              
              {isEditing ?
              <form onSubmit={handleUpdate} className="animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Chargesheet Status</label>
                    <select className="form-control" value={editChargesheet} onChange={(e) => setEditChargesheet(e.target.value)}>
                      <option value="Not Filed">Not Filed</option>
                      <option value="Filed">Filed</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Trial">Trial</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dossier Notes</label>
                    <textarea
                    className="form-control"
                    rows={5}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Provide trial observations, missing files, counsel declarations..." />
                  
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary flex-1" disabled={updating}>
                      {updating ? 'Saving...' : 'Save Dossier'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form> :

              <div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {caseItem.case_notes || 'No trial notes documented in the registry. Active assigned counsel can compile notes.'}
                  </div>
                  {isAssignedLawyer &&
                <button className="btn-link mt-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={() => setIsEditing(true)}>
                      Quick Edit Folder Notes
                    </button>
                }
                </div>
              }
            </div>

          </div>
        </div>
      </div>
    </div>);

};

export default CaseDetail;