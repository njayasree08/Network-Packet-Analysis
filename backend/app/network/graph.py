"""Topology graph helpers (device connectivity / paths)."""
from __future__ import annotations

from collections import deque
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


def build_adjacency(
    edges: Iterable[Tuple[str, str]],
) -> Dict[str, List[str]]:
    graph: Dict[str, List[str]] = {}
    for a, b in edges:
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
    return graph


def find_path(graph: Dict[str, List[str]], source_id: str, destination_id: str) -> Optional[List[str]]:
    if source_id == destination_id:
        return [source_id]
    if source_id not in graph:
        return None

    visited = {source_id}
    queue = deque([[source_id]])
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == destination_id:
            return path
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])
    return None


def is_reachable(graph: Dict[str, List[str]], source_id: str, destination_id: str) -> bool:
    return find_path(graph, source_id, destination_id) is not None


def reachable_from(graph: Dict[str, List[str]], source_id: str) -> List[str]:
    if source_id not in graph:
        return []
    visited = {source_id}
    queue = deque([source_id])
    while queue:
        node = queue.popleft()
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    visited.discard(source_id)
    return sorted(visited)


def all_reachable_pairs(device_ids: Sequence[str], edges: Iterable[Tuple[str, str]]) -> List[Tuple[str, str]]:
    graph = build_adjacency(edges)
    pairs: List[Tuple[str, str]] = []
    for src in device_ids:
        for dst in reachable_from(graph, src):
            pairs.append((src, dst))
    return pairs
