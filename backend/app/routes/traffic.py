"""
traffic.py
==========
FastAPI routes for generating flow features, simulating live attacks,
uploading PCAP files for automated flow classification, and fetching flow details.
"""

import uuid
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import TrafficGenerateRequest
from app.network.traffic import generate_traffic, generate_flow_features
from app.network.graph import build_adjacency, find_path
from app.models.db_models import TrafficFlow, Device, Connection, Prediction
from app.services.pcap_parser import parse_pcap_bytes
from app.ml.predict import run_prediction

router = APIRouter()


@router.post("/generate")
def generate(request: TrafficGenerateRequest, db: Session = Depends(get_db)):
    try:
        result = generate_traffic(db, request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Traffic generation failed: {str(e)}")


@router.post("/simulate-attack")
def simulate_attack(
    scenario: str = Form("dos"),
    source_id: Optional[str] = Form(None),
    destination_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Simulates a live network attack (DoS, PortScan, or NAT_Anomaly), generates flow statistical
    features, runs XGBoost classification, saves prediction records, and returns affected paths.
    """
    devices = db.query(Device).all()
    if len(devices) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 devices are required in the topology to simulate an attack."
        )

    src_dev = None
    dst_dev = None

    if source_id:
        src_dev = db.query(Device).filter(Device.id == source_id).first()
    if destination_id:
        dst_dev = db.query(Device).filter(Device.id == destination_id).first()

    if not src_dev or not dst_dev or src_dev.id == dst_dev.id:
        # Default pick: PC/Workstation as source, Server/Router as destination
        servers = [d for d in devices if d.device_type.lower() in ["server", "router", "firewall"]]
        clients = [d for d in devices if d.device_type.lower() in ["pc", "laptop"]]
        dst_dev = servers[0] if servers else devices[-1]
        src_dev = clients[0] if clients else devices[0]
        if src_dev.id == dst_dev.id and len(devices) > 1:
            src_dev = [d for d in devices if d.id != dst_dev.id][0]

    # Map scenario name
    scenario_clean = scenario.lower().strip()
    if scenario_clean in ["portscan", "port_scan"]:
        scenario_clean = "port_scan"
    elif scenario_clean in ["nat_anomaly", "nat anomaly", "nat"]:
        scenario_clean = "nat_anomaly"
    elif scenario_clean in ["dos", "ddos"]:
        scenario_clean = "dos"
    else:
        scenario_clean = "dos"

    # Select destination port based on attack profile
    if scenario_clean == "port_scan":
        dst_port = random.randint(1, 65535)
    elif scenario_clean == "nat_anomaly":
        dst_port = random.choice([10000, 3128, 50000, 61000])
    else:  # DoS
        dst_port = random.choice([80, 443, 8080])

    features = generate_flow_features(
        src_device=src_dev,
        dst_device=dst_dev,
        protocol="TCP",
        src_port=random.randint(1024, 65535),
        dst_port=dst_port,
        packet_count=random.randint(200, 2000),
        packet_size=random.randint(64, 1024),
        traffic_scenario=scenario_clean,
    )

    # Calculate topology path
    connections = db.query(Connection).all()
    edge_list = [{"source_id": c.source_id, "destination_id": c.destination_id} for c in connections]
    graph = build_adjacency(edge_list)
    path = find_path(graph, src_dev.id, dst_dev.id) or [src_dev.id, dst_dev.id]

    # Run XGBoost ML Prediction
    raw_input = {**features, "traffic_scenario": scenario_clean}
    pred_res = run_prediction(raw_input)

    # Save to Database
    flow_id = f"ATTACK-{str(uuid.uuid4())[:8].upper()}"
    traffic_flow = TrafficFlow(
        id=str(uuid.uuid4()),
        flow_id=flow_id,
        source_device_id=src_dev.id,
        destination_device_id=dst_dev.id,
        source_ip=src_dev.ip_address or "192.168.1.100",
        destination_ip=dst_dev.ip_address or "192.168.1.1",
        source_port=features.get("Source_Port", 49152),
        destination_port=dst_port,
        protocol="TCP",
        packet_count=features.get("Total_Fwd_Packets", 100),
        packet_size=int(features.get("Average_Packet_Size", 512)),
        traffic_scenario=scenario_clean,
        features=features,
    )
    db.add(traffic_flow)

    pred_record = Prediction(
        id=str(uuid.uuid4()),
        flow_id=flow_id,
        source_device_id=src_dev.id,
        destination_device_id=dst_dev.id,
        source_name=src_dev.name,
        destination_name=dst_dev.name,
        source_ip=src_dev.ip_address or "192.168.1.100",
        destination_ip=dst_dev.ip_address or "192.168.1.1",
        source_port=features.get("Source_Port", 49152),
        destination_port=dst_port,
        protocol="TCP",
        prediction=pred_res["prediction"],
        confidence=pred_res["confidence"],
        probabilities=pred_res["probabilities"],
        features_used=pred_res["features_used"],
        traffic_scenario=scenario_clean,
    )
    db.add(pred_record)
    db.commit()

    return {
        "status": "success",
        "scenario": scenario_clean,
        "prediction": pred_res["prediction"],
        "confidence": pred_res["confidence"],
        "probabilities": pred_res["probabilities"],
        "flow_id": flow_id,
        "source_device": {"id": src_dev.id, "name": src_dev.name, "ip": src_dev.ip_address},
        "destination_device": {"id": dst_dev.id, "name": dst_dev.name, "ip": dst_dev.ip_address},
        "path": path,
        "features": features,
    }


@router.post("/upload-pcap")
async def upload_pcap(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Parses an uploaded PCAP / PCAPNG packet capture file, extracts 5-tuple flows & statistical
    features, runs XGBoost ML predictions on each flow, saves records to DB, and returns results.
    """
    if not file.filename.lower().endswith((".pcap", ".pcapng", ".cap")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a .pcap or .pcapng packet capture file."
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        raw_flows = parse_pcap_bytes(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PCAP parsing failed: {str(e)}")

    if not raw_flows:
        raise HTTPException(status_code=400, detail="No IP packet flows were found in the uploaded PCAP file.")

    results = []
    for flow_feat in raw_flows:
        pred_res = run_prediction(flow_feat)
        flow_id = flow_feat.get("Flow_ID", f"PCAP-{str(uuid.uuid4())[:8]}")

        pred_record = Prediction(
            id=str(uuid.uuid4()),
            flow_id=flow_id,
            source_name=flow_feat.get("Source_IP", "Unknown"),
            destination_name=flow_feat.get("Destination_IP", "Unknown"),
            source_ip=flow_feat.get("Source_IP", "0.0.0.0"),
            destination_ip=flow_feat.get("Destination_IP", "0.0.0.0"),
            source_port=flow_feat.get("Source_Port", 0),
            destination_port=flow_feat.get("Destination_Port", 80),
            protocol=flow_feat.get("Protocol_Name", "TCP"),
            prediction=pred_res["prediction"],
            confidence=pred_res["confidence"],
            probabilities=pred_res["probabilities"],
            features_used=pred_res["features_used"],
            traffic_scenario="pcap_upload",
        )
        db.add(pred_record)

        results.append({
            "flow_id": flow_id,
            "source_ip": flow_feat.get("Source_IP"),
            "destination_ip": flow_feat.get("Destination_IP"),
            "source_port": flow_feat.get("Source_Port"),
            "destination_port": flow_feat.get("Destination_Port"),
            "protocol": flow_feat.get("Protocol_Name"),
            "packet_count": flow_feat.get("Total_Fwd_Packets", 0) + flow_feat.get("Total_Backward_Packets", 0),
            "flow_duration_ms": round(flow_feat.get("Flow_Duration", 0) / 1000, 2),
            "prediction": pred_res["prediction"],
            "confidence": pred_res["confidence"],
            "probabilities": pred_res["probabilities"],
            "features": flow_feat,
        })

    db.commit()

    malicious_count = sum(1 for r in results if r["prediction"] != "BENIGN")
    return {
        "status": "success",
        "filename": file.filename,
        "total_flows": len(results),
        "malicious_flows": malicious_count,
        "benign_flows": len(results) - malicious_count,
        "flows": results,
    }


@router.get("/flows")
def list_flows(db: Session = Depends(get_db)):
    flows = db.query(TrafficFlow).order_by(TrafficFlow.created_at.desc()).limit(100).all()
    return [
        {
            "flow_id": f.flow_id,
            "source_device_id": f.source_device_id,
            "destination_device_id": f.destination_device_id,
            "source_ip": f.source_ip,
            "destination_ip": f.destination_ip,
            "source_port": f.source_port,
            "destination_port": f.destination_port,
            "protocol": f.protocol,
            "traffic_scenario": f.traffic_scenario,
            "packet_count": f.packet_count,
            "created_at": f.created_at,
        }
        for f in flows
    ]


@router.get("/flows/{flow_id}")
def get_flow(flow_id: str, db: Session = Depends(get_db)):
    flow = db.query(TrafficFlow).filter(TrafficFlow.flow_id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {
        "flow_id": flow.flow_id,
        "source_device_id": flow.source_device_id,
        "destination_device_id": flow.destination_device_id,
        "source_ip": flow.source_ip,
        "destination_ip": flow.destination_ip,
        "source_port": flow.source_port,
        "destination_port": flow.destination_port,
        "protocol": flow.protocol,
        "traffic_scenario": flow.traffic_scenario,
        "packet_count": flow.packet_count,
        "packet_size": flow.packet_size,
        "features": flow.features,
        "created_at": flow.created_at,
    }
