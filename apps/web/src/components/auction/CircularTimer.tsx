"use client";
import React from "react";

interface Props {
  seconds: number;
  total: number;
  size?: number; // px
}

export default function CircularTimer({ seconds, total, size = 88 }: Props) {
  const radius = (size - 12) / 2; // 8 stroke + 4 padding
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, total ? seconds / total : 0));
  const dash = circumference * progress;
  const color = progress > 0.6 ? "#00B894" : progress > 0.3 ? "#FFD700" : "#EF4444";
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} stroke="#E5E7EB" strokeWidth={8} fill="none" />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s linear" }}
      />
      <text x={center} y={center} dominantBaseline="middle" textAnchor="middle" fontWeight={700} fontFamily="Inter">
        {seconds}s
      </text>
    </svg>
  );
}
