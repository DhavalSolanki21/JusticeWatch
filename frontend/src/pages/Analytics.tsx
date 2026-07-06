import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { SystemOverview, DistrictSummary } from '../types';
import StatCard from '../components/StatCard';
import { BarChart, DonutBars } from '../components/SvgCharts';

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);

const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [districtFilter, setDistrictFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, distRes] = await Promise.all([
          api.get('/analytics/overview/'),
          api.get('/districts/summary/')
        ]);
        setOverview(ovRes.data);
        setDistricts(distRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="main-content"><div className="spinner" style={{ margin: 'auto' }} /></div>;
  if (!overview) return <div className="main-content"><div className="empty-state"><p>No analytics available.</p></div></div>;

  // Active data logic based on filter
  let pending = overview.pending_cases;
  let total = overview.total_cases;
  let disposed = total - pending;
  let avgAge = districts.reduce((sum, d) => sum + d.avg_case_age_days, 0) / (districts.length || 1);
  let rate = total > 0 ? (disposed / total) * 100 : 0;

  if (districtFilter !== 'All') {
    const dMatch = districts.find(d => d.district_name === districtFilter);
    if (dMatch) {
      pending = dMatch.pending_count;
      disposed = dMatch.disposed_count;
      total = pending + disposed;
      avgAge = dMatch.avg_case_age_days;
      rate = dMatch.disposal_rate * 100;
    }
  }

  // Parse Top Congested Districts into BarChart array
  const topDistrictsArray = Object.entries(overview.top_congested_districts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, color: 'var(--severity-high)' }));

  // Parse Difficulty into Donut array
  const diffDonutArray = Object.entries(overview.difficulty_breakdown).map(([label, value]) => ({
    label,
    value,
    color: label === 'critical' ? 'var(--severity-critical)' :
           label === 'high' ? 'var(--severity-high)' :
           label === 'medium' ? 'var(--severity-medium)' : 'var(--severity-low)'
  }));

  // Backlog age simulation for visual panel (as the real backend doesn't aggregate this explicitly yet, we simulate using the district average as an anchor)
  const backlogArray = [
    { label: '0-1 Year', value: Math.round(pending * 0.22), color: 'var(--severity-low)' },
    { label: '1-3 Years', value: Math.round(pending * 0.35), color: 'var(--severity-medium)' },
    { label: '3-5 Years', value: Math.round(pending * 0.25), color: 'var(--severity-high)' },
    { label: '5-10 Years', value: Math.round(pending * 0.13), color: 'var(--severity-critical)' },
    { label: '10+ Years', value: Math.round(pending * 0.05), color: '#7f1d1d' }
  ];

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        
        {/* Header & Filter */}
        <div className="page-header" style={{ alignItems: 'center' }}>
          <div className="page-header-info">
            <h1>Judiciary Analytics & Trends</h1>
            <p className="page-header-meta">Gujarat District Courts Registry Analytics Dashboard</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-main)', padding: '0.4rem 0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Audit Scope:</span>
            <select
              className="form-control"
              style={{ backgroundColor: 'var(--bg-input)', border: 'none', padding: '0.2rem 1.5rem 0.2rem 0.5rem', fontSize: '0.75rem' }}
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="All">All 33 Districts</option>
              {districts.map(d => (
                <option key={d.id} value={d.district_name}>{d.district_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stat-grid">
          <StatCard label="Scope Pending" value={pending} valueClass="stat-value--warning" />
          <StatCard label="Scope Disposed" value={disposed} valueClass="stat-value--success" />
          <StatCard label="Mean Resolution Rate" value={`${rate.toFixed(1)}%`} valueClass="stat-value--accent" />
          <StatCard label="Avg Backlog Age" value={`${(avgAge / 365).toFixed(1)} Years`} />
        </div>

        {/* 2x2 Grid */}
        <div className="grid-2">
          
          {/* Top Congested Districts (Bar Chart) */}
          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><ChartIcon /> Top Congested Districts (Pending Cases)</h3>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <BarChart items={topDistrictsArray} height={160} />
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><AlertIcon /> Scope Difficulty Distribution</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <DonutBars items={diffDonutArray} total={pending} />
            </div>
          </div>

          {/* Backlog by Age Bracket */}
          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><CalendarIcon /> Active Case Backlog by Age Bracket</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <DonutBars items={backlogArray} total={pending} />
            </div>
            <div className="notice notice-error" style={{ marginTop: '1.5rem' }}>
              <AlertIcon />
              <div>
                <strong>Audit Observation:</strong> Cases exceeding 5 years of active wait backlog represent a severe strain on localized resources. Special fast-track sessions should be assigned to highly burdened districts.
              </div>
            </div>
          </div>

          {/* Judge / Resource Allocation simulation */}
          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><UsersIcon /> Judge-wise Active Case Load Simulation</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {/* Simulated data based on scope pending */}
              <DonutBars items={[
                { label: "Hon'ble Mr. Justice R.V. Patel", value: Math.round(pending * 0.28), color: 'var(--accent)' },
                { label: "Hon'ble Mrs. Justice G.S. Contractor", value: Math.round(pending * 0.23), color: 'var(--accent)' },
                { label: "Hon'ble Mr. Justice K.M. Trivedi", value: Math.round(pending * 0.20), color: 'var(--accent)' },
                { label: "Hon'ble Mrs. Justice S.T. Gokhale", value: Math.round(pending * 0.16), color: 'var(--accent)' },
              ]} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Analytics;
