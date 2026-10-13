"""
generate_dataset.py
====================
Generates a synthetic CICIDS-compatible dataset where every flow is tied to the
reference interconnected lab topology (same graph as the demo network simulator).

    cd network-ids-project/ml
    python generate_dataset.py
"""

import os
import random
import sys

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.network.graph import build_adjacency, find_path  # noqa: E402
from app.network.reference_topology import (  # noqa: E402
    REF_DEVICES,
    REF_EDGES,
    ref_device_by_id,
    reachable_device_pairs,
)
from app.network.traffic import generate_flow_features  # noqa: E402

OUT_PATH = os.path.join(os.path.dirname(__file__), "dataset/sample_dataset.csv")
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

FEATURE_COLS = [
    "Destination_Port", "Flow_Duration", "Total_Fwd_Packets", "Total_Backward_Packets",
    "Total_Length_of_Fwd_Packets", "Total_Length_of_Bwd_Packets",
    "Fwd_Packet_Length_Max", "Fwd_Packet_Length_Min", "Fwd_Packet_Length_Mean", "Fwd_Packet_Length_Std",
    "Bwd_Packet_Length_Max", "Bwd_Packet_Length_Min", "Bwd_Packet_Length_Mean", "Bwd_Packet_Length_Std",
    "Flow_Bytes_s", "Flow_Packets_s",
    "Flow_IAT_Mean", "Flow_IAT_Std", "Flow_IAT_Max", "Flow_IAT_Min",
    "Fwd_IAT_Total", "Fwd_IAT_Mean", "Fwd_IAT_Std", "Fwd_IAT_Max", "Fwd_IAT_Min",
    "Bwd_IAT_Total", "Bwd_IAT_Mean", "Bwd_IAT_Std", "Bwd_IAT_Max", "Bwd_IAT_Min",
    "Fwd_PSH_Flags", "Bwd_PSH_Flags", "Fwd_URG_Flags", "Bwd_URG_Flags",
    "Fwd_Header_Length", "Bwd_Header_Length",
    "Fwd_Packets_s", "Bwd_Packets_s",
    "Packet_Length_Min", "Packet_Length_Max", "Packet_Length_Mean", "Packet_Length_Std", "Packet_Length_Variance",
    "FIN_Flag_Count", "SYN_Flag_Count", "RST_Flag_Count", "PSH_Flag_Count",
    "ACK_Flag_Count", "URG_Flag_Count", "CWE_Flag_Count", "ECE_Flag_Count",
    "Down_Up_Ratio", "Average_Packet_Size", "Avg_Fwd_Segment_Size", "Avg_Bwd_Segment_Size",
    "Subflow_Fwd_Packets", "Subflow_Fwd_Bytes", "Subflow_Bwd_Packets", "Subflow_Bwd_Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward", "act_data_pkt_fwd", "min_seg_size_forward",
    "Active_Mean", "Active_Std", "Active_Max", "Active_Min",
    "Idle_Mean", "Idle_Std", "Idle_Max", "Idle_Min",
    "Protocol",
]

SCENARIO_LABEL = {
    "normal": "BENIGN",
    "dos": "DoS",
    "port_scan": "PortScan",
    "nat_anomaly": "NAT_Anomaly",
    "bruteforce": "BruteForce",
}

SCENARIO_COUNTS = {
    "normal": 2500,
    "dos": 500,
    "port_scan": 450,
    "nat_anomaly": 300,
    "bruteforce": 250,
}


class _SimDevice:
    def __init__(self, ip_address: str, name: str):
        self.ip_address = ip_address
        self.name = name


def _pick_dst_port(scenario: str) -> int:
    if scenario == "port_scan":
        return random.randint(1, 65535)
    if scenario == "nat_anomaly":
        return random.choice([10000, 3128, 8080, 50000, 61000])
    if scenario == "bruteforce":
        return random.choice([22, 21, 3389, 23, 5900])
    if scenario == "dos":
        return random.choice([80, 443, 8080])
    return random.choice([80, 443, 8080])


def _flow_row(
    src_ref: str,
    dst_ref: str,
    scenario: str,
    devices: dict,
    graph: dict,
) -> dict:
    src = devices[src_ref]
    dst = devices[dst_ref]
    protocol = random.choice(["TCP", "TCP", "TCP", "UDP"])
    dst_port = _pick_dst_port(scenario)
    features = generate_flow_features(
        src_device=src,
        dst_device=dst,
        protocol=protocol,
        src_port=random.randint(1024, 65535),
        dst_port=dst_port,
        packet_count=random.randint(50, 500),
        packet_size=random.randint(64, 1024),
        traffic_scenario=scenario,
    )
    path = find_path(graph, src_ref, dst_ref) or []
    path_names = [devices[node].name for node in path]

    row = {col: features.get(col) for col in FEATURE_COLS}
    row["Label"] = SCENARIO_LABEL[scenario]
    row["Source_IP"] = features.get("Source_IP", src.ip_address)
    row["Destination_IP"] = features.get("Destination_IP", dst.ip_address)
    row["Source_Device"] = src.name
    row["Destination_Device"] = dst.name
    row["Traffic_Scenario"] = scenario
    row["Topology_Path"] = " -> ".join(path_names)
    return row


def generate_interconnected_dataset() -> pd.DataFrame:
    devices = {
        d["ref_id"]: _SimDevice(d["ip_address"] or "0.0.0.0", d["name"])
        for d in REF_DEVICES
    }
    graph = build_adjacency(REF_EDGES)
    pairs = reachable_device_pairs()
    if not pairs:
        raise RuntimeError("Reference topology has no reachable device pairs.")

    rows = []
    for scenario, count in SCENARIO_COUNTS.items():
        for _ in range(count):
            src_ref, dst_ref = random.choice(pairs)
            rows.append(_flow_row(src_ref, dst_ref, scenario, devices, graph))

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    df.replace([float("inf"), float("-inf")], 0, inplace=True)
    df.fillna(0, inplace=True)
    return df


def main():
    print("[*] Generating interconnected CICIDS-compatible dataset...")
    print(f"    Reference topology: {len(REF_DEVICES)} devices, {len(REF_EDGES)} links")
    print(f"    Reachable flows: {len(reachable_device_pairs())} directed pairs")
    df = generate_interconnected_dataset()
    df.to_csv(OUT_PATH, index=False)
    print(f"[OK] Dataset saved -> {OUT_PATH}")
    print(f"    Shape: {df.shape}")
    print(f"    Labels:\n{df['Label'].value_counts().to_string()}")


if __name__ == "__main__":
    main()
