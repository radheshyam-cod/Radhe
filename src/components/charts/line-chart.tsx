'use client'

import { motion } from 'framer-motion'

interface LineChartProps {
  data: {
    label: string;
    value: number;
  }[];
  width?: number;
  height?: number;
}

export default function LineChart({ data, width = 300, height = 150 }: LineChartProps) {
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxX = data.length - 1;
  const maxY = Math.max(...data.map(d => d.value));

  const points = data
    .map((d, i) => {
      const x = (i / maxX) * chartWidth + padding;
      const y = chartHeight - (d.value / maxY) * chartHeight + padding;
      return `${x},${y}`;
    })
    .join(' ');

  const xAxis = (
    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1d204d" strokeWidth="1" />
  );

  const yAxis = (
    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#1d204d" strokeWidth="1" />
  );

  const xLabels = data.map((d, i) => {
    const x = (i / maxX) * chartWidth + padding;
    return (
      <text key={i} x={x} y={height - padding + 15} textAnchor="middle" fill="#7aa2ff" fontSize="10">
        {d.label}
      </text>
    );
  });

  return (
    <motion.svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {xAxis}
      {yAxis}
      <polyline
        points={points}
        fill="none"
        stroke="#7aa2ff"
        strokeWidth="2"
      />
      {xLabels}
    </motion.svg>
  );
}
