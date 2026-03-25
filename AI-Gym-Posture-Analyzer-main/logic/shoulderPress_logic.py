import mediapipe as mp
import pandas as pd
from .base_corrector import BaseCorrector
from .utils import calculate_angle

mp_pose = mp.solutions.pose

class ShoulderPressCorrector(BaseCorrector):
    def __init__(self):
        super().__init__()
        self.stage = "down"
        self.column_names = [
            'left_elbow_angle', 'right_elbow_angle',
            'left_back_angle', 'right_back_angle'
        ]
        # --- NEW: State for smart motion detection ---
        self.prev_elbow_angle = 0 

    def analyze_form(self, landmarks, model):
        form_feedback = "N/A"
        accuracy = 0
        penalty = 0

        # --- 1. Calculate all angles and coordinates ---
        try:
            l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
            l_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            r_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]

            # Calculate Angles
            left_elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
            right_elbow_angle = calculate_angle(r_shoulder, r_elbow, r_wrist)
            left_shoulder_angle = calculate_angle(l_hip, l_shoulder, l_elbow)
            right_shoulder_angle = calculate_angle(r_hip, r_shoulder, r_elbow)
            
            # Average angles for stability
            elbow_angle_avg = (left_elbow_angle + right_elbow_angle) / 2
            shoulder_angle_avg = (left_shoulder_angle + right_shoulder_angle) / 2
            
            # Coordinates for Flare Check
            l_elbow_x = l_elbow[0]
            l_wrist_x = l_wrist[0]
            r_elbow_x = r_elbow[0]
            r_wrist_x = r_wrist[0]

            shoulder_width = abs(l_shoulder[0] - r_shoulder[0])

            # Coordinates for Rep Counting
            wrist_y_avg = (l_wrist[1] + r_wrist[1]) / 2
            shoulder_y_avg = (l_shoulder[1] + r_shoulder[1]) / 2
            
        except Exception as e:
            return self.counter, "N/A", 0

        # --- 2. Motion Detection Logic ---
        # Positive diff = Opening arms (Pushing Up)
        # Negative diff = Closing arms (Coming Down)
        # We use a small threshold (0.5) to filter out jitter
        is_pushing_up = (elbow_angle_avg - self.prev_elbow_angle) > 0.7
        is_coming_down = (self.prev_elbow_angle - elbow_angle_avg) > 0.7

        form_feedback = "Good Form"

        # --- 3. Rep Counting ---
        if elbow_angle_avg < 100: 
            self.stage = "down"
            
        # Arm straight AND overhead
        if self.stage == 'down' and elbow_angle_avg > 160 and wrist_y_avg < shoulder_y_avg:
            self.stage = "up"
            self.counter += 1
        
        # --- 4. Smart Rule-Based Feedback ---
    

        # Rule 2: Elbow Flare (Check continuously)
        flare_tolerance = shoulder_width * 0.3
        if shoulder_width > 0:
            left_flare = abs(l_elbow_x - l_wrist_x)
            right_flare = abs(r_elbow_x - r_wrist_x)
            if left_flare > flare_tolerance or right_flare > flare_tolerance:
                form_feedback = "Keep Forearms Vertical"
                penalty += 20

        # Rule 3: Range of Motion (With Motion Detection)
        if form_feedback == "Good Form": # Only check ROM if form is otherwise good
            
            # Case A: User is going UP (Pressing)
            # Goal: Lock out arms (elbow angle > 160)
            if self.stage == "down":
                # We are in the 'down' state, meaning the rep has started.
                # We should be pushing up towards > 160.
                if elbow_angle_avg < 160: # Not locked out yet
                    if elbow_angle_avg > 120: # Past the difficult middle part
                        if not is_pushing_up:
                            # User has stalled near the top
                            form_feedback = "Lock Out Arms"
                            penalty += 15
            
            # Case B: User is going DOWN (Resetting)
            # Goal: Go deep (elbow angle < 90, or hands near shoulders)
            elif self.stage == "up":
                 # We are in the 'up' state, rep is finished.
                 # We should be coming down towards the start position.
                 # Shoulder angle is a better proxy for depth here than elbow angle
                # print("shoulder angle:",shoulder_angle_avg)
                if shoulder_angle_avg < 170: # Arms are still high
                     if not is_coming_down:
                         # User stalled high up
                         form_feedback = "Go Deeper"
                         penalty += 15

        # Update previous angle for next frame
        self.prev_elbow_angle = elbow_angle_avg

        # --- 5. ML Model Prediction (ACCURACY ONLY) ---
        target_accuracy = max(0, 100 - penalty)
        accuracy = self.smooth_accuracy(target_accuracy)
        
        return self.counter, form_feedback, accuracy