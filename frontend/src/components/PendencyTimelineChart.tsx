import { TrendingUp } from "lucide-react";
import "./PendencyTimelineChart.css";

interface PendencyTimelineChartProps {
  trend?: {
    filed: Record<string, number>;
    disposed: Record<string, number>;
  };
}

export function PendencyTimelineChart({ trend }: PendencyTimelineChartProps) {
  // Process real data or fallback to empty array
  let dataPoints: { label: string, filed: number, disposed: number }[] = [];
  
  if (trend && trend.filed && trend.disposed) {
    const allMonths = Array.from(new Set([...Object.keys(trend.filed), ...Object.keys(trend.disposed)])).sort();
    dataPoints = allMonths.map(m => {
      // Format YYYY-MM to abbreviated month/year (e.g., 'JAN 25')
      const date = new Date(m + '-01');
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();
      return {
        label,
        filed: trend.filed[m] || 0,
        disposed: trend.disposed[m] || 0
      };
    });
  }

  // If there's no data, we don't render or render empty
  const hasData = dataPoints.length > 0;
  
  // Calculate max for Y-axis scaling
  const maxVal = hasData ? Math.max(...dataPoints.map(d => Math.max(d.filed, d.disposed))) : 1000;
  const chartHeight = 135; // 155 - 20
  const startX = 40;
  const endX = 480;
  const chartWidth = endX - startX;
  
  const stepX = hasData && dataPoints.length > 1 ? chartWidth / (dataPoints.length - 1) : chartWidth;

  const getPoint = (val: number, index: number) => {
    const x = startX + (index * stepX);
    // Inverse Y so higher value = higher on graph
    const y = 155 - ((val / (maxVal || 1)) * chartHeight);
    return { x, y };
  };

  const filedPoints = dataPoints.map((d, i) => getPoint(d.filed, i));
  const disposedPoints = dataPoints.map((d, i) => getPoint(d.disposed, i));

  const filedPolyline = filedPoints.map(p => `${p.x},${p.y}`).join(' ');
  const disposedPolyline = disposedPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Choose some labels for X axis (e.g. first, middle, last or evenly spaced)
  const xLabels = dataPoints.filter((_, i) => i === 0 || i === Math.floor(dataPoints.length / 2) || i === dataPoints.length - 1 || i % Math.max(1, Math.floor(dataPoints.length / 4)) === 0);
  
  return (
    <div className="pendency-timeline-container">
      {/* Chart Header */}
      <div className="pendency-timeline-header">
        <h3 className="pendency-timeline-title">
          <TrendingUp className="pendency-timeline-icon" />
          <span>Pendency Timeline Trend (Historical Data)</span>
        </h3>
        <div className="pendency-timeline-legend">
          <span className="pendency-timeline-legend-item">
            <span className="pendency-timeline-legend-line-filed" />
            <span className="pendency-timeline-legend-text">Cases Filed</span>
          </span>
          <span className="pendency-timeline-legend-item">
            <span className="pendency-timeline-legend-line-disposed" />
            <span className="pendency-timeline-legend-text">Cases Disposed</span>
          </span>
        </div>
      </div>

      {/* Responsive SVG Graphic */}
      <div className="pendency-timeline-svg-container">
        <svg viewBox="0 0 500 200" className="pendency-timeline-svg">
          {/* horizontal gridlines */}
          <line x1="40" y1="20" x2="480" y2="20" stroke="#222B38" strokeDasharray="4" />
          <line x1="40" y1="65" x2="480" y2="65" stroke="#222B38" strokeDasharray="4" />
          <line x1="40" y1="110" x2="480" y2="110" stroke="#222B38" strokeDasharray="4" />
          <line x1="40" y1="155" x2="480" y2="155" stroke="#222B38" strokeDasharray="4" />

          {hasData && (
            <>
              {/* Filed Line path (Orange) */}
              <polyline
                points={filedPolyline}
                fill="none"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Disposed Line path (Emerald) */}
              <polyline
                points={disposedPolyline}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Intersection Nodes (Orange) */}
              {filedPoints.map((p, i) => (
                <circle key={`f-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#F97316" />
              ))}

              {/* Intersection Nodes (Emerald) */}
              {disposedPoints.map((p, i) => (
                <circle key={`d-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#10B981" />
              ))}
            </>
          )}

          {/* Y-Axis Value Guides */}
          <text x="5" y="25" fill="#4B5563" fontSize="8" fontFamily="monospace">{maxVal > 1000 ? (maxVal/1000).toFixed(1)+'k' : maxVal}</text>
          <text x="5" y="115" fill="#4B5563" fontSize="8" fontFamily="monospace">{(maxVal/2 > 1000 ? (maxVal/2000).toFixed(1)+'k' : Math.round(maxVal/2))}</text>
          <text x="5" y="160" fill="#4B5563" fontSize="8" fontFamily="monospace">0</text>

          {/* X-Axis Timeline Guides */}
          {hasData && xLabels.map((d) => {
            const index = dataPoints.findIndex(dp => dp.label === d.label);
            const x = startX + (index * stepX);
            return (
              <text key={d.label} x={x} y="185" fill="#4B5563" fontSize="8" fontFamily="monospace" textAnchor="middle">
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Warning Observation */}
        <p className="pendency-timeline-warning">
          * Dynamic timeline rendered from active historical caseload data
        </p>
      </div>
    </div>
  );
}
