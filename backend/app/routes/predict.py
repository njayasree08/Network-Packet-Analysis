import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import PredictRequest, PredictionOut
from app.models.db_models import Prediction, TrafficFlow, Device
from app.ml.predict import run_prediction
from app.network.connections import get_path_between

router = APIRouter()


@router.post("/predict", status_code=201)
def predict(request: PredictRequest, db: Session = Depends(get_db)):
    # Resolve device names
    src_device = db.query(Device).filter(Device.id == request.source_device_id).first()
    dst_device = db.query(Device).filter(Device.id == request.destination_device_id).first()

    src_name = src_device.name if src_device else "Unknown"
    dst_name = dst_device.name if dst_device else "Unknown"
    src_ip = request.source_ip or (src_device.ip_address if src_device else "")
    dst_ip = request.destination_ip or (dst_device.ip_address if dst_device else "")

    # Build feature dict: merge provided features + metadata
    features = dict(request.features or {})
    features["traffic_scenario"] = request.traffic_scenario
    features["Destination_Port"] = request.destination_port
    features["Protocol"] = request.protocol
    features["Source_Port"] = request.source_port

    # If flow_id exists, pull stored features
    if request.flow_id:
        stored = db.query(TrafficFlow).filter(TrafficFlow.flow_id == request.flow_id).first()
        if stored and stored.features:
            features.update(stored.features)
            features["traffic_scenario"] = stored.traffic_scenario

    # Run ML prediction
    result = run_prediction(features)

    # Get device path for topology highlighting
    path = []
    if src_device and dst_device:
        path = get_path_between(db, request.source_device_id, request.destination_device_id)

    # Persist prediction
    pred = Prediction(
        id=str(uuid.uuid4()),
        flow_id=request.flow_id,
        source_device_id=request.source_device_id,
        destination_device_id=request.destination_device_id,
        source_name=src_name,
        destination_name=dst_name,
        source_ip=src_ip,
        destination_ip=dst_ip,
        source_port=request.source_port,
        destination_port=request.destination_port,
        protocol=request.protocol,
        prediction=result["prediction"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
        features_used=result["features_used"],
        traffic_scenario=request.traffic_scenario,
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)

    return {
        "id": pred.id,
        "flow_id": pred.flow_id,
        "source": src_name,
        "destination": dst_name,
        "source_device_id": request.source_device_id,
        "destination_device_id": request.destination_device_id,
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "source_port": request.source_port,
        "destination_port": request.destination_port,
        "protocol": request.protocol,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "probabilities": result["probabilities"],
        "features_used": result["features_used"],
        "traffic_scenario": request.traffic_scenario,
        "device_path": path,
        "model_used": result.get("model_used", "unknown"),
        "created_at": pred.created_at,
    }


@router.get("/predictions")
def list_predictions(db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(200).all()
    return [
        {
            "id": p.id,
            "flow_id": p.flow_id,
            "source": p.source_name,
            "destination": p.destination_name,
            "source_device_id": p.source_device_id,
            "destination_device_id": p.destination_device_id,
            "source_ip": p.source_ip,
            "destination_ip": p.destination_ip,
            "source_port": p.source_port,
            "destination_port": p.destination_port,
            "protocol": p.protocol,
            "prediction": p.prediction,
            "confidence": p.confidence,
            "probabilities": p.probabilities,
            "traffic_scenario": p.traffic_scenario,
            "created_at": p.created_at,
        }
        for p in preds
    ]


@router.get("/predictions/{pred_id}")
def get_prediction(pred_id: str, db: Session = Depends(get_db)):
    pred = db.query(Prediction).filter(Prediction.id == pred_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {
        "id": pred.id,
        "flow_id": pred.flow_id,
        "source": pred.source_name,
        "destination": pred.destination_name,
        "source_device_id": pred.source_device_id,
        "destination_device_id": pred.destination_device_id,
        "source_ip": pred.source_ip,
        "destination_ip": pred.destination_ip,
        "source_port": pred.source_port,
        "destination_port": pred.destination_port,
        "protocol": pred.protocol,
        "prediction": pred.prediction,
        "confidence": pred.confidence,
        "probabilities": pred.probabilities,
        "features_used": pred.features_used,
        "traffic_scenario": pred.traffic_scenario,
        "created_at": pred.created_at,
    }
