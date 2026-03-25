# logic/curls_logic.py
import mediapipe as mp
import pandas as pd
from .base_corrector import BaseCorrector
from .utils import calculate_angle

mp_pose = mp.solutions.pose

class CurlsCorrector(BaseCorrector):
    def __init__(self):
        super().__init__()
        self.stage = "down" # Start with arms down for curls
        self.baseline_l_shoulder_angle = None
        self.baseline_r_shoulder_angle = None
        
        self.column_names = ['left_elbow_angle', 'right_elbow_angle', 'left_shoulder_swing_angle', 'right_shoulder_swing_angle']

    def analyze_form(self, landmarks, model):
        # --- 1. Calculate all angles ---
        try:
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            l_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            r_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            left_elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
            right_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
            left_shoulder_swing_angle = calculate_angle(l_hip, l_shoulder, l_elbow)
            right_shoulder_swing_angle = calculate_angle(r_hip, r_shoulder, r_elbow)
        except Exception as e:
            return self.counter, "N/A", 0

        # --- 2. Rep Counting & Form Logic ---
        elbow_angle_avg = (left_elbow_angle + right_elbow_angle) / 2
        
        form_feedback = "Good Form"
        accuracy = 0
        penalty = 0
        

        # --- Rep Counting Logic ---
        if elbow_angle_avg > 160: # Arms are straight down
            self.stage = "down"
            if self.baseline_l_shoulder_angle is None: 
                self.baseline_l_shoulder_angle = left_shoulder_swing_angle
                self.baseline_r_shoulder_angle = right_shoulder_swing_angle

        if self.stage == 'down' and elbow_angle_avg < 70: # Arms are fully curled
            self.stage = "up"
            self.counter += 1
        
        # --- Form Correction Logic ---
        # We check for errors during the entire rep
        if (self.stage == "up" or self.stage == "down"):
            
            # --- NEW: Rule 1: Check for Elbow Flare ---
            # We check the horizontal distance between elbow and hip
            l_elbow_x = l_elbow[0]
            l_hip_x = l_hip[0]
            r_elbow_x = r_elbow[0]
            r_hip_x = r_hip[0]
            l_wrist_x = l_wrist[0]
            r_wrist_x = r_wrist[0]
            
            left_flare_distance = abs(l_elbow_x - l_hip_x)
            right_flare_distance = abs(r_elbow_x - r_hip_x)

            left_wrist_flare_distance = abs(l_wrist_x - l_hip_x)
            right_wrist_flare_distance = abs(r_wrist_x - r_hip_x)
            
            # Set a tolerance (e.g., 0.1 is ~10% of screen width)
            # You can adjust this tolerance to be stricter (0.08) or looser (0.15)
            FLARE_TOLERANCE = 0.1 
            
            if left_flare_distance > FLARE_TOLERANCE or right_flare_distance > FLARE_TOLERANCE:
                form_feedback = "Keep Elbows In"
                penalty += 40 # Apply a penalty
            if left_wrist_flare_distance > FLARE_TOLERANCE or right_wrist_flare_distance > FLARE_TOLERANCE:
                form_feedback = "Keep Arms Close"
                penalty += 20
        
        # Ensure accuracy doesn't go negative
        target_accuracy = max(0, 100 - penalty)
        accuracy = self.smooth_accuracy(target_accuracy)
        return self.counter, form_feedback, accuracy