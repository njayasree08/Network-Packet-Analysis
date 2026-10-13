import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Save, RefreshCw, Zap, Settings } from 'lucide-react'
import DevicePalette from '../components/DevicePalette.jsx'
import NetworkCanvas from '../components/NetworkCanvas.jsx'
import DeviceConfig from '../components/DeviceConfig.jsx'
import TrafficGenerator from '../components/TrafficGenerator.jsx'
import PredictionPanel from '../components/PredictionPanel.jsx'
import {
  getDevices, createDevice, updateDevice,
  getConnections, saveTopologySnapshot,
} from '../services/api.js'

let deviceCounter = { pc: 0, laptop: 0, server: 0, router: 0, switch: 0, firewall: 0 }

const DEFAULT_IPS = {
  pc:       '192.168.1.',
  laptop:   '192.168.1.',
  server:   '10.0.0.',
  router:   '10.0.1.',
  switch:   '',
  firewall: '172.16.0.',
}

export default function NetworkSimulator() {
  const [devices, setDevices] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showTraffic, setShowTraffic] = useState(false)
  const [latestResult, setLatestResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [topoName, setTopoName] = useState('My Topology')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [devs, conns] = await Promise.all([getDevices(), getConnections()])
    setDevices(devs)
    setConnections(conns)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleAddDevice = async (type) => {
    deviceCounter[type] = (deviceCounter[type] || 0) + 1
    const num = deviceCounter[type]
    const name = `${type.charAt(0).toUpperCase() + type.slice(1)}${num}`
    const suffix = num + (type === 'server' ? 10 : 0)
    const ip = DEFAULT_IPS[type] ? `${DEFAULT_IPS[type]}${suffix}` : ''

    // Spread devices in a grid
    const col = devices.length % 5
    const row = Math.floor(devices.length / 5)
    const pos_x = 80 + col * 160
    const pos_y = 80 + row * 160

    const dev = await createDevice({
      name, device_type: type, ip_address: ip,
      pos_x, pos_y,
      interfaces: type === 'router' ? ['fa0/0','fa0/1','fa0/2'] :
                  type === 'switch' ? ['fa0/1','fa0/2','fa0/3','fa0/4'] :
                  type === 'firewall' ? ['eth0-outside','eth1-inside'] : ['eth0'],
      services: type === 'server' ? ['HTTP','SSH'] : [],
      ports:    type === 'server' ? [80, 22] : [],
    })
    setDevices(prev => [...prev, dev])
  }

  const handleNodeClick = (deviceData) => setSelectedDevice(deviceData)

  const handleDeviceUpdated = (updated) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d))
    setSelectedDevice(updated)
  }

  const handleDeviceDeleted = (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    setConnections(prev => prev.filter(c => c.source_id !== id && c.destination_id !== id))
  }

  const handlePositionChange = useCallback(async (id, x, y) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, pos_x: x, pos_y: y } : d))
    try { await updateDevice(id, { pos_x: x, pos_y: y }) } catch {}
  }, [])

  const handleConnectionCreated = (conn) => {
    setConnections(prev => {
      const exists = prev.find(c => c.id === conn.id)
      return exists ? prev : [...prev, conn]
    })
  }

  const handleConnectionDeleted = (id) => {
    setConnections(prev => prev.filter(c => c.id !== id))
  }

  const handleSaveTopology = async () => {
    setSaving(true)
    try {
      await saveTopologySnapshot({
        name: topoName,
        devices: devices.map(d => ({
          id: d.id, name: d.name, device_type: d.device_type,
          ip_address: d.ip_address, mac_address: d.mac_address,
          subnet_mask: d.subnet_mask, gateway: d.gateway,
          services: d.services, ports: d.ports, interfaces: d.interfaces,
          pos_x: d.pos_x, pos_y: d.pos_y, extra_config: d.extra_config,
        })),
        connections: connections.map(c => ({
          id: c.id, source_id: c.source_id, destination_id: c.destination_id,
          source_interface: c.source_interface, destination_interface: c.destination_interface,
          link_type: c.link_type, bandwidth: c.bandwidth, status: c.status,
        })),
      })
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handlePredictionResult = (result) => {
    setLatestResult(result)
    setShowTraffic(false)
    // Refresh connections to re-apply any DB changes
    getConnections().then(setConnections)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0e1a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111827] border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-sm">Network Simulator</h1>
          <span className="text-xs text-gray-500">{devices.length} devices · {connections.length} links</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={topoName}
            onChange={e => setTopoName(e.target.value)}
            className="bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-1.5 text-xs text-white w-40 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleSaveTopology}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1f2937] rounded-lg text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all"
          >
            <Save size={12} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1f2937] rounded-lg text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setShowTraffic(t => !t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
              showTraffic
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                : 'border-[#1f2937] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30'
            }`}
          >
            <Zap size={12} /> Traffic & Predict
          </button>
        </div>
      </div>

      {/* Device palette */}
      <DevicePalette onAddDevice={handleAddDevice} />

      {/* Canvas + side panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Loading topology…
            </div>
          ) : (
            <NetworkCanvas
              devices={devices}
              connections={connections}
              onNodeClick={handleNodeClick}
              onPositionChange={handlePositionChange}
              latestPrediction={latestResult}
              onConnectionCreated={handleConnectionCreated}
              onConnectionDeleted={handleConnectionDeleted}
            />
          )}

          {/* Empty state */}
          {!loading && devices.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-gray-600 text-center">
                <div className="text-4xl mb-3">🌐</div>
                <div className="font-semibold text-gray-500">Start Building Your Topology</div>
                <div className="text-xs text-gray-600 mt-1">Click a device type above to add it to the canvas</div>
              </div>
            </div>
          )}
        </div>

        {/* Right panels */}
        <div className="w-[440px] overflow-y-auto bg-[#0a0e1a] border-l border-[#1f2937] p-4 space-y-4">
          {/* Traffic Generator */}
          {showTraffic && (
            <TrafficGenerator
              devices={devices}
              connections={connections}
              onResult={handlePredictionResult}
              onClose={() => setShowTraffic(false)}
            />
          )}

          {/* Prediction result */}
          {latestResult && (
            <PredictionPanel
              result={latestResult}
              onClose={() => setLatestResult(null)}
            />
          )}

          {/* Instructions when nothing shown */}
          {!showTraffic && !latestResult && (
            <div className="text-center py-10">
              <div className="text-gray-600 text-xs space-y-2">
                <div className="text-3xl mb-3">🛡️</div>
                <div className="font-semibold text-gray-500">Network Topology Workspace</div>
                <div>1. Add devices from the palette above</div>
                <div>2. Connect devices by dragging handles or using Connect mode</div>
                <div>3. Click a device to configure IP / settings</div>
                <div>4. Click "Traffic & Predict" to run ML classification</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Device config modal */}
      {selectedDevice && (
        <DeviceConfig
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdated={handleDeviceUpdated}
          onDeleted={handleDeviceDeleted}
        />
      )}
    </div>
  )
}
