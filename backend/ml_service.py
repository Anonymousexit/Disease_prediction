"""
ML Service - Loads trained model artifacts and provides disease prediction.
"""
import pickle
import re
import numpy as np
import pandas as pd
from pathlib import Path

ML_DIR = Path(__file__).parent.parent / "ml"
DATASET_PATH = ML_DIR / "filtered_disease_dataset.xlsx"


class MLService:
    """Loads the best ML model, label encoder, and symptom columns from the ml/ folder."""

    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.symptom_columns: list[str] = []
        self.medicine_map: dict[str, str] = {}
        self._load_model()
        self._load_medicine_map()

    def _load_model(self):
        with open(ML_DIR / "best_model.pkl", "rb") as f:
            self.model = pickle.load(f)
        with open(ML_DIR / "label_encoder.pkl", "rb") as f:
            self.label_encoder = pickle.load(f)
        with open(ML_DIR / "symptom_columns.pkl", "rb") as f:
            self.symptom_columns = pickle.load(f)
        print(f"✅ ML model loaded — {len(self.symptom_columns)} symptom features")

    def _load_medicine_map(self):
        """Build a disease → medicine lookup from the original dataset."""
        if DATASET_PATH.exists():
            df = pd.read_excel(DATASET_PATH)
            self.medicine_map = df.groupby("prognosis")["medicine"].first().to_dict()
            print(f"✅ Medicine map loaded — {len(self.medicine_map)} diseases")
        else:
            self.medicine_map = {}
            print("⚠️  Dataset not found — medicine recommendations unavailable")

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------
    def get_symptoms(self) -> list[str]:
        """Return raw symptom column names."""
        return self.symptom_columns

    @staticmethod
    def format_symptom_name(symptom: str) -> str:
        """Convert raw column name to a human-readable display label.
        
        Examples:
            pain_behind_the_eyes  → Pain Behind The Eyes
            toxic_look_(typhos)   → Toxic Look
            spotting_ urination   → Spotting Urination
        """
        name = symptom.replace("_", " ").strip()
        name = re.sub(r"\(.*?\)", "", name).strip()   # remove parenthesised text
        name = re.sub(r"\s+", " ", name)               # collapse multiple spaces
        return name.title()

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------
    # Classes to exclude from predictions (synthetic training classes)
    _EXCLUDED_CLASSES = {"Unknown"}

    def predict(self, selected_symptoms: list[str]) -> dict:
        """Run the trained model on a binary symptom vector.

        Args:
            selected_symptoms: list of raw symptom column names the patient selected.

        Returns:
            dict with disease, confidence, probabilities, medicine, requires_referral.
        """
        # Build binary input vector
        input_vector = np.zeros(len(self.symptom_columns))
        for i, col in enumerate(self.symptom_columns):
            if col in selected_symptoms:
                input_vector[i] = 1

        input_df = pd.DataFrame([input_vector], columns=self.symptom_columns)

        # Predict — get raw probabilities from the model
        probabilities = self.model.predict_proba(input_df)[0]

        # Build the full probability map (including synthetic classes)
        raw_probs = {}
        for i, cls in enumerate(self.label_encoder.classes_):
            raw_probs[cls] = float(probabilities[i])

        # Filter out excluded classes (e.g. "Unknown") and keep only real diseases
        real_probs = {cls: prob for cls, prob in raw_probs.items()
                      if cls not in self._EXCLUDED_CLASSES}

        # Re-normalise so real-disease probabilities sum to 100%
        total = sum(real_probs.values())
        if total > 0:
            all_probs = {cls: round((prob / total) * 100, 1)
                         for cls, prob in real_probs.items()}
        else:
            # Fallback: equal probability across all real diseases
            n = len(real_probs)
            all_probs = {cls: round(100 / n, 1) for cls in real_probs}

        # Sort descending by probability
        all_probs = dict(sorted(all_probs.items(), key=lambda x: x[1], reverse=True))

        # The top prediction is always a real disease
        disease_name = next(iter(all_probs))
        confidence = all_probs[disease_name]

        # Medicine recommendation
        medicine = self.medicine_map.get(disease_name, "Consult a healthcare professional")

        return {
            "disease": disease_name,
            "confidence": confidence,
            "probabilities": all_probs,
            "medicine": medicine,
            "requires_referral": confidence < 85,
        }
