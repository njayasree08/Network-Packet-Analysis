import uuid
import random
import math
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Device, TrafficFlow
from app.schemas.schemas import TrafficGenerateRequest
from app.network.connections import is_connected


# ── Scenario profiles ─────────────────────────────────────────────────────────
SCENARIO_PROFILES = {
    "normal": {
        "flow_duration_range": (50000, 5000000),
        "fwd_packets_range": (10, 200),
        "bwd_packets_range": (8, 180),
        "fwd_len_range": (40, 1460),
        "bwd_len_range": (40, 1460),
        "syn_flag": 1, "ack_flag": 1, "fin_flag": 1,
        "rst_flag": 0, "psh_flag": 1, "urg_flag": 0,
        "idle_mean": 100000, "idle_std": 50000,
    },
    "dos": {
        "flow_duration_range": (1000, 500000),
        "fwd_packets_range": (500, 5000),
        "bwd_packets_range": (0, 5),
        "fwd_len_range": (40, 60),
        "bwd_len_range": (0, 10),
        "syn_flag": 1, "ack_flag": 0, "fin_flag": 0,
        "rst_flag": 1, "psh_flag": 0, "urg_flag": 0,
        "idle_mean": 10000, "idle_std": 5000,
    },
    "port_scan": {
        "flow_duration_range": (100, 10000),
        "fwd_packets_range": (1, 3),
        "bwd_packets_range": (0, 1),
        "fwd_len_range": (40, 60),
        "bwd_len_range": (0, 40),
        "syn_flag": 1, "ack_flag": 0, "fin_flag": 0,
        "rst_flag": 1, "psh_flag": 0, "urg_flag": 0,
        "idle_mean": 5000, "idle_std": 2000,
    },
    "bruteforce": {
        "flow_duration_range": (10000, 300000),
        "fwd_packets_range": (50, 500),
        "bwd_packets_range": (50, 500),
        "fwd_len_range": (40, 200),
        "bwd_len_range": (40, 200),
        "syn_flag": 1, "ack_flag": 1, "fin_flag": 1,
        "rst_flag": 0, "psh_flag": 1, "urg_flag": 0,
        "idle_mean": 50000, "idle_std": 20000,
    },
    "nat_anomaly": {
        "flow_duration_range": (15000, 800000),
        "fwd_packets_range": (150, 900),
        "bwd_packets_range": (1, 10),
        "fwd_len_range": (120, 1400),
        "bwd_len_range": (0, 60),
        "syn_flag": 1, "ack_flag": 1, "fin_flag": 0,
        "rst_flag": 1, "psh_flag": 1, "urg_flag": 1,
        "idle_mean": 150000, "idle_std": 80000,
    },
}

PROTOCOL_MAP = {"TCP": 6, "UDP": 17, "ICMP": 1, "HTTP": 6, "HTTPS": 6}


def _r(lo, hi):
    return random.uniform(lo, hi)


def _ri(lo, hi):
    return random.randint(lo, hi)


