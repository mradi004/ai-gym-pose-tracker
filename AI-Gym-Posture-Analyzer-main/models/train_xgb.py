import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# --- CONFIGURATION ---
CSV_PATH = '../data/exercise_classifier_form_data.csv'
MODEL_NAME = "XGBoost"

# 1. Load Data
print(f"Loading data for {MODEL_NAME}...")
df = pd.read_csv(CSV_PATH)
X = df.drop('class', axis=1)
y = df['class']

# 2. Encode Labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# 3. Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

# 4. Train XGBoost
print(f"Training {MODEL_NAME}...")
model = XGBClassifier(n_estimators=100, random_state=42, eval_metric='mlogloss')
model.fit(X_train, y_train)

# 5. Evaluate
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

print("\n" + "="*40)
print(f"RESULTS: {MODEL_NAME}")
print("="*40)
print(f"Accuracy: {acc * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# 6. Plot Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', xticklabels=le.classes_, yticklabels=le.classes_)
plt.title(f'Confusion Matrix - {MODEL_NAME}')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.show()