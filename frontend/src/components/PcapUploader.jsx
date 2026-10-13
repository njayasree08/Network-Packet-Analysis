import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  AlertOctagon,
  CheckCircle,
  Loader2,
  ShieldAlert,
  List,
  Clock,
  HardDrive,
} from 'lucide-react'
import { uploadPcap } from '../services/api'

export default function PcapUploader() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pcapResult, setPcapResult] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setPcapResult(null)

    try {
      const res = await uploadPcap(file)
      setPcapResult(res)
    } catch (err) {
      console.error('PCAP upload failed:', err)
      setError(err.response?.data?.detail || 'Failed to process PCAP file on backend server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="glass-panel p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition-all text-center relative overflow-hidden"
      >
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            Upload PCAP / PCAPNG Packet Capture File
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Drag & drop raw packet traces (.pcap, .pcapng) to extract 5-tuple flows and classify intrusions automatically
          </p>

          <input
            type="file"
            id="pcapInput"
            accept=".pcap,.pcapng,.cap"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label
              htmlFor="pcapInput"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer border border-slate-700 transition-colors"
            >
              Choose PCAP File
            </label>

            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing Flows & Classifying...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Process & Classify PCAP
                  </>
                )}
              </button>
            )}
          </div>

          {file && (
            <p className="text-xs text-cyan-300 font-mono mt-3">
              Selected: <span className="font-semibold text-white">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PCAP Processed Results */}
      <AnimatePresence>
        {pcapResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Total Flows Extracted</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{pcapResult.total_flows}</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <List className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-rose-300">Malicious Flows Flagged</p>
                  <p className="text-2xl font-extrabold text-rose-400 mt-1">{pcapResult.malicious_flows}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-300">Benign Flows</p>
                  <p className="text-2xl font-extrabold text-emerald-400 mt-1">{pcapResult.benign_flows}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Extracted Flows Table */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Extracted 5-Tuple Flow Classifications</h4>
                <span className="text-xs text-slate-400 font-mono">{pcapResult.filename}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Flow ID</th>
                      <th className="p-3">5-Tuple (Src &rarr; Dst)</th>
                      <th className="p-3">Protocol</th>
                      <th className="p-3">Packets</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">XGBoost Prediction</th>
                      <th className="p-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {pcapResult.flows.map((flow) => {
                      const isAttack = flow.prediction !== 'BENIGN'
                      return (
                        <tr key={flow.flow_id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-mono text-cyan-300 font-semibold">{flow.flow_id}</td>
                          <td className="p-3 font-mono text-slate-300">
                            {flow.source_ip}:{flow.source_port} &rarr; {flow.destination_ip}:{flow.destination_port}
                          </td>
                          <td className="p-3 font-semibold text-slate-400">{flow.protocol}</td>
                          <td className="p-3 text-slate-300">{flow.packet_count} pkts</td>
                          <td className="p-3 text-slate-400 font-mono">{flow.flow_duration_ms} ms</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              isAttack
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                            }`}>
                              {isAttack && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                              {flow.prediction}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            {(flow.confidence * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
