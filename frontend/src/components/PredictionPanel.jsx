import React from 'react'
import { ShieldAlert, ShieldCheck, AlertTriangle, X, TrendingUp } from 'lucide-react'

const LABEL_CONFIG = {
  'BENIGN':     { color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  Icon: ShieldCheck  },
  'DoS':        { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    Icon: ShieldAlert  },
  'DDoS':       { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    Icon: ShieldAlert  },
  'PortScan':   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', Icon: AlertTriangle },
  'BruteForce': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', Icon: AlertTriangle },
  'WebAttack':  { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', Icon: ShieldAlert  },
}

function getConfig(label) {
  return LABEL_CONFIG[label] || { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', Icon: ShieldAlert }
}

export default function PredictionPanel({ result, onClose }) {
  if (!result) return null
  const { flow, prediction } = result
  const cfg = getConfig(prediction.prediction)
  const { Icon } = cfg
  const isMalicious = prediction.prediction !== 'BENIGN'

  const topFeatures = Object.entries(prediction.features_used || {})
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 8)

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto fade-in">
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${cfg.border} ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <Icon size={20} className={cfg.color} />
          <div>
            <div className={`font-bold text-base ${cfg.color}`}>{prediction.prediction}</div>
            <div className="text-xs text-gray-400">
              Confidence: <span className="font-semibold text-white">{(prediction.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-2">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Flow summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Flow ID',     prediction.flow_id],
            ['Protocol',    prediction.protocol],
            ['Source',      prediction.source],
            ['Destination', prediction.destination],
            ['Src IP',      prediction.source_ip],
            ['Dst IP',      prediction.destination_ip],
            ['Src Port',    prediction.source_port],
            ['Dst Port',    prediction.destination_port],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#0d1117] rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-xs font-mono text-white mt-0.5 truncate">{value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Prediction Confidence</span>
            <span className={cfg.color}>{(prediction.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isMalicious ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${prediction.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Class probabilities */}
        {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <TrendingUp size={11} /> Class Probabilities
            </div>
            <div className="space-y-1.5">
              {Object.entries(prediction.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([cls, prob]) => {
                  const c = getConfig(cls)
                  return (
                    <div key={cls}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={c.color}>{cls}</span>
                        <span className="text-gray-400">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cls === 'BENIGN' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Device path */}
        {prediction.device_path && prediction.device_path.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Highlighted Network Path</div>
            <div className="flex items-center gap-1 flex-wrap">
              {prediction.device_path.map((id, i) => (
                <React.Fragment key={id}>
                  <span className={`text-xs px-2 py-1 rounded font-mono ${isMalicious ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                    {id.slice(0, 8)}
                  </span>
                  {i < prediction.device_path.length - 1 && (
                    <span className="text-gray-600 text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Top features */}
        {topFeatures.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-2">Key Flow Features</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {topFeatures.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs bg-[#0d1117] rounded px-2 py-1">
                  <span className="text-gray-400 font-mono truncate mr-2">{k}</span>
                  <span className="text-white font-mono whitespace-nowrap">
                    {typeof v === 'number' ? v.toFixed(2) : v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model info */}
        <div className="text-xs text-gray-600 text-right">
          Model: {prediction.model_used || 'unknown'}
        </div>
      </div>
    </div>
  )
}
