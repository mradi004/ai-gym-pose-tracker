from abc import ABC, abstractmethod
from collections import deque
import random

class BaseCorrector(ABC):
    def __init__(self):
        self.stage = "down"
        self.counter = 0
        self.landmarks_to_use = []
        self.column_names = []
        
        # Buffer to store the last 10 accuracy scores for smoothing
        self.accuracy_buffer = deque(maxlen=10)

    def smooth_accuracy(self, target_accuracy):
        """
        Takes a hardcoded target score (e.g., 85), adds artificial jitter,
        and returns a smoothed moving average.
        """
        # 1. Add artificial jitter (+/- 2%) to make it feel "alive"
        # If target is 100, jittered might be 98, 99, or 100.
        jitter = random.randint(-2, 2)
        jittered_score = target_accuracy + jitter
        
        # Clamp between 0 and 100 just in case
        jittered_score = max(0, min(100, jittered_score))
        
        # 2. Add to buffer
        self.accuracy_buffer.append(jittered_score)
        
        # 3. Calculate moving average
        avg_score = sum(self.accuracy_buffer) / len(self.accuracy_buffer)
        
        return int(avg_score)

    @abstractmethod
    def analyze_form(self, landmarks, model):
        pass