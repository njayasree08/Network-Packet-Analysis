from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter
from app.database import get_db
from app.models.db_models import Device, Connection, TrafficFlow, Prediction

router = APIRouter()

MALICIOUS_LABELS = {"DoS", "DDoS", "PortScan", "BruteForce", "WebAttack", "Infiltration", "Heartbleed", "Botnet"}


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    total_devices = db.query(Device).count()
    total_connections = db.query(Connection).count()
    total_flows = db.query(TrafficFlow).count()

    preds = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    total_predictions = len(preds)

    normal_flows = sum(1 for p in preds if p.prediction == "BENIGN")
    malicious_flows = sum(1 for p in preds if p.prediction in MALICIOUS_LABELS)
    dos_flows = sum(1 for p in preds if p.prediction in {"DoS", "DDoS"})
    port_scan_flows = sum(1 for p in preds if p.prediction == "PortScan")
    bruteforce_flows = sum(1 for p in preds if p.prediction == "BruteForce")

    attack_dist = Counter(p.prediction for p in preds)
    protocol_dist = Counter(p.protocol for p in preds)

    recent = [
        {
            "id": p.id,
            "flow_id": p.flow_id,
            "source": p.source_name,
            "destination": p.destination_name,
            "source_ip": p.source_ip,
            "destination_ip": p.destination_ip,
            "source_port": p.source_port,
            "destination_port": p.destination_port,
            "protocol": p.protocol,
            "prediction": p.prediction,
            "confidence": p.confidence,
            "traffic_scenario": p.traffic_scenario,
            "created_at": p.created_at,
        }
        for p in preds[:20]
    ]

    # Protocol distribution from all flows
    all_flows = db.query(TrafficFlow).all()
    flow_protocol_dist = Counter(f.protocol for f in all_flows)

    # Attack type by device
    device_attack = {}
    for p in preds:
        if p.prediction != "BENIGN":
            key = p.source_name or p.source_ip or "Unknown"
            device_attack[key] = device_attack.get(key, 0) + 1

    return {
        "total_devices": total_devices,
        "total_connections": total_connections,
        "total_flows": total_flows,
        "total_predictions": total_predictions,
        "normal_flows": normal_flows,
        "malicious_flows": malicious_flows,
        "dos_flows": dos_flows,
        "port_scan_flows": port_scan_flows,
        "bruteforce_flows": bruteforce_flows,
        "attack_distribution": dict(attack_dist),
        "protocol_distribution": dict(protocol_dist),
        "flow_protocol_distribution": dict(flow_protocol_dist),
        "device_attack_distribution": device_attack,
        "recent_predictions": recent,
    }
