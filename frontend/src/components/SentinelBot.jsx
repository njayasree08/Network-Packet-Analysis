import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Shield, AlertTriangle, Zap, MessageSquare, X } from 'lucide-react'
import { soundFX } from './SoundEffects'

const MASCOT_TIPS = [
  "Beep Boop! 🤖 I'm Sentinel-Bot! I use XGBoost decision trees to crush cyber intruders!",
  "Did you know? DoS attacks spam high-frequency SYN packets with zero responses! 💥",
  "Port scans sneak around checking sequential ports! I catch them red-handed! ⚡",
  "NAT anomalies show crazy asymmetric port mappings! My ML brains flag them instantly! 🌀",
  "Upload a .pcap file anytime to let me parse raw packet streams into 5-tuple flows! 📄",
  "Class imbalance? No problem! My training uses balanced sample weighting for 100% precision! 🎯"
]

export default function SentinelBot({ attackState }) {
  const [mood, setMood] = useState('happy') // happy, shocked, scanning, shielded
  const [speech, setSpeech] = useState(MASCOT_TIPS[0])
  const [tipIndex, setTipIndex] = useState(0)
  const [minimized, setMinimized] = useState(false)

  // React to attack events
  useEffect(() => {
    if (!attackState) return

    const pred = attackState.prediction
    if (pred === 'DoS') {
      setMood('shocked')
      setSpeech('OH NO! 😱 Massive DoS SYN packet flood detected! Shields up!')
      soundFX.playSiren()
    } else if (pred === 'PortScan') {
      setMood('shocked')
      setSpeech('ZOINKS! ⚡ Sequential Port Scan probe detected across target ports!')
      soundFX.playSiren()
    } else if (pred === 'NAT_Anomaly') {
      setMood('shocked')
      setSpeech('WUT? 🌀 Irregular NAT translation mapping detected!')
      soundFX.playSiren()
    } else if (pred === 'BENIGN') {
      setMood('shielded')
      setSpeech('ALL CLEAR! ✨ BENIGN traffic flow confirmed safe by XGBoost!')
      soundFX.playShield()
    }

    const timer = setTimeout(() => {
      setMood('happy')
    }, 6000)

    return () => clearTimeout(timer)
  }, [attackState])

  const nextTip = () => {
    soundFX.playLaser()
    const nextIdx = (tipIndex + 1) % MASCOT_TIPS.length
    setTipIndex(nextIdx)
    setSpeech(MASCOT_TIPS[nextIdx])
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="pointer-events-auto mb-3 max-w-xs p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-2 border-cyan-400/80 shadow-2xl relative text-xs"
          >
            {/* Comic Speech Pointer */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-900 border-r-2 border-b-2 border-cyan-400 rotate-45" />

            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                <span>SENTINEL-BOT AI</span>
              </div>
              <button
                onClick={() => setMinimized(true)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-slate-200 leading-relaxed font-sans">{speech}</p>

            <button
              onClick={nextTip}
              className="mt-3 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30"
            >
              <MessageSquare className="w-3 h-3" />
              Click for Next Tip &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Animated Mascot Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setMinimized(!minimized)
          soundFX.playLaser()
        }}
        className="pointer-events-auto relative p-3.5 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 border-2 border-white shadow-2xl flex items-center justify-center text-white glow-cyan"
      >
        {/* Animated Mood Face */}
        {mood === 'happy' && <Bot className="w-8 h-8 text-white animate-bounce" />}
        {mood === 'shocked' && <AlertTriangle className="w-8 h-8 text-yellow-300 animate-ping" />}
        {mood === 'shielded' && <Shield className="w-8 h-8 text-emerald-300 animate-pulse" />}

        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-400"></span>
        </span>
      </motion.button>
    </div>
  )
}
