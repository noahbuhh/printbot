const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Kongloprint</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #333; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
    button.btn { padding: 10px 20px; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    .open { background: #0066cc; }
    .close { background: #cc3300; }
    .save { background: #228833; margin-top: 12px; }
    label { display: block; margin-top: 12px; font-weight: bold; }
    input[type=range] { width: 100%; }
    .val { font-size: 14px; color: #555; }
  </style>
</head>
<body>
  <h1>Kongloprint Dashboard</h1>

  <div class="card">
    <h2>Door Control</h2>
    <button class="btn open" onclick="fetch('/door-motor/open')">Open Door</button>
    &nbsp;
    <button class="btn close" onclick="fetch('/door-motor/close')">Close Door</button>
  </div>

  <div class="card">
    <h2>Motor Settings</h2>
    <label>Open Position: <span class="val" id="openVal"></span></label>
    <input type="range" min="500" max="2500" id="openPos" oninput="document.getElementById('openVal').innerText = this.value">

    <label>Close Position: <span class="val" id="closeVal"></span></label>
    <input type="range" min="500" max="2500" id="closePos" oninput="document.getElementById('closeVal').innerText = this.value">

    <br>
    <button class="btn save" onclick="saveSettings()">Save Settings</button>
  </div>

  <script>
    // Load current settings on page load
    fetch('/door-motor/settings')
      .then(r => r.json())
      .then(s => {
        document.getElementById('openPos').value = s.open_position;
        document.getElementById('openVal').innerText = s.open_position;
        document.getElementById('closePos').value = s.close_position;
        document.getElementById('closeVal').innerText = s.close_position;
      });

    function saveSettings() {
      fetch('/door-motor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          open_position: document.getElementById('openPos').value,
          close_position: document.getElementById('closePos').value
        })
      }).then(() => alert('Settings saved!'));
    }
  </script>
</body>
</html>`)
})

app.listen(port, () => console.log(`Web dashboard listening on port ${port}`))
