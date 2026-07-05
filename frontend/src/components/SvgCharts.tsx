import React from 'react';

// ==========================================
// 1. PENDENCY TREND AREA CHART
// ==========================================
interface TrendDataPoint {
  label: string;
  value: number;
}

export const PendencyTrendChart: React.FC<{ data: TrendDataPoint[] }> = ({ data }) => {
  const width = 500;
  const height = 220;
  const padding = 35;
  
  if (!data || data.length === 0) return <div className="text-center text-muted">No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * graphWidth;
    const y = padding + graphHeight - (d.value / maxVal) * graphHeight;
    return { x, y, label: d.label, val: d.value };
  });

  // Construct SVG paths
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${padding + graphHeight} L ${points[0].x} ${padding + graphHeight} Z`
    : '';

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B08D57" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#B08D57" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + graphHeight * ratio;
          const gridVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#2A323D" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-axis-text">{gridVal}</text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <line x1={p.x} y1={padding + graphHeight} x2={p.x} y2={padding + graphHeight + 4} stroke="#B08D57" strokeWidth="1" />
            <text x={p.x} y={padding + graphHeight + 18} textAnchor="middle" className="chart-axis-text">{p.label}</text>
          </g>
        ))}

        {/* Grid Area and Line */}
        {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}
        {linePath && <path d={linePath} fill="none" stroke="#B08D57" strokeWidth="2" />}

        {/* Dots on line */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-dot-group">
            <circle cx={p.x} cy={p.y} r="4" fill="#12161C" stroke="#B08D57" strokeWidth="2" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="chart-tooltip-text">{p.val}</text>
          </g>
        ))}

        {/* Base Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
        <line x1={padding} y1={padding + graphHeight} x2={width - padding} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
      </svg>
    </div>
  );
};


// ==========================================
// 2. CASE TYPE DONUT CHART
// ==========================================
interface DonutDataPoint {
  label: string;
  value: number;
}

export const CaseTypeDonutChart: React.FC<{ data: DonutDataPoint[] }> = ({ data }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  
  if (total === 0) return <div className="text-center text-muted">No data available</div>;

  let currentAngle = 0;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const colors = ['#B08D57', '#4E9C54', '#D2963C', '#E67E22'];

  const items = data.map((d, idx) => {
    const percentage = d.value / total;
    const strokeDashoffset = circumference - percentage * circumference;
    const rotation = currentAngle;
    currentAngle += percentage * 360;
    return {
      ...d,
      strokeDashoffset,
      rotation,
      color: colors[idx % colors.length],
    };
  });

  return (
    <div className="donut-chart-container" style={{ margin: '1rem 0' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#2A323D" strokeWidth="16" />
        {items.map((item, idx) => (
          <circle
            key={idx}
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={item.color}
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={item.strokeDashoffset}
            transform={`rotate(${item.rotation - 90} 80 80)`}
          />
        ))}
        <text x="80" y="85" textAnchor="middle" fill="var(--text-main)" fontSize="0.75rem" fontWeight="bold" fontFamily="var(--font-serif)">
          {total} Total
        </text>
      </svg>
      <div className="donut-legend">
        {items.map((item, idx) => (
          <div key={idx} className="legend-row">
            <span className="legend-color-box" style={{ backgroundColor: item.color }}></span>
            <span className="legend-label">{item.label} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// 3. JUDGE LOAD VERTICAL BAR CHART
// ==========================================
interface JudgeLoadDataPoint {
  label: string;
  value: number;
}

export const JudgeLoadChart: React.FC<{ data: JudgeLoadDataPoint[] }> = ({ data }) => {
  const width = 500;
  const height = 220;
  const padding = 35;

  if (!data || data.length === 0) return <div className="text-center text-muted">No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  const barGap = 20;
  const numBars = data.length;
  const barWidth = (graphWidth - barGap * (numBars - 1)) / numBars;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + graphHeight * ratio;
          const gridVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#2A323D" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-axis-text">{gridVal}</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding + i * (barWidth + barGap);
          const barHeight = (d.value / maxVal) * graphHeight;
          const y = padding + graphHeight - barHeight;

          return (
            <g key={i} className="chart-bar-group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="rgba(176, 141, 87, 0.25)"
                stroke="#B08D57"
                strokeWidth="1"
              />
              {/* Tooltip Count */}
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="chart-tooltip-text">{d.value}</text>
              {/* Axis Label */}
              <text 
                x={x + barWidth / 2} 
                y={padding + graphHeight + 16} 
                textAnchor="middle" 
                className="chart-axis-text"
                style={{ fontSize: '0.65rem' }}
              >
                {d.label.length > 8 ? `${d.label.substring(0, 8)}.` : d.label}
              </text>
            </g>
          );
        })}

        {/* Base Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
        <line x1={padding} y1={padding + graphHeight} x2={width - padding} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
      </svg>
    </div>
  );
};


// ==========================================
// 4. BACKLOG AGE HORIZONTAL BAR CHART
// ==========================================
interface AgeDataPoint {
  label: string;
  value: number;
}

export const BacklogAgeChart: React.FC<{ data: AgeDataPoint[] }> = ({ data }) => {
  const width = 500;
  const height = 220;
  const padding = 35;
  const labelWidth = 80;

  if (!data || data.length === 0) return <div className="text-center text-muted">No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const graphWidth = width - padding * 2 - labelWidth;
  const graphHeight = height - padding * 2;
  const barGap = 12;
  const numBars = data.length;
  const barHeight = (graphHeight - barGap * (numBars - 1)) / numBars;

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
        {/* Vertical Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const x = padding + labelWidth + graphWidth * ratio;
          const gridVal = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line x1={x} y1={padding} x2={x} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" strokeDasharray="4 4" />
              <text x={x} y={padding + graphHeight + 16} textAnchor="middle" className="chart-axis-text">{gridVal}</text>
            </g>
          );
        })}

        {/* Horizontal Bars */}
        {data.map((d, i) => {
          const y = padding + i * (barHeight + barGap);
          const barWidthVal = (d.value / maxVal) * graphWidth;
          const x = padding + labelWidth;

          return (
            <g key={i}>
              {/* Category Label */}
              <text x={x - 10} y={y + barHeight / 2 + 4} textAnchor="end" className="chart-axis-text">{d.label}</text>
              {/* Bar Rect */}
              <rect
                x={x}
                y={y}
                width={barWidthVal}
                height={barHeight}
                fill="rgba(176, 141, 87, 0.25)"
                stroke="#B08D57"
                strokeWidth="1"
              />
              {/* Bar Value Tooltip */}
              <text x={x + barWidthVal + 10} y={y + barHeight / 2 + 4} textAnchor="start" className="chart-tooltip-text" style={{ fontSize: '0.7rem' }}>
                {d.value}
              </text>
            </g>
          );
        })}

        {/* Base Axes */}
        <line x1={padding + labelWidth} y1={padding} x2={padding + labelWidth} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
        <line x1={padding + labelWidth} y1={padding + graphHeight} x2={width - padding} y2={padding + graphHeight} stroke="#2A323D" strokeWidth="1" />
      </svg>
    </div>
  );
};
