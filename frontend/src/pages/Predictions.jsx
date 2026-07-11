import React, { useEffect, useState } from 'react';

import api from '../services/api';

import { DonutBars } from '../components/SvgCharts';

const BrainIcon = () =>
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>;


const SearchIcon = () =>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>;


const Predictions = () => {
  const [activeTab, setActiveTab] = useState('interactive');

  // Overview State
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Interactive Form State
  const [predictMode, setPredictMode] = useState('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customData, setCustomData] = useState({
    crime_type: 'Fraud',
    case_category: 'Criminal',
    chargesheet_status: 'Not Filed',
    num_parties: 2,
    num_hearings: 0,
    filing_to_first_list_days: 30,
    listing_gap_days: 180,
    court_caseload: 100,
    case_age_days: 365,
    female_defendant: 0,
    female_petitioner: 0
  });

  // Prediction Result State
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/analytics/predictions/');
        setOverview(res.data);
      } catch (err) {
        console.error('Failed to load predictions overview:', err);
      } finally {
        setLoadingOverview(false);
      }
    };
    fetchOverview();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/cases/?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const runPrediction = async (payload) => {
    setIsPredicting(true);
    setPredictError(null);
    setPredictionResult(null);
    try {
      const res = await api.post('/analytics/predict-custom/', payload);
      setPredictionResult(res.data);
    } catch (e) {
      setPredictError(e.response?.data?.error || 'Failed to generate prediction.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    runPrediction(customData);
  };

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        
        {/* Header */}
        <div className="page-header" style={{ alignItems: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <div className="page-header-info">
            <h1><BrainIcon /> AI Case Predictions</h1>
            <p className="page-header-meta">Advanced Random Forest modeling for procedural roadmaps</p>
          </div>
          
          <div className="jw-tabs" style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={`btn ${activeTab === 'interactive' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('interactive')}>
              
              Interactive Predictor
            </button>
            <button
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('overview')}>
              
              State Aggregates
            </button>
          </div>
        </div>

        {/* --- INTERACTIVE PREDICTOR TAB --- */}
        {activeTab === 'interactive' &&
        <div className="grid-2" style={{ marginTop: '1.5rem', gap: '2rem' }}>
            
            {/* INPUT PANEL */}
            <div className="jw-card" style={{ alignSelf: 'start' }}>
              <div className="jw-card-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 className="jw-card-title">Case Input Parameters</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <input type="radio" checked={predictMode === 'custom'} onChange={() => {setPredictMode('custom');setPredictionResult(null);}} /> 
                  Custom Scenario
                </label>
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <input type="radio" checked={predictMode === 'search'} onChange={() => {setPredictMode('search');setPredictionResult(null);}} /> 
                  Existing Case
                </label>
              </div>

              {predictMode === 'search' ?
            <div>
                  <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                  type="text"
                  className="form-control"
                  placeholder="Search FIR or Case Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                
                    <button className="btn btn-primary" onClick={handleSearch} disabled={isSearching}>
                      <SearchIcon />
                    </button>
                  </div>
                  
                  {searchResults.length > 0 &&
              <div className="jw-table-wrapper" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table className="jw-table" style={{ fontSize: '0.8rem' }}>
                        <tbody>
                          {searchResults.map((c) =>
                    <tr key={c.id}>
                              <td className="td-mono">{c.case_number}</td>
                              <td>{c.case_category}</td>
                              <td className="text-right">
                                <button className="btn btn-ghost btn-sm" onClick={() => runPrediction({ case_id: c.id })}>Select</button>
                              </td>
                            </tr>
                    )}
                        </tbody>
                      </table>
                    </div>
              }
                </div> :

            <form onSubmit={handleCustomSubmit}>
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label>Case Category</label>
                      <select className="form-control" value={customData.case_category} onChange={(e) => setCustomData({ ...customData, case_category: e.target.value })}>
                        <option>Criminal</option>
                        <option>Civil</option>
                        <option>Family</option>
                        <option>Corporate</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Crime/Dispute Type</label>
                      <input type="text" className="form-control" value={customData.crime_type} onChange={(e) => setCustomData({ ...customData, crime_type: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Chargesheet Status</label>
                      <select className="form-control" value={customData.chargesheet_status} onChange={(e) => setCustomData({ ...customData, chargesheet_status: e.target.value })}>
                        <option>Not Filed</option>
                        <option>Under Review</option>
                        <option>Filed</option>
                        <option>Trial</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Number of Parties</label>
                      <input type="number" className="form-control" value={customData.num_parties} onChange={(e) => setCustomData({ ...customData, num_parties: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className="form-group">
                      <label>Number of Hearings So Far</label>
                      <input type="number" className="form-control" value={customData.num_hearings} onChange={(e) => setCustomData({ ...customData, num_hearings: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Filing to First List (Days)</label>
                      <input type="number" className="form-control" value={customData.filing_to_first_list_days} onChange={(e) => setCustomData({ ...customData, filing_to_first_list_days: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Listing Gap (Days)</label>
                      <input type="number" className="form-control" value={customData.listing_gap_days} onChange={(e) => setCustomData({ ...customData, listing_gap_days: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Court Caseload</label>
                      <input type="number" className="form-control" value={customData.court_caseload} onChange={(e) => setCustomData({ ...customData, court_caseload: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Case Age (Days)</label>
                      <input type="number" className="form-control" value={customData.case_age_days} onChange={(e) => setCustomData({ ...customData, case_age_days: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isPredicting}>
                    {isPredicting ? 'Analyzing...' : 'Generate Roadmap'}
                  </button>
                </form>
            }
            </div>

            {/* RESULTS PANEL */}
            <div className="jw-card" style={{ alignSelf: 'start', backgroundColor: predictionResult ? 'var(--bg-card)' : 'var(--bg-input)' }}>
              <div className="jw-card-header" style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 className="jw-card-title">AI Actionable Roadmap</h3>
              </div>
              
              {predictError &&
            <div className="notice notice-error">{predictError}</div>
            }
              
              {isPredicting &&
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <div className="spinner" style={{ margin: 'auto' }}></div>
                  <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Running Random Forest Inference...</p>
                </div>
            }

              {!isPredicting && !predictionResult && !predictError &&
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <BrainIcon />
                  <p style={{ marginTop: '0.5rem' }}>Awaiting input parameters to generate roadmap.</p>
                </div>
            }

              {predictionResult &&
            <div className="animate-fadeInUp">
                  <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', border: '1px solid var(--border-main)', borderRadius: '6px', backgroundColor: 'var(--bg-main)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration Risk</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: predictionResult.predictions.duration_risk === 'critical' ? 'var(--severity-critical)' : 'var(--accent)' }}>
                        {predictionResult.predictions.duration_risk.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{predictionResult.predictions.duration_confidence}% Confidence</div>
                    </div>
                    <div style={{ padding: '0.75rem', border: '1px solid var(--border-main)', borderRadius: '6px', backgroundColor: 'var(--bg-main)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>12-Month Disposal</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{predictionResult.predictions.disposal_likelihood}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{predictionResult.predictions.disposal_confidence}% Confidence</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>Procedural Roadmap</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {predictionResult.roadmap.map((phase, idx) =>
                <div key={idx} style={{ padding: '1rem', borderLeft: `3px solid var(--${phase.status === 'success' ? 'accent' : phase.status === 'warning' ? 'severity-high' : 'severity-critical'})`, backgroundColor: 'var(--bg-main)', borderRadius: '0 6px 6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem' }}>Phase {idx + 1}: {phase.phase}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{phase.duration}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{phase.details}</p>
                      </div>
                )}
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}>
                    <strong>Identified Risk Factors:</strong>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--severity-high)' }}>
                      {predictionResult.predictions.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>

                </div>
            }
            </div>
          </div>
        }

        {/* --- OVERVIEW TAB (Existing content) --- */}
        {activeTab === 'overview' &&
        <div style={{ marginTop: '1.5rem' }}>
            {loadingOverview ?
          <div className="spinner" style={{ margin: 'auto' }} /> :
          !overview ?
          <div className="empty-state"><p>No prediction data available.</p></div> :

          <>
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', padding: '0.4rem 0.75rem', fontSize: '0.75rem', marginBottom: '1.5rem', display: 'inline-block' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Data Source: </span>
                  <span style={{ fontWeight: '600' }}>{overview.data_source}</span>
                </div>

                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="jw-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duration Risk Model Accuracy</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{overview.accuracy_metrics.duration_risk_accuracy}</div>
                  </div>
                  <div className="jw-card" style={{ padding: '1rem', borderLeft: '4px solid var(--severity-high)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Disposal Likelihood Model Accuracy</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{overview.accuracy_metrics.disposal_likelihood_accuracy}</div>
                  </div>
                </div>

                <div className="grid-2 mt-4">
                  <div className="jw-card">
                    <div className="jw-card-header">
                      <h3 className="jw-card-title">Duration Risk Distribution (Sample of 100 Pending)</h3>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      <DonutBars
                    items={Object.entries(overview.duration_distribution).map(([label, value]) => ({
                      label, value, color: label.includes('>2yr') ? 'var(--severity-critical)' : label.includes('6mo') ? 'var(--severity-medium)' : 'var(--severity-low)'
                    }))}
                    total={Object.values(overview.duration_distribution).reduce((a, b) => a + b, 0)} />
                  
                    </div>
                  </div>

                  <div className="jw-card">
                    <div className="jw-card-header">
                      <h3 className="jw-card-title">12-Month Disposal Likelihood</h3>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      <DonutBars
                    items={Object.entries(overview.disposal_distribution).map(([label, value]) => ({
                      label, value, color: label === 'Likely' ? 'var(--severity-low)' : 'var(--severity-critical)'
                    }))}
                    total={Object.values(overview.disposal_distribution).reduce((a, b) => a + b, 0)} />
                  
                    </div>
                  </div>
                </div>
              </>
          }
          </div>
        }

      </div>
    </div>);

};

export default Predictions;