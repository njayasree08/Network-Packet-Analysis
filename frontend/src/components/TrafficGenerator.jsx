import React, { useMemo, useState } from 'react'
import { Play, Zap, X } from 'lucide-react'
import { generateTraffic, runPrediction } from '../services/api.js'
import { buildAdjacency, isReachable, reachableDeviceIds } from '../utils/topologyGraph.js'

const SCENARIOS = [
  { value: 'normal',     label: 'Normal Traffic',  color: 'text-green-400',  desc: 'Standard benign network flow' },
  { value: 'dos',        label: 'DoS Attack',       color: 'text-red-400',    desc: 'Denial-of-Service flood pattern' },
  { value: 'port_scan',  label: 'Port Scan',        color: 'text-yellow-400', desc: 'Reconnaissance scanning pattern' },
  { value: 'bruteforce', label: 'Brute Force',      color: 'text-purple-400', desc: 'Credential brute-force pattern' },
]

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS']

const COMMON_PORTS = [
  { port: 80,   label: '80 (HTTP)'   },
  { port: 443,  label: '443 (HTTPS)' },
  { port: 22,   label: '22 (SSH)'    },
  { port: 21,   label: '21 (FTP)'    },
  { port: 3389, label: '3389 (RDP)'  },
  { port: 8080, label: '8080 (Alt)'  },
]

export default function TrafficGenerator({ devices, connections = [], onResult, onClose }) {
  const [form, setForm] = useState({
    source_device_id: '',
    destination_device_id: '',
    protocol: 'TCP',
    source_port: 5000,
    destination_port: 80,
    packet_count: 100,
    packet_size: 512,
    traffic_scenario: 'normal',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const graph = useMemo(() => buildAdjacency(connections), [connections])

  const reachableDestinations = useMemo(() => {
    if (!form.source_device_id) return []
    const ids = reachableDeviceIds(graph, form.source_device_id)
    return devices.filter(d => ids.includes(d.id))
  }, [devices, form.source_device_id, graph])

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'source_device_id') {
        const stillValid = next.destination_device_id
          && isReachable(graph, v, next.destination_device_id)
        if (!stillValid) next.destination_device_id = ''
      }
      return next
    })
  }

  const handleRun = async () => {
    if (!form.source_device_id || !form.destination_device_id) {
      setError('Select source and destination devices.')
      return
    }
    if (form.source_device_id === form.destination_device_id) {
      setError('Source and destination must differ.')
      return
    }
    if (!isReachable(graph, form.source_device_id, form.destination_device_id)) {
      setError('Devices must be interconnected by links in the topology (reachable path required).')
      return
    }
    setError('')
    setLoading(true)
    try {
      // Step 1: Generate flow + features
      const flow = await generateTraffic(form)

      // Step 2: Run ML prediction on the generated flow
      const prediction = await runPrediction({
        flow_id: flow.flow_id,
        source_device_id: form.source_device_id,
        destination_device_id: form.destination_device_id,
        source_ip: flow.source_ip,
        destination_ip: flow.destination_ip,
        source_port: form.source_port,
        destination_port: form.destination_port,
        protocol: form.protocol,
        traffic_scenario: form.traffic_scenario,
        features: flow.features,
      })

      onResult && onResult({ flow, prediction })
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Error running prediction')
    }
    setLoading(false)
  }

  const Label = ({ children }) => (
    <label className="block text-xs text-gray-500 mb-1">{children}</label>
  )

  const Select = ({ value, onChange, children, className = '' }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 ${className}`}
    >
      {children}
    </select>
  )

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-2xl w-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2937]">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <span className="text-white font-semibold text-sm">Traffic Generator & ML Predict</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Scenario */}
        <div>
          <Label>Traffic Scenario</Label>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                onClick={() => set('traffic_scenario', s.value)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                  form.traffic_scenario === s.value
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-[#1f2937] hover:border-[#374151]'
                }`}
              >
                <div className={`font-semibold ${s.color}`}>{s.label}</div>
                <div className="text-gray-600 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Source / Destination */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Source Device</Label>
            <Select value={form.source_device_id} onChange={v => set('source_device_id', v)}>
              <option value="">Select…</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name} {d.ip_address ? `(${d.ip_address})` : ''}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Destination Device</Label>
            <Select value={form.destination_device_id} onChange={v => set('destination_device_id', v)}>
              <option value="">Select…</option>
              {(form.source_device_id ? reachableDestinations : devices).map(d => (
                <option key={d.id} value={d.id}>{d.name} {d.ip_address ? `(${d.ip_address})` : ''}</option>
              ))}
            </Select>
          </div>
        </div>
        {form.source_device_id && reachableDestinations.length === 0 && (
          <p className="text-xs text-amber-400/90">
            No interconnected destination for this source — connect devices with links on the canvas.
          </p>
        )}

        {/* Protocol */}
        <div>
          <Label>Protocol</Label>
          <div className="flex gap-2 flex-wrap">
            {PROTOCOLS.map(p => (
              <button
                key={p}
                onClick={() => set('protocol', p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  form.protocol === p
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-[#1f2937] text-gray-400 hover:border-[#374151]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Ports */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Source Port</Label>
            <input
              type="number"
              value={form.source_port}
              onChange={e => set('source_port', parseInt(e.target.value) || 0)}
              className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <Label>Destination Port</Label>
            <Select value={form.destination_port} onChange={v => set('destination_port', parseInt(v))}>
              {COMMON_PORTS.map(p => (
                <option key={p.port} value={p.port}>{p.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Packet settings */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Packet Count</Label>
            <input
              type="number"
              value={form.packet_count}
              onChange={e => set('packet_count', parseInt(e.target.value) || 1)}
              className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <Label>Packet Size (bytes)</Label>
            <input
              type="number"
              value={form.packet_size}
              onChange={e => set('packet_size', parseInt(e.target.value) || 64)}
              className="w-full bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
        >
          <Play size={14} />
          {loading ? 'Generating & Predicting…' : 'Generate Traffic & Predict'}
        </button>
      </div>
    </div>
  )
}
