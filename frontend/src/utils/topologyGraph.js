export function buildAdjacency(connections) {
  const graph = {}
  for (const c of connections) {
    graph[c.source_id] = graph[c.source_id] || []
    graph[c.destination_id] = graph[c.destination_id] || []
    graph[c.source_id].push(c.destination_id)
    graph[c.destination_id].push(c.source_id)
  }
  return graph
}

export function reachableDeviceIds(graph, sourceId) {
  if (!sourceId || !graph[sourceId]) return []
  const visited = new Set([sourceId])
  const queue = [sourceId]
  while (queue.length) {
    const node = queue.shift()
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  visited.delete(sourceId)
  return [...visited]
}

export function isReachable(graph, sourceId, destinationId) {
  if (!sourceId || !destinationId || sourceId === destinationId) return false
  return reachableDeviceIds(graph, sourceId).includes(destinationId)
}
