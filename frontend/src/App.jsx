import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import SentinelBot from './components/SentinelBot.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NetworkSimulator from './pages/NetworkSimulator.jsx'
import ModelAnalytics from './pages/ModelAnalytics.jsx'
import PcapAnalysis from './pages/PcapAnalysis.jsx'
import PredictionResults from './pages/PredictionResults.jsx'
import { simulateAttack } from './services/api'

function AppContent() {
  const navigate = useNavigate()
  const [latestAttack, setLatestAttack] = useState(null)

  const handleQuickAttack = async () => {
    try {
      const res = await simulateAttack('dos')
      setLatestAttack(res)
      navigate('/')
    } catch (err) {
      console.error('Quick attack trigger failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans relative">
      <Navbar onQuickAttack={handleQuickAttack} />

      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard onAttackComplete={setLatestAttack} />} />
          <Route path="/simulator" element={<NetworkSimulator />} />
          <Route path="/analytics" element={<ModelAnalytics />} />
          <Route path="/pcap" element={<PcapAnalysis />} />
          <Route path="/history" element={<PredictionResults />} />
          <Route path="/predictions" element={<PredictionResults />} />
        </Routes>
      </main>

      {/* Floating Interactive Sentinel-Bot Mascot */}
      <SentinelBot attackState={latestAttack} />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-cyan-400">PacketSentinel Cartoon Edition</span> &mdash; Flow-Based Intrusion Detection System
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            CICIDS Feature Engine &bull; XGBoost ML &bull; Candy Neon Visuals &bull; FastAPI + React 18
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
