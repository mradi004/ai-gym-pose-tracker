import mediapipe as mp
import pandas as pd
from .base_corrector import BaseCorrector
from .utils import calculate_angle

mp_pose = mp.solutions.pose

class SquatCorrector(BaseCorrector):
    def __init__(self):
        super().__init__()
        # 1. Define the angle columns for the ML model
        self.column_names = [
            'left_knee_angle', 'right_knee_angle', 
            'left_hip_angle', 'right_hip_angle',
            
        ]
        # --- NEW: State for smart depth checking ---
        self.prev_knee_angle = 180 # Initialize as standing
        self.has_hit_depth = False # Track if depth was hit this rep

    def analyze_form(self, landmarks, model):
        form_feedback = "N/A"
        accuracy = 0
        penalty = 0

        # --- 1. Calculate all angles ---
        try:
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
            l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
            l_foot = [landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].x, landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].y]
            r_foot = [landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]

            left_knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            right_knee_angle = calculate_angle(r_hip, r_knee, r_ankle)
            left_hip_angle = calculate_angle(l_shoulder, l_hip, l_knee)
            right_hip_angle = calculate_angle(r_shoulder, r_hip, r_knee)
            left_ankle_angle = calculate_angle(l_knee, l_ankle, l_foot)
            right_ankle_angle = calculate_angle(r_knee, r_ankle, r_foot)

        except Exception as e:
            return self.counter, "N/A", 0 

        # --- 2. Rep Counting & Smart Rule Feedback ---
        knee_angle_avg = (left_knee_angle + right_knee_angle) / 2
        hip_angle_avg = (left_hip_angle + right_hip_angle) / 2

        form_feedback = "Good Form"
        
        # Check for standing position (Reset)
        if hip_angle_avg > 160 and knee_angle_avg > 160: 
            self.stage = "up"
        
        # Check for start of descent
        if self.stage == "up" and hip_angle_avg < 150: 
            self.stage = "down"
            self.has_hit_depth = False # New rep started, reset depth flag
        
        if self.stage == "down":
            # 1. Check if depth is hit
            if knee_angle_avg < 90: 
                self.has_hit_depth = True
            
            # 2. Determine Feedback
            if self.has_hit_depth:
                form_feedback = "Good Depth"
            else:
                # We haven't hit depth yet. Are we still moving down?
                # If previous angle (150) - current angle (140) is positive, we are descending.
                # We use a small threshold (1.0) to ignore tiny jitters.
                is_descending = (self.prev_knee_angle - knee_angle_avg) > 0.5

                if is_descending:
                    # User is actively going down. Don't complain.
                    form_feedback = "Good Form" 
                else:
                    # User has stopped descending or is coming up, BUT hasn't hit depth.
                    form_feedback = "Go Deeper"
                    penalty += 30 
            
            # 3. Check Chest (Back Angle) - Always active
            if hip_angle_avg < 50: 
                form_feedback = "Keep Chest Up"
                penalty += 20 
        
        # Count Rep
        if self.stage == "down" and knee_angle_avg > 160:
            self.stage = "up"
            self.counter += 1
        
        # Update previous angle for next frame
        self.prev_knee_angle = knee_angle_avg

        # --- 3. ML Model + Penalty Application ---
        accuracy = 0
        if model:
            try:
                row = [
                    left_knee_angle, right_knee_angle,
                    left_hip_angle, right_hip_angle,
                    
                ]
                X = pd.DataFrame([row], columns=self.column_names)
                
                prediction_proba = model.predict_proba(X)[0]
                class_names = [name.lower().replace('_', '') for name in list(model.classes_)]
                
                if 'goodform' in class_names:
                    good_form_index = class_names.index('goodform')
                    accuracy = int(prediction_proba[good_form_index] * 100)
                else:
                    accuracy = int(max(prediction_proba) * 100)
                
                # Apply Penalty
                accuracy = max(0, accuracy - penalty)
                
                # Smooth the result
                accuracy = self.smooth_accuracy(accuracy)
                
            except Exception as e:
                print(f"Squat model error: {e}")
                accuracy = 0
        else:
            form_feedback = "Model not loaded"
            accuracy = 0
        
        return self.counter, form_feedback, accuracy