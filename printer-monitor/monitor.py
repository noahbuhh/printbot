import ftplib
import json
import os
import socket
import ssl
import threading
import time
import uuid
from flask import Flask, jsonify, request
import paho.mqtt.client as mqtt
import requests

app = Flask(__name__)

DATA_FILE = '/data/printers.json'
DOOR_MOTOR_URL = 'http://door-motor:3000'

config_lock = threading.Lock()
state_lock = threading.Lock()

# List of printer config dicts
# {id, name, ip, serial, access_code, temp_threshold, gpio_pin, open_position, close_position}
printers = []

# Map of printer_id -> live state dict
# {bed_temp, nozzle_temp, gcode_state, servo_open, connected}
live_state = {}

# Map of printer_id -> mqtt client
mqtt_clients = {}


def load_config():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            return json.load(f)
    return []


def save_config():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(printers, f, indent=2)


def call_servo(pin, position):
    try:
        requests.post(
            f"{DOOR_MOTOR_URL}/servo/{pin}/move",
            json={'position': position},
            timeout=5,
        )
    except Exception as e:
        app.logger.error(f"Servo call failed pin={pin}: {e}")


class _ImplicitFTPS(ftplib.FTP_TLS):
    """FTP_TLS subclass that wraps the socket in SSL immediately (implicit FTPS, port 990)."""
    def connect(self, host='', port=0, timeout=-999, source_address=None):
        if host:
            self.host = host
        if port > 0:
            self.port = port
        if timeout != -999:
            self.timeout = timeout
        sock = socket.create_connection((self.host, self.port), self.timeout)
        self.sock = self.context.wrap_socket(sock, server_hostname=self.host)
        self.af = self.sock.family
        self.file = self.sock.makefile('r', encoding=self.encoding)
        self.welcome = self.getresp()
        return self.welcome


def list_ftp_files(printer):
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    ftp = _ImplicitFTPS(context=ctx)
    try:
        ftp.connect(printer['ip'], 990, timeout=10)
        ftp.login('bblp', printer['access_code'])
        ftp.prot_p()

        # Try common Bambu paths; track which one worked
        entries = []
        found_path = ''
        for path in ['/sdcard', '/sdcard/', '']:
            try:
                result = ftp.nlst(path) if path else ftp.nlst()
                if result is not None:
                    entries = result
                    found_path = path
                    break
            except ftplib.error_perm:
                continue

        print(f"[FTP] path='{found_path}' entries={entries}", flush=True)
        ftp.quit()
    except Exception as e:
        raise RuntimeError(f"FTP error: {e}")

    # Return {name, url} so the frontend can pass the correct ftp:// URL
    files = []
    for entry in entries:
        name = entry.split('/')[-1] if '/' in entry else entry
        if not (name.endswith('.3mf') or name.endswith('.gcode')):
            continue
        # Build the ftp URL from the actual entry path returned by the server
        if entry.startswith('/'):
            url = f"ftp://{entry}"
        else:
            url = f"ftp:///{found_path.strip('/')}/{name}".replace('///', '/')
        files.append({'name': name, 'url': url})
    return files


def send_print_command(printer, file_url, subtask_name):
    payload = {
        "print": {
            "sequence_id": str(int(time.time())),
            "command": "project_file",
            "param": "Metadata/plate_1.gcode",
            "url": file_url,
            "subtask_name": subtask_name,
            "bed_type": "auto",
            "timelapse": False,
            "bed_leveling": True,
            "flow_cali": False,
            "vibration_cali": True,
            "layer_inspect": False,
            "use_ams": False,
        }
    }
    client = mqtt_clients.get(printer['id'])
    if client:
        client.publish(f"device/{printer['serial']}/request", json.dumps(payload))
        print(f"[LOOP] print sent → {printer['name']} serial={printer['serial']} url={file_url}", flush=True)
    else:
        print(f"[LOOP] ERROR no MQTT client for printer {printer['id']}", flush=True)


def start_loop_timer(pid, gen, delay=300):
    def run():
        deadline = time.time() + delay
        while time.time() < deadline:
            time.sleep(1)
            with state_lock:
                s = live_state.get(pid)
                if s is None or not s.get('loop_enabled') or s.get('loop_gen') != gen:
                    return
        with state_lock:
            s = live_state.get(pid)
            if s is None or not s.get('loop_enabled') or s.get('loop_gen') != gen:
                return
            file_url = s.get('loop_file')
            subtask  = s.get('loop_subtask', 'loop_print')
            s['loop_phase']   = 'printing'
            s['loop_next_at'] = None
        with config_lock:
            printer = next((p for p in printers if p['id'] == pid), None)
        if printer and file_url:
            send_print_command(printer, file_url, subtask)
    threading.Thread(target=run, daemon=True).start()


