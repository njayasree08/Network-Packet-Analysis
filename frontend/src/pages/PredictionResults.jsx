import React, { useEffect, useState } from 'react'
import { getPredictions } from '../services/api.js'
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const LABEL_CFG = {
  BENIGN:     { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  Icon: ShieldCheck  },
  DoS:        { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    Icon: ShieldAlert  },
  DDoS:       { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    Icon: ShieldAlert  },
  PortScan:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', Icon: AlertTriangle },
  BruteForce: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', Icon: AlertTriangle },
  WebAttack:  { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', Icon: ShieldAlert  },
}

function cfg(label) {
  return LABEL_CFG[label] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', Icon: ShieldAlert }
}

function PredictionRow({ pred }) {
  const [expanded, setExpanded] = useState(false)
  const c = cfg(pred.prediction)
  const { Icon } = c

  return (
    <>
      <tr
        className="border-b border-[#1f2937] hover:bg-[#1f2937]/40 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-3 px-4">
          <span className="font-mono text-xs text-gray-400">{pred.flow_id?.slice(0, 16)}</span>
        </td>
        <td className="py-3 px-4">
          <div className="text-sm text-white">{pred.source}</div>
          <div className="text-xs font-mono text-gray-500">{pred.source_ip}:{pred.source_port}</div>
        </td>
        <td className="py-3 px-4">
          <div className="text-sm text-white">{pred.destination}</div>
          <div className="text-xs font-mono text-gray-500">{pred.destination_ip}:{pred.destination_port}</div>
        </td>
        <td className="py-3 px-4">
          <span className="font-mono text-xs text-cyan-300">{pred.protocol}</span>
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${c.bg} ${c.color} ${c.border}`}>
            <Icon size={11} /> {pred.prediction}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-[#1f2937] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${pred.prediction === 'BENIGN' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${pred.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-300">{(pred.confidence * 100).toFixed(1)}%</span>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-gray-500">
          {pred.created_at ? new Date(pred.created_at).toLocaleString() : '—'}
        </td>
        <td className="py-3 px-4 text-gray-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && (
        <tr className="bg-[#0d1117]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-gray-500 mb-2 font-semibold">Class Probabilities</div>
                {Object.entries(pred.probabilities || {}).sort(([,a],[,b])=>b-a).map(([cls, prob]) => {
                  const cc = cfg(cls)
                  return (
                    <div key={cls} className="flex justify-between items-center mb-1">
                      <span className={cc.color}>{cls}</span>
                      <span className="font-mono text-gray-300">{(prob*100).toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
              <div>
                <div className="text-gray-500 mb-2 font-semibold">Flow Info</div>
                {[
                  ['Scenario', pred.traffic_scenario],
                  ['Src Port', pred.source_port],
                  ['Dst Port', pred.destination_port],
                  ['Protocol', pred.protocol],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between mb-1">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function PredictionResults() {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    try { setPredictions(await getPredictions()) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all'
    ? predictions
    : filter === 'malicious'
    ? predictions.filter(p => p.prediction !== 'BENIGN')
    : predictions.filter(p => p.prediction === filter)

  const counts = {
    all:       predictions.length,
    malicious: predictions.filter(p => p.prediction !== 'BENIGN').length,
    BENIGN:    predictions.filter(p => p.prediction === 'BENIGN').length,
    DoS:       predictions.filter(p => p.prediction === 'DoS').length,
    PortScan:  predictions.filter(p => p.prediction === 'PortScan').length,
    BruteForce:predictions.filter(p => p.prediction === 'BruteForce').length,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">ML Prediction History</h1>
          <p className="text-xs text-gray-500 mt-0.5">{predictions.length} total predictions from trained model</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1f2937] rounded-lg text-gray-400 hover:text-white transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'all',       label: 'All',         color: 'text-gray-300' },
          { key: 'malicious', label: 'Malicious',   color: 'text-red-400'  },
          { key: 'BENIGN',    label: 'Benign',       color: 'text-green-400'},
          { key: 'DoS',       label: 'DoS',          color: 'text-red-400'  },
          { key: 'PortScan',  label: 'Port Scan',    color: 'text-yellow-400'},
          { key: 'BruteForce',label: 'Brute Force',  color: 'text-purple-400'},
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === key
                ? `bg-cyan-500/10 text-cyan-400 border-cyan-500/20`
                : `border-[#1f2937] ${color} hover:border-[#374151]`
            }`}
          >
            {label}
            <span className="ml-1.5 text-gray-600">({counts[key] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-500 text-sm">Loading predictions…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            No predictions found. Go to the Network Simulator, generate traffic, and run a prediction.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#1f2937]">
                <tr>
                  {['Flow ID','Source','Destination','Protocol','Prediction','Confidence','Time',''].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(pred => <PredictionRow key={pred.id} pred={pred} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
