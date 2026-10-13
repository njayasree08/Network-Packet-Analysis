import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import DeviceNode from './DeviceNode.jsx'
import { createConnection, deleteConnection } from '../services/api.js'
import { Trash2, Link as LinkIcon, Zap, Shield, Sparkles } from 'lucide-react'
import { soundFX } from './SoundEffects.js'

const nodeTypes = { device: DeviceNode }

const MALICIOUS_LABELS = new Set([
  'DoS',
  'DDoS',
  'PortScan',
  'NAT_Anomaly',
  'NAT Anomaly',
  'BruteForce',
  'WebAttack',
  'Infiltration',
])

function devicesToNodes(devices, alertMap) {
  return devices.map((d) => ({
    id: d.id,
    type: 'device',
    position: { x: d.pos_x || 100, y: d.pos_y || 100 },
    data: {
      ...d,
      alertStatus: alertMap[d.id]?.status,
      alertLabel: alertMap[d.id]?.label,
    },
  }))
}

function connectionsToEdges(connections, alertEdgeSet, alertTypeMap) {
  return connections.map((c) => {
    const key1 = `${c.source_id}-${c.destination_id}`
    const key2 = `${c.destination_id}-${c.source_id}`
    const isAlert = alertEdgeSet.has(key1) || alertEdgeSet.has(key2)
    const attackType = alertTypeMap[key1] || alertTypeMap[key2] || 'DoS'

    let strokeColor = '#0284c7'
    let animated = false
    let strokeWidth = 2.5

    if (isAlert) {
      animated = true
      strokeWidth = 4
      if (attackType === 'DoS') strokeColor = '#f43f5e' // Fiery Red
      else if (attackType === 'PortScan') strokeColor = '#f59e0b' // Electric Yellow
      else if (attackType === 'NAT_Anomaly') strokeColor = '#a855f7' // Glitch Purple
      else strokeColor = '#10b981' // Green
    }

    return {
      id: c.id,
      source: c.source_id,
      target: c.destination_id,
      label: isAlert ? `💥 ${attackType} Flow` : c.link_type || 'ethernet',
      labelStyle: { fill: isAlert ? '#f43f5e' : '#94a3b8', fontSize: 11, fontWeight: 700 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9, rx: 6, ry: 6 },
      style: {
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDasharray: isAlert ? '8 4' : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
      animated: animated,
      data: { dbId: c.id, link_type: c.link_type },
    }
  })
}

export default function NetworkCanvas({
  devices,
  connections,
  onNodeClick,
  onPositionChange,
  latestPrediction,
  onConnectionCreated,
  onConnectionDeleted,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [connecting, setConnecting] = useState(false)
  const [pendingSrc, setPendingSrc] = useState(null)
  const [comicPopup, setComicPopup] = useState(null)

  const alertMap = useRef({})
  const alertEdgeSet = useRef(new Set())
  const alertTypeMap = useRef({})

  // Apply prediction highlights & comic action popups
  useEffect(() => {
    if (!latestPrediction) return
    const pred = latestPrediction.prediction || latestPrediction
    if (!pred) return

    const srcId = pred.source_device_id || pred.source_device?.id
    const dstId = pred.destination_device_id || pred.destination_device?.id
    const predLabel = pred.prediction
    const isMal = MALICIOUS_LABELS.has(predLabel)
    const status = isMal ? 'danger' : 'normal'

    if (srcId && dstId) {
      const edgeKey = `${srcId}-${dstId}`
      alertEdgeSet.current.add(edgeKey)
      alertTypeMap.current[edgeKey] = predLabel

      // Play arcade audio FX
      if (isMal) soundFX.playBoom()
      else soundFX.playShield()

      // Show Comic Action Popup (POW! ZAP! BLOCKED!)
      let comicText = 'POW! 💥 DoS Deflected!'
      if (predLabel === 'PortScan') comicText = 'ZAP! ⚡ Port Probe Flagged!'
      if (predLabel === 'NAT_Anomaly') comicText = 'GLITCH! 🌀 NAT Anomaly!'
      if (predLabel === 'BENIGN') comicText = 'SHIELD UP! 🛡️ BENIGN Safe!'

      setComicPopup({
        text: comicText,
        isAttack: isMal,
      })

      setTimeout(() => setComicPopup(null), 4000)
    }

    alertMap.current = {
      ...alertMap.current,
      ...(srcId ? { [srcId]: { status, label: predLabel } } : {}),
      ...(dstId ? { [dstId]: { status, label: predLabel } } : {}),
    }

    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        data: {
          ...n.data,
          alertStatus: alertMap.current[n.id]?.status,
          alertLabel: alertMap.current[n.id]?.label,
        },
      }))
    )
    setEdges(connectionsToEdges(connections, alertEdgeSet.current, alertTypeMap.current))
  }, [latestPrediction])

  // Sync nodes from prop
  useEffect(() => {
    setNodes(devicesToNodes(devices, alertMap.current))
  }, [devices])

  // Sync edges from prop
  useEffect(() => {
    setEdges(connectionsToEdges(connections, alertEdgeSet.current, alertTypeMap.current))
  }, [connections])

  const onNodeDragStop = useCallback(
    (_, node) => {
      onPositionChange && onPositionChange(node.id, node.position.x, node.position.y)
    },
    [onPositionChange]
  )

  const onNodeClickCB = useCallback(
    (_, node) => {
      if (connecting) {
        if (!pendingSrc) {
          setPendingSrc(node.id)
        } else if (pendingSrc !== node.id) {
          createConnection({
            source_id: pendingSrc,
            destination_id: node.id,
            link_type: 'ethernet',
          })
            .then((conn) => {
              onConnectionCreated && onConnectionCreated(conn)
              setPendingSrc(null)
              setConnecting(false)
            })
            .catch(console.error)
        }
      } else {
        onNodeClick && onNodeClick(node.data)
      }
    },
    [connecting, pendingSrc, onNodeClick, onConnectionCreated]
  )

  const onConnect = useCallback(
    (params) => {
      createConnection({
        source_id: params.source,
        destination_id: params.target,
        source_interface: params.sourceHandle || 'eth0',
        destination_interface: params.targetHandle || 'eth0',
        link_type: 'ethernet',
      })
        .then((conn) => {
          onConnectionCreated && onConnectionCreated(conn)
        })
        .catch(console.error)
    },
    [onConnectionCreated]
  )

  const deleteSelectedEdge = useCallback(() => {
    const sel = edges.find((e) => e.selected)
    if (!sel) return
    const dbId = sel.data?.dbId || sel.id
    deleteConnection(dbId)
      .then(() => {
        onConnectionDeleted && onConnectionDeleted(dbId)
      })
      .catch(console.error)
  }, [edges, onConnectionDeleted])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Floating Comic Action Popup Overlay */}
      {comicPopup && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div
            className={`px-5 py-2.5 rounded-2xl font-black text-sm uppercase tracking-wider border-4 shadow-2xl ${
              comicPopup.isAttack
                ? 'bg-rose-600 text-white border-yellow-300 glow-red rotate-3'
                : 'bg-emerald-500 text-slate-950 border-white glow-emerald -rotate-2'
            }`}
          >
            {comicPopup.text}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClickCB}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          style: { stroke: '#0284c7', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0284c7' },
        }}
      >
        <Background color="#1e293b" gap={28} size={1.5} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const a = n.data?.alertStatus
            return a === 'danger' ? '#f43f5e' : a === 'warning' ? '#f59e0b' : '#0284c7'
          }}
          maskColor="rgba(8, 12, 20, 0.75)"
        />

        {/* Toolbar Panel */}
        <Panel position="top-right">
          <div className="flex gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                setConnecting((c) => !c)
                setPendingSrc(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                connecting
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-400'
              }`}
            >
              <LinkIcon size={13} />
              {connecting ? (pendingSrc ? 'Click Destination...' : 'Click Source...') : 'Connect Link'}
            </button>
            <button
              onClick={deleteSelectedEdge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-slate-800 text-slate-300 border-slate-700 hover:text-rose-400 hover:border-rose-500 transition-all"
            >
              <Trash2 size={13} /> Delete Link
            </button>
          </div>
        </Panel>

        {/* Legend Panel */}
        <Panel position="bottom-left">
          <div className="flex gap-3 text-xs bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 shadow-xl text-slate-200 font-mono">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> BENIGN
            </span>
            <span className="flex items-center gap-1.5 font-bold text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" /> DoS Fireball 💥
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse" /> Port Scan ⚡
            </span>
            <span className="flex items-center gap-1.5 font-bold text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block animate-pulse" /> NAT Anomaly 🌀
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
