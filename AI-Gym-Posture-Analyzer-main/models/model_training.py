import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier

# --- CONFIGURATION ---
# Path to the dataset created with ALL_LANDMARKS
CSV_PATH = '../data/exercise_classifier_form_data.csv' 

# Output directory for models
OUTPUT_DIR = './'

# ==============================================================================
# 1. Load Data
# ==============================================================================
if not os.path.exists(CSV_PATH):
    print(f"Error: Dataset not found at {CSV_PATH}")
    exit()

print(f"Loading dataset from {CSV_PATH}...")
df = pd.read_csv(CSV_PATH)
print(f"Dataset loaded. Rows: {len(df)}")
print(f"Class distribution:\n{df['class'].value_counts()}")

# ==============================================================================
# 2. Preprocess Data
# ==============================================================================
X = df.drop('class', axis=1)
y = df['class']

# Encode string labels (squats, pushups...) into numbers (0, 1...)
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print(f"\nClasses detected: {list(label_encoder.classes_)}")
print(f"Mapping: {dict(zip(label_encoder.classes_, label_encoder.transform(label_encoder.classes_)))}")

# Split into training and testing sets
# stratify=y ensures each class is represented equally in train and test sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# ==============================================================================
# 3. Train XGBoost Model
# ==============================================================================
print("\nTraining XGBoost Classifier...")
# n_estimators=100: Number of trees
# eval_metric='mlogloss': Standard metric for multi-class classification
model = XGBClassifier(n_estimators=100, random_state=42, eval_metric='mlogloss')
model.fit(X_train, y_train)
print("Training complete.")

# ==============================================================================
# 4. Evaluate
# ==============================================================================
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n" + "="*30)
print(f"MODEL ACCURACY: {accuracy * 100:.2f}%")
print("="*30)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

# ==============================================================================
# 5. Save Model and Encoder
# ==============================================================================
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Save the model
model_path = os.path.join(OUTPUT_DIR, 'exerciseClassifier_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(model, f)
print(f"\nSaved model to: {model_path}")

# CRITICAL: Save the label encoder so the app knows that 0='squats', etc.
encoder_path = os.path.join(OUTPUT_DIR, 'exercise_classifier_label_encoder.pkl')
with open(encoder_path, 'wb') as f:
    pickle.dump(label_encoder, f)
print(f"Saved label encoder to: {encoder_path}")

print("\nDone! You can now run app.py.")