"""
preprocess.py
=============
Preprocessing pipeline for the feature DataFrame before prediction.

HOW TO ADAPT TO YOUR MODEL
---------------------------
1. If you saved a scaler (StandardScaler, MinMaxScaler, etc.) during training,
   place the .pkl / .joblib file at backend/models/scaler.pkl and set
   SCALER_PATH accordingly.
2. If you used a LabelEncoder for the target, place it at backend/models/label_encoder.pkl.
3. If no scaler was used, the raw DataFrame is passed directly to the model.
"""

import os
import numpy as np
import pandas as pd
from typing import Optional

# Optional: lazy-load scaler / encoder
_scaler = None
_label_encoder = None

SCALER_PATH = os.path.join(os.path.dirname(__file__), "../../../models/scaler.pkl")
LABEL_ENCODER_PATH = os.path.join(os.path.dirname(__file__), "../../../models/label_encoder.pkl")


def _load_artifact(path: str):
    """Try to load a joblib/pickle artifact; return None if not found."""
    abs_path = os.path.abspath(path)
    if not os.path.exists(abs_path):
        return None
    try:
        import joblib
        return joblib.load(abs_path)
    except Exception:
        try:
            import pickle
            with open(abs_path, "rb") as f:
                return pickle.load(f)
        except Exception:
            return None


def get_scaler():
    global _scaler
    if _scaler is None:
        _scaler = _load_artifact(SCALER_PATH)
    return _scaler


def get_label_encoder():
    global _label_encoder
    if _label_encoder is None:
        _label_encoder = _load_artifact(LABEL_ENCODER_PATH)
    return _label_encoder


def preprocess(df: pd.DataFrame) -> np.ndarray:
    """
    Apply scaling / encoding to the feature DataFrame.
    Returns a numpy array ready to be passed to model.predict().
    """
    scaler = get_scaler()
    if scaler is not None:
        try:
            X = scaler.transform(df)
        except Exception:
            X = df.values
    else:
        X = df.values

    # Final safety: replace any remaining inf/nan
    X = np.nan_to_num(X, nan=0.0, posinf=1e9, neginf=-1e9)
    return X


def decode_label(label_index) -> str:
    """Convert numeric label back to class name using LabelEncoder if available."""
    encoder = get_label_encoder()
    if encoder is not None:
        try:
            return str(encoder.inverse_transform([label_index])[0])
        except Exception:
            pass
    # Fallback mapping
    fallback = {0: "BENIGN", 1: "DoS", 2: "PortScan", 3: "BruteForce", 4: "Infiltration"}
    return fallback.get(int(label_index), str(label_index))
