"""
model_loader.py
===============
Loads the trained ML model from disk.

Supported formats: .pkl, .joblib
Place your model at: backend/models/ids_model.pkl  (or .joblib)

The loader tries both extensions automatically.
"""

import os
import logging

logger = logging.getLogger(__name__)

MODEL_PATHS = [
    os.path.join(os.path.dirname(__file__), "../../../models/ids_model.joblib"),
    os.path.join(os.path.dirname(__file__), "../../../models/ids_model.pkl"),
]

_model = None
_model_loaded = False


def load_model():
    """Load model from disk. Returns the model object or None if not found."""
    global _model, _model_loaded
    if _model_loaded:
        return _model

    for path in MODEL_PATHS:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            try:
                import joblib
                _model = joblib.load(abs_path)
                _model_loaded = True
                logger.info(f"Model loaded from {abs_path}")
                return _model
            except Exception as e:
                logger.warning(f"joblib load failed for {abs_path}: {e}")
                try:
                    import pickle
                    with open(abs_path, "rb") as f:
                        _model = pickle.load(f)
                    _model_loaded = True
                    logger.info(f"Model loaded (pickle) from {abs_path}")
                    return _model
                except Exception as e2:
                    logger.error(f"pickle load also failed: {e2}")

    logger.warning("No trained model found. Using fallback heuristic predictor.")
    _model_loaded = True
    _model = None
    return None


def get_model():
    return load_model()


def model_supports_proba() -> bool:
    """Check if model has predict_proba method."""
    m = get_model()
    return m is not None and hasattr(m, "predict_proba")


def get_model_classes():
    """Return class labels if available."""
    m = get_model()
    if m is not None and hasattr(m, "classes_"):
        return list(m.classes_)
    return None