def generate_flow_features(
    src_device: Device,
    dst_device: Device,
    protocol: str,
    src_port: int,
    dst_port: int,
    packet_count: int,
    packet_size: int,
    traffic_scenario: str,
) -> Dict[str, Any]:
    """Generate CICIDS-compatible flow features from topology + scenario."""

    profile = SCENARIO_PROFILES.get(traffic_scenario, SCENARIO_PROFILES["normal"])
    proto_num = PROTOCOL_MAP.get(protocol.upper(), 6)

    flow_duration = _r(*profile["flow_duration_range"])
    total_fwd = _ri(*profile["fwd_packets_range"])
    total_bwd = _ri(*profile["bwd_packets_range"])
    total_fwd_len = total_fwd * _r(*profile["fwd_len_range"])
    total_bwd_len = total_bwd * _r(*profile["bwd_len_range"])

    total_packets = max(total_fwd + total_bwd, 1)
    flow_bytes_s = (total_fwd_len + total_bwd_len) / (flow_duration / 1e6 + 1e-9)
    flow_pkts_s = total_packets / (flow_duration / 1e6 + 1e-9)

    fwd_pkt_len_mean = total_fwd_len / max(total_fwd, 1)
    bwd_pkt_len_mean = total_bwd_len / max(total_bwd, 1)
    pkt_len_mean = (total_fwd_len + total_bwd_len) / total_packets
    pkt_len_std = pkt_len_mean * random.uniform(0.1, 0.5)
    pkt_len_var = pkt_len_std ** 2

    fwd_iat_mean = flow_duration / max(total_fwd, 1)
    bwd_iat_mean = flow_duration / max(total_bwd, 1)
    flow_iat_mean = flow_duration / max(total_packets - 1, 1)
    flow_iat_std = flow_iat_mean * random.uniform(0.2, 0.8)
    flow_iat_max = flow_iat_mean * random.uniform(1.5, 4.0)
    flow_iat_min = flow_iat_mean * random.uniform(0.01, 0.5)

    idle_mean = _r(profile["idle_mean"] * 0.8, profile["idle_mean"] * 1.2)
    active_mean = flow_duration * random.uniform(0.3, 0.7)

    features = {
        # Identity
        "Flow_ID": str(uuid.uuid4())[:8],
        "Source_IP": src_device.ip_address or "192.168.1.1",
        "Source_Port": src_port,
        "Destination_IP": dst_device.ip_address or "192.168.1.2",
        "Destination_Port": dst_port,
        "Protocol": proto_num,
        "Protocol_Name": protocol.upper(),

        # Core flow features (CICIDS compatible)
        "Flow_Duration": round(flow_duration, 4),
        "Total_Fwd_Packets": total_fwd,
        "Total_Backward_Packets": total_bwd,
        "Total_Length_of_Fwd_Packets": round(total_fwd_len, 4),
        "Total_Length_of_Bwd_Packets": round(total_bwd_len, 4),

        "Fwd_Packet_Length_Max": round(fwd_pkt_len_mean * 1.5, 4),
        "Fwd_Packet_Length_Min": round(fwd_pkt_len_mean * 0.5, 4),
        "Fwd_Packet_Length_Mean": round(fwd_pkt_len_mean, 4),
        "Fwd_Packet_Length_Std": round(fwd_pkt_len_mean * 0.3, 4),

        "Bwd_Packet_Length_Max": round(bwd_pkt_len_mean * 1.5, 4),
        "Bwd_Packet_Length_Min": round(bwd_pkt_len_mean * 0.5, 4),
        "Bwd_Packet_Length_Mean": round(bwd_pkt_len_mean, 4),
        "Bwd_Packet_Length_Std": round(bwd_pkt_len_mean * 0.3, 4),

        "Flow_Bytes_s": round(flow_bytes_s, 4),
        "Flow_Packets_s": round(flow_pkts_s, 4),

        "Flow_IAT_Mean": round(flow_iat_mean, 4),
        "Flow_IAT_Std": round(flow_iat_std, 4),
        "Flow_IAT_Max": round(flow_iat_max, 4),
        "Flow_IAT_Min": round(flow_iat_min, 4),

        "Fwd_IAT_Total": round(flow_duration * 0.6, 4),
        "Fwd_IAT_Mean": round(fwd_iat_mean, 4),
        "Fwd_IAT_Std": round(fwd_iat_mean * 0.3, 4),
        "Fwd_IAT_Max": round(fwd_iat_mean * 2.0, 4),
        "Fwd_IAT_Min": round(fwd_iat_mean * 0.1, 4),

        "Bwd_IAT_Total": round(flow_duration * 0.4, 4),
        "Bwd_IAT_Mean": round(bwd_iat_mean, 4),
        "Bwd_IAT_Std": round(bwd_iat_mean * 0.3, 4),
        "Bwd_IAT_Max": round(bwd_iat_mean * 2.0, 4),
        "Bwd_IAT_Min": round(bwd_iat_mean * 0.1, 4),

        # TCP Flags
        "Fwd_PSH_Flags": profile["psh_flag"],
        "Bwd_PSH_Flags": profile["psh_flag"],
        "Fwd_URG_Flags": profile["urg_flag"],
        "Bwd_URG_Flags": profile["urg_flag"],
        "FIN_Flag_Count": profile["fin_flag"],
        "SYN_Flag_Count": profile["syn_flag"],
        "RST_Flag_Count": profile["rst_flag"],
        "PSH_Flag_Count": profile["psh_flag"],
        "ACK_Flag_Count": profile["ack_flag"],
        "URG_Flag_Count": profile["urg_flag"],
        "CWE_Flag_Count": 0,
        "ECE_Flag_Count": 0,

        # Header/payload
        "Fwd_Header_Length": total_fwd * 20,
        "Bwd_Header_Length": total_bwd * 20,
        "Fwd_Packets_s": round(total_fwd / (flow_duration / 1e6 + 1e-9), 4),
        "Bwd_Packets_s": round(total_bwd / (flow_duration / 1e6 + 1e-9), 4),

        "Packet_Length_Min": round(pkt_len_mean * 0.4, 4),
        "Packet_Length_Max": round(pkt_len_mean * 2.0, 4),
        "Packet_Length_Mean": round(pkt_len_mean, 4),
        "Packet_Length_Std": round(pkt_len_std, 4),
        "Packet_Length_Variance": round(pkt_len_var, 4),

        "Down_Up_Ratio": round(total_bwd / max(total_fwd, 1), 4),
        "Average_Packet_Size": round(pkt_len_mean, 4),
        "Avg_Fwd_Segment_Size": round(fwd_pkt_len_mean, 4),
        "Avg_Bwd_Segment_Size": round(bwd_pkt_len_mean, 4),

        "Init_Win_bytes_forward": _ri(0, 65535),
        "Init_Win_bytes_backward": _ri(0, 65535),
        "act_data_pkt_fwd": _ri(0, total_fwd),
        "min_seg_size_forward": 20,

        "Active_Mean": round(active_mean, 4),
        "Active_Std": round(active_mean * 0.2, 4),
        "Active_Max": round(active_mean * 1.5, 4),
        "Active_Min": round(active_mean * 0.5, 4),

        "Idle_Mean": round(idle_mean, 4),
        "Idle_Std": round(idle_mean * 0.2, 4),
        "Idle_Max": round(idle_mean * 1.5, 4),
        "Idle_Min": round(idle_mean * 0.5, 4),

        "Subflow_Fwd_Packets": total_fwd,
        "Subflow_Fwd_Bytes": round(total_fwd_len, 4),
        "Subflow_Bwd_Packets": total_bwd,
        "Subflow_Bwd_Bytes": round(total_bwd_len, 4),
    }
    return features


