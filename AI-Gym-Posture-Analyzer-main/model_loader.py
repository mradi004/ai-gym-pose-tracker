# model_loader.py
import pickle
import os

def load_models_and_encoder():
    """Loads all .pkl models and the label encoder from the ./models/ directory."""
    models = {}
    label_encoder = None
    models_dir = './models'
    print("Loading models and encoder...")
    
    try:
        if not os.path.isdir(models_dir):
            print(f"Error: Models directory '{models_dir}' not found.")
            return models, label_encoder # Return empty if directory missing

        for filename in os.listdir(models_dir):
            if filename.endswith('.pkl'):
                filepath = os.path.join(models_dir, filename)
                
                try:
                    # Explicitly check for the classifier model file
                    if filename == 'exerciseClassifier_model.pkl':
                        with open(filepath, 'rb') as f:
                            models['classifier'] = pickle.load(f)
                            print("  - Loaded Exercise Classifier")
                            
                    # Explicitly check for the label encoder file
                    elif filename == 'exercise_classifier_label_encoder.pkl':
                        with open(filepath, 'rb') as f:
                            label_encoder = pickle.load(f)
                            print("  - Loaded Label Encoder")
                            
                    # Handle all other files ending in _form_model.pkl
                    elif filename.endswith('_form_model.pkl'):
                        # Derive the base name (e.g., "squats", "pushups", "shoulderPress", "curls")
                        base_name = filename.replace('_form_model.pkl', '')
                        
                        # --- Standardize the key ---
                        # Convert camelCase like shoulderPress to shoulder_press
                        # Keep simple names like squats as squats (but add 's' if needed - adjust logic if your files are singular)
                        exercise_key = base_name # Start with the base name
                        
                        # Specific handling for known variations if needed
                        if base_name == "shoulderPress":
                           exercise_key = "shoulder_press" # Match classifier/EXERCISE_MAP
                        else:
                           # General rule: lowercase and add 's' if it's likely plural
                           exercise_key = base_name.lower()
                           # Example: if your file is squat_form_model.pkl, make the key 'squats'
                           # Adjust this logic based on your exact filenames and desired keys in EXERCISE_MAP
                           if exercise_key in ["squat", "pushup", "curl"]: # Check if it's a known singular form
                               exercise_key += "s" 

                        # Load the model with the derived key
                        with open(filepath, 'rb') as f:
                            models[exercise_key] = pickle.load(f)
                            print(f"  - Loaded model for '{exercise_key}' (from {filename})")
                            
                except Exception as load_error:
                     print(f"  - Error loading file {filename}: {load_error}")


        print("Loading complete.")
        
        # Final checks
        if 'classifier' not in models:
             print("Warning: Classifier model was not found or failed to load.")
        if label_encoder is None:
             print("Warning: Label encoder was not found or failed to load.")
             
    except Exception as e:
        print(f"General error during model loading: {e}")
        
    return models, label_encoder