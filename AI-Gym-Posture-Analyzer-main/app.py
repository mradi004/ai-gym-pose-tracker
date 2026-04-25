# app.py
from flask import Flask, Response, stream_with_context, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta, timezone
import cv2
import mediapipe as mp
import json
import time
import importlib
import os
import threading
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from zoneinfo import ZoneInfo
from chatbot import chatbot_bp

# Load environment variables from .env file
load_dotenv()

# Your modular imports
from model_loader import load_models_and_encoder
from auth import token_required
from db import mongo

app = Flask(__name__)
CORS(app, supports_credentials=True)
bcrypt = Bcrypt(app)

# FIX 1: Removed url_prefix="/api" to avoid double /api/api/chat route.
# Your chatbot.py already defines the route as /api/chat,
# so registering with url_prefix="/api" was making it /api/api/chat.
app.register_blueprint(chatbot_bp)

# --- Configuration for Database and JWT ---
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

# Initialize the database connection
mongo.init_app(app)

# --- Global Variables ---
models, label_encoder = load_models_and_encoder()
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
cap = None
active_exercise = None
corrector = None
latest_data = {"reps": 0, "form": "N/A", "accuracy": 0}

# FIX 2: Thread lock to protect shared global state from race conditions
data_lock = threading.Lock()

EXERCISE_MAP = {
    "squats": ("logic.squat_logic", "SquatCorrector"),
    "pushups": ("logic.pushup_logic", "PushupCorrector"),
    "curls": ("logic.curls_logic", "CurlsCorrector"),
    "shoulder_press": ("logic.shoulderPress_logic", "ShoulderPressCorrector"),
}

# --- User Authentication Routes ---

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    age = data.get('age')
    height = data.get('height')
    weight = data.get('weight')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if mongo.db.users.find_one({'username': username}):
        return jsonify({'message': 'User already exists'}), 409

    heightInMeter = (int(height) / 100)
    bmi = int(weight) / (heightInMeter * heightInMeter)

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # FIX 3: Replaced deprecated datetime.utcnow() with datetime.now(timezone.utc)
    mongo.db.users.insert_one({
        'username': username,
        'password': hashed_password,
        'created_at': datetime.now(timezone.utc),
        'age': age,
        'height': height,
        'weight': weight,
        'bmi': bmi
    })
    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = mongo.db.users.find_one({'username': username})

    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid username or password'}), 401

    # FIX 3: Replaced deprecated datetime.utcnow() with datetime.now(timezone.utc)
    token = jwt.encode({
        'sub': user['username'],
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})


@app.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    if 'created_at' in current_user and isinstance(current_user['created_at'], datetime):
        current_user['created_at'] = current_user['created_at'].isoformat()

    if 'sessions' in current_user and isinstance(current_user['sessions'], list):
        for session in current_user['sessions']:
            if 'start_time' in session and isinstance(session['start_time'], datetime):
                session['start_time'] = session['start_time'].isoformat()
            if 'end_time' in session and isinstance(session['end_time'], datetime):
                session['end_time'] = session['end_time'].isoformat()

    return jsonify({
        'message': f'Welcome {current_user["username"]}!',
        'user_data': current_user
    })


@app.route('/update_profile', methods=['POST'])
@token_required
def update_profile(current_user):
    data = request.get_json()

    new_age = data.get('age', current_user.get('age'))
    new_height = data.get('height', current_user.get('height'))
    new_weight = data.get('weight', current_user.get('weight'))

    try:
        new_age = int(new_age)
        new_height = float(new_height)
        new_weight = float(new_weight)
    except (ValueError, TypeError):
        return jsonify({'message': 'Invalid input data types'}), 400

    new_bmi = None
    try:
        height_m = new_height / 100
        if height_m > 0:
            new_bmi = float(new_weight) / (height_m ** 2)
    except Exception:
        new_bmi = current_user.get('bmi')

    try:
        mongo.db.users.update_one(
            {'username': current_user['username']},
            {'$set': {
                'age': new_age,
                'height': new_height,
                'weight': new_weight,
                'bmi': new_bmi
            }}
        )
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({'message': 'Database error'}), 500


