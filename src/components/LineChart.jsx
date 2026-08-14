import React from 'react';

const LineChart = ({ data = [30, 45, 35, 60, 40, 85, 70, 75, 90], labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'] }) => {
  const width = 600;
  const height = 180;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = 100;
  
  // Calculate SVG points
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (val / maxVal) * chartHeight;
    return { x, y };
  });

  // Generate cubic bezier curve command
  // Simple Catmull-Rom or midpoints method to make the line smooth
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  // Generate closed path for gradient fill under the line
  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '180px' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          {/* Main orange glow gradient */}
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5722" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((tick, i) => {
          const y = padding + chartHeight - (tick / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="rgba(255,255,255,0.03)" 
                strokeWidth="1" 
              />
              <text 
                x={padding - 5} 
                y={y + 3} 
                fill="var(--color-text-muted)" 
                fontSize="8" 
                textAnchor="end"
                fontFamily="var(--font-body)"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Gradient Area Fill */}
        {fillD && <path d={fillD} fill="url(#chartGradient)" />}

        {/* Chart Line */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="var(--color-orange)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Dots on line */}
        {points.map((pt, idx) => (
          <g key={idx}>
            {/* Outer hover ring */}
            <circle 
              cx={pt.x} 
              cy={pt.y} 
              r="7" 
              fill="rgba(255, 87, 34, 0.2)" 
              opacity="0" 
              style={{ transition: 'opacity 0.2s' }}
              className="chart-dot-ring"
            />
            {/* Core dot */}
            <circle 
              cx={pt.x} 
              cy={pt.y} 
              r="4.5" 
              fill="#ffffff" 
              stroke="var(--color-orange)" 
              strokeWidth="2.5" 
            />
            {/* Tooltip text (shown on hover) */}
            <text
              x={pt.x}
              y={pt.y - 12}
              fill="var(--color-text-primary)"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              backgroundColor="#000"
              style={{ pointerEvents: 'none', opacity: 0.9 }}
            >
              {data[idx]}%
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {labels.map((lbl, idx) => {
          const x = padding + (idx / (labels.length - 1)) * chartWidth;
          return (
            <text 
              key={idx} 
              x={x} 
              y={height - 2} 
              fill="var(--color-text-secondary)" 
              fontSize="9" 
              textAnchor="middle"
              fontFamily="var(--font-display)"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default LineChart;
