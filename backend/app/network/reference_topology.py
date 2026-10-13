"""
Reference interconnected lab topology shared by:
- ML dataset generation (ml/generate_dataset.py)
- Demo seed on empty database (network/seed.py)
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from app.network.graph import all_reachable_pairs

REF_TOPOLOGY_NAME = "Interconnected Lab Network"

REF_DEVICES: List[Dict[str, Any]] = [
    {
        "ref_id": "pc1",
        "name": "PC1",
        "device_type": "pc",
        "ip_address": "192.168.1.10",
        "subnet_mask": "255.255.255.0",
        "gateway": "192.168.1.1",
        "pos_x": 80,
        "pos_y": 220,
        "interfaces": ["eth0"],
        "services": [],
        "ports": [],
    },
    {
        "ref_id": "laptop1",
        "name": "Laptop1",
        "device_type": "laptop",
        "ip_address": "192.168.1.11",
        "subnet_mask": "255.255.255.0",
        "gateway": "192.168.1.1",
        "pos_x": 80,
        "pos_y": 80,
        "interfaces": ["eth0"],
        "services": [],
        "ports": [],
    },
    {
        "ref_id": "switch1",
        "name": "Switch1",
        "device_type": "switch",
        "ip_address": "",
        "subnet_mask": "255.255.255.0",
        "gateway": "",
        "pos_x": 260,
        "pos_y": 150,
        "interfaces": ["fa0/1", "fa0/2", "fa0/3", "fa0/4"],
        "services": [],
        "ports": [],
    },
    {
        "ref_id": "router1",
        "name": "Router1",
        "device_type": "router",
        "ip_address": "10.0.1.1",
        "subnet_mask": "255.255.255.0",
        "gateway": "",
        "pos_x": 440,
        "pos_y": 150,
        "interfaces": ["fa0/0", "fa0/1", "fa0/2"],
        "services": [],
        "ports": [],
    },
    {
        "ref_id": "firewall1",
        "name": "Firewall1",
        "device_type": "firewall",
        "ip_address": "172.16.0.1",
        "subnet_mask": "255.255.255.0",
        "gateway": "",
        "pos_x": 620,
        "pos_y": 150,
        "interfaces": ["eth0-outside", "eth1-inside"],
        "services": [],
        "ports": [],
    },
    {
        "ref_id": "server1",
        "name": "Server1",
        "device_type": "server",
        "ip_address": "10.0.0.10",
        "subnet_mask": "255.255.255.0",
        "gateway": "172.16.0.1",
        "pos_x": 800,
        "pos_y": 150,
        "interfaces": ["eth0"],
        "services": ["HTTP", "SSH"],
        "ports": [80, 22],
    },
]

REF_EDGES: List[Tuple[str, str]] = [
    ("pc1", "switch1"),
    ("laptop1", "switch1"),
    ("switch1", "router1"),
    ("router1", "firewall1"),
    ("firewall1", "server1"),
]


@dataclass
class _RefDevice:
    ip_address: str
    name: str


def ref_device_by_id() -> Dict[str, _RefDevice]:
    return {
        d["ref_id"]: _RefDevice(ip_address=d["ip_address"] or "0.0.0.0", name=d["name"])
        for d in REF_DEVICES
    }


def reachable_device_pairs() -> List[Tuple[str, str]]:
    ids = [d["ref_id"] for d in REF_DEVICES]
    return all_reachable_pairs(ids, REF_EDGES)
