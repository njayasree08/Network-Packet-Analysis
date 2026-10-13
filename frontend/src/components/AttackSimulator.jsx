import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  Search,
  ArrowRightLeft,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Cpu,
  Layers,
} from 'lucide-react'
import { simulateAttack } from '../services/api'

export default function AttackSimulator({ onAttackComplete }) {
  const [loading, setLoading] = useState(false)
  const [activeScenario, setActiveScenario] = useState(null)
  const [attackResult, setAttackResult] = useState(null)
  const [error, setError] = useState(null)

  const scenarios = [
    {
      id: 'dos',
      title: 'DoS Attack',
      subtitle: 'Denial of Service Burst',
      desc: 'Floods target server with SYN packets, creating massive queue overflow and zero backward ACKs.',
      icon: Flame,
      color: 'from-rose-500 to-red-600',
      border: 'border-rose-500/40',
      badge: 'High Packet Rate',
    },
    {
      id: 'port_scan',
      title: 'Port Scan',
      subtitle: 'Reconnaissance Probe',
      desc: 'Rapidly probes sequential TCP ports (1-65535) using 1-3 packet short flows and RST responses.',
      icon: Search,
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-500/40',
      badge: 'Short Flow Probe',
    },
    {
      id: 'nat_anomaly',
      title: 'NAT Anomaly',
      subtitle: 'Translation Signature',
      desc: 'Irregular NAT address/port translation with high asymmetry, unexpected non-standard ports & URG flags.',
      icon: ArrowRightLeft,
      color: 'from-purple-500 to-indigo-600',
      border: 'border-purple-500/40',
      badge: 'Asymmetric Translation',
    },
  ]

  const handleSimulate = async (scenarioId) => {
    setLoading(true)
    setActiveScenario(scenarioId)
    setError(null)
    setAttackResult(null)

    try {
      const res = await simulateAttack(scenarioId)
      setAttackResult(res)
      if (onAttackComplete) {
        onAttackComplete(res)
      }
    } catch (err) {
      console.error('Attack simulation failed:', err)
      setError(err.response?.data?.detail || 'Simulation failed to reach backend API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="scanline-effect opacity-30" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
            <h2 className="text-lg font-bold text-white tracking-tight">Live Attack Simulator Console</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-time malicious flows and observe instant XGBoost intrusion classification
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          XGBoost Ready
        </div>
      </div>

      {/* Attack Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarios.map((sc) => {
          const Icon = sc.icon
          const isSelected = activeScenario === sc.id && loading

          return (
            <motion.button
              key={sc.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              onClick={() => handleSimulate(sc.id)}
              className={`relative text-left p-4 rounded-xl bg-slate-900/90 border transition-all duration-300 ${sc.border} hover:bg-slate-800/80 group ${
                isSelected ? 'ring-2 ring-cyan-400 opacity-90' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${sc.color} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {sc.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                {sc.title}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mb-2">{sc.subtitle}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{sc.desc}</p>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                  Trigger Flow &rarr;
                </span>
                {isSelected && (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Result Feedback Banner */}
      <AnimatePresence>
        {attackResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-5 rounded-xl border ${
              attackResult.prediction === 'BENIGN'
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-rose-950/40 border-rose-500/50 glow-red'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  attackResult.prediction === 'BENIGN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">FLAGGED BY ML:</span>
                    <span className={`text-base font-extrabold tracking-wide ${
                      attackResult.prediction === 'BENIGN' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {attackResult.prediction} DETECTED
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono font-bold">
                      {(attackResult.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Path: <span className="font-semibold text-white">{attackResult.source_device?.name}</span> ({attackResult.source_device?.ip}) &rarr; <span className="font-semibold text-white">{attackResult.destination_device?.name}</span> ({attackResult.destination_device?.ip})
                  </p>
                </div>
              </div>

              {/* Class probabilities micro list */}
              <div className="w-full md:w-auto bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-[10px] text-slate-400 font-mono mb-1.5 flex items-center justify-between gap-3">
                  <span>XGBoost Probabilities</span>
                  <Layers className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(attackResult.probabilities || {}).map(([cls, prob]) => (
                    <div key={cls} className="text-[11px]">
                      <span className="text-slate-400">{cls}: </span>
                      <span className="font-semibold text-cyan-300">{(prob * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
