import React, { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import { updateDevice, deleteDevice } from '../services/api.js'

const DEVICE_TYPE_DEFAULTS = {
  pc:       { interfaces: ['eth0'], services: [], ports: [] },
  laptop:   { interfaces: ['wlan0', 'eth0'], services: [], ports: [] },
  server:   { interfaces: ['eth0', 'eth1'], services: ['HTTP', 'SSH'], ports: [80, 22, 443] },
  router:   { interfaces: ['fa0/0', 'fa0/1', 'fa0/2'], services: ['OSPF', 'RIP'], ports: [] },
  switch:   { interfaces: ['fa0/1','fa0/2','fa0/3','fa0/4','fa0/5','fa0/6'], services: [], ports: [] },
  firewall: { interfaces: ['eth0-outside', 'eth1-inside', 'eth2-dmz'], services: ['Firewall', 'NAT'], ports: [] },
}

export default function DeviceConfig({ device, onClose, onUpdated, onDeleted }) {
  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    mac_address: '',
    subnet_mask: '255.255.255.0',
    gateway: '',
    interfaces: ['eth0'],
    services: [],
    ports: [],
    extra_config: {},
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (device) {
      setForm({
        name:        device.name || '',
        ip_address:  device.ip_address || '',
        mac_address: device.mac_address || '',
        subnet_mask: device.subnet_mask || '255.255.255.0',
        gateway:     device.gateway || '',
        interfaces:  device.interfaces || DEVICE_TYPE_DEFAULTS[device.device_type]?.interfaces || ['eth0'],
        services:    device.services || [],
        ports:       device.ports || [],
        extra_config: device.extra_config || {},
      })
    }
  }, [device])

  if (!device) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateDevice(device.id, form)
      setMsg('Saved!')
      onUpdated && onUpdated(updated)
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg('Error saving')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete device "${device.name}"?`)) return
    try {
      await deleteDevice(device.id)
      onDeleted && onDeleted(device.id)
      onClose()
    } catch (e) {
      setMsg('Error deleting')
    }
  }

  const Input = ({ label, value, onChange, placeholder, mono }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#0d1117] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl w-[420px] max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2937]">
          <div>
            <div className="text-white font-semibold">{device.name}</div>
            <div className="text-xs text-gray-500 capitalize">{device.device_type} Configuration</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          <Input label="Device Name" value={form.name} onChange={v => set('name', v)} />
          <Input label="IP Address" value={form.ip_address} onChange={v => set('ip_address', v)} placeholder="192.168.1.1" mono />
          <Input label="Subnet Mask" value={form.subnet_mask} onChange={v => set('subnet_mask', v)} placeholder="255.255.255.0" mono />
          <Input label="Default Gateway" value={form.gateway} onChange={v => set('gateway', v)} placeholder="192.168.1.254" mono />
          <Input label="MAC Address" value={form.mac_address} onChange={v => set('mac_address', v)} mono />

          {/* Interfaces */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Interfaces</label>
            <div className="flex flex-wrap gap-1">
              {form.interfaces.map((iface, i) => (
                <span key={i} className="text-xs bg-[#1f2937] text-cyan-300 font-mono px-2 py-1 rounded">
                  {iface}
                </span>
              ))}
            </div>
          </div>

          {/* Services */}
          {form.services.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Services</label>
              <div className="flex flex-wrap gap-1">
                {form.services.map((s, i) => (
                  <span key={i} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ports */}
          {form.ports.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Open Ports</label>
              <div className="flex flex-wrap gap-1">
                {form.ports.map((p, i) => (
                  <span key={i} className="text-xs bg-yellow-500/10 text-yellow-400 font-mono border border-yellow-500/20 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Device ID */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Device ID</label>
            <div className="text-xs font-mono text-gray-600 bg-[#0d1117] rounded px-3 py-2 break-all">{device.id}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1f2937]">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className="flex items-center gap-3">
            {msg && <span className="text-xs text-cyan-400">{msg}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
