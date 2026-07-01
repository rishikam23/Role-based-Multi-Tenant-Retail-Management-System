"use client";

import React, { useState } from "react";
import { formatCurrency } from "../helpers";

interface ChartDataPoint {
  date: string;
  amount: number;
}

interface RevenueTrendChartProps {
  data: ChartDataPoint[];
  symbol: string;
}

export function RevenueTrendChart({ data, symbol }: RevenueTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed text-slate-400">
        No sales transaction trend data available for the chosen filters.
      </div>
    );
  }

  // Dimension specs
  const width = 800;
  const height = 250;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Math metrics
  const maxAmount = Math.max(...data.map((d) => d.amount), 100); // Guard division by zero
  const minAmount = 0;
  const amountRange = maxAmount - minAmount;

  // Calculate coordinates for points
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingBottom - ((d.amount - minAmount) / amountRange) * chartHeight;
    return { x, y, ...d };
  });

  // Build SVG path string (Bezier Curve)
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p = points[i];
      // Control points for smooth beziers
      const cpX1 = p0.x + (p.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p.x - p0.x) / 2;
      const cpY2 = p.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }
  }

  // Path for gradient background under line
  const fillD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : "";

  // Y-axis grid values
  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const ratio = i / yTicks;
    const val = minAmount + ratio * amountRange;
    const y = height - paddingBottom - ratio * chartHeight;
    return { y, val };
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Sales Revenue Trend</h3>
          <p className="text-xs text-slate-500">7-Day operational billing performance trajectory.</p>
        </div>
        {hoveredIndex !== null && (
          <div className="text-right bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs shadow-md animate-fade-in transition-all">
            <span className="font-semibold text-slate-300">
              {new Date(data[hoveredIndex].date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
              :{" "}
            </span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(data[hoveredIndex].amount, symbol)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto no-scrollbar">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          className="overflow-visible select-none min-w-[600px]"
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
            {/* Stroke gradient */}
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Y Labels */}
          {gridLines.map((line, idx) => (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={width - paddingRight}
                y2={line.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={idx === yTicks ? "0" : "4 4"}
              />
              <text
                x={paddingLeft - 12}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] font-medium fill-slate-400 font-mono"
              >
                {formatCurrency(line.val, symbol).split(".")[0]}
              </text>
            </g>
          ))}

          {/* Gradient fill area */}
          {fillD && <path d={fillD} fill="url(#areaGrad)" />}

          {/* Main trend curve line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          )}

          {/* Interactive Circle Coordinates */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible larger hover catcher circle */}
                <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                {/* Outer pulsing focus border */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill="#10b981"
                    className="opacity-30 animate-ping"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "6" : "4.5"}
                  fill="#ffffff"
                  stroke={isHovered ? "#6366f1" : "#10b981"}
                  strokeWidth={isHovered ? "3" : "2.5"}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* X Labels */}
          {points.map((pt, idx) => {
            // Label rendering filter (e.g. skip labels if array too large to avoid overlaps)
            const shouldShow =
              points.length <= 8 || idx % Math.ceil(points.length / 7) === 0 || idx === points.length - 1;

            if (!shouldShow) return null;

            return (
              <text
                key={idx}
                x={pt.x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-500"
              >
                {new Date(pt.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