def generate_traffic(db: Session, request: TrafficGenerateRequest) -> Dict[str, Any]:
    src = db.query(Device).filter(Device.id == request.source_device_id).first()
    dst = db.query(Device).filter(Device.id == request.destination_device_id).first()

    if not src or not dst:
        raise ValueError("Source or destination device not found")
    if not is_connected(db, src.id, dst.id):
        raise ValueError(
            "Source and destination are not connected in the topology. "
            "Add links so there is a path between them before generating traffic."
        )

    features = generate_flow_features(
        src_device=src,
        dst_device=dst,
        protocol=request.protocol,
        src_port=request.source_port,
        dst_port=request.destination_port,
        packet_count=request.packet_count,
        packet_size=request.packet_size,
        traffic_scenario=request.traffic_scenario,
    )

    flow_id = f"FLOW-{str(uuid.uuid4())[:8].upper()}"

    flow = TrafficFlow(
        id=str(uuid.uuid4()),
        flow_id=flow_id,
        source_device_id=src.id,
        destination_device_id=dst.id,
        source_ip=src.ip_address or "0.0.0.0",
        destination_ip=dst.ip_address or "0.0.0.0",
        source_port=request.source_port,
        destination_port=request.destination_port,
        protocol=request.protocol,
        packet_count=request.packet_count,
        packet_size=request.packet_size,
        traffic_scenario=request.traffic_scenario,
        features=features,
    )
    db.add(flow)
    db.commit()
    db.refresh(flow)

    return {
        "flow_id": flow_id,
        "source_device_id": src.id,
        "destination_device_id": dst.id,
        "source_ip": src.ip_address or "0.0.0.0",
        "destination_ip": dst.ip_address or "0.0.0.0",
        "source_port": request.source_port,
        "destination_port": request.destination_port,
        "protocol": request.protocol,
        "packet_count": request.packet_count,
        "packet_size": request.packet_size,
        "traffic_scenario": request.traffic_scenario,
        "features": features,
    }
