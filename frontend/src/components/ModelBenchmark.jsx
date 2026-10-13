import React from 'react'
import { motion } from 'framer-motion'
import { Award, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react'

export default function ModelBenchmark({ benchmarks }) {
  if (!benchmarks || !benchmarks.models) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400 text-sm">
        No model benchmarks available. Run model training first.
      </div>
    )
  }

  const models = benchmarks.models

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Classifier Benchmark Comparison</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating XGBoost versus scikit-learn baseline algorithms under class imbalance
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono">
          Class-Weighted Evaluation
        </span>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {models.map((m) => (
          <div
            key={m.name}
            className={`p-5 rounded-xl border relative transition-all ${
              m.is_primary
                ? 'bg-cyan-950/30 border-cyan-500/50 glow-cyan ring-1 ring-cyan-500/30'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            {m.is_primary && (
              <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow">
                CHOSEN MODEL
              </span>
            )}

            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-lg ${m.is_primary ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{m.name}</h4>
                <p className="text-[11px] text-slate-400">{m.is_primary ? 'Tabular Gradient Boosting' : 'Baseline Classifier'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Accuracy:</span>
                <span className="font-bold text-white">{(m.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Precision (Weighted):</span>
                <span className="font-bold text-cyan-300">{(m.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recall (Weighted):</span>
                <span className="font-bold text-sky-300">{(m.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">F1 Score (Weighted):</span>
                <span className="font-bold text-emerald-400">{(m.f1_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Why XGBoost is the Optimal Choice:</span> XGBoost handles heterogeneous tabular features (IAT, byte rates, flag counts) without requiring strict normalization, and exhibits superior robustness against non-linear interactions and minority class skew compared to standard baselines.
        </div>
      </div>
    </div>
  )
}