def make_mqtt_client(printer):
    pid = printer['id']

    OVERRIDE_SECONDS = 10

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            with state_lock:
                if pid in live_state:
                    live_state[pid]['connected'] = True
            client.subscribe(f"device/{printer['serial']}/report")
        else:
            app.logger.warning(f"Printer {pid} MQTT connect failed rc={rc}")

    def on_message(client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
        except Exception:
            return

        print_data = payload.get('print', {})
        loop_trigger = None

        with state_lock:
            state = live_state.setdefault(pid, {
                'bed_temp': None,
                'nozzle_temp': None,
                'gcode_state': None,
                'servo_open': None,
                'connected': True,
            })
            if 'bed_temper' in print_data:
                state['bed_temp'] = round(print_data['bed_temper'], 1)
            if 'nozzle_temper' in print_data:
                state['nozzle_temp'] = round(print_data['nozzle_temper'], 1)
            if 'mc_percent' in print_data:
                state['mc_percent'] = round(float(print_data['mc_percent']), 1)
            if 'mc_remaining_time' in print_data:
                state['mc_remaining_time'] = int(print_data['mc_remaining_time'])
            if 'gcode_state' in print_data:
                prev_gstate = state.get('gcode_state')
                new_gstate = print_data['gcode_state']
                state['gcode_state'] = new_gstate
                if new_gstate == 'FINISH' and prev_gstate != 'FINISH':
                    state['finish_time'] = time.time()
                elif prev_gstate == 'FINISH' and new_gstate != 'FINISH':
                    state['finish_time'] = None

                ACTIVE = {'RUNNING', 'PREPARE', 'PAUSE'}
                DONE   = {'FINISH', 'FAILED'}
                prev_u = (prev_gstate or '').upper()
                new_u  = (new_gstate  or '').upper()
                ended  = (new_u in DONE   and prev_u not in DONE) \
                      or (not new_u        and prev_u in ACTIVE)
                if ended and state.get('loop_enabled'):
                    state['loop_phase']   = 'waiting'
                    state['loop_next_at'] = time.time() + 300
                    loop_trigger = (pid, state.get('loop_gen', 0))

            bed_temp = state['bed_temp']
            current_servo_open = state['servo_open']

        if loop_trigger:
            start_loop_timer(loop_trigger[0], loop_trigger[1], 300)

        if bed_temp is None:
            return

        # Skip auto-control while a manual override is active
        with state_lock:
            override_until = live_state.get(pid, {}).get('override_until', 0)
        if time.time() < override_until:
            return

        with config_lock:
            p = next((p for p in printers if p['id'] == pid), None)
            if p is None:
                return
            threshold = p['temp_threshold']
            pin = p.get('gpio_pin')
            open_pos = p.get('open_position', 1900)
            close_pos = p.get('close_position', 2500)

        if pin is None:
            return

        target_open = bed_temp < threshold

        if target_open == current_servo_open:
            return  # no state change, do nothing

        with state_lock:
            if pid in live_state:
                live_state[pid]['servo_open'] = target_open

        position = open_pos if target_open else close_pos
        threading.Thread(
            target=call_servo, args=(pin, position), daemon=True
        ).start()

    def on_disconnect(client, userdata, rc):
        with state_lock:
            if pid in live_state:
                live_state[pid]['connected'] = False

    client = mqtt.Client()
    client.username_pw_set('bblp', printer['access_code'])
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect_async(printer['ip'], 8883, keepalive=60)
    client.loop_start()
    return client


def connect_printer(printer):
    pid = printer['id']
    with state_lock:
        live_state[pid] = {
            'bed_temp': None,
            'nozzle_temp': None,
            'gcode_state': None,
            'servo_open': None,
            'connected': False,
            'override_until': 0,
            'loop_enabled': False,
            'loop_file': None,
            'loop_subtask': None,
            'loop_phase': None,
            'loop_next_at': None,
            'loop_gen': 0,
        }
    mqtt_clients[pid] = make_mqtt_client(printer)


def disconnect_printer(pid):
    client = mqtt_clients.pop(pid, None)
    if client:
        client.loop_stop()
        client.disconnect()
    with state_lock:
        live_state.pop(pid, None)


# ── REST API ────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/printers', methods=['GET'])
def get_printers():
    with config_lock:
        cfg = list(printers)
    with state_lock:
        states = dict(live_state)
    result = []
    for p in cfg:
        entry = dict(p)
        entry['state'] = states.get(p['id'], {})
        result.append(entry)
    return jsonify(result)


@app.route('/printers', methods=['POST'])
def add_printer():
    data = request.get_json(force=True)
    required = ('name', 'ip', 'serial', 'access_code', 'temp_threshold', 'gpio_pin')
    if not all(k in data for k in required):
        return jsonify({'error': f'Missing fields: {list(required)}'}), 400

    printer = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'ip': data['ip'],
        'serial': data['serial'],
        'access_code': data['access_code'],
        'temp_threshold': float(data['temp_threshold']),
        'gpio_pin': int(data['gpio_pin']),
        'open_position': int(data.get('open_position', 1900)),
        'close_position': int(data.get('close_position', 2500)),
    }
    with config_lock:
        printers.append(printer)
        save_config()

    connect_printer(printer)
    return jsonify(printer), 201


