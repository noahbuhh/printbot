import time
import pigpio
from flask import Flask, request, jsonify

# Initialize Flask for a simple API
app = Flask(__name__)

# Connect to the pigpio daemon
pi = pigpio.pi()

# Servo GPIO pin
SERVO_PIN = 18

# Open/Close Positions (adjustable via /settings)
settings = {
    "open_position": 1900,
    "close_position": 2500
}

def move_servo(position):
    """Move the servo to the given position."""
    if pi.connected:
        pi.set_servo_pulsewidth(SERVO_PIN, position)
        time.sleep(1)
        pi.set_servo_pulsewidth(SERVO_PIN, 0)
        return f"Servo moved to {position}"
    else:
        return "pigpio daemon not running!"

@app.route('/open', methods=['GET'])
def open_door():
    return move_servo(settings["open_position"])

@app.route('/close', methods=['GET'])
def close_door():
    return move_servo(settings["close_position"])

@app.route('/settings', methods=['GET'])
def get_settings():
    return jsonify(settings)

@app.route('/settings', methods=['POST'])
def update_settings():
    data = request.get_json()
    if "open_position" in data:
        settings["open_position"] = int(data["open_position"])
    if "close_position" in data:
        settings["close_position"] = int(data["close_position"])
    return jsonify(settings)

if __name__ == "__main__":
    print("Starting door motor API...")
    app.run(host='0.0.0.0', port=3000)
