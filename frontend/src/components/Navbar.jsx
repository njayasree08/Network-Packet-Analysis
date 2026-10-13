import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  Activity,
  Network,
  BarChart3,
  FileSearch,
  History,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react'
import { soundFX } from './SoundEffects'

export default function Navbar({ onQuickAttack }) {
  const location = useLocation()
  const [muted, setMuted] = useState(soundFX.muted)

  const handleToggleSound = () => {
    const isMuted = soundFX.toggleMute()
    setMuted(isMuted)
    if (!isMuted) soundFX.playLaser()
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/simulator', label: 'Network Simulator', icon: Network },
    { path: '/analytics', label: 'ML Analytics', icon: BarChart3 },
    { path: '/pcap', label: 'PCAP Inspector', icon: FileSearch },
    { path: '/history', label: 'Prediction History', icon: History },
  ]

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Cartoon Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <div className="p-2 rounded-[14px] bg-slate-950 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-pink-400 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-pink-400 via-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                PacketSentinel
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-pink-300 border border-pink-500/40 rounded-full flex items-center gap-1 shadow">
                <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> Cartoon IDS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Flow Traffic ML & Cyber Cartoon Defense</p>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-400/50 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Sound FX Toggle Button */}
          <button
            onClick={handleToggleSound}
            title={muted ? "Unmute Arcade Sounds" : "Mute Arcade Sounds"}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
              muted
                ? 'bg-slate-900 text-slate-500 border-slate-800'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-md glow-cyan'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />}
            <span className="hidden sm:inline font-mono text-[10px]">{muted ? 'MUTED' : 'ARCADE FX'}</span>
          </button>

          {/* Quick Simulate Attack Button */}
          {onQuickAttack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onQuickAttack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all border border-rose-300/40"
            >
              <Zap className="w-4 h-4 fill-white" />
              Simulate Attack
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}