@app.route('/save_session', methods=['POST'])
@token_required
def save_session(current_user):
    data = request.get_json()

    start_time_str = data.get('startTime')
    end_time_str = data.get('endTime')
    exercises_performed = data.get('exercises')
    session_name = data.get('sessionName')

    if not start_time_str or not end_time_str or not isinstance(exercises_performed, list) or not exercises_performed:
        return jsonify({'message': 'Missing or invalid session data (startTime, endTime, exercises array)'}), 400

    # FIX 4: Moved total_session_reps check OUTSIDE the for loop.
    # Previously it was inside the loop, so it ran on every iteration incorrectly.
    for ex in exercises_performed:
        if not all(k in ex for k in ('exercise_name', 'reps', 'avg_accuracy', 'duration_seconds')):
            return jsonify({'message': 'Invalid structure in exercises array'}), 400

    total_session_reps = sum(ex.get('reps', 0) for ex in exercises_performed)
    if total_session_reps == 0:
        return jsonify({'message': 'No reps were performed, session not saved.'}), 400

    try:
        start_time_utc = datetime.fromisoformat(start_time_str.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
        end_time_utc = datetime.fromisoformat(end_time_str.replace("Z", "+00:00")).replace(tzinfo=timezone.utc)
        local_tz = ZoneInfo("Asia/Kolkata")
        start_time = start_time_utc.astimezone(local_tz).replace(tzinfo=None)
        end_time = end_time_utc.astimezone(local_tz).replace(tzinfo=None)
    except (ValueError, TypeError) as e:
        print(f"Timestamp parsing error: {e}")
        return jsonify({'message': 'Invalid startTime or endTime format (ISO 8601 expected)'}), 400

    session_document = {
        "start_time": start_time,
        "end_time": end_time,
        "exercises_performed": exercises_performed,
        "session_name": session_name,
    }

    try:
        result = mongo.db.users.update_one(
            {'username': current_user['username']},
            {'$push': {'sessions': session_document}}
        )

        if result.matched_count == 1:
            if result.modified_count == 1 or result.upserted_id is not None:
                return jsonify({'message': 'Workout session saved successfully'}), 200
            else:
                print(f"Session save failed for user {current_user['username']} despite match.")
                return jsonify({'message': 'Failed to modify user document'}), 500
        else:
            return jsonify({'message': 'User not found'}), 404

    except Exception as e:
        print(f"Error saving session for user {current_user['username']}: {e}")
        return jsonify({'message': 'Error saving workout session'}), 500


ALL_LANDMARKS_INDICES = list(range(33))
classifier_column_names = []
for idx in ALL_LANDMARKS_INDICES:
    name = mp_pose.PoseLandmark(idx).name
    classifier_column_names.extend([
        f'{name.lower()}_x', f'{name.lower()}_y',
        f'{name.lower()}_z', f'{name.lower()}_visibility'
    ])


def video_generator():
    global cap, latest_data, corrector, active_exercise, models, label_encoder
    cap = cv2.VideoCapture(0)

    last_predicted_exercise = None
    prediction_streak = 0
    STABILITY_THRESHOLD = 10

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)

            detected_exercise_str = None

            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark

                classifier_model = models.get('classifier')
                if classifier_model and label_encoder:
                    try:
                        row = []
                        for idx in ALL_LANDMARKS_INDICES:
                            lm = landmarks[idx]
                            row.extend([lm.x, lm.y, lm.z, lm.visibility])
                        X = pd.DataFrame([row], columns=classifier_column_names)
                        prediction_encoded = classifier_model.predict(X)[0]
                        detected_exercise_str = label_encoder.inverse_transform([prediction_encoded])[0]
                    except Exception as e:
                        print(f"Classifier error: {e}")

                if detected_exercise_str:
                    if detected_exercise_str == last_predicted_exercise:
                        prediction_streak += 1
                    else:
                        last_predicted_exercise = detected_exercise_str
                        prediction_streak = 1

                    if prediction_streak >= STABILITY_THRESHOLD:
                        if detected_exercise_str != active_exercise:
                            active_exercise = detected_exercise_str
                            if active_exercise in EXERCISE_MAP:
                                try:
                                    module_name, class_name = EXERCISE_MAP[active_exercise]
                                    ExerciseModule = importlib.import_module(module_name)
                                    CorrectorClass = getattr(ExerciseModule, class_name)
                                    corrector = CorrectorClass()
                                    print(f"--- Switched to Exercise: {active_exercise} ---")
                                    # FIX 2: Use lock when writing to latest_data
                                    with data_lock:
                                        latest_data = {"reps": 0, "form": "N/A", "accuracy": 0}
                                except Exception as e:
                                    print(f"Error switching corrector: {e}")
                                    corrector = None
                            else:
                                print(f"Warning: Corrector logic not found for '{active_exercise}'")
                                corrector = None
                else:
                    prediction_streak = 0
                    last_predicted_exercise = None

                if corrector and active_exercise:
                    try:
                        reps, form, acc = corrector.analyze_form(landmarks, models.get(active_exercise))
                        # FIX 2: Use lock when writing to latest_data
                        with data_lock:
                            latest_data = {"reps": reps, "form": form, "accuracy": acc, "exercise": active_exercise}
                    except Exception as e:
                        print(f"Analysis error for {active_exercise}: {e}")
                else:
                    with data_lock:
                        latest_data = {"reps": 0, "form": "Waiting...", "accuracy": 0, "exercise": "Detecting..."}

            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    # FIX 5: Properly release the camera instead of just setting cap = None
    if cap:
        cap.release()
        cap = None


def data_generator():
    while True:
        # FIX 2: Use lock when reading latest_data
        with data_lock:
            current_data = latest_data.copy()
        yield f"data:{json.dumps(current_data)}\n\n"
        time.sleep(0.1)


@app.route('/video')
def video():
    return Response(stream_with_context(video_generator()), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/data')
def data():
    return Response(data_generator(), mimetype='text/event-stream')


@app.route('/stop', methods=['POST'])
def stop():
    global cap, corrector, active_exercise
    # FIX 5: Properly release the camera on stop
    if cap is not None:
        cap.release()
        cap = None
    corrector = None
    active_exercise = None
    return jsonify({"status": "session stopped"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, threaded=True, debug=True, use_reloader=False)