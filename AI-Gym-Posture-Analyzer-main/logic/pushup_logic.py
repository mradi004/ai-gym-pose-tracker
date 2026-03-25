import mediapipe as mp
import pandas as pd
from .base_corrector import BaseCorrector
from .utils import calculate_angle

mp_pose = mp.solutions.pose

class PushupCorrector(BaseCorrector):
    def __init__(self):
        super().__init__()
        # 1. Define the angle columns your new model was trained on
        self.column_names = ['left_elbow_angle', 'right_elbow_angle', 'left_hip_angle', 'right_hip_angle']

    def analyze_form(self, landmarks, model):
        # --- 1. Calculate all angles and coordinates ---
        try:
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
            l_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            r_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            # Calculate the angles
            left_elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
            right_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
            left_hip_angle = calculate_angle(l_shoulder, l_hip, l_ankle) # Back angle
            right_hip_angle = calculate_angle(r_shoulder, r_hip, r_ankle) # Back angle
            
            # Calculate average body angle (for straightness)
            body_angle = (left_hip_angle + right_hip_angle) / 2
            
        except Exception as e:
            return self.counter, "N/A", 0

        # --- 2. Rep Counting ---
        elbow_angle_avg = (left_elbow_angle + right_elbow_angle) / 2
        if elbow_angle_avg > 160: self.stage = "up"
        if self.stage == 'up' and elbow_angle_avg < 90:
            self.stage = "down"
            self.counter += 1
        
        # --- 3. ML Model Prediction (Base Accuracy) ---
        form_feedback = "Good Form"
        accuracy = 0
        
        if model:
            try:
                # Create the feature row using the calculated angles
                row = [left_elbow_angle, right_elbow_angle, left_hip_angle, right_hip_angle]
                X = pd.DataFrame([row], columns=self.column_names)
                
                prediction_proba = model.predict_proba(X)[0]
                
                # Use model's feedback as the default
                # form_feedback = prediction_class.replace('_', ' ').title()
                
                class_names = [name.lower().replace('_', '') for name in list(model.classes_)]
                if 'goodform' in class_names:
                    good_form_index = class_names.index('goodform')
                    accuracy = int(prediction_proba[good_form_index] * 100)
                else:
                    accuracy = int(max(prediction_proba) * 100)
                final_accuracy = self.smooth_accuracy(accuracy)
            except Exception as e:
                print(f"Pushup model error: {e}")
                form_feedback = "Error"
                accuracy = 0
        
        # --- 4. Rule-Based Overrides (Specific Bad Form) ---
        # We override the feedback if a specific rule is broken, and penalize the accuracy
        
        # 165 degrees allows for a slight natural curve. Anything less is likely poor form.
        if body_angle < 165: 
            # We need to distinguish between Sagging (Back Bent) and Piking (Hips Raised)
            # We do this by checking the Y-coordinate of the hip relative to the shoulder/ankle line.
            
            avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
            avg_ankle_y = (l_ankle[1] + r_ankle[1]) / 2
            avg_hip_y = (l_hip[1] + r_hip[1]) / 2
            
            # Calculate the expected Y of the hip if the body were a straight line
            midpoint_y = (avg_shoulder_y + avg_ankle_y) / 2
            
            # In MediaPipe, Y increases downwards (0 is top, 1 is bottom)
            # So, Smaller Y = Higher up on screen
            # Larger Y = Lower down on screen
            
            if avg_hip_y < midpoint_y - 0.05: 
                # Hip is physically HIGHER than the line -> Piking
                form_feedback = "Lower Hips"
                accuracy = max(0, accuracy - 30) # Heavy penalty
                
            elif avg_hip_y > midpoint_y + 0.05:
                # Hip is physically LOWER than the line -> Sagging
                form_feedback = "Don't Sag Back"
                accuracy = max(0, accuracy - 30) # Heavy penalty

        return self.counter, form_feedback, final_accuracy