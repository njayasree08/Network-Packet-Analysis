import React from 'react'
import PcapUploader from '../components/PcapUploader.jsx'
import { FileSearch, ShieldCheck, Cpu } from 'lucide-react'

export default function PcapAnalysis() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FileSearch className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              PCAP Packet Flow Inspector & Extractor
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Convert raw packet captures (.pcap / .pcapng) into 5-tuple statistical flows and run XGBoost intrusion classification
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Scapy + XGBoost Parser
        </div>
      </div>

      {/* PCAP Uploader Component */}
      <PcapUploader />
    </div>
  )
}
