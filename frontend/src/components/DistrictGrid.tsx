import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { DistrictSummary } from '../types';

interface DistrictGridProps {
  interactive?: boolean;
  onDistrictClick?: (district: DistrictSummary) => void;
}

const DistrictGrid: React.FC<DistrictGridProps> = ({ interactive = true, onDistrictClick }) => {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/districts/summary/');
        setDistricts(res.data);
      } catch (err) {
        console.error('Failed to fetch district summaries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (districts.length === 0) {
    return (
      <div className="empty-state">
        <p>No district data available. Run the summary computation first.</p>
      </div>
    );
  }

  const handleClick = (d: DistrictSummary) => {
    if (interactive && onDistrictClick) {
      onDistrictClick(d);
    }
  };

  return (
    <div>
      <div className="district-grid">
        {districts.map((d) => (
          <div
            key={d.id}
            className={`district-tile district-tile--${d.severity_tier}`}
            onClick={() => handleClick(d)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            title={`${d.district_name} — ${d.pending_count} pending`}
          >
            <div className="district-tile-name">{d.district_name}</div>
            <div>
              <div className="district-tile-stat-label">Pending</div>
              <div className="district-tile-stat-value">{d.pending_count.toLocaleString()}</div>
            </div>
            {d.severity_tier === 'critical' && <div className="pulse-dot" />}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem',
        paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text-faint)' }}>Load Index:</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--severity-low-bg)', border: '1px solid var(--severity-low-border)' }} /> Low
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--severity-medium-bg)', border: '1px solid var(--severity-medium-border)' }} /> Medium
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--severity-high-bg)', border: '1px solid var(--severity-high-border)' }} /> High
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--severity-critical-bg)', border: '1px solid var(--severity-critical-border)' }} /> Critical
        </span>
      </div>
    </div>
  );
};

export default DistrictGrid;
