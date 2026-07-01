import React from "react";
import { formatCurrency } from "../helpers";

interface LocationValuePoint {
  locationName: string;
  totalValue: number;
}

interface InventoryDistributionChartProps {
  data: LocationValuePoint[];
  symbol: string;
}

export function InventoryDistributionChart({ data, symbol }: InventoryDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed text-slate-400">
        No stock assets available to chart.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.totalValue), 1);
  const totalValSum = data.reduce((sum, d) => sum + d.totalValue, 0);

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div>
        <h3 className="font-bold text-slate-800 text-lg">Location-wise Stock Distribution</h3>
        <p className="text-xs text-slate-500 mb-6">Distribution of capital assets across active store locations.</p>
      </div>

      <div className="space-y-5">
        {data.map((item, idx) => {
          const ratio = item.totalValue / maxValue;
          const percentage = totalValSum > 0 ? (item.totalValue / totalValSum) * 100 : 0;
          
          // Harmonic gradient colors based on index
          const colors = [
            "bg-gradient-to-r from-indigo-500 to-indigo-600",
            "bg-gradient-to-r from-emerald-500 to-teal-500",
            "bg-gradient-to-r from-violet-500 to-purple-500",
            "bg-gradient-to-r from-amber-500 to-orange-500",
            "bg-gradient-to-r from-pink-500 to-rose-500",
          ];
          const colorClass = colors[idx % colors.length];

          return (
            <div key={item.locationName} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                  {item.locationName}
                </span>
                <div className="space-x-2">
                  <span className="text-slate-400 font-mono">({percentage.toFixed(1)}%)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.totalValue, symbol)}</span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out origin-left ${colorClass}`}
                  style={{
                    width: `${Math.max(ratio * 100, 1.5)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t flex justify-between items-center text-xs text-slate-400">
        <span>Combined Assets:</span>
        <span className="font-bold text-indigo-600 text-sm">{formatCurrency(totalValSum, symbol)}</span>
      </div>
    </div>
  );
}
