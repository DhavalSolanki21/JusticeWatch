import React from 'react';


import './DistrictGrid.css';






export default function DistrictGrid({ districts, onDistrictClick }) {
  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
      case 'moderate':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'severity-default';
    }
  };

  return (
    <div className="district-grid-container">
      {districts.map((dist) =>
      <button
        key={dist.id || dist.district_name}
        onClick={() => onDistrictClick(dist)}
        className={`district-tile ${getSeverityClass(dist.severity_tier)}`}>
        
          <div className="district-tile-title">{dist.district_name}</div>
          <div className="district-tile-meta">
            <div className="district-tile-label">Pending</div>
            <div className="district-tile-value">
              {dist.pending_count.toLocaleString()}
            </div>
          </div>
          
          {dist.severity_tier === 'critical' &&
        <span className="district-beacon-wrapper">
              <span className="district-beacon-ping"></span>
              <span className="district-beacon-dot"></span>
            </span>
        }
        </button>
      )}
    </div>);

}