import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDashboard } from '../services/api.js'
import AttackSimulator from '../components/AttackSimulator.jsx'
import {
  AttackDistributionPie,
  ProtocolBarChart,
  NormalVsMaliciousBar,
  DeviceAttackBar,
} from '../charts/DashboardCharts.jsx'
import {
  Monitor,
  Network,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Skull,
  RefreshCw,
  Zap,
  Radio,
} from 'lucide-react'

const LABEL_BADGE = {
  BENIGN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DoS: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  DDoS: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  PortScan: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  NAT_Anomaly: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  BruteForce: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
}

function StatCard({ icon: Icon, label, value, color, sub, glow }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`glass-panel p-5 rounded-2xl border border-slate-800 transition-all ${glow || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className={`text-2xl font-extrabold mt-1 ${color || 'text-white'}`}>{value}</p>
          {sub && <p className="text-[11px] text-slate-500 mt-1 font-mono">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800`}>
          <Icon className={`w-5 h-5 ${color || 'text-slate-400'}`} />
        </div>
      </div>
    </motion.div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
        <span>{title}</span>
        <Activity className="w-4 h-4 text-cyan-400 opacity-60" />
      </h3>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await getDashboard()
      setStats(data)
    } catch (err) {
      console.error('Failed to load dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const s = stats || {}
  const maliciousPct = s.total_predictions
    ? ((s.malicious_flows / s.total_predictions) * 100).toFixed(1)
    : 0

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              PacketSentinel Security Operations Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine Learning-Based Intrusion Detection System with Flow-Based Traffic Analysis & XGBoost
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Live Attack Simulator Component */}
      <AttackSimulator onAttackComplete={loadStats} />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Monitor} label="Total Devices" value={s.total_devices || 0} color="text-cyan-400" />
        <StatCard icon={Network} label="Network Links" value={s.total_connections || 0} color="text-sky-400" />
        <StatCard icon={Activity} label="Traffic Flows" value={s.total_flows || 0} color="text-blue-400" />
        <StatCard icon={ShieldAlert} label="ML Predictions" value={s.total_predictions || 0} color="text-indigo-400" />

        <StatCard icon={ShieldCheck} label="Benign Traffic" value={s.normal_flows || 0} color="text-emerald-400" />
        <StatCard
          icon={Skull}
          label="Malicious Attacks"
          value={s.malicious_flows || 0}
          color="text-rose-400"
          sub={`${maliciousPct}% Threat Ratio`}
          glow={s.malicious_flows > 0 ? 'border-rose-500/30' : ''}
        />
        <StatCard icon={AlertTriangle} label="DoS Attacks" value={s.dos_flows || 0} color="text-rose-400" />
        <StatCard icon={AlertTriangle} label="Port Scans" value={s.port_scan_flows || 0} color="text-amber-400" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Normal vs Malicious Flow Ratio">
          <NormalVsMaliciousBar normal={s.normal_flows || 0} malicious={s.malicious_flows || 0} />
        </ChartCard>

        <ChartCard title="Intrusion Category Distribution">
          <AttackDistributionPie data={s.attack_distribution || {}} />
        </ChartCard>

        <ChartCard title="Traffic Volume by Protocol">
          <ProtocolBarChart data={s.protocol_distribution || {}} />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Attacks Target Distribution by Source">
          <DeviceAttackBar data={s.device_attack_distribution || {}} />
        </ChartCard>

        {/* Live Recent ML Predictions Table */}
        <ChartCard title="Real-Time Intrusion Detection Log">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2 text-left">Flow ID</th>
                  <th className="pb-2 text-left">Source</th>
                  <th className="pb-2 text-left">Destination</th>
                  <th className="pb-2 text-left">Protocol</th>
                  <th className="pb-2 text-left">Prediction</th>
                  <th className="pb-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {(s.recent_predictions || []).slice(0, 8).map((p) => {
                  const badgeClass = LABEL_BADGE[p.prediction] || 'bg-slate-800 text-slate-300'
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 text-cyan-400 font-semibold">{p.flow_id?.slice(0, 12)}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{p.source}</td>
                      <td className="py-2.5 text-slate-300 font-sans">{p.destination}</td>
                      <td className="py-2.5 text-slate-400">{p.protocol}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${badgeClass}`}>
                          {p.prediction}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-white">
                        {(p.confidence * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
                {(!s.recent_predictions || s.recent_predictions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No predictions logged yet. Run an attack simulation above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
