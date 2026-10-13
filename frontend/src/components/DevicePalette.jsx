import React from 'react'
import { Monitor, Server, Router, Network, Shield, Laptop } from 'lucide-react'

const DEVICE_TYPES = [
  { type: 'pc',       label: 'PC',       icon: Monitor,  color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { type: 'laptop',   label: 'Laptop',   icon: Laptop,   color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { type: 'server',   label: 'Server',   icon: Server,   color: 'text-green-400',  bg: 'bg-green-500/10'  },
  { type: 'router',   label: 'Router',   icon: Router,   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { type: 'switch',   label: 'Switch',   icon: Network,  color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  { type: 'firewall', label: 'Firewall', icon: Shield,   color: 'text-red-400',    bg: 'bg-red-500/10'    },
]

export function getDeviceIcon(type, size = 20) {
  const found = DEVICE_TYPES.find(d => d.type === type)
  if (!found) return <Monitor size={size} />
  const Icon = found.icon
  return <Icon size={size} />
}

export function getDeviceColor(type) {
  return DEVICE_TYPES.find(d => d.type === type)?.color || 'text-gray-400'
}

export default function DevicePalette({ onAddDevice }) {
  return (
    <div className="bg-[#111827] border-b border-[#1f2937] px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Device Palette</span>
        <span className="text-xs text-gray-600">— click to add</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEVICE_TYPES.map(({ type, label, icon: Icon, color, bg }) => (
          <button
            key={type}
            onClick={() => onAddDevice(type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1f2937] ${bg} hover:border-cyan-500/40 transition-all text-sm font-medium ${color}`}
            title={`Add ${label}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
