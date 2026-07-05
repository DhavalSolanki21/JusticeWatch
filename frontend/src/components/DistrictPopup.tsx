import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

interface DistrictPopupProps {
  summaryId: number;
  districtName: string;
  severityTier: 'low' | 'medium' | 'high' | 'critical';
  pendingCount: number;
  disposedCount: number;
  disposalRate: number;
  onClose: () => void;
}

interface BreakdownData {
  district: string;
  category_split: Record<string, number>;
  top_crime_types: Record<string, number>;
  chargesheet_distribution: Record<string, number>;
}

const DistrictPopup: React.FC<DistrictPopupProps> = ({
  summaryId,
  districtName,
  severityTier,
  pendingCount,
  disposedCount,
  disposalRate,
  onClose,
}) => {
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBreakdown = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch summary's district first to get the actual District model ID
        const summariesResponse = await api.get('/districts/summary/');
        const currentSummary = summariesResponse.data.find((s: any) => s.id === summaryId);
        
        if (currentSummary) {
          // If we find the district ID, fetch its breakdown (requires Judge role API)
          const response = await api.get(`/districts/${currentSummary.id}/breakdown/`);
          setBreakdown(response.data);
        } else {
          setError("District summary not found.");
        }
      } catch (err: any) {
        console.error("Failed to load district breakdown:", err);
        setError("Caseload analytics breakdown restricted to Judges / Admins.");
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [summaryId]);

  const handleViewCases = () => {
    // Navigate to Search page and filter by district name
    navigate(`/search?district=${encodeURIComponent(districtName)}`);
    onClose();
  };

  // Helper to draw clean inline SVG donuts
  const renderCategoryDonut = (categories: Record<string, number>) => {
    const total = Object.values(categories).reduce((a, b) => a + b, 0);
    if (total === 0) return <p className="text-center">No category data.</p>;

    let currentAngle = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const colors = ['#B08D57', '#4E9C54', '#D2963C', '#E67E22', '#C0392B'];

    const items = Object.entries(categories).map(([label, val], idx) => {
      const percentage = val / total;
      const strokeDashoffset = circumference - percentage * circumference;
      const rotation = currentAngle;
      currentAngle += percentage * 360;

      return {
        label,
        val,
        percentage,
        strokeDashoffset,
        rotation,
        color: colors[idx % colors.length],
      };
    });

    return (
      <div className="donut-chart-container">
        <svg width="150" height="150" viewBox="0 0 150 150" className="donut-svg">
          <circle cx="75" cy="75" r={radius} fill="transparent" stroke="#2A323D" strokeWidth="15" />
          {items.map((item, idx) => (
            <circle
              key={idx}
              cx="75"
              cy="75"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="15"
              strokeDasharray={circumference}
              strokeDashoffset={item.strokeDashoffset}
              transform={`rotate(${item.rotation - 90} 75 75)`}
            />
          ))}
          <text x="75" y="80" textAnchor="middle" className="donut-inner-text">
            {total} Cases
          </text>
        </svg>
        <div className="donut-legend">
          {items.map((item, idx) => (
            <div key={idx} className="legend-row">
              <span className="legend-color-box" style={{ backgroundColor: item.color }}></span>
              <span className="legend-label">{item.label} ({item.val})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="jw-modal-overlay" onClick={onClose}>
      <div className="jw-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="jw-modal-header">
          <h2>{districtName} Caseload</h2>
          <button className="jw-modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="jw-modal-body">
          {/* Header Stats */}
          <div className="popup-header-stats">
            <div className="pop-stat">
              <span className="pop-label">Backlog Index</span>
              <span className={`badge badge-${severityTier}`}>{severityTier}</span>
            </div>
            <div className="pop-stat">
              <span className="pop-label">Pending Cases</span>
              <span className="pop-val font-serif text-amber">{pendingCount}</span>
            </div>
            <div className="pop-stat">
              <span className="pop-label">Disposed Cases</span>
              <span className="pop-val font-serif text-green">{disposedCount}</span>
            </div>
            <div className="pop-stat">
              <span className="pop-label">Disposal Rate</span>
              <span className="pop-val font-serif">{(disposalRate * 100).toFixed(0)}%</span>
            </div>
          </div>

          <hr className="divider" />

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Analyzing local case distributions...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="btn-brass" style={{ marginTop: '1.5rem' }} onClick={handleViewCases}>
                View Cases List <FaExternalLinkAlt style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />
              </button>
            </div>
          ) : breakdown ? (
            <div className="breakdown-details">
              <div className="grid-2col" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Category Split Donut */}
                <div className="breakdown-card">
                  <h4>Category Distribution</h4>
                  {renderCategoryDonut(breakdown.category_split)}
                </div>

                {/* Chargesheet Status Bars */}
                <div className="breakdown-card">
                  <h4>Chargesheet Distribution</h4>
                  <div className="bar-chart-vertical">
                    {Object.entries(breakdown.chargesheet_distribution).map(([label, val], idx) => {
                      const total = Object.values(breakdown.chargesheet_distribution).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div key={idx} className="bar-row">
                          <div className="bar-label-row">
                            <span className="label">{label}</span>
                            <span className="value">{val}</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Crime Types Table */}
              <div className="breakdown-card" style={{ marginBottom: '1.5rem' }}>
                <h4>Top Crime Classifications</h4>
                {Object.keys(breakdown.top_crime_types).length === 0 ? (
                  <p className="no-crimes text-muted">No criminal cases recorded.</p>
                ) : (
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Crime Classification</th>
                        <th style={{ textAlign: 'right' }}>Active Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown.top_crime_types).map(([crime, count], idx) => (
                        <tr key={idx}>
                          <td>{crime || 'Unclassified/Other'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-brass)' }}>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="action-row">
                <button className="btn-brass-filled w-full" onClick={handleViewCases}>
                  View All cases in {districtName} <FaExternalLinkAlt style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <style>{`
          .popup-header-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            text-align: center;
            margin-bottom: 1rem;
          }
          
          .pop-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .pop-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--text-muted);
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
          }
          
          .pop-val {
            font-size: 1.25rem;
            font-weight: 600;
          }
          
          .text-amber {
            color: var(--color-pending);
          }
          
          .text-green {
            color: var(--color-disposed);
          }
          
          .divider {
            border: 0;
            height: 1px;
            background-color: var(--border-brass);
            margin: 1rem 0 1.5rem 0;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 0;
            color: var(--text-muted);
          }
          
          .spinner {
            border: 2px solid var(--bg-main);
            border-top: 2px solid var(--accent-brass);
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .error-message {
            text-align: center;
            padding: 2rem 0;
            color: var(--text-muted);
          }
          
          .breakdown-card {
            border: 1px solid var(--border-muted);
            background-color: rgba(28, 36, 47, 0.2);
            padding: 1.25rem;
          }
          
          .breakdown-card h4 {
            font-size: 0.85rem;
            text-transform: uppercase;
            color: var(--accent-brass);
            letter-spacing: 0.05em;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-muted);
            padding-bottom: 0.5rem;
          }
          
          /* Donut charts styles */
          .donut-chart-container {
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 1rem;
          }
          
          .donut-svg {
            transform: rotate(0deg);
          }
          
          .donut-inner-text {
            fill: var(--text-main);
            font-family: var(--font-serif);
            font-size: 0.8rem;
            font-weight: bold;
            letter-spacing: 0.05em;
          }
          
          .donut-legend {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          
          .legend-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .legend-color-box {
            width: 8px;
            height: 8px;
            display: inline-block;
          }
          
          .legend-label {
            font-size: 0.75rem;
            color: var(--text-muted);
          }
          
          /* Simple bar chart styles */
          .bar-chart-vertical {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .bar-row {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .bar-label-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
          }
          
          .bar-label-row .label {
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }
          
          .bar-label-row .value {
            font-weight: bold;
            color: var(--text-main);
          }
          
          .progress-track {
            background-color: var(--bg-main);
            height: 6px;
            width: 100%;
          }
          
          .progress-fill {
            background-color: var(--accent-brass);
            height: 100%;
            transition: width 0.5s ease-out;
          }
          
          /* Mini Table */
          .mini-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .mini-table th {
            color: var(--text-muted);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border-muted);
            text-align: left;
          }
          
          .mini-table td {
            font-size: 0.85rem;
            padding: 0.5rem 0;
            border-bottom: 1px dashed var(--border-muted);
          }
          
          .action-row {
            display: flex;
            justify-content: center;
          }
          
          .w-full {
            width: 100%;
          }
        `}</style>
      </div>
    </div>
  );
};

export default DistrictPopup;
