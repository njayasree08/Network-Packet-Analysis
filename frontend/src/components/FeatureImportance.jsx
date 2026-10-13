import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Sliders, Info } from 'lucide-react'

export default function FeatureImportance({ features }) {
  if (!features || !Array.isArray(features) || features.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400 text-sm">
        No feature importances available. Run model training first.
      </div>
    )
  }

  // Take top 12 features for clean presentation
  const topData = features.slice(0, 12).map((item) => ({
    name: item.feature.replace(/_/g, ' '),
    rawName: item.feature,
    importance: +(item.importance * 100).toFixed(2),
  }))

  const colors = [
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#10b981'
  ]

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">XGBoost Feature Importance Rankings</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top statistical flow characteristics driving ML intrusion decisions
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
          Gain-Based Ranking
        </span>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-80 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={topData}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis
              type="number"
              unit="%"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: '#334155' }}
              width={120}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="glass-panel p-3 rounded-lg border border-slate-700 text-xs shadow-xl">
                      <p className="font-bold text-cyan-300">{data.rawName}</p>
                      <p className="text-slate-300 mt-1">
                        XGBoost Importance: <span className="font-semibold text-white">{data.importance}%</span>
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={14}>
              {topData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-semibold text-cyan-300">Flow Packets/sec & IAT:</span> High packet rates with microsecond inter-arrival times correlate directly with <span className="text-rose-400 font-semibold">DoS attacks</span>.
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <span className="font-semibold text-cyan-300">TCP SYN & RST Flag Counts:</span> High SYN/RST flag occurrences on single-packet flows identify <span className="text-amber-400 font-semibold">Port Scanning probes</span>.
        </div>
      </div>
    </div>
  )
}
