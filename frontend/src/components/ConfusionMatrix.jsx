import React from 'react'
import { motion } from 'framer-motion'
import { Grid, HelpCircle, CheckCircle, AlertOctagon } from 'lucide-react'

export default function ConfusionMatrix({ matrixData }) {
  if (!matrixData || !matrixData.confusion_matrix || !matrixData.classes) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400 text-sm">
        No Confusion Matrix available. Please run model training first.
      </div>
    )
  }

  const { classes, confusion_matrix, per_class } = matrixData

  // Calculate cell colors based on value vs row total
  const getCellBg = (val, rowSum, isDiagonal) => {
    if (rowSum === 0) return 'bg-slate-900/40 text-slate-500'
    const pct = val / rowSum
    if (isDiagonal) {
      if (pct > 0.9) return 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 font-bold'
      if (pct > 0.7) return 'bg-emerald-600/20 border-emerald-600/40 text-emerald-400 font-semibold'
      return 'bg-emerald-700/15 border-emerald-700/30 text-emerald-400'
    } else {
      if (val === 0) return 'bg-slate-900/30 text-slate-600'
      if (pct > 0.1) return 'bg-rose-500/35 border-rose-500/60 text-rose-200 font-bold glow-red'
      return 'bg-amber-500/20 border-amber-500/40 text-amber-300'
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">XGBoost Confusion Matrix Heatmap</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates true positive rates & inter-class misclassification patterns across imbalanced traffic
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60 inline-block" />
            <span className="text-slate-300">Correctly Classified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60 inline-block" />
            <span className="text-slate-300">Misclassified Attack</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-xs font-semibold text-slate-500 text-left bg-slate-900/80 rounded-tl-xl border-b border-slate-800">
                Actual \ Predicted
              </th>
              {classes.map((cls) => (
                <th
                  key={cls}
                  className="p-3 text-xs font-bold text-cyan-300 bg-slate-900/80 border-b border-slate-800"
                >
                  {cls}
                </th>
              ))}
              <th className="p-3 text-xs font-bold text-slate-400 bg-slate-900/80 rounded-tr-xl border-b border-slate-800">
                F1 Score
              </th>
            </tr>
          </thead>
          <tbody>
            {confusion_matrix.map((row, rIdx) => {
              const actualClass = classes[rIdx]
              const rowSum = row.reduce((a, b) => a + b, 0)
              const f1 = per_class?.[actualClass]?.f1_score ?? 0

              return (
                <tr key={actualClass} className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 text-xs font-bold text-white text-left bg-slate-900/40">
                    {actualClass}
                    <span className="block text-[10px] font-normal text-slate-500">n = {rowSum}</span>
                  </td>

                  {row.map((val, cIdx) => {
                    const isDiag = rIdx === cIdx
                    const cellStyle = getCellBg(val, rowSum, isDiag)

                    return (
                      <td key={cIdx} className="p-2">
                        <div className={`p-3 rounded-lg border text-sm transition-all ${cellStyle}`}>
                          <div>{val}</div>
                          {rowSum > 0 && (
                            <div className="text-[10px] opacity-75">
                              {((val / rowSum) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}

                  <td className="p-3 text-xs font-mono font-bold text-cyan-400 bg-slate-900/40">
                    {(f1 * 100).toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Explanatory callout */}
      <div className="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Why Confusion Matrix matters for IDS:</span> Raw accuracy can mislead when attacks represent &lt;15% of traffic. The matrix proves XGBoost accurately resolves subtle boundaries between high-volume <span className="text-rose-400 font-semibold">DoS bursts</span>, multi-port <span className="text-amber-400 font-semibold">Port Scans</span>, and asymmetric <span className="text-purple-400 font-semibold">NAT Anomalies</span>.
        </div>
      </div>
    </div>
  )
}
