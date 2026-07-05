import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  PendencyTrendChart, 
  CaseTypeDonutChart, 
  JudgeLoadChart, 
  BacklogAgeChart 
} from '../components/SvgCharts';
import { FaChartBar, FaFilter } from 'react-icons/fa';

interface CaseItem {
  id: number;
  case_number: string;
  district_name: string;
  case_category: string;
  crime_type: string | null;
  case_status: string;
  chargesheet_status: string;
  difficulty_tier: 'low' | 'medium' | 'high' | 'critical';
  filed_date: string;
  judge_name?: string;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gujarat Districts static list for filter
  const gujaratDistricts = [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 
    'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 
    'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 
    'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 
    'Tapi', 'Vadodara', 'Valsad'
  ];

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/cases/');
        setCases(response.data);
      } catch (err: any) {
        console.error("Analytics cases fetch failed:", err);
        setError("Failed to sync caseload files for analytics. Verify server connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  if (!user) return null;

  // Filter cases based on selected district
  const filteredCases = selectedDistrict
    ? cases.filter(c => c.district_name.toLowerCase() === selectedDistrict.toLowerCase())
    : cases;

  // ----------------------------------------------------
  // Aggregate 1: Pendency Trend (By Filed Year)
  // ----------------------------------------------------
  const getPendencyTrendData = () => {
    const countsByYear: Record<string, number> = {};
    // Seed with last few years for smooth graphing
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear; y++) {
      countsByYear[y.toString()] = 0;
    }

    filteredCases.forEach(c => {
      try {
        const year = c.filed_date.split('-')[0];
        if (year && countsByYear[year] !== undefined) {
          countsByYear[year]++;
        }
      } catch (e) {}
    });

    return Object.entries(countsByYear).map(([year, count]) => ({
      label: year,
      value: count
    })).sort((a, b) => a.label.localeCompare(b.label));
  };

  // ----------------------------------------------------
  // Aggregate 2: Case Type (Civil vs Criminal vs Appeal)
  // ----------------------------------------------------
  const getCaseTypeData = () => {
    const types = { Civil: 0, Criminal: 0, Appeal: 0 };
    filteredCases.forEach(c => {
      const cat = c.case_category as keyof typeof types;
      if (types[cat] !== undefined) {
        types[cat]++;
      }
    });
    return Object.entries(types).map(([label, value]) => ({ label, value }));
  };

  // ----------------------------------------------------
  // Aggregate 3: Judge Load (Cases per Judge)
  // ----------------------------------------------------
  const getJudgeLoadData = () => {
    const counts: Record<string, number> = {};
    filteredCases.forEach(c => {
      const name = c.judge_name || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Take top 5 judges
  };

  // ----------------------------------------------------
  // Aggregate 4: Backlog Age (Pending Case Durations)
  // ----------------------------------------------------
  const getBacklogAgeData = () => {
    const ageBuckets = {
      '< 1 Year': 0,
      '1-3 Years': 0,
      '3-5 Years': 0,
      '5+ Years': 0
    };

    const today = new Date();

    filteredCases.forEach(c => {
      if (c.case_status === 'Pending') {
        try {
          const filed = new Date(c.filed_date);
          const diffTime = Math.abs(today.getTime() - filed.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffYears = diffDays / 365;

          if (diffYears < 1) {
            ageBuckets['< 1 Year']++;
          } else if (diffYears < 3) {
            ageBuckets['1-3 Years']++;
          } else if (diffYears < 5) {
            ageBuckets['3-5 Years']++;
          } else {
            ageBuckets['5+ Years']++;
          }
        } catch (e) {}
      }
    });

    return Object.entries(ageBuckets).map(([label, value]) => ({ label, value }));
  };

  const trendData = getPendencyTrendData();
  const typeData = getCaseTypeData();
  const judgeData = getJudgeLoadData();
  const ageData = getBacklogAgeData();

  return (
    <div className="main-content">
      {/* Header */}
      <div className="analytics-header">
        <span className="subtitle">State Court Management System</span>
        <h1>Judicial Backlog Analytics</h1>
        <p className="text-muted">Real-time pendency distribution, court loading aggregates, and backlog duration curves.</p>
      </div>

      <hr className="divider" />

      {/* Filter Row */}
      <div className="jw-card filter-card no-margin" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
        <div className="form-group no-margin" style={{ maxWidth: '350px', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
          <label className="form-label no-margin font-serif flex-label" style={{ whiteSpace: 'nowrap' }}>
            <FaFilter className="icon" /> Scope District
          </label>
          <select
            className="form-control select-control"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={loading}
            style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}
          >
            <option value="">All Gujarat Courts</option>
            {gujaratDistricts.map((d, idx) => (
              <option key={idx} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-container" style={{ margin: 'auto' }}>
          <div className="spinner"></div>
          <p>Compiling judicial aggregates and loading charting panels...</p>
        </div>
      ) : (
        /* 2x2 Chart Grid */
        <div className="charts-2x2-grid">
          {/* Chart 1: Pendency Trend */}
          <div className="jw-card chart-card">
            <div className="chart-header">
              <FaChartBar className="icon" />
              <h3>Caseload Pendency Curve</h3>
            </div>
            <p className="chart-desc text-muted">Annual filing intake and active backlog volumes.</p>
            <PendencyTrendChart data={trendData} />
          </div>

          {/* Chart 2: Case Category Split */}
          <div className="jw-card chart-card">
            <div className="chart-header">
              <FaChartBar className="icon" />
              <h3>Case Type Distribution</h3>
            </div>
            <p className="chart-desc text-muted">Comparative proportions of Civil vs Criminal litigation.</p>
            <CaseTypeDonutChart data={typeData} />
          </div>

          {/* Chart 3: Judge Load */}
          <div className="jw-card chart-card">
            <div className="chart-header">
              <FaChartBar className="icon" />
              <h3>Judicial Loading Factor</h3>
            </div>
            <p className="chart-desc text-muted">Dockets currently allocated to top active Judicial Magistrates.</p>
            <JudgeLoadChart data={judgeData} />
          </div>

          {/* Chart 4: Backlog Age */}
          <div className="jw-card chart-card">
            <div className="chart-header">
              <FaChartBar className="icon" />
              <h3>Pendency Age Profile</h3>
            </div>
            <p className="chart-desc text-muted">Active litigation records bucketed by duration since filing date.</p>
            <BacklogAgeChart data={ageData} />
          </div>
        </div>
      )}

      <style>{`
        .analytics-header h1 {
          font-size: 2.25rem;
          margin-bottom: 0.25rem;
        }
        
        .analytics-header .subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        
        .charts-2x2-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        
        .chart-card {
          margin-bottom: 0px !important;
          padding: 1.5rem;
        }
        
        .chart-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
          border-bottom: 1px solid var(--border-muted);
          padding-bottom: 0.5rem;
        }
        
        .chart-header h3 {
          font-size: 0.95rem;
          text-transform: uppercase;
          color: var(--accent-brass);
          letter-spacing: 0.05em;
        }
        
        .chart-header .icon {
          color: var(--accent-brass);
          font-size: 1.1rem;
        }
        
        .chart-desc {
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }
        
        .chart-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          min-height: 180px;
        }
        
        .svg-chart {
          width: 100%;
          max-height: 200px;
        }
        
        .chart-axis-text {
          fill: var(--text-muted);
          font-size: 0.7rem;
          font-family: var(--font-sans);
        }
        
        .chart-tooltip-text {
          fill: var(--text-main);
          font-size: 0.65rem;
          font-weight: bold;
          font-family: var(--font-mono);
        }
        
        .chart-dot-group:hover circle {
          r: 6;
          fill: var(--accent-brass);
        }
        
        .chart-dot-group text {
          display: none;
        }
        
        .chart-dot-group:hover text {
          display: block;
        }
        
        @media (max-width: 900px) {
          .charts-2x2-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
