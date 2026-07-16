import React from "react";
import { Landmark, AlertCircle, Sparkles } from "lucide-react";

import "./GeographicDossierReader.css";

export function GeographicDossierReader({ hoveredDetails, hoveredShape }) {
  return (
    <div className="geo-dossier-container">
      <React.Fragment>
        {hoveredDetails && hoveredShape ?
        <div
          className="geo-dossier-card">
          
            <div className="geo-dossier-emblem">
              <Landmark />
            </div>

            <div>
              <span className="geo-dossier-eyebrow">District dossier</span>
              <h3 className="geo-dossier-title">
                {hoveredDetails.district_name} Court
              </h3>
              <span className="geo-dossier-region-badge">
                {hoveredShape.region} Region
              </span>
            </div>

            <div className="geo-dossier-metrics">
              <div>
                <div className="geo-dossier-metric-label">Pending Backlog</div>
                <div className="geo-dossier-metric-value-white">
                  {hoveredDetails.pending_count.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="geo-dossier-metric-label">Disposal Rate</div>
                <div className="geo-dossier-metric-value-gold">
                  {typeof hoveredDetails.disposal_rate === 'number' ? hoveredDetails.disposal_rate.toFixed(2) : parseFloat(String(hoveredDetails.disposal_rate)).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="geo-dossier-severity" title={`Severity Load: ${hoveredDetails.severity_tier?.toUpperCase()} (${hoveredDetails.pending_count} pending cases)`}>
              <div className="geo-dossier-severity-header">
                <span>Backlog Severity Indicator</span>
                <span className={`geo-text-${hoveredDetails.severity_tier?.toLowerCase() || 'default'}`}>
                  {hoveredDetails.severity_tier}
                </span>
              </div>
              <div className="geo-dossier-severity-bar-bg">
                <div
                className={`geo-dossier-severity-bar-fill geo-bg-${hoveredDetails.severity_tier?.toLowerCase() || 'default'}`}
                style={{
                  width: `${Math.min(100, (hoveredDetails.pending_count / 25) * 100)}%`
                }} />
              
              </div>
            </div>

            <div className="geo-dossier-incident">
              <div className="geo-dossier-incident-label">Top Litigation Type</div>
              <div className="geo-dossier-incident-box">
                <AlertCircle className="geo-dossier-incident-icon" />
                <div>
                  <div className="geo-dossier-incident-title">
                    {hoveredDetails.crime_distribution && hoveredDetails.crime_distribution.length > 0 ?
                  hoveredDetails.crime_distribution[0].crime.split(" (")[0] :
                  "Civil / General"}
                  </div>
                  <div className="geo-dossier-incident-desc">
                    Accounting for {hoveredDetails.crime_distribution && hoveredDetails.crime_distribution.length > 0 ? hoveredDetails.crime_distribution[0].count.toLocaleString() : "..."} cases.
                  </div>
                </div>
              </div>
            </div>

            <div className="geo-dossier-footer">
              Click district to access database
            </div>
        </div> : (

        <div
          className="geo-dossier-card geo-dossier-card-placeholder">
          
            <div className="geo-dossier-placeholder-icon-wrap">
              <Sparkles />
            </div>
            <h4 className="geo-dossier-placeholder-title">
              Geographic Dossier Reader
            </h4>
            <p className="geo-dossier-placeholder-desc">
              Hover over any state district in the GIS panel to project live analytics, pending backlogs, disposal rates, and major infraction spikes.
            </p>
            <div className="geo-dossier-placeholder-meta">
              <div className="geo-dossier-placeholder-meta-row">
                <span>TOTAL CAPACITY:</span>
                <span className="geo-dossier-placeholder-meta-val-white">33 COURTS</span>
              </div>
              <div className="geo-dossier-placeholder-meta-row">
                <span>GIS ENGINE:</span>
                <span className="geo-dossier-placeholder-meta-val-gold">HIGH-FIDELITY GEOJSON</span>
              </div>
            </div>
          </div>)
        }
      </React.Fragment>
    </div>);

}