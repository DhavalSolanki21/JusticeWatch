import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { DistrictSummary, DistrictBreakdown } from '../types';
import { DonutBars } from './SvgCharts';

interface DistrictModalProps {
  district: DistrictSummary;
  onClose: () => void;
  onAuditCases?: (districtName: string) => void;
}

const DistrictModal: React.FC<DistrictModalProps> = ({ district, onClose, onAuditCases }) => {
  const [breakdown, setBreakdown] = useState<DistrictBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        const res = await api.get(`/districts/${district.id}/breakdown/`);
        setBreakdown(res.data);
      } catch (err: any) {
        console.error('Failed to fetch district breakdown:', err);
        setError(err.response?.status === 403 ? 'Access restricted to judges.' : 'Failed to load breakdown data.');
      } finally {
        setLoading(false);
      }
    };
    fetchBreakdown();
  }, [district.id]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const disposalPct = district.disposal_rate
    ? (district.disposal_rate * 100).toFixed(1)
    : '0';

  const avgAgeDays = Math.round(district.avg_case_age_days);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content animate-slideUp">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{district.district_name} District</h3>
            <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Code: {district.district_code} • Severity: {district.severity_tier.toUpperCase()}
            </span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ minHeight: 'auto', padding: '0.85rem' }}>
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{district.pending_count.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ minHeight: 'auto', padding: '0.85rem' }}>
              <div className="stat-label">Disposed</div>
              <div className="stat-value stat-value--accent" style={{ fontSize: '1.25rem' }}>{district.disposed_count.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ minHeight: 'auto', padding: '0.85rem' }}>
              <div className="stat-label">Disposal Rate</div>
              <div className="stat-value stat-value--success" style={{ fontSize: '1.25rem' }}>{disposalPct}%</div>
            </div>
            <div className="stat-card" style={{ minHeight: 'auto', padding: '0.85rem' }}>
              <div className="stat-label">Avg Age</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{avgAgeDays}d</div>
            </div>
          </div>

          {/* Breakdown Data */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          )}

          {error && (
            <div className="notice notice-warning">
              <span>{error}</span>
            </div>
          )}

          {breakdown && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Category Split */}
              {Object.keys(breakdown.category_split).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Case Category Distribution
                  </h4>
                  <DonutBars
                    items={Object.entries(breakdown.category_split).map(([label, value]) => ({
                      label,
                      value,
                      color: label === 'Criminal' ? '#D97706' : label === 'Civil' ? 'var(--accent)' : '#6B7280'
                    }))}
                  />
                </div>
              )}

              {/* Top Crime Types */}
              {Object.keys(breakdown.top_crime_types).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    Top Crime Types
                  </h4>
                  <DonutBars
                    items={Object.entries(breakdown.top_crime_types).map(([label, value], i) => ({
                      label,
                      value,
                      color: ['var(--severity-critical)', 'var(--severity-high)', 'var(--severity-medium)', 'var(--severity-low)', 'var(--text-muted)'][i] || 'var(--text-muted)'
                    }))}
                  />
                </div>
              )}

              {/* Chargesheet Distribution */}
              {Object.keys(breakdown.chargesheet_distribution).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    Chargesheet Status Distribution
                  </h4>
                  <DonutBars
                    items={Object.entries(breakdown.chargesheet_distribution).map(([label, value]) => ({
                      label,
                      value,
                      color: label === 'Filed' ? 'var(--severity-low)' : label === 'Not Filed' ? 'var(--severity-critical)' : 'var(--severity-medium)'
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {onAuditCases && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-main)' }}>
              <button
                className="btn btn-outline w-full"
                onClick={() => onAuditCases(district.district_name)}
              >
                Audit All Cases in {district.district_name}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DistrictModal;
