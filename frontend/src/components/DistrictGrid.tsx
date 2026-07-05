import React from 'react';

export interface DistrictSummaryData {
  id: number;
  district_name: string;
  district_code: string;
  pending_count: number;
  disposed_count: number;
  disposal_rate: number;
  avg_case_age_days: number;
  severity_tier: 'low' | 'medium' | 'high' | 'critical';
}

interface DistrictGridProps {
  summaries: DistrictSummaryData[];
  onSelectDistrict: (districtId: number) => void;
  interactive?: boolean;
}

const DistrictGrid: React.FC<DistrictGridProps> = ({ summaries, onSelectDistrict, interactive = true }) => {
  // Gujarat Districts static list
  const gujaratDistricts = [
    { name: 'Ahmedabad', code: 'GJ01' },
    { name: 'Amreli', code: 'GJ02' },
    { name: 'Anand', code: 'GJ03' },
    { name: 'Aravalli', code: 'GJ04' },
    { name: 'Banaskantha', code: 'GJ05' },
    { name: 'Bharuch', code: 'GJ06' },
    { name: 'Bhavnagar', code: 'GJ07' },
    { name: 'Botad', code: 'GJ08' },
    { name: 'Chhota Udaipur', code: 'GJ09' },
    { name: 'Dahod', code: 'GJ10' },
    { name: 'Dang', code: 'GJ11' },
    { name: 'Devbhoomi Dwarka', code: 'GJ12' },
    { name: 'Gandhinagar', code: 'GJ13' },
    { name: 'Gir Somnath', code: 'GJ14' },
    { name: 'Jamnagar', code: 'GJ15' },
    { name: 'Junagadh', code: 'GJ16' },
    { name: 'Kheda', code: 'GJ17' },
    { name: 'Kutch', code: 'GJ18' },
    { name: 'Mahisagar', code: 'GJ19' },
    { name: 'Mehsana', code: 'GJ20' },
    { name: 'Morbi', code: 'GJ21' },
    { name: 'Narmada', code: 'GJ22' },
    { name: 'Navsari', code: 'GJ23' },
    { name: 'Panchmahal', code: 'GJ24' },
    { name: 'Patan', code: 'GJ25' },
    { name: 'Porbandar', code: 'GJ26' },
    { name: 'Rajkot', code: 'GJ27' },
    { name: 'Sabarkantha', code: 'GJ28' },
    { name: 'Surat', code: 'GJ29' },
    { name: 'Surendranagar', code: 'GJ30' },
    { name: 'Tapi', code: 'GJ31' },
    { name: 'Vadodara', code: 'GJ32' },
    { name: 'Valsad', code: 'GJ33' },
  ];

  // Helper to match static districts with summaries
  const getSeverity = (dName: string): 'low' | 'medium' | 'high' | 'critical' => {
    const summary = summaries.find(s => s.district_name.toLowerCase() === dName.toLowerCase());
    return summary ? summary.severity_tier : 'low';
  };

  const getDistrictSummaryId = (dName: string): number | null => {
    const summary = summaries.find(s => s.district_name.toLowerCase() === dName.toLowerCase());
    return summary ? summary.id : null;
  };

  return (
    <div className="grid-section">
      <div className="grid-title-row">
        <h3>Gujarat Backlog Severity Index</h3>
        <p className="subtitle">{interactive ? "Click a district square to view local analytics breakdown." : "Visual index of administrative caseload density."}</p>
      </div>

      <div className="gujarat-grid">
        {gujaratDistricts.map((district) => {
          const severity = getSeverity(district.name);
          const summaryId = getDistrictSummaryId(district.name);
          const blockClass = `grid-block severity-${severity} ${interactive && summaryId ? 'clickable' : ''}`;

          const handleClick = () => {
            if (interactive && summaryId) {
              onSelectDistrict(summaryId);
            }
          };

          return (
            <div 
              key={district.code} 
              className={blockClass}
              onClick={handleClick}
              title={`${district.name} - Severity: ${severity.toUpperCase()}`}
            >
              <span className="block-code">{district.code}</span>
              <span className="block-name">{district.name}</span>
            </div>
          );
        })}
      </div>

      {/* Grid Legend */}
      <div className="grid-legend">
        <div className="legend-item">
          <span className="legend-dot severity-low"></span>
          <span>Low Severity</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot severity-medium"></span>
          <span>Medium Severity</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot severity-high"></span>
          <span>High Severity</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot severity-critical"></span>
          <span>Critical Severity</span>
        </div>
      </div>

      <style>{`
        .grid-section {
          margin-bottom: 2.5rem;
        }
        
        .grid-title-row {
          margin-bottom: 1.5rem;
        }
        
        .grid-title-row h3 {
          font-size: 1.15rem;
          color: var(--accent-brass);
          text-transform: uppercase;
        }
        
        .grid-title-row .subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        
        .gujarat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .grid-block {
          background-color: var(--bg-card);
          border: 1px solid var(--border-muted);
          padding: 1rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 85px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .grid-block::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
        }
        
        .grid-block.clickable {
          cursor: pointer;
        }
        
        .grid-block.clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          border-color: var(--accent-brass);
        }
        
        .block-code {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }
        
        .block-name {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.02em;
          margin-top: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        
        /* Severity color classes */
        .severity-low::after, .legend-dot.severity-low {
          background-color: var(--color-disposed);
        }
        .severity-medium::after, .legend-dot.severity-medium {
          background-color: var(--color-pending);
        }
        .severity-high::after, .legend-dot.severity-high {
          background-color: var(--color-stayed);
        }
        .severity-critical::after, .legend-dot.severity-critical {
          background-color: var(--color-critical);
        }
        
        .grid-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding: 1rem;
          border: 1px dashed var(--border-muted);
          background-color: rgba(23, 30, 39, 0.3);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .legend-dot {
          width: 10px;
          height: 10px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default DistrictGrid;