@app.route('/printers/<pid>', methods=['DELETE'])
def remove_printer(pid):
    with config_lock:
        idx = next((i for i, p in enumerate(printers) if p['id'] == pid), None)
        if idx is None:
            return jsonify({'error': 'Not found'}), 404
        printers.pop(idx)
        save_config()
    disconnect_printer(pid)
    return jsonify({'status': 'deleted'})


@app.route('/printers/<pid>', methods=['PATCH'])
def update_printer(pid):
    data = request.get_json(force=True)
    reconnect = False
    with config_lock:
        printer = next((p for p in printers if p['id'] == pid), None)
        if printer is None:
            return jsonify({'error': 'Not found'}), 404
        for field in ('name', 'ip', 'serial', 'access_code',
                      'temp_threshold', 'gpio_pin', 'open_position', 'close_position'):
            if field in data:
                if field == 'temp_threshold':
                    printer[field] = float(data[field])
                elif field in ('gpio_pin', 'open_position', 'close_position'):
                    printer[field] = int(data[field])
                else:
                    printer[field] = data[field]
                if field in ('ip', 'serial', 'access_code'):
                    reconnect = True
        save_config()
        printer_copy = dict(printer)
    if reconnect:
        disconnect_printer(pid)
        connect_printer(printer_copy)
    return jsonify(printer_copy)


@app.route('/printers/<pid>/open-door', methods=['POST'])
def open_door(pid):
    with config_lock:
        p = next((p for p in printers if p['id'] == pid), None)
        if p is None:
            return jsonify({'error': 'Not found'}), 404
        pin = p.get('gpio_pin')
        pos = p.get('open_position', 1900)
    if pin is None:
        return jsonify({'error': 'No gpio_pin configured'}), 400
    with state_lock:
        if pid in live_state:
            live_state[pid]['servo_open'] = True
            live_state[pid]['override_until'] = time.time() + 10
    threading.Thread(target=call_servo, args=(pin, pos), daemon=True).start()
    return jsonify({'status': 'opening'})


@app.route('/printers/<pid>/close-door', methods=['POST'])
def close_door(pid):
    with config_lock:
        p = next((p for p in printers if p['id'] == pid), None)
        if p is None:
            return jsonify({'error': 'Not found'}), 404
        pin = p.get('gpio_pin')
        pos = p.get('close_position', 2500)
    if pin is None:
        return jsonify({'error': 'No gpio_pin configured'}), 400
    with state_lock:
        if pid in live_state:
            live_state[pid]['servo_open'] = False
            live_state[pid]['override_until'] = time.time() + 10
    threading.Thread(target=call_servo, args=(pin, pos), daemon=True).start()
    return jsonify({'status': 'closing'})


@app.route('/printers/<pid>/files', methods=['GET'])
def get_files(pid):
    with config_lock:
        p = next((p for p in printers if p['id'] == pid), None)
    if p is None:
        return jsonify({'error': 'Not found'}), 404
    try:
        files = list_ftp_files(p)
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 502
    return jsonify({'files': files})  # list of {name, url}


@app.route('/printers/<pid>/loop', methods=['POST'])
def start_loop(pid):
    data = request.get_json(force=True)
    file_url  = data.get('file_url')
    file_name = data.get('file_name')
    if not file_url and not file_name:
        return jsonify({'error': 'file_url or file_name required'}), 400
    if not file_url:
        file_url = f"ftp:///sdcard/{file_name}"
    subtask = (file_name or file_url.split('/')[-1]).rsplit('.', 1)[0]
    print(f"[LOOP] start pid={pid} url={file_url}", flush=True)

    with config_lock:
        p = next((p for p in printers if p['id'] == pid), None)
    if p is None:
        return jsonify({'error': 'Not found'}), 404

    with state_lock:
        s = live_state.get(pid)
        if s is None:
            return jsonify({'error': 'Printer not connected'}), 409
        gen = s.get('loop_gen', 0) + 1
        s['loop_enabled'] = True
        s['loop_file']    = file_url
        s['loop_subtask'] = subtask
        s['loop_gen']     = gen
        s['loop_phase']   = 'printing'
        s['loop_next_at'] = None

    send_print_command(p, file_url, subtask)
    return jsonify({'status': 'loop_started', 'file': file_url})


@app.route('/printers/<pid>/loop', methods=['DELETE'])
def stop_loop(pid):
    with state_lock:
        s = live_state.get(pid)
        if s is None:
            return jsonify({'error': 'Not found'}), 404
        s['loop_enabled'] = False
        s['loop_file']    = None
        s['loop_subtask'] = None
        s['loop_phase']   = None
        s['loop_next_at'] = None
        s['loop_gen']     = s.get('loop_gen', 0) + 1
    return jsonify({'status': 'loop_stopped'})


# ── Startup ─────────────────────────────────────────────────────────────────

def init():
    loaded = load_config()
    with config_lock:
        printers.extend(loaded)
    for p in loaded:
        connect_printer(p)


if __name__ == '__main__':
    init()
    app.run(host='0.0.0.0', port=5000, threaded=True)
