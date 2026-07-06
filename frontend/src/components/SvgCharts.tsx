import React from 'react';

/* ================================================================
   SvgCharts — Pure SVG chart primitives for JusticeWatch Analytics
   No external chart libraries (Plotly is backend-only per syllabus)
   ================================================================ */

/* ---- Horizontal Progress Bar ---- */
interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  suffix?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label, value, maxValue, color = 'var(--accent)', suffix = ''
}) => {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

/* ---- Vertical Bar Chart (inline SVG) ---- */
interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ items, height = 180 }) => {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barWidth = 40;
  const gap = 20;
  const chartWidth = items.length * (barWidth + gap) + gap;
  const labelHeight = 30;
  const yAxisWidth = 40;

  return (
    <svg
      viewBox={`0 0 ${chartWidth + yAxisWidth} ${height + labelHeight + 10}`}
      style={{ width: '100%', height: `${height + labelHeight + 20}px` }}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(fraction => {
        const y = height - (fraction * height) + 5;
        return (
          <line
            key={fraction}
            x1={yAxisWidth}
            y1={y}
            x2={chartWidth + yAxisWidth}
            y2={y}
            stroke="var(--border-main)"
            strokeDasharray="3"
          />
        );
      })}

      {/* Bars */}
      {items.map((item, idx) => {
        const barHeight = (item.value / maxVal) * height;
        const x = yAxisWidth + gap + idx * (barWidth + gap);
        const y = height - barHeight + 5;

        return (
          <g key={idx}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={item.color || 'var(--accent)'}
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              {item.value.toLocaleString()}
            </text>
            <text
              x={x + barWidth / 2}
              y={height + labelHeight}
              textAnchor="middle"
              fill="var(--text-faint)"
              fontSize="8"
              fontFamily="var(--font-mono)"
              textDecoration="none"
            >
              {item.label.length > 8 ? item.label.substring(0, 8) + '…' : item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---- Donut / Pie style via stacked horizontal bars ---- */
interface DonutBarItem {
  label: string;
  value: number;
  color: string;
}

interface DonutBarsProps {
  items: DonutBarItem[];
  total?: number;
}

export const DonutBars: React.FC<DonutBarsProps> = ({ items, total }) => {
  const sum = total || items.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      {items.map((item, idx) => {
        const pct = sum > 0 ? Math.round((item.value / sum) * 100) : 0;
        return (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: item.color, display: 'inline-block' }} />
                {item.label}
              </span>
              <span style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {item.value.toLocaleString()} ({pct}%)
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
