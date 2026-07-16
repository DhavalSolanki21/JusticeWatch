import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { DonutBars, BarChart } from '../components/SvgCharts';
import { PendencyTimelineChart } from '../components/PendencyTimelineChart';

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

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [districtFilter, setDistrictFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, distRes] = await Promise.all([
          api.get(`/analytics/overview/?district=${districtFilter}`),
          api.get('/districts/summary/')
        ]);
        setOverview(ovRes.data);
        setDistricts(distRes.data.results || distRes.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [districtFilter]);

  if (loading) return <div className="main-content"><div className="spinner" style={{ margin: 'auto' }} /></div>;
  if (!overview) return <div className="main-content"><div className="empty-state"><p>No analytics available.</p></div></div>;

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

  const topDistrictsArray = Object.entries(overview.top_congested_districts).map(([label, value]) => ({
    label,
    value,
    color: '#eab308'
  }));

  const diffDonutArray = Object.entries(overview.difficulty_breakdown).map(([label, value]) => ({
    label,
    value,
    color: label === 'critical' ? 'var(--severity-critical)' :
           label === 'high' ? 'var(--severity-high)' :
           label === 'medium' ? 'var(--severity-medium)' : 'var(--severity-low)'
  }));

  let backlogArray = [
    { label: '0-1 Year', value: 0, color: 'var(--severity-low)' },
    { label: '1-3 Years', value: 0, color: 'var(--severity-medium)' },
    { label: '3-5 Years', value: 0, color: 'var(--severity-high)' },
    { label: '5-10 Years', value: 0, color: 'var(--severity-critical)' },
    { label: '10+ Years', value: 0, color: '#7f1d1d' }
  ];

  if (overview.backlog_age_brackets) {
    backlogArray = [
      { label: '0-1 Year', value: overview.backlog_age_brackets['0-1 Year'] || 0, color: 'var(--severity-low)' },
      { label: '1-3 Years', value: overview.backlog_age_brackets['1-3 Years'] || 0, color: 'var(--severity-medium)' },
      { label: '3-5 Years', value: overview.backlog_age_brackets['3-5 Years'] || 0, color: 'var(--severity-high)' },
      { label: '5-10 Years', value: overview.backlog_age_brackets['5-10 Years'] || 0, color: 'var(--severity-critical)' },
      { label: '10+ Years', value: overview.backlog_age_brackets['10+ Years'] || 0, color: '#7f1d1d' }
    ];
  }

  let judgeArray = [];
  if (overview.judge_distribution) {
    judgeArray = Object.entries(overview.judge_distribution).map(([label, value]) => ({
      label,
      value,
      color: 'var(--accent)'
    }));
  }

  return (
    <div className="main-content">
      <div className="page-wrapper animate-fadeInUp">
        
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

        <div className="stat-grid">
          <StatCard label="Scope Pending" value={pending} valueClass="stat-value--warning" />
          <StatCard label="Scope Disposed" value={disposed} valueClass="stat-value--success" />
          <StatCard label="Mean Resolution Rate" value={`${rate.toFixed(1)}%`} valueClass="stat-value--accent" />
          <StatCard label="Avg Backlog Age" value={`${(avgAge / 365).toFixed(1)} Years`} />
        </div>

        {districtFilter === 'All' && overview.trend && (
          <div style={{ marginBottom: '2rem' }}>
            <PendencyTimelineChart trend={overview.trend} />
          </div>
        )}

        <div className="grid-2">
          
          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><ChartIcon /> Top Congested Districts (Pending Cases)</h3>
            </div>
            <div style={{ padding: '1rem 0', width: '100%', overflowX: 'auto' }}>
              <BarChart items={topDistrictsArray} height={200} />
            </div>
          </div>

          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><AlertIcon /> Scope Difficulty Distribution</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <DonutBars items={diffDonutArray} total={pending} />
            </div>
          </div>

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

          <div className="jw-card">
            <div className="jw-card-header">
              <h3 className="jw-card-title"><UsersIcon /> Judge-wise Active Case Load</h3>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              <DonutBars items={judgeArray} total={pending} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Analytics;
