# 🏋️‍♂️ FORM AI  
### AI-Powered Fitness Trainer for Perfect Exercise Form

---

## 📌 Overview
FORM AI is an intelligent fitness assistant that helps users perform exercises with correct form using AI and computer vision. It analyzes body posture in real-time, provides feedback, counts repetitions, and estimates accuracy.

The system combines Machine Learning models, rule-based logic, and pose detection to deliver precise and reliable feedback.

---

## 🚀 Features

- 🎯 Real-time exercise form correction  
- 🔢 Automatic rep counting  
- 📊 Accuracy scoring (0–100%)  
- 🧠 AI-powered feedback system  
- 💬 AI Fitness Chatbot  
- 🏋️ Supports multiple exercises:
  - Bicep Curls  
  - Push-ups  
  - Squats  
  - Shoulder Press  

---

## 🧠 Technologies Used

### 💻 Frontend
- React.js  
- Tailwind CSS  

### 🔧 Backend
- Flask (Python)  

### 🤖 AI / ML
- MediaPipe (Pose Detection)  
- Scikit-learn  
- Models used:
  - Decision Tree  
  - Random Forest  
  - SVM  
  - XGBoost  

### 🗄️ Database
- MongoDB  

### 🌐 API
- Gemini API (for chatbot)

---

## ⚙️ How It Works

1. Capture video using webcam  
2. Detect body landmarks using MediaPipe  
3. Calculate joint angles  
4. Feed angles into ML model  
5. Get prediction (Good / Bad form)  
6. Apply rule-based corrections  
7. Show feedback, accuracy, and rep count  

---

## 🧪 Machine Learning Approach

- Extracted features:
  - Elbow angles  
  - Knee angles  
  - Hip angles  

- Trained multiple models:
  - Decision Tree  
  - Random Forest  
  - SVM  
  - XGBoost  

- Compared performance and selected the best model for deployment.

---

## 💬 Chatbot Feature

- AI Fitness Coach integrated  
- Answers workout, diet, and fitness-related queries  
- Restricted to fitness-related questions only  

---

## 📂 Project Structure
project/
│── frontend/
│── backend/
│ ├── chatbot.py
│ ├── routes/
│ ├── models/
│── logic/
│ ├── curls_logic.py
│ ├── pushup_logic.py
│ ├── squat_logic.py
│ ├── shoulder_press_logic.py
│── .env
│── .gitignore
│── requirements.txt


---

## ▶️ How to Run

### 1. Clone repository
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py


---

## ✅ What to do now
1. Go to your GitHub repo  
2. Click **Add file → Create new file**  
3. Name it:  
