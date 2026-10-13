from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Device ──────────────────────────────────────────────────────────────────

class DeviceCreate(BaseModel):
    name: str
    device_type: str  # pc, server, router, switch, firewall, laptop
    ip_address: Optional[str] = ""
    mac_address: Optional[str] = ""
    subnet_mask: Optional[str] = "255.255.255.0"
    gateway: Optional[str] = ""
    services: Optional[List[str]] = []
    ports: Optional[List[int]] = []
    interfaces: Optional[List[str]] = ["eth0"]
    pos_x: Optional[float] = 100.0
    pos_y: Optional[float] = 100.0
    topology_id: Optional[str] = None
    extra_config: Optional[Dict[str, Any]] = {}


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    subnet_mask: Optional[str] = None
    gateway: Optional[str] = None
    services: Optional[List[str]] = None
    ports: Optional[List[int]] = None
    interfaces: Optional[List[str]] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    extra_config: Optional[Dict[str, Any]] = None


class DeviceOut(BaseModel):
    id: str
    name: str
    device_type: str
    ip_address: str
    mac_address: str
    subnet_mask: str
    gateway: str
    services: List[str]
    ports: List[Any]
    interfaces: List[str]
    pos_x: float
    pos_y: float
    topology_id: Optional[str]
    extra_config: Dict[str, Any]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Connection ───────────────────────────────────────────────────────────────

class ConnectionCreate(BaseModel):
    source_id: str
    destination_id: str
    source_interface: Optional[str] = "eth0"
    destination_interface: Optional[str] = "eth0"
    link_type: Optional[str] = "ethernet"
    bandwidth: Optional[int] = 1000
    status: Optional[str] = "active"
    topology_id: Optional[str] = None


class ConnectionUpdate(BaseModel):
    source_interface: Optional[str] = None
    destination_interface: Optional[str] = None
    link_type: Optional[str] = None
    bandwidth: Optional[int] = None
    status: Optional[str] = None


class ConnectionOut(BaseModel):
    id: str
    source_id: str
    destination_id: str
    source_interface: str
    destination_interface: str
    link_type: str
    bandwidth: int
    status: str
    topology_id: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Topology ─────────────────────────────────────────────────────────────────

class TopologyCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class TopologyOut(BaseModel):
    id: str
    name: str
    description: str
    created_at: Optional[datetime]
    devices: List[DeviceOut] = []
    connections: List[ConnectionOut] = []

    class Config:
        from_attributes = True


# ── Traffic ───────────────────────────────────────────────────────────────────

class TrafficGenerateRequest(BaseModel):
    source_device_id: str
    destination_device_id: str
    protocol: Optional[str] = "TCP"
    source_port: Optional[int] = 5000
    destination_port: Optional[int] = 80
    packet_count: Optional[int] = 100
    packet_size: Optional[int] = 512
    traffic_scenario: Optional[str] = "normal"  # normal, dos, port_scan, bruteforce


class TrafficFlowOut(BaseModel):
    flow_id: str
    source_device_id: str
    destination_device_id: str
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    packet_count: int
    packet_size: int
    traffic_scenario: str
    features: Dict[str, Any]

    class Config:
        from_attributes = True


# ── Prediction ────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    flow_id: str
    source_device_id: str
    destination_device_id: str
    source_ip: Optional[str] = ""
    destination_ip: Optional[str] = ""
    source_port: Optional[int] = 0
    destination_port: Optional[int] = 80
    protocol: Optional[str] = "TCP"
    traffic_scenario: Optional[str] = "normal"
    features: Optional[Dict[str, Any]] = {}


class PredictionOut(BaseModel):
    id: str
    flow_id: str
    source_device_id: Optional[str]
    destination_device_id: Optional[str]
    source_name: str
    destination_name: str
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    prediction: str
    confidence: float
    probabilities: Dict[str, Any]
    features_used: Dict[str, Any]
    traffic_scenario: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_devices: int
    total_connections: int
    total_flows: int
    normal_flows: int
    malicious_flows: int
    dos_flows: int
    port_scan_flows: int
    bruteforce_flows: int
    attack_distribution: Dict[str, int]
    protocol_distribution: Dict[str, int]
    recent_predictions: List[Dict[str, Any]]
