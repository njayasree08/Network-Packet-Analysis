"""
ml_metrics.py
=============
FastAPI router serving machine learning evaluation metrics,
confusion matrices, feature importance rankings, and model benchmarks.
"""

import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")
IMPORTANCE_PATH = os.path.join(MODEL_DIR, "feature_importances.json")
BENCHMARKS_PATH = os.path.join(MODEL_DIR, "benchmarks.json")


@router.get("/metrics")
def get_ml_metrics():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=404,
            detail="ML metrics file not found. Please run train_model.py first."
        )
    try:
        with open(METRICS_PATH, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading metrics: {str(e)}")


@router.get("/feature-importance")
def get_feature_importances():
    if not os.path.exists(IMPORTANCE_PATH):
        raise HTTPException(
            status_code=404,
            detail="Feature importances file not found. Please run train_model.py first."
        )
    try:
        with open(IMPORTANCE_PATH, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading feature importances: {str(e)}")


@router.get("/benchmarks")
def get_model_benchmarks():
    if not os.path.exists(BENCHMARKS_PATH):
        raise HTTPException(
            status_code=404,
            detail="Benchmarks file not found. Please run train_model.py first."
        )
    try:
        with open(BENCHMARKS_PATH, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading benchmarks: {str(e)}")
