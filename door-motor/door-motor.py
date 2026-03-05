import time
import lgpio
from flask import Flask, request, jsonify

app = Flask(__name__)

# Open GPIO chip — no daemon required, works directly on /dev/gpiochip0
CHIP = lgpio.gpiochip_open(0)
print("lgpio: GPIO chip 0 opened")

settings = {
    "open_position": 1900,
    "close_position": 2500
}

def move_servo(pin, position):
    lgpio.gpio_claim_output(CHIP, pin, 0)
    lgpio.tx_servo(CHIP, pin, position)
    time.sleep(1)
    lgpio.gpio_free(CHIP, pin)  # release pin to stop servo pulses

@app.route('/open', methods=['GET'])
def open_door():
    move_servo(18, settings["open_position"])
    return f"Servo moved to {settings['open_position']}"

@app.route('/close', methods=['GET'])
def close_door():
    move_servo(18, settings["close_position"])
    return f"Servo moved to {settings['close_position']}"

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

@app.route('/servo/<int:pin>/move', methods=['POST'])
def move_servo_pin(pin):
    data = request.get_json(force=True)
    position = int(data.get('position', 0))
    move_servo(pin, position)
    return jsonify({'pin': pin, 'position': position})

if __name__ == "__main__":
    print("Starting door motor API (lgpio)...")
    app.run(host='0.0.0.0', port=3000)
