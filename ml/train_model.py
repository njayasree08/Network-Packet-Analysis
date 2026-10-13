"""
train_model.py
==============
PacketSentinel ML Pipeline Trainer.
Trains XGBoost (primary) and scikit-learn baseline classifiers (Random Forest, Decision Tree).
Explicitly handles class imbalance via balanced sample weighting and class weights.
Saves model artifacts, confusion matrices, feature importances, and benchmarks to backend/models/
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    accuracy_score,
)
from sklearn.utils.class_weight import compute_sample_weight
import joblib

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset/sample_dataset.csv")
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/models"))
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_OUT = os.path.join(MODEL_DIR, "ids_model.joblib")
SCALER_OUT = os.path.join(MODEL_DIR, "scaler.pkl")
ENCODER_OUT = os.path.join(MODEL_DIR, "label_encoder.pkl")
METRICS_OUT = os.path.join(MODEL_DIR, "metrics.json")
IMPORTANCE_OUT = os.path.join(MODEL_DIR, "feature_importances.json")
BENCHMARKS_OUT = os.path.join(MODEL_DIR, "benchmarks.json")

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
LABEL_COL = "Label"


def main():
    if not os.path.exists(DATASET_PATH):
        print(f"[*] Dataset not found at {DATASET_PATH}. Running generate_dataset.py first...")
        from generate_dataset import main as gen_main
        gen_main()

    print("[*] Loading PacketSentinel flow dataset...")
    df = pd.read_csv(DATASET_PATH)
    print(f"    Total flows: {len(df)}")
    print(f"    Class distribution:\n{df[LABEL_COL].value_counts().to_string()}")

    X = df[FEATURE_COLS].copy()
    y = df[LABEL_COL].copy()

    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(0, inplace=True)

    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    classes = list(le.classes_)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    sample_weights_train = compute_sample_weight("balanced", y_train)

    print("\n[*] Training Primary Model: XGBoost Classifier with Class Imbalance Weighting...")
    xgb_clf = XGBClassifier(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="mlogloss",
    )
    xgb_clf.fit(X_train_s, y_train, sample_weight=sample_weights_train)
    xgb_preds = xgb_clf.predict(X_test_s)

    xgb_report = classification_report(y_test, xgb_preds, target_names=classes, output_dict=True)
    xgb_cm = confusion_matrix(y_test, xgb_preds).tolist()
    xgb_acc = accuracy_score(y_test, xgb_preds)

    print("\n[+] XGBoost Classification Report:")
    print(classification_report(y_test, xgb_preds, target_names=classes))

    print("\n[*] Training Baseline Models for Benchmarking...")
    # Random Forest Baseline
    rf_clf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
    rf_clf.fit(X_train_s, y_train)
    rf_preds = rf_clf.predict(X_test_s)
    rf_acc = accuracy_score(y_test, rf_preds)
    rf_p, rf_r, rf_f1, _ = precision_recall_fscore_support(y_test, rf_preds, average="weighted")

    # Decision Tree Baseline
    dt_clf = DecisionTreeClassifier(class_weight="balanced", random_state=42)
    dt_clf.fit(X_train_s, y_train)
    dt_preds = dt_clf.predict(X_test_s)
    dt_acc = accuracy_score(y_test, dt_preds)
    dt_p, dt_r, dt_f1, _ = precision_recall_fscore_support(y_test, dt_preds, average="weighted")

    xgb_p, xgb_r, xgb_f1, _ = precision_recall_fscore_support(y_test, xgb_preds, average="weighted")

    # Save primary model, scaler, encoder
    joblib.dump(xgb_clf, MODEL_OUT)
    joblib.dump(scaler, SCALER_OUT)
    joblib.dump(le, ENCODER_OUT)

    # Save detailed XGBoost & Class-imbalance metrics
    per_class_metrics = {}
    for cls_name in classes:
        per_class_metrics[cls_name] = {
            "precision": round(xgb_report[cls_name]["precision"], 4),
            "recall": round(xgb_report[cls_name]["recall"], 4),
            "f1_score": round(xgb_report[cls_name]["f1-score"], 4),
            "support": int(xgb_report[cls_name]["support"]),
        }

    metrics_payload = {
        "primary_model": "XGBoost Classifier",
        "classes": classes,
        "overall_accuracy": round(xgb_acc, 4),
        "weighted_precision": round(xgb_p, 4),
        "weighted_recall": round(xgb_r, 4),
        "weighted_f1": round(xgb_f1, 4),
        "confusion_matrix": xgb_cm,
        "per_class": per_class_metrics,
        "class_counts": df[LABEL_COL].value_counts().to_dict(),
    }
    with open(METRICS_OUT, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    # Save XGBoost Feature Importances
    importances = xgb_clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = [
        {"feature": FEATURE_COLS[i], "importance": round(float(importances[i]), 5)}
        for i in sorted_idx[:25]
    ]
    with open(IMPORTANCE_OUT, "w") as f:
        json.dump(top_features, f, indent=2)

    # Save Benchmarks
    benchmarks_payload = {
        "models": [
            {
                "name": "XGBoost (Class-Weighted)",
                "accuracy": round(xgb_acc, 4),
                "precision": round(xgb_p, 4),
                "recall": round(xgb_r, 4),
                "f1_score": round(xgb_f1, 4),
                "is_primary": True,
            },
            {
                "name": "Random Forest (Balanced)",
                "accuracy": round(rf_acc, 4),
                "precision": round(rf_p, 4),
                "recall": round(rf_r, 4),
                "f1_score": round(rf_f1, 4),
                "is_primary": False,
            },
            {
                "name": "Decision Tree (Balanced)",
                "accuracy": round(dt_acc, 4),
                "precision": round(dt_p, 4),
                "recall": round(dt_r, 4),
                "f1_score": round(dt_f1, 4),
                "is_primary": False,
            },
        ]
    }
    with open(BENCHMARKS_OUT, "w") as f:
        json.dump(benchmarks_payload, f, indent=2)

    print(f"\n[OK] Primary XGBoost Model saved -> {MODEL_OUT}")
    print(f"[OK] Scaler saved -> {SCALER_OUT}")
    print(f"[OK] Encoder saved -> {ENCODER_OUT}")
    print(f"[OK] Metrics saved -> {METRICS_OUT}")
    print(f"[OK] Feature importances saved -> {IMPORTANCE_OUT}")
    print(f"[OK] Benchmarks saved -> {BENCHMARKS_OUT}")


if __name__ == "__main__":
    main()
