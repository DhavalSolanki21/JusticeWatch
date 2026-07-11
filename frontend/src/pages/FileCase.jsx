import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const FileCase = () => {
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState('');
  const [courtName, setCourtName] = useState('');
  const [caseCategory, setCaseCategory] = useState('Civil');
  const [crimeType, setCrimeType] = useState('');
  const [applicableSections, setApplicableSections] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [firDate, setFirDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrestDate, setArrestDate] = useState(new Date().toISOString().split('T')[0]);
  const [chargesheetStatus, setChargesheetStatus] = useState('Not Filed');
  const [caseStatus, setCaseStatus] = useState('Pending');
  const [numParties, setNumParties] = useState(2);
  const [caseNotes, setCaseNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await api.get('/districts/list/');
        setDistricts(response.data);
      } catch (err) {
        console.error("Failed to fetch districts", err);
      }
    };
    fetchDistricts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      district: parseInt(district),
      court_name: courtName,
      case_category: caseCategory,
      crime_type: crimeType,
      applicable_sections: applicableSections,
      fir_number: firNumber,
      fir_date: firDate,
      arrest_date: arrestDate,
      chargesheet_status: chargesheetStatus,
      case_status: caseStatus,
      num_parties: numParties,
      case_notes: caseNotes
    };

    try {
      await api.post('/cases/', payload);
      alert('Case filed successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to file case. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        <div className="page-header">
          <div className="page-header-info">
            <h1>File New Case</h1>
            <p className="page-header-meta">Registry Entry</p>
          </div>
        </div>

        <div className="jw-card" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group">
                <label className="form-label">District Court Jurisdiction</label>
                <select className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)} required>
                  <option value="">Select District...</option>
                  {districts.map((d) =>
                  <option key={d.id} value={d.id}>{d.name}</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Court Name</label>
                <input type="text" className="form-control" value={courtName} onChange={(e) => setCourtName(e.target.value)} required placeholder="e.g., Session Court No. 4" />
              </div>

              <div className="form-group">
                <label className="form-label">Case Category</label>
                <select className="form-control" value={caseCategory} onChange={(e) => setCaseCategory(e.target.value)} required>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Appeal">Appeal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Crime Type</label>
                <input type="text" className="form-control" value={crimeType} onChange={(e) => setCrimeType(e.target.value)} required placeholder="e.g., Theft, Fraud" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Applicable Sections / Acts</label>
                <input type="text" className="form-control" value={applicableSections} onChange={(e) => setApplicableSections(e.target.value)} required placeholder="e.g., IPC Sec 420, CrPC Sec 144" />
              </div>

              <div className="form-group">
                <label className="form-label">FIR Number</label>
                <input type="text" className="form-control" value={firNumber} onChange={(e) => setFirNumber(e.target.value)} required placeholder="e.g., FIR-1234/2026" />
              </div>

              <div className="form-group">
                <label className="form-label">FIR Date</label>
                <input type="date" className="form-control" value={firDate} onChange={(e) => setFirDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Arrest Date</label>
                <input type="date" className="form-control" value={arrestDate} onChange={(e) => setArrestDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Chargesheet Status</label>
                <select className="form-control" value={chargesheetStatus} onChange={(e) => setChargesheetStatus(e.target.value)} required>
                  <option value="Not Filed">Not Filed</option>
                  <option value="Filed">Filed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Case Status</label>
                <select className="form-control" value={caseStatus} onChange={(e) => setCaseStatus(e.target.value)} required>
                  <option value="Pending">Pending</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Stayed">Stayed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Parties</label>
                <input type="number" className="form-control" min={1} value={numParties} onChange={(e) => setNumParties(parseInt(e.target.value))} required />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Initial Case Notes / Briefing</label>
                <textarea className="form-control" rows={4} value={caseNotes} onChange={(e) => setCaseNotes(e.target.value)} required placeholder="Enter briefing details..."></textarea>
              </div>
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Filing Case...' : 'File Case to Registry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileCase;