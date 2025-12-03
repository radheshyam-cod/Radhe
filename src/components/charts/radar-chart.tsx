'use client'

import { motion } from 'framer-motion'

interface RadarChartProps {
  data: {
    topic: string;
    score: number;
  }[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const size = 200;
  const center = size / 2;
  const numLevels = 5;
  const angleSlice = (Math.PI * 2) / data.length;

  const levelLines = Array.from({ length: numLevels }, (_, i) => {
    const radius = (center * (i + 1)) / numLevels;
    return (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#1d204d"
        strokeWidth="1"
      />
    );
  });

  const axisLines = data.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = center + center * Math.cos(angle);
    const y = center + center * Math.sin(angle);
    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#1d204d" strokeWidth="1" />;
  });

  const dataShape = data
    .map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const radius = (center * d.score) / 100;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const axisLabels = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const radius = center * 1.1;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return (
      <text key={i} x={x} y={y} textAnchor="middle" dy="0.35em" fill="#7aa2ff" fontSize="10">
        {d.topic}
      </text>
    );
  });

  return (
    <motion.svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levelLines}
      {axisLines}
      <polygon points={dataShape} fill="rgba(122, 162, 255, 0.4)" stroke="#7aa2ff" strokeWidth="2" />
      {axisLabels}
    </motion.svg>
  );
}
