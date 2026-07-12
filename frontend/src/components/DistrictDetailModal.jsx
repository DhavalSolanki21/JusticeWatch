import React from 'react';
import { X, Landmark, ShieldAlert, ArrowRight, FolderKanban, ClipboardCheck } from "lucide-react";

import "./DistrictDetailModal.css";







export default function DistrictDetailModal({ district, onClose, onViewAllCases }) {
  // Severity styling colors for labels
  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "badge-critical";
      case "high":
        return "badge-high";
      case "moderate":
      case "medium":
        return "badge-moderate";
      case "low":
        return "badge-low";
      default:
        return "badge-default";
    }
  };

  // Calculate real category splits from API
  let civilCount = 0;
  let criminalCount = 0;
  let appealCount = 0;

  if (district.category_distribution) {
    district.category_distribution.forEach((item) => {
      const lower = item.category.toLowerCase();
      if (lower.includes('civil')) civilCount += item.count;else
      if (lower.includes('criminal')) criminalCount += item.count;else
      if (lower.includes('appeal')) appealCount += item.count;else
      civilCount += item.count; // Default unknown to civil
    });
  }

  const totalSplit = civilCount + criminalCount + appealCount;
  const civilPct = totalSplit > 0 ? (civilCount / totalSplit * 100).toFixed(0) : "0";
  const criminalPct = totalSplit > 0 ? (criminalCount / totalSplit * 100).toFixed(0) : "0";
  const appealPct = totalSplit > 0 ? (appealCount / totalSplit * 100).toFixed(0) : "0";

  // Conversion of backlog average age
  const ageInYears = (district.avg_case_age_days / 365).toFixed(1);

  const chargesheetDistribution = district.chargesheet_distribution || [];
  const crimeDistribution = district.crime_distribution || [];

  return (
    <React.Fragment>
      <div className="district-detail-backdrop">
        {/* Click-out backdrop shadow */}
        <div className="district-detail-backdrop-click" onClick={onClose} />

        {/* Modal Card */}
        <div
          className="district-detail-card"
          id={`district-detail-modal-${district.id}`}>
          
          {/* Top Header */}
          <div className="district-detail-header">
            <div className="district-detail-header-left">
              <div className="district-detail-title-row">
                <Landmark className="district-detail-title-icon" />
                <h2 className="district-detail-title">
                  {district.district_name} District Court
                </h2>
                <span className={`district-detail-badge ${getSeverityBadge(district.severity_tier)}`}>
                  {district.severity_tier} LOAD
                </span>
              </div>
              <p className="district-detail-subtitle">
                State Record Registry — Audit Drilldown
              </p>
            </div>
            <button
              onClick={onClose}
              className="district-detail-close-btn"
              id="close-district-modal-btn">
              
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Data Body */}
          <div className="district-detail-body">
            {/* Key statistical numbers */}
            <div className="district-detail-stats-grid">
              <div className="district-detail-stat-box">
                <span className="district-detail-stat-label">Pending Cases</span>
                <span className="district-detail-stat-val val-white">
                  {district.pending_count.toLocaleString()}
                </span>
              </div>
              <div className="district-detail-stat-box">
                <span className="district-detail-stat-label">Disposed Cases</span>
                <span className="district-detail-stat-val val-gold">
                  {district.disposed_count.toLocaleString()}
                </span>
              </div>
              <div className="district-detail-stat-box">
                <span className="district-detail-stat-label">Disposal Rate</span>
                <span className="district-detail-stat-val val-emerald">
                  {typeof district.disposal_rate === 'number' ? district.disposal_rate.toFixed(2) : parseFloat(String(district.disposal_rate)).toFixed(2)}%
                </span>
              </div>
              <div className="district-detail-stat-box">
                <span className="district-detail-stat-label">Avg Backlog Age</span>
                <span className="district-detail-stat-val val-orange">
                  {ageInYears} Yrs
                  <span className="district-detail-stat-sub">({district.avg_case_age_days} Days)</span>
                </span>
              </div>
            </div>

            {/* Double Column Breakdown */}
            <div className="district-detail-breakdown-grid">
              {/* Split Categorization Bar */}
              <div className="district-detail-breakdown-box">
                <h3 className="district-detail-breakdown-header">
                  <FolderKanban className="district-detail-breakdown-icon icon-gold" />
                  <span>Caseload Split Category</span>
                </h3>
                <div className="district-detail-progress-container">
                  {/* Custom Tri-segmented Progress Bar */}
                  <div className="district-detail-tri-bar">
                    <div style={{ width: `${civilPct}%`, backgroundColor: '#B08D57' }} title={`Civil: ${civilPct}%`} />
                    <div style={{ width: `${criminalPct}%`, backgroundColor: '#b45309' }} title={`Criminal: ${criminalPct}%`} />
                    <div style={{ width: `${appealPct}%`, backgroundColor: '#52525b' }} title={`Appeal: ${appealPct}%`} />
                  </div>
                  <div className="district-detail-progress-legend">
                    <div className="district-detail-legend-item">
                      <span className="district-detail-legend-label">CIVIL</span>
                      <span className="district-detail-legend-pct-gold">{civilPct}%</span>
                      <span className="district-detail-legend-count">{civilCount.toLocaleString()}</span>
                    </div>
                    <div className="district-detail-legend-item">
                      <span className="district-detail-legend-label">CRIMINAL</span>
                      <span className="district-detail-legend-pct-amber">{criminalPct}%</span>
                      <span className="district-detail-legend-count">{criminalCount.toLocaleString()}</span>
                    </div>
                    <div className="district-detail-legend-item">
                      <span className="district-detail-legend-label">APPEAL</span>
                      <span className="district-detail-legend-pct-zinc">{appealPct}%</span>
                      <span className="district-detail-legend-count">{appealCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chargesheet Filing Progress Metrics */}
              <div className="district-detail-breakdown-box">
                <h3 className="district-detail-breakdown-header">
                  <ClipboardCheck className="district-detail-breakdown-icon icon-gold" />
                  <span>Chargesheet Filing Rate</span>
                </h3>
                <div className="district-detail-chargesheet-list">
                  {chargesheetDistribution.map((item) => {
                    const totalCounts = chargesheetDistribution.reduce((sum, d) => sum + d.count, 0);
                    const pct = totalCounts > 0 ? (item.count / totalCounts * 100).toFixed(0) : "0";
                    return (
                      <div key={item.status} className="district-detail-chargesheet-item">
                        <div className="district-detail-chargesheet-labels">
                          <span>{item.status.toUpperCase()}</span>
                          <span>{item.count.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="district-detail-chargesheet-bar-bg">
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: item.status === "In Trial" || item.status === "Trial" ?
                              "#059669" :
                              item.status === "Under Review" ?
                              "#d97706" :
                              item.status === "Filed" ?
                              "#0369a1" :
                              "#7f1d1d"
                            }}
                            className="district-detail-chargesheet-bar-fill" />
                          
                        </div>
                      </div>);

                  })}
                </div>
              </div>
            </div>

            {/* Highest Offense Vectors */}
            <div className="district-detail-breakdown-box">
              <h3 className="district-detail-breakdown-header">
                <ShieldAlert className="district-detail-breakdown-icon icon-rose" />
                <span>Highest Statutory Case Counts (Top Crime Types)</span>
              </h3>
              <div className="district-detail-crime-list">
                {crimeDistribution.map((item, idx) =>
                <div key={idx} className="district-detail-crime-item">
                    <div className="district-detail-crime-left">
                      <span className="district-detail-crime-rank">
                        #0{idx + 1}
                      </span>
                      <span className="district-detail-crime-name">{item.crime}</span>
                    </div>
                    <span className="district-detail-crime-count">{item.count.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Actions footer */}
          <div className="district-detail-footer">
            <p className="district-detail-footer-code">
              CNR RECORD CODE RANGE: 24-{String(district.id).padStart(2, '0')}-XXXX
            </p>
            <button
              onClick={() => onViewAllCases(district.district_name)}
              className="district-detail-audit-btn"
              id={`view-district-cases-btn-${district.id}`}>
              
              <span>Audit Cases</span>
              <ArrowRight className="district-detail-audit-btn-icon" />
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>);

}