import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

const LABEL_COLORS = {
  BENIGN:     '#10b981',
  DoS:        '#ef4444',
  DDoS:       '#ef4444',
  PortScan:   '#f59e0b',
  BruteForce: '#8b5cf6',
  WebAttack:  '#f97316',
  Infiltration: '#ec4899',
  Heartbleed: '#06b6d4',
  Botnet:     '#a78bfa',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <div className="text-gray-400 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#fff' }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export function AttackDistributionPie({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={LABEL_COLORS[entry.name] || COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ProtocolBarChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function NormalVsMaliciousBar({ normal, malicious }) {
  const data = [
    { name: 'Normal',    value: normal,    fill: '#10b981' },
    { name: 'Malicious', value: malicious, fill: '#ef4444' },
  ]
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DeviceAttackBar({ data }) {
  const chartData = Object.entries(data || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ClassDistributionBar({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({ name, value }))
  if (!chartData.length) return <EmptyChart />

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">Traffic Class Distribution</h3>
        <span className="text-[10px] uppercase tracking-wider text-cyan-300">Dataset</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-10} textAnchor="end" height={50} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={LABEL_COLORS[entry.name] || COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PerClassMetricsBar({ data }) {
  const chartData = Object.entries(data || {}).map(([name, metrics]) => ({
    name,
    precision: Number(metrics?.precision ?? 0),
    recall: Number(metrics?.recall ?? 0),
    f1_score: Number(metrics?.f1_score ?? 0),
  }))

  if (!chartData.length) return <EmptyChart />

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">Precision, Recall & F1 by Class</h3>
        <span className="text-[10px] uppercase tracking-wider text-amber-300">Evaluation</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-12} textAnchor="end" height={50} />
          <YAxis domain={[0, 1.05]} tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip formatter={(value) => Number(value).toFixed(2)} content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Bar dataKey="precision" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="recall" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="f1_score" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
      No data yet
    </div>
  )
}
