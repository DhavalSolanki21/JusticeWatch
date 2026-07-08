import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { CaseDetail as CaseDetailType, CasePrediction, Hearing } from '../types';
import DifficultyBadge from '../components/DifficultyBadge';
import HearingTimeline from '../components/HearingTimeline';

const ShieldAlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" />
  </svg>
);

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [caseItem, setCaseItem] = useState<CaseDetailType | null>(null);
  const [prediction, setPrediction] = useState<CasePrediction | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editChargesheet, setEditChargesheet] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        const [caseRes, diffRes, hearingRes] = await Promise.all([
          api.get(`/cases/${id}/`),
          api.get(`/cases/${id}/predict/`),
          api.get(`/timeline/?case=${id}`)
        ]);
        
        setCaseItem(caseRes.data);
        setPrediction(diffRes.data);
        setHearings(hearingRes.data.results || hearingRes.data);
        
        setEditChargesheet(caseRes.data.chargesheet_status);
        setEditNotes(caseRes.data.case_notes || '');
      } catch (err) {
        console.error('Failed to load case details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaseData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
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

  if (loading) {
    return <div className="main-content"><div className="spinner" style={{ margin: 'auto' }} /></div>;
  }

  if (!caseItem) {
    return (
      <div className="main-content">
        <div className="empty-state"><p>Case record not found or access denied.</p></div>
      </div>
    );
  }

  // Check if current user is an assigned lawyer who can edit
  const isAssignedLawyer = user?.role === 'lawyer' && 
    caseItem.assigned_lawyers.some(l => l.full_name.includes(user.full_name.split(' ').slice(-1)[0]) || l.lawyer === user.id);

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
          
          {isAssignedLawyer && !isEditing && (
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Update Status & Notes
            </button>
          )}
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
                  <span className="case-info-value">{caseItem.judge_name || 'Unassigned'}</span>
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
            {prediction && !prediction.error && (
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
            )}

            {/* Assigned Litigators */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Assigned Litigators</h2>
              </div>
              {caseItem.assigned_lawyers.length === 0 ? (
                <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>No litigators assigned.</div>
              ) : (
                <div className="flex-col space-y-1">
                  {caseItem.assigned_lawyers.map(l => (
                    <div key={l.id} className="lawyer-card">
                      <div>
                        <div className="lawyer-card-name">{l.full_name}</div>
                        <div className="lawyer-card-bar">System ID: {l.lawyer}</div>
                      </div>
                      <div className="lawyer-card-role">{l.representing}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case Notes Editor */}
            <div className="jw-card">
              <div className="jw-card-header">
                <h2 className="jw-card-title">Case Trial Notes</h2>
              </div>
              
              {isEditing ? (
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
                      placeholder="Provide trial observations, missing files, counsel declarations..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary flex-1" disabled={updating}>
                      {updating ? 'Saving...' : 'Save Dossier'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {caseItem.case_notes || 'No trial notes documented in the registry. Active assigned counsel can compile notes.'}
                  </div>
                  {isAssignedLawyer && (
                    <button className="btn-link mt-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={() => setIsEditing(true)}>
                      Quick Edit Folder Notes
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
