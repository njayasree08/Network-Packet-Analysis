import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'
import { Shield, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react'

const CARTOON_AVATAR = {
  pc: { emoji: '🖥️', name: 'Agent PC', color: 'from-blue-500 to-cyan-500', glow: 'shadow-cyan-500/50' },
  laptop: { emoji: '💻', name: 'Cyber Laptop', color: 'from-indigo-500 to-purple-500', glow: 'shadow-purple-500/50' },
  server: { emoji: '🤖', name: 'Robot Server', color: 'from-emerald-400 to-teal-600', glow: 'shadow-emerald-500/50' },
  router: { emoji: '🧙‍♂️', name: 'Wizard Router', color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/50' },
  switch: { emoji: '🎛️', name: 'Network Hub', color: 'from-sky-400 to-blue-600', glow: 'shadow-sky-500/50' },
  firewall: { emoji: '🏰', name: 'Fortress Firewall', color: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/50' },
}

function DeviceNode({ data, selected }) {
  const avatar = CARTOON_AVATAR[data.device_type] || CARTOON_AVATAR.pc
  const isDanger = data.alertStatus === 'danger'
  const isWarning = data.alertStatus === 'warning'

  const healthPct = isDanger ? 30 : isWarning ? 65 : 100
  const healthColor = isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
      whileTap={{ scale: 0.95 }}
      className={`relative px-3 py-2.5 rounded-2xl bg-slate-900/90 border-2 transition-all duration-300 shadow-xl cursor-pointer ${
        isDanger
          ? 'border-rose-500 glow-red animate-pulse'
          : isWarning
          ? 'border-amber-400 glow-amber'
          : selected
          ? 'border-cyan-400 glow-cyan ring-2 ring-cyan-400/40'
          : 'border-slate-700/80 hover:border-cyan-400/60'
      }`}
      style={{ minWidth: 120 }}
    >
      {/* Handles for flow connections */}
      <Handle type="target" position={Position.Top} style={{ background: '#06b6d4', width: 9, height: 9 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#06b6d4', width: 9, height: 9 }} />
      <Handle type="target" position={Position.Left} style={{ background: '#06b6d4', width: 9, height: 9 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#06b6d4', width: 9, height: 9 }} />

      {/* Floating Cartoon Shield & Health Bar */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full px-2 flex flex-col items-center">
        <div className="w-full bg-slate-950/90 border border-slate-700 rounded-full h-2.5 overflow-hidden p-0.5 flex items-center shadow-md">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${healthPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`h-full rounded-full ${healthColor}`}
          />
        </div>
        <span className="text-[8px] font-extrabold text-slate-300 font-mono mt-0.5 tracking-tight">
          {isDanger ? 'SHIELD CRITICAL' : 'SHIELD 100%'}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 mt-1">
        {/* Cartoon Avatar Circle */}
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatar.color} p-0.5 shadow-lg ${avatar.glow} flex items-center justify-center text-2xl transform hover:rotate-6 transition-transform`}>
          <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center">
            <span>{avatar.emoji}</span>
          </div>
        </div>

        {/* Device Name */}
        <div className="text-[11px] font-bold text-white tracking-wide text-center truncate max-w-[100px]">
          {data.name}
        </div>

        {/* IP Address */}
        {data.ip_address && (
          <div className="text-[9px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
            {data.ip_address}
          </div>
        )}

        {/* Attack Cartoon Badge */}
        {isDanger && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="mt-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 text-[9px] font-extrabold flex items-center gap-1 shadow-lg"
          >
            <Zap className="w-3 h-3 text-rose-400 animate-spin" />
            <span>{data.alertLabel || 'ATTACK!'}</span>
          </motion.div>
        )}

        {!isDanger && !isWarning && (
          <div className="mt-0.5 text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>SAFE</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default memo(DeviceNode)
