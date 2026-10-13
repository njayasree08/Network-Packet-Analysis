import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Devices ──────────────────────────────────────────────────────────────────
export const getDevices = (topologyId) =>
  api.get('/devices', { params: topologyId ? { topology_id: topologyId } : {} }).then(r => r.data)

export const createDevice = (data) =>
  api.post('/devices', data).then(r => r.data)

export const updateDevice = (id, data) =>
  api.put(`/devices/${id}`, data).then(r => r.data)

export const deleteDevice = (id) =>
  api.delete(`/devices/${id}`).then(r => r.data)

// ── Connections ───────────────────────────────────────────────────────────────
export const getConnections = (topologyId) =>
  api.get('/connections', { params: topologyId ? { topology_id: topologyId } : {} }).then(r => r.data)

export const createConnection = (data) =>
  api.post('/connections', data).then(r => r.data)

export const updateConnection = (id, data) =>
  api.put(`/connections/${id}`, data).then(r => r.data)

export const deleteConnection = (id) =>
  api.delete(`/connections/${id}`).then(r => r.data)

// ── Topology ──────────────────────────────────────────────────────────────────
export const getTopologies = () =>
  api.get('/topology').then(r => r.data)

export const getTopology = (id) =>
  api.get(`/topology/${id}`).then(r => r.data)

export const createTopology = (data) =>
  api.post('/topology', data).then(r => r.data)

export const saveTopologySnapshot = (data) =>
  api.post('/topology/save', data).then(r => r.data)

export const deleteTopology = (id) =>
  api.delete(`/topology/${id}`).then(r => r.data)

// ── Traffic & Attack Simulation ────────────────────────────────────────────────
export const generateTraffic = (data) =>
  api.post('/traffic/generate', data).then(r => r.data)

export const simulateAttack = (scenario = 'dos', sourceId = '', destinationId = '') => {
  const formData = new FormData()
  formData.append('scenario', scenario)
  if (sourceId) formData.append('source_id', sourceId)
  if (destinationId) formData.append('destination_id', destinationId)
  return api.post('/traffic/simulate-attack', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const uploadPcap = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/traffic/upload-pcap', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

export const getFlows = () =>
  api.get('/traffic/flows').then(r => r.data)

// ── Predict ───────────────────────────────────────────────────────────────────
export const runPrediction = (data) =>
  api.post('/predict', data).then(r => r.data)

export const getPredictions = () =>
  api.get('/predictions').then(r => r.data)

export const getPrediction = (id) =>
  api.get(`/predictions/${id}`).then(r => r.data)

// ── Dashboard & ML Analytics ──────────────────────────────────────────────────
export const getDashboard = () =>
  api.get('/dashboard').then(r => r.data)

export const getMlMetrics = () =>
  api.get('/ml/metrics').then(r => r.data)

export const getFeatureImportances = () =>
  api.get('/ml/feature-importance').then(r => r.data)

export const getModelBenchmarks = () =>
  api.get('/ml/benchmarks').then(r => r.data)

export default api
