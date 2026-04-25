from flask import Blueprint, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get("message")

    if not user_message:
        return jsonify({"reply": "No message received"}), 400

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    # ✅ FIXED MODEL (THIS IS THE KEY CHANGE)
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [
            {
                "parts": [{"text": user_message}]
            }
        ]
    }

    try:
        print("Calling Gemini API...")
        response = requests.post(url, json=payload, headers=headers)

        print("Status:", response.status_code)
        print("Response:", response.text)

        if response.status_code != 200:
            return jsonify({"reply": "AI failed to respond"}), 500

        result = response.json()
        reply = result['candidates'][0]['content']['parts'][0]['text']

        return jsonify({"reply": reply})

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"reply": "Server error"}), 500