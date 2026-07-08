import React from 'react';
import { motion } from 'framer-motion';
import type { DistrictSummary } from '../types';
import './DistrictGrid.css';

interface DistrictGridProps {
  districts: DistrictSummary[];
  onDistrictClick: (district: DistrictSummary) => void;
}

export default function DistrictGrid({ districts, onDistrictClick }: DistrictGridProps) {
  const getSeverityClass = (severity: string) => {
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
      {districts.map((dist) => (
        <motion.button
          key={dist.id || dist.district_name}
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onDistrictClick(dist)}
          className={`district-tile ${getSeverityClass(dist.severity_tier)}`}
        >
          <div className="district-tile-title">{dist.district_name}</div>
          <div className="district-tile-meta">
            <div className="district-tile-label">Pending</div>
            <div className="district-tile-value">
              {dist.pending_count.toLocaleString()}
            </div>
          </div>
          
          {dist.severity_tier === 'critical' && (
            <span className="district-beacon-wrapper">
              <span className="district-beacon-ping"></span>
              <span className="district-beacon-dot"></span>
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
