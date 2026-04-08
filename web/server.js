const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Autoprint</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/darkly/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    :root {
      --cy-bg: #05060a; --cy-surface: #0a0d14; --cy-border: #0f1923;
      --cy-cyan: #00f0ff; --cy-magenta: #ff2d95; --cy-yellow: #ffe156;
      --cy-green: #39ff14; --cy-text: #c8d6e5; --cy-dim: #4a5568;
    }
    body { background: var(--cy-bg); font-family: 'Rajdhani', sans-serif; color: var(--cy-text); }
    .mono { font-family: 'Share Tech Mono', monospace; font-weight: 500; }
    .card { background: var(--cy-surface); border: 1px solid var(--cy-border); box-shadow: 0 0 15px rgba(0,240,255,0.03); }
    .card-header { background: linear-gradient(90deg, rgba(0,240,255,0.05), transparent); border-bottom: 1px solid var(--cy-border); font-family: 'Orbitron', monospace; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; }
    .card-footer { background: var(--cy-surface); border-top: 1px solid var(--cy-border); }
    .modal-content { background: var(--cy-surface); border: 1px solid var(--cy-cyan); box-shadow: 0 0 30px rgba(0,240,255,0.1); }
    .modal-header { border-bottom: 1px solid var(--cy-border); font-family: 'Orbitron', monospace; }
    .modal-footer { border-top: 1px solid var(--cy-border); }
    .form-control, .form-select {
      background: var(--cy-bg); border-color: var(--cy-border); color: var(--cy-text);
      font-family: 'Share Tech Mono', monospace; font-size: 0.9rem;
    }
    .form-control:focus, .form-select:focus {
      background: var(--cy-bg); border-color: var(--cy-cyan); color: #fff;
      box-shadow: 0 0 8px rgba(0,240,255,0.15);
    }
    .form-control::placeholder { color: var(--cy-dim); }
    .form-range { accent-color: var(--cy-cyan); }
    .printer-running { border-left: 3px solid var(--cy-green) !important; box-shadow: 0 0 12px rgba(57,255,20,0.08); }
    .printer-finish  { border-left: 3px solid var(--cy-yellow) !important; box-shadow: 0 0 12px rgba(255,225,86,0.08); }
    .printer-idle    { border-left: 3px solid var(--cy-dim) !important; }
    .printer-unknown { border-left: 3px solid #1a1a2e !important; }
    .add-toggle { cursor: pointer; user-select: none; }
    .btn-outline-primary { border-color: var(--cy-cyan); color: var(--cy-cyan); }
    .btn-outline-primary:hover { background: rgba(0,240,255,0.12); color: var(--cy-cyan); border-color: var(--cy-cyan); }
    .btn-outline-danger { border-color: var(--cy-magenta); color: var(--cy-magenta); }
    .btn-outline-danger:hover { background: rgba(255,45,149,0.12); color: var(--cy-magenta); border-color: var(--cy-magenta); }
    .btn-outline-warning { border-color: var(--cy-yellow); color: var(--cy-yellow); }
    .btn-outline-warning:hover { background: rgba(255,225,86,0.12); color: var(--cy-yellow); border-color: var(--cy-yellow); }
    .btn-outline-success { border-color: var(--cy-green); color: var(--cy-green); }
    .btn-outline-success:hover { background: rgba(57,255,20,0.12); color: var(--cy-green); border-color: var(--cy-green); }
    .btn-outline-secondary { border-color: var(--cy-dim); color: var(--cy-dim); }
    .btn-outline-secondary:hover { background: rgba(74,85,104,0.15); color: var(--cy-text); }
    .btn-primary { background: linear-gradient(135deg, #00b4d8, #0077b6); border: none; }
    .btn-primary:hover { background: linear-gradient(135deg, #00d4ff, #0099e6); }
    .btn-success { background: linear-gradient(135deg, #2d6a4f, #40916c); border: none; }
    .btn-danger { background: linear-gradient(135deg, #6b1a1a, #a02020); border: none; }
    .text-success { color: var(--cy-green) !important; }
    .text-warning { color: var(--cy-yellow) !important; }
    .text-danger { color: var(--cy-magenta) !important; }
    .text-info { color: var(--cy-cyan) !important; }
    .text-muted { color: var(--cy-dim) !important; }
    .badge { font-family: 'Share Tech Mono', monospace; font-weight: 500; }
    .table { --bs-table-bg: transparent; color: var(--cy-text); }
    hr { border-color: var(--cy-border) !important; }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.5; transform:scale(.8); }
    }
    @keyframes pulseGlow {
      0%,100% { box-shadow: 0 0 5px rgba(0,240,255,0.1); }
      50%      { box-shadow: 0 0 15px rgba(0,240,255,0.2); }
    }
    .dot-pulse { display:inline-block; width:8px; height:8px; border-radius:50%;
                 background: var(--cy-green); animation:pulse 1.5s ease-in-out infinite; }
    .dot-pulse-sm { width:7px; height:7px; }
  </style>
</head>
<body>

  <!-- Navbar -->
  <nav class="navbar navbar-dark" style="background:linear-gradient(180deg,rgba(0,240,255,0.03),var(--cy-bg));border-bottom:1px solid var(--cy-border);position:relative">
  <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cy-cyan),var(--cy-magenta),transparent)"></div>
    <div class="container-fluid px-4">
      <span class="navbar-brand d-flex align-items-center gap-2 mb-0">
        <i class="bi bi-printer-fill fs-5" style="color:var(--cy-cyan)"></i>
        <span style="font-family:'Orbitron',monospace;font-weight:900;font-size:1.1rem;letter-spacing:0.15em;background:linear-gradient(90deg,var(--cy-cyan),var(--cy-magenta));-webkit-background-clip:text;-webkit-text-fill-color:transparent">AUTOPRINT</span>
        <span style="font-size:0.72rem;letter-spacing:0.06em;color:var(--cy-dim)">3D PRINT MONITOR</span>
      </span>
      <span class="d-flex align-items-center gap-2">
        <span class="dot-pulse"></span>
        <span class="text-success mono" style="font-size:0.8rem">ONLINE</span>
      </span>
    </div>
  </nav>

  <div class="container-fluid px-4 py-4">

    <!-- Global actions -->
    <div class="d-flex gap-2 mb-3">
      <button class="btn btn-outline-primary btn-sm" id="openAllBtn">
        <i class="bi bi-unlock me-1"></i>Open All
      </button>
      <button class="btn btn-outline-danger btn-sm" id="closeAllBtn">
        <i class="bi bi-lock me-1"></i>Close All
      </button>
    </div>

    <!-- Printer Grid -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-4" id="printerGrid">
      <div class="col"><div class="card h-100 p-3 text-muted"><em>Loading printers...</em></div></div>
    </div>

    <!-- Camera -->
    <div class="card mb-4">
      <div class="card-header d-flex align-items-center gap-2">
        <i class="bi bi-camera-video-fill"></i>
        <span class="fw-semibold">Camera</span>
        <div class="d-flex align-items-center gap-1 ms-auto">
          <button class="btn btn-outline-secondary btn-sm" id="camZoomOut" title="Zoom out">
            <i class="bi bi-zoom-out"></i>
          </button>
          <span class="mono text-muted" id="camZoomLabel" style="font-size:0.78rem;min-width:3rem;text-align:center">100%</span>
          <button class="btn btn-outline-secondary btn-sm" id="camZoomIn" title="Zoom in">
            <i class="bi bi-zoom-in"></i>
          </button>
          <div class="vr mx-1" style="opacity:0.2"></div>
          <button class="btn btn-outline-secondary btn-sm" id="camRotLeft" title="Rotate left">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" id="camRotRight" title="Rotate right">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div class="card-body p-0" style="background:#000;border-radius:0 0 4px 4px;overflow:hidden;min-height:80px">
        <div id="camWrap" style="width:100%;display:flex;align-items:center;justify-content:center">
          <img id="camImg" src="/stream/?action=stream" alt="Camera stream"
               style="width:100%;max-height:480px;object-fit:contain;display:block;transition:transform 0.2s;transform-origin:center center"
               onerror="this.style.display='none';document.getElementById('camErr').style.display='block'">
        </div>
        <div id="camErr" style="display:none;padding:1rem;color:var(--cy-dim);font-size:0.85rem">
          <i class="bi bi-camera-video-off me-2"></i>Camera not available
        </div>
      </div>
    </div>

    <!-- Recordings -->
    <div class="card mb-4">
      <div class="card-header add-toggle d-flex align-items-center justify-content-between"
           id="recToggle">
        <span><i class="bi bi-film me-2"></i>Recordings</span>
        <i class="bi bi-chevron-down" id="recChevron"></i>
      </div>
      <div id="recBody" style="display:none">
        <div class="card-body p-2" id="recList">
          <span class="text-muted fst-italic">Loading…</span>
        </div>
      </div>
    </div>

    <!-- Add Printer -->
    <div class="card mb-4">
      <div class="card-header add-toggle d-flex align-items-center justify-content-between"
           id="addToggle">
        <span><i class="bi bi-plus-circle me-2"></i>Add Printer</span>
        <i class="bi bi-chevron-down" id="addChevron"></i>
      </div>
      <div id="addBody" style="display:none">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-6">
              <label class="form-label small text-muted">Name</label>
              <input class="form-control form-control-sm" id="pName" placeholder="P1S Living Room">
              <label class="form-label small text-muted mt-2">IP Address</label>
              <input class="form-control form-control-sm" id="pIp" placeholder="192.168.1.50">
              <label class="form-label small text-muted mt-2">Serial Number</label>
              <input class="form-control form-control-sm" id="pSerial" placeholder="01P00A...">
              <label class="form-label small text-muted mt-2">GPIO Pin</label>
              <input class="form-control form-control-sm" type="number" id="pPin" placeholder="18" min="0" max="27">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-muted">Access Code</label>
              <input class="form-control form-control-sm" id="pCode" placeholder="12345678">
              <label class="form-label small text-muted mt-2">Trigger Temp (C)</label>
              <input class="form-control form-control-sm" type="number" id="pThreshold" value="35" min="20" max="80">
              <label class="form-label small text-muted mt-2">Open Position (us)</label>
              <input class="form-control form-control-sm" type="number" id="pOpenPos" value="1900" min="500" max="2500">
              <label class="form-label small text-muted mt-2">Close Position (us)</label>
              <input class="form-control form-control-sm" type="number" id="pClosePos" value="2500" min="500" max="2500">
            </div>
          </div>
          <button class="btn btn-primary w-100 mt-3" id="addSubmitBtn">
            <i class="bi bi-plus-lg me-1"></i> Add Printer
          </button>
        </div>
      </div>
    </div>

    <!-- Global Servo Settings -->
    <div class="card">
      <div class="card-header d-flex align-items-center gap-2">
        <i class="bi bi-sliders"></i>
        <span class="fw-semibold">Global Servo Settings</span>
        <span class="text-muted ms-1" style="font-size:0.78rem">— applies to all printers</span>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label small text-muted">
              Open Position &nbsp;<span class="mono text-light" id="openVal"></span>
            </label>
            <input type="range" class="form-range" min="500" max="2500" id="openPos">
          </div>
          <div class="col-md-6">
            <label class="form-label small text-muted">
              Close Position &nbsp;<span class="mono text-light" id="closeVal"></span>
            </label>
            <input type="range" class="form-range" min="500" max="2500" id="closePos">
          </div>
        </div>
        <button class="btn btn-success mt-3" id="saveGlobalBtn">
          <i class="bi bi-broadcast me-1"></i> Apply to All Printers
        </button>
      </div>
    </div>

  </div>

  <!-- Edit Printer Modal -->
  <div class="modal fade" id="editModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-pencil-square me-2"></i>Edit Printer</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="editId">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label small text-muted">Name</label>
              <input class="form-control form-control-sm" id="editName">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">IP Address</label>
              <input class="form-control form-control-sm" id="editIp" placeholder="192.168.1.50">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Serial Number</label>
              <input class="form-control form-control-sm" id="editSerial" placeholder="01P00A...">
            </div>
            <div class="col-12">
              <label class="form-label small text-muted">Access Code</label>
              <input class="form-control form-control-sm" id="editCode" placeholder="12345678">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">GPIO Pin</label>
              <input class="form-control form-control-sm" type="number" id="editPin" min="0" max="27">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Trigger Temp (C)</label>
              <input class="form-control form-control-sm" type="number" id="editThreshold" min="20" max="80">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Open Position (us)</label>
              <input class="form-control form-control-sm" type="number" id="editOpenPos" min="500" max="2500">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Close Position (us)</label>
              <input class="form-control form-control-sm" type="number" id="editClosePos" min="500" max="2500">
            </div>
            <div class="col-12"><hr class="border-secondary my-1"></div>
            <div class="col-12">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="editPreheatEnabled">
                <label class="form-check-label small text-muted" for="editPreheatEnabled">
                  Chamber preheat before loop print
                </label>
              </div>
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Bed Temp (°C)</label>
              <input class="form-control form-control-sm" type="number" id="editPreheatTemp" min="20" max="110" value="65">
            </div>
            <div class="col-6">
              <label class="form-label small text-muted">Soak Time (min)</label>
              <input class="form-control form-control-sm" type="number" id="editPreheatMinutes" min="1" max="60" value="5">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" id="saveEditBtn">
            <i class="bi bi-save me-1"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Loop Print Modal -->
  <div class="modal fade" id="loopModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-arrow-repeat me-2"></i>Loop Print — select file</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="loopPid">
          <div id="loopFileList" class="list-group mb-3">
            <span class="text-muted fst-italic p-1">Loading files…</span>
          </div>
          <hr style="border-color:var(--cy-border)">
          <div class="form-check form-switch mb-2">
            <input class="form-check-input" type="checkbox" id="loopPreheatEnabled">
            <label class="form-check-label" for="loopPreheatEnabled">
              <i class="bi bi-thermometer-half me-1"></i>Vorheizen vor jedem Druck
            </label>
          </div>
          <div id="loopPreheatOptions" style="display:none">
            <div class="row g-2 mt-1">
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Betttemperatur (°C)</label>
                <input type="number" class="form-control form-control-sm" id="loopPreheatTemp" value="65" min="20" max="120">
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Einweichzeit (Min)</label>
                <input type="number" class="form-control form-control-sm" id="loopPreheatMinutes" value="5" min="0" max="60">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-success btn-sm" id="startLoopBtn" disabled>
            <i class="bi bi-play-fill me-1"></i>Start Loop
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Recording Video Modal -->
  <div class="modal fade" id="recVideoModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title mono" id="recVideoTitle" style="font-size:0.85rem"></h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0" style="background:#000">
          <video id="recVideo" controls style="width:100%;max-height:70vh;display:block">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  </div>

  <!-- Print Modal -->
  <div class="modal fade" id="printModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><i class="bi bi-play-fill me-2"></i>Print — select file</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="printPid">
          <div id="printFileList" class="list-group">
            <span class="text-muted fst-italic p-1">Loading files…</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-success btn-sm" id="confirmPrintBtn" disabled>
            <i class="bi bi-play-fill me-1"></i>Start Print
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Bootstrap JS at end of body so the full DOM exists when it initialises -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

  <script>
    // ── Camera zoom / rotate ─────────────────────────────────────────────────
    (function() {
      var saved = JSON.parse(localStorage.getItem('camSettings') || '{}');
      var zoom = saved.zoom || 1, rot = saved.rot || 0;
      var steps = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

      function applyTransform() {
        localStorage.setItem('camSettings', JSON.stringify({ zoom: zoom, rot: rot }));
        var img = document.getElementById('camImg');
        if (!img) return;
        img.style.transform = 'rotate(' + rot + 'deg) scale(' + zoom + ')';
        // expand wrapper height when rotated 90/270 so image isn't clipped
        var wrap = document.getElementById('camWrap');
        if (rot % 180 !== 0) {
          wrap.style.minHeight = img.offsetWidth + 'px';
        } else {
          wrap.style.minHeight = '';
        }
        document.getElementById('camZoomLabel').innerText = Math.round(zoom * 100) + '%';
      }

      document.getElementById('camZoomIn').addEventListener('click', function() {
        var idx = steps.indexOf(zoom);
        if (idx < steps.length - 1) zoom = steps[idx + 1];
        applyTransform();
      });
      document.getElementById('camZoomOut').addEventListener('click', function() {
        var idx = steps.indexOf(zoom);
        if (idx > 0) zoom = steps[idx - 1];
        applyTransform();
      });
      document.getElementById('camRotLeft').addEventListener('click', function() {
        rot = (rot - 90 + 360) % 360;
        applyTransform();
      });
      document.getElementById('camRotRight').addEventListener('click', function() {
        rot = (rot + 90) % 360;
        applyTransform();
      });

      applyTransform();  // restore saved settings on load
    }());

    // ── Add Printer toggle (no Bootstrap JS dependency) ─────────────────────
    document.getElementById('addToggle').addEventListener('click', function() {
      var body    = document.getElementById('addBody');
      var chevron = document.getElementById('addChevron');
      var opening = body.style.display === 'none';
      body.style.display    = opening ? 'block' : 'none';
      chevron.className     = opening ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
    });

    document.getElementById('addSubmitBtn').addEventListener('click', addPrinter);

    // ── Global servo settings ────────────────────────────────────────────────
    (function() {
      var openPos  = document.getElementById('openPos');
      var closePos = document.getElementById('closePos');
      openPos.value  = 1900;
      closePos.value = 2500;
      document.getElementById('openVal').innerText  = '1900 us';
      document.getElementById('closeVal').innerText = '2500 us';

      openPos.addEventListener('input', function() {
        document.getElementById('openVal').innerText = this.value + ' us';
      });
      closePos.addEventListener('input', function() {
        document.getElementById('closeVal').innerText = this.value + ' us';
      });

      document.getElementById('saveGlobalBtn').addEventListener('click', function() {
        if (!currentPrinters.length) { alert('No printers to update.'); return; }
        var body = {
          open_position:  parseInt(openPos.value),
          close_position: parseInt(closePos.value)
        };
        Promise.all(currentPrinters.map(function(p) {
          return fetch('/printer-monitor/printers/' + p.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
        })).then(function() { loadPrinters(); })
           .catch(function(err) { alert('Failed: ' + err.message); });
      });
    }());

    // ── Open All / Close All ─────────────────────────────────────────────────
    document.getElementById('openAllBtn').addEventListener('click', function() {
      currentPrinters.forEach(function(p) {
        fetch('/printer-monitor/printers/' + p.id + '/open-door', { method: 'POST' });
      });
    });

    document.getElementById('closeAllBtn').addEventListener('click', function() {
      currentPrinters.forEach(function(p) {
        fetch('/printer-monitor/printers/' + p.id + '/close-door', { method: 'POST' });
      });
    });

    // ── Helpers ──────────────────────────────────────────────────────────────
    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function tempColor(val) {
      if (val == null) return '';
      if (val < 30) return 'color:var(--cy-green)';
      if (val < 60) return 'color:var(--cy-yellow)';
      return 'color:var(--cy-magenta)';
    }
    function tempDisplay(val) {
      if (val == null) return '<span class="text-muted">--</span>';
      return '<span class="mono" style="' + tempColor(val) + '">' + val + ' C</span>';
    }
    function badgeClass(state) {
      var s = (state || '').toUpperCase();
      if (s === 'RUNNING' || s === 'PREPARE') return 'bg-success';
      if (s === 'FINISH')  return 'bg-warning text-dark';
      if (s === 'IDLE')    return 'bg-secondary';
      return 'bg-dark border';
    }
    function cardAccent(state) {
      var s = (state || '').toUpperCase();
      if (s === 'RUNNING' || s === 'PREPARE') return 'printer-running';
      if (s === 'FINISH')  return 'printer-finish';
      if (s === 'IDLE')    return 'printer-idle';
      return 'printer-unknown';
    }
    function makeRateHtml(pid) {
      var rate = getTempRate(pid);
      if (rate === null) return '';
      var abs = Math.abs(rate).toFixed(1);
      if (rate < -0.5) return '<div class="d-flex align-items-center gap-2 mb-2">'
        + '<i class="bi bi-arrow-down-short" style="color:var(--cy-cyan)"></i>'
        + '<span class="small text-muted">Cooling</span>'
        + '<span class="mono" style="color:var(--cy-cyan)">' + abs + '°/min</span></div>';
      if (rate > 0.5) return '<div class="d-flex align-items-center gap-2 mb-2">'
        + '<i class="bi bi-arrow-up-short" style="color:var(--cy-magenta)"></i>'
        + '<span class="small text-muted">Heating</span>'
        + '<span class="mono" style="color:var(--cy-magenta)">' + abs + '°/min</span></div>';
      return '<div class="d-flex align-items-center gap-2 mb-2">'
        + '<i class="bi bi-dash text-muted"></i>'
        + '<span class="small text-muted">Rate</span>'
        + '<span class="mono text-muted">stable</span></div>';
    }
    function makeHmsHtml(hms) {
      if (!hms || !hms.length) return '';
      return '<div class="d-flex align-items-center gap-2 mt-1 p-1 rounded" '
        + 'style="background:rgba(255,45,149,0.08);border:1px solid rgba(255,45,149,0.3);font-size:0.78rem">'
        + '<i class="bi bi-exclamation-triangle-fill" style="color:var(--cy-magenta)"></i>'
        + '<span style="color:var(--cy-magenta)">HMS Error</span>'
        + '<span class="mono text-muted ms-1">'
        + hms.map(function(e) { return '0x' + (e.code || 0).toString(16).toUpperCase(); }).join(', ')
        + '</span>'
        + '<span class="text-muted ms-auto" style="font-size:0.72rem">clear on printer screen</span>'
        + '</div>';
    }

    function makeServoHtml(servo_open) {
      if (servo_open === true)  return '<i class="bi bi-unlock-fill text-success me-1"></i><span class="text-success small">Open</span>';
      if (servo_open === false) return '<i class="bi bi-lock-fill text-secondary me-1"></i><span class="text-secondary small">Closed</span>';
      return '<span class="text-muted small">--</span>';
    }

    function makeLoopHtml(s, p) {
      if (!s.loop_enabled || !s.loop_file) return '';
      var name = (s.loop_file || '').split('/').pop();
      var phase = s.loop_phase || '';

      if (phase === 'waiting' && s.loop_next_at) {
        var secs = Math.max(0, Math.round(s.loop_next_at - Date.now() / 1000));
        var m    = Math.floor(secs / 60);
        var sec  = secs % 60;
        var cd   = m + ':' + (sec < 10 ? '0' : '') + sec;
        return '<div class="d-flex align-items-center gap-2 mt-1" style="font-size:0.78rem">'
          + '<i class="bi bi-hourglass-split" style="color:var(--cy-cyan)"></i>'
          + '<span class="mono" style="color:var(--cy-cyan)">' + escHtml(name) + '</span>'
          + '<span class="text-muted">next in ' + cd + '</span>'
          + '</div>';
      }
      if (phase === 'preheating') {
        var target = (p && p.preheat_temp) ? p.preheat_temp + '°C' : '…';
        var cur    = s.bed_temp != null ? s.bed_temp + '°C' : '--';
        return '<div class="d-flex align-items-center gap-2 mt-1" style="font-size:0.78rem">'
          + '<i class="bi bi-thermometer-high" style="color:var(--cy-magenta)"></i>'
          + '<span style="color:var(--cy-magenta)">Preheating</span>'
          + '<span class="mono text-muted">' + cur + ' → ' + target + '</span>'
          + '</div>';
      }
      if (phase === 'preheated') {
        var mins = (p && p.preheat_minutes) ? p.preheat_minutes + ' min' : '…';
        return '<div class="d-flex align-items-center gap-2 mt-1" style="font-size:0.78rem">'
          + '<i class="bi bi-hourglass-split" style="color:var(--cy-yellow)"></i>'
          + '<span style="color:var(--cy-yellow)">Soaking</span>'
          + '<span class="mono text-muted">' + escHtml(mins) + '</span>'
          + '</div>';
      }
      return '<div class="d-flex align-items-center gap-2 mt-1" style="font-size:0.78rem">'
        + '<i class="bi bi-arrow-repeat" style="color:var(--cy-green)"></i>'
        + '<span class="mono" style="color:var(--cy-green)">' + escHtml(name) + '</span>'
        + '</div>';
    }

    // ── Build full card HTML (called once per printer per list change) ─────────
    function buildCard(p) {
      var s      = p.state || {};
      var gstate = s.gcode_state || '';
      var upper  = gstate.toUpperCase();
      var isRunning = upper === 'RUNNING' || upper === 'PREPARE';
      var pid    = escHtml(p.id);

      return '<div class="col">'
        + '<div class="card h-100 ' + cardAccent(gstate) + '" id="card-' + pid + '">'

        + '<div class="card-header d-flex align-items-center justify-content-between">'
        + '<span class="fw-semibold">' + escHtml(p.name) + '</span>'
        + '<span class="d-flex align-items-center gap-2">'
        + '<span class="badge ' + badgeClass(gstate) + '" id="badge-' + pid + '">' + (gstate || 'Unknown') + '</span>'
        + '<span id="dot-' + pid + '">' + (isRunning ? '<span class="dot-pulse dot-pulse-sm"></span>' : '') + '</span>'
        + '</span>'
        + '</div>'

        + '<div class="card-body py-2">'
        + '<div class="d-flex align-items-center gap-2 mb-1">'
        + '<i class="bi bi-thermometer-half text-muted"></i>'
        + '<span class="small text-muted">Bed</span>'
        + '<span id="bed-' + pid + '">' + tempDisplay(s.bed_temp) + '</span>'
        + '</div>'
        + '<div class="d-flex align-items-center gap-2 mb-2">'
        + '<i class="bi bi-thermometer text-muted"></i>'
        + '<span class="small text-muted">Nozzle</span>'
        + '<span id="nozzle-' + pid + '">' + tempDisplay(s.nozzle_temp) + '</span>'
        + '</div>'
        + '<div id="rate-' + pid + '">' + makeRateHtml(p.id) + '</div>'
        + '<div class="mb-1" style="font-size:0.78rem;color:var(--cy-dim)">'
        + '<i class="bi bi-cpu"></i> GPIO' + escHtml(String(p.gpio_pin))
        + ' &nbsp;<i class="bi bi-arrows-angle-contract"></i> ' + escHtml(String(p.temp_threshold)) + 'C'
        + '</div>'
        + '<div class="mb-2" style="font-size:0.78rem;color:var(--cy-dim)">'
        + 'Open ' + escHtml(String(p.open_position)) + 'us / Close ' + escHtml(String(p.close_position)) + 'us'
        + '</div>'
        + '<div id="servo-' + pid + '">' + makeServoHtml(s.servo_open) + '</div>'
        + '<div id="loop-' + pid + '">' + makeLoopHtml(s, p) + '</div>'
        + '<div id="hms-' + pid + '">' + makeHmsHtml(s.hms_errors) + '</div>'
        + '</div>'

        + '<div class="card-footer d-flex gap-2">'
        + '<button class="btn btn-outline-primary btn-sm" data-action="open" data-pid="' + pid + '">'
        + '<i class="bi bi-unlock me-1"></i>Open</button>'
        + '<button class="btn btn-outline-danger btn-sm" data-action="close" data-pid="' + pid + '">'
        + '<i class="bi bi-lock me-1"></i>Close</button>'
        + '<button class="btn btn-outline-success btn-sm" data-action="print" data-pid="' + pid + '">'
        + '<i class="bi bi-play-fill"></i></button>'
        + '<button class="btn ' + (s.loop_enabled ? 'btn-info' : 'btn-outline-info') + ' btn-sm" '
        + 'id="loop-btn-' + pid + '" '
        + 'data-action="' + (s.loop_enabled ? 'stop-loop' : 'loop') + '" data-pid="' + pid + '">'
        + '<i class="bi bi-arrow-repeat"></i></button>'
        + '<button class="btn btn-outline-warning btn-sm" data-action="edit" data-pid="' + pid + '">'
        + '<i class="bi bi-pencil"></i></button>'
        + '<button class="btn btn-outline-secondary btn-sm ms-auto" data-action="remove" data-pid="' + pid + '">'
        + '<i class="bi bi-trash3"></i></button>'
        + '</div>'

        + '</div></div>';
    }

    // ── Patch only the live data fields — iframes are untouched ──────────────
    function updateCardData(p) {
      var s      = p.state || {};
      var pid    = p.id;
      var gstate = s.gcode_state || '';
      var upper  = gstate.toUpperCase();
      var isRunning = upper === 'RUNNING' || upper === 'PREPARE';

      var card = document.getElementById('card-' + pid);
      if (card) card.className = 'card h-100 ' + cardAccent(gstate);

      var badge = document.getElementById('badge-' + pid);
      if (badge) { badge.className = 'badge ' + badgeClass(gstate); badge.innerText = gstate || 'Unknown'; }

      var dot = document.getElementById('dot-' + pid);
      if (dot) dot.innerHTML = isRunning ? '<span class="dot-pulse dot-pulse-sm"></span>' : '';

      var bed = document.getElementById('bed-' + pid);
      if (bed) bed.innerHTML = tempDisplay(s.bed_temp);

      var nozzle = document.getElementById('nozzle-' + pid);
      if (nozzle) nozzle.innerHTML = tempDisplay(s.nozzle_temp);

      var rate = document.getElementById('rate-' + pid);
      if (rate) rate.innerHTML = makeRateHtml(pid);

      var servo = document.getElementById('servo-' + pid);
      if (servo) servo.innerHTML = makeServoHtml(s.servo_open);

      var loopEl = document.getElementById('loop-' + pid);
      if (loopEl) loopEl.innerHTML = makeLoopHtml(s, p);

      var hmsEl = document.getElementById('hms-' + pid);
      if (hmsEl) hmsEl.innerHTML = makeHmsHtml(s.hms_errors);

      var loopBtn = document.getElementById('loop-btn-' + pid);
      if (loopBtn) {
        loopBtn.className  = 'btn ' + (s.loop_enabled ? 'btn-info' : 'btn-outline-info') + ' btn-sm';
        loopBtn.dataset.action = s.loop_enabled ? 'stop-loop' : 'loop';
      }
    }

    // ── Smart render: full rebuild only when printer list changes ─────────────
    var _renderedIds = null;

    function renderPrinters(printers) {
      var grid = document.getElementById('printerGrid');
      if (!printers.length) {
        _renderedIds = '';
        grid.innerHTML = '<div class="col"><div class="card h-100 p-3 text-muted fst-italic">No printers configured. Add one below.</div></div>';
        return;
      }
      var newIds = printers.map(function(p) { return p.id; }).join(',');
      if (newIds === _renderedIds) {
        printers.forEach(updateCardData);  // data poll: patch in-place, iframes untouched
        return;
      }
      _renderedIds = newIds;
      grid.innerHTML = printers.map(buildCard).join('');
    }

    // ── Single delegated click handler ────────────────────────────────────────
    document.getElementById('printerGrid').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var pid    = btn.dataset.pid;

      if (action === 'open') {
        fetch('/printer-monitor/printers/' + pid + '/open-door', { method: 'POST' })
          .then(function(r) {
            if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
          })
          .catch(function(err) { alert('Open door failed: ' + err.message); });

      } else if (action === 'close') {
        fetch('/printer-monitor/printers/' + pid + '/close-door', { method: 'POST' })
          .then(function(r) {
            if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
          })
          .catch(function(err) { alert('Close door failed: ' + err.message); });

      } else if (action === 'print') {
        showPrintModal(pid);

      } else if (action === 'edit') {
        var printer = currentPrinters.filter(function(p) { return p.id === pid; })[0];
        if (!printer) return;
        document.getElementById('editId').value        = printer.id;
        document.getElementById('editName').value      = printer.name;
        document.getElementById('editIp').value        = printer.ip || '';
        document.getElementById('editSerial').value    = printer.serial || '';
        document.getElementById('editCode').value      = printer.access_code || '';
        document.getElementById('editPin').value            = printer.gpio_pin;
        document.getElementById('editThreshold').value      = printer.temp_threshold;
        document.getElementById('editOpenPos').value        = printer.open_position;
        document.getElementById('editClosePos').value       = printer.close_position;
        document.getElementById('editPreheatEnabled').checked = !!printer.preheat_enabled;
        document.getElementById('editPreheatTemp').value    = printer.preheat_temp    || 65;
        document.getElementById('editPreheatMinutes').value = printer.preheat_minutes || 5;
        new bootstrap.Modal(document.getElementById('editModal')).show();

      } else if (action === 'loop') {
        showLoopModal(pid);

      } else if (action === 'stop-loop') {
        fetch('/printer-monitor/printers/' + pid + '/loop', { method: 'DELETE' })
          .then(function(r) {
            if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
            loadPrinters();
          })
          .catch(function(err) { alert('Stop loop failed: ' + err.message); });

      } else if (action === 'remove') {
        if (!confirm('Remove this printer?')) return;
        fetch('/printer-monitor/printers/' + pid, { method: 'DELETE' })
          .then(function() { loadPrinters(); });
      }
    });

    // ── Edit modal save ───────────────────────────────────────────────────────
    document.getElementById('saveEditBtn').addEventListener('click', function() {
      var id = document.getElementById('editId').value;
      var body = {
        name:           document.getElementById('editName').value.trim(),
        ip:             document.getElementById('editIp').value.trim(),
        serial:         document.getElementById('editSerial').value.trim(),
        access_code:    document.getElementById('editCode').value.trim(),
        gpio_pin:       parseInt(document.getElementById('editPin').value),
        temp_threshold: parseFloat(document.getElementById('editThreshold').value),
        open_position:    parseInt(document.getElementById('editOpenPos').value),
        close_position:   parseInt(document.getElementById('editClosePos').value),
        preheat_enabled:  document.getElementById('editPreheatEnabled').checked,
        preheat_temp:     parseFloat(document.getElementById('editPreheatTemp').value),
        preheat_minutes:  parseFloat(document.getElementById('editPreheatMinutes').value)
      };
      fetch('/printer-monitor/printers/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Error'); });
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        loadPrinters();
      }).catch(function(err) { alert('Save failed: ' + err.message); });
    });

    // ── Add Printer submit ────────────────────────────────────────────────────
    function addPrinter() {
      var data = {
        name:           document.getElementById('pName').value.trim(),
        ip:             document.getElementById('pIp').value.trim(),
        serial:         document.getElementById('pSerial').value.trim(),
        access_code:    document.getElementById('pCode').value.trim(),
        temp_threshold: parseFloat(document.getElementById('pThreshold').value) || 35,
        gpio_pin:       parseInt(document.getElementById('pPin').value),
        open_position:  parseInt(document.getElementById('pOpenPos').value) || 1900,
        close_position: parseInt(document.getElementById('pClosePos').value) || 2500
      };
      if (!data.name || !data.ip || !data.serial || !data.access_code || isNaN(data.gpio_pin)) {
        alert('Please fill in all fields including GPIO Pin.');
        return;
      }
      fetch('/printer-monitor/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Error'); });
        ['pName','pIp','pSerial','pCode','pPin'].forEach(function(id) {
          document.getElementById(id).value = '';
        });
        document.getElementById('pThreshold').value = '35';
        document.getElementById('pOpenPos').value   = '1900';
        document.getElementById('pClosePos').value  = '2500';
        document.getElementById('addBody').style.display = 'none';
        document.getElementById('addChevron').className  = 'bi bi-chevron-down';
        loadPrinters();
      }).catch(function(err) { alert('Failed to add printer: ' + err.message); });
    }

    // ── Temperature history & rate ────────────────────────────────────────────
    var currentPrinters = [];
    var tempHistory = {};  // pid -> [{temp, time}]

    function updateHistory(printers) {
      var now = Date.now();
      printers.forEach(function(p) {
        var bed = (p.state || {}).bed_temp;
        if (bed == null) return;
        if (!tempHistory[p.id]) tempHistory[p.id] = [];
        var h = tempHistory[p.id];
        h.push({ temp: bed, time: now });
        if (h.length > 12) h.splice(0, h.length - 12);  // keep ~60 s
      });
    }

    function getTempRate(pid) {
      var h = tempHistory[pid];
      if (!h || h.length < 3) return null;
      var dt = (h[h.length - 1].time - h[0].time) / 60000;  // minutes
      if (dt < 0.1) return null;
      return (h[h.length - 1].temp - h[0].temp) / dt;  // °C/min
    }

    // ── Loop print ───────────────────────────────────────────────────────────
    var selectedLoopFile = null;

    function showLoopModal(pid) {
      selectedLoopFile = null;
      document.getElementById('loopPid').value = pid;
      document.getElementById('startLoopBtn').disabled = true;
      document.getElementById('loopFileList').innerHTML =
        '<span class="text-muted fst-italic p-1">Loading files…</span>';
      new bootstrap.Modal(document.getElementById('loopModal')).show();

      fetch('/printer-monitor/printers/' + pid + '/files')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var files = data.files || [];
          if (data.error) {
            document.getElementById('loopFileList').innerHTML =
              '<span class="text-danger p-1">' + escHtml(data.error) + '</span>';
            return;
          }
          if (!files.length) {
            document.getElementById('loopFileList').innerHTML =
              '<span class="text-muted fst-italic p-1">No .3mf files found on SD card.</span>';
            return;
          }
          document.getElementById('loopFileList').innerHTML = files.map(function(f) {
            var name = f.name || f;
            var url  = f.url  || '';
            return '<div class="list-group-item list-group-item-dark d-flex align-items-center gap-2 py-1 px-3" style="font-size:0.82rem">'
              + '<button type="button" class="btn btn-link text-decoration-none mono p-0 flex-grow-1 text-start" style="color:var(--cy-text);font-size:0.82rem" data-file="' + escHtml(name) + '" data-url="' + escHtml(url) + '">'
              + '<i class="bi bi-file-earmark-zip me-2 text-muted"></i>' + escHtml(name)
              + '</button>'
              + '<button type="button" class="btn btn-outline-danger btn-sm py-0 px-1" data-delete-file="' + escHtml(name) + '" title="Delete file">'
              + '<i class="bi bi-trash3" style="font-size:0.7rem"></i></button>'
              + '</div>';
          }).join('');
        })
        .catch(function(err) {
          document.getElementById('loopFileList').innerHTML =
            '<span class="text-danger p-1">Error: ' + escHtml(err.message) + '</span>';
        });
    }

    document.getElementById('loopFileList').addEventListener('click', function(e) {
      var delBtn = e.target.closest('[data-delete-file]');
      if (delBtn) {
        e.stopPropagation();
        var fname = delBtn.dataset.deleteFile;
        var pid = document.getElementById('loopPid').value;
        if (!confirm('Delete "' + fname + '" from printer?')) return;
        fetch('/printer-monitor/printers/' + pid + '/files/' + encodeURIComponent(fname), { method: 'DELETE' })
          .then(function(r) { if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Error'); }); })
          .then(function() { showLoopModal(pid); })
          .catch(function(err) { alert('Delete failed: ' + err.message); });
        return;
      }
      var btn = e.target.closest('[data-file]');
      if (!btn) return;
      document.querySelectorAll('#loopFileList [data-file]').forEach(function(el) {
        el.closest('.list-group-item').classList.remove('active');
      });
      btn.closest('.list-group-item').classList.add('active');
      selectedLoopFile = { name: btn.dataset.file, url: btn.dataset.url };
      document.getElementById('startLoopBtn').disabled = false;
    });

    document.getElementById('loopPreheatEnabled').addEventListener('change', function() {
      document.getElementById('loopPreheatOptions').style.display = this.checked ? '' : 'none';
    });

    document.getElementById('startLoopBtn').addEventListener('click', function() {
      var pid = document.getElementById('loopPid').value;
      if (!selectedLoopFile || !pid) return;
      var preheatEnabled = document.getElementById('loopPreheatEnabled').checked;
      var body = {
        file_name: selectedLoopFile.name,
        file_url:  selectedLoopFile.url,
        preheat_enabled: preheatEnabled,
        preheat_temp:    parseFloat(document.getElementById('loopPreheatTemp').value) || 65,
        preheat_minutes: parseFloat(document.getElementById('loopPreheatMinutes').value) || 5
      };
      fetch('/printer-monitor/printers/' + pid + '/loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
        bootstrap.Modal.getInstance(document.getElementById('loopModal')).hide();
        loadPrinters();
      }).catch(function(err) { alert('Loop start failed: ' + err.message); });
    });

    // ── Manual print ─────────────────────────────────────────────────────────
    var selectedPrintFile = null;

    function showPrintModal(pid) {
      selectedPrintFile = null;
      document.getElementById('printPid').value = pid;
      document.getElementById('confirmPrintBtn').disabled = true;
      document.getElementById('printFileList').innerHTML =
        '<span class="text-muted fst-italic p-1">Loading files…</span>';
      new bootstrap.Modal(document.getElementById('printModal')).show();

      fetch('/printer-monitor/printers/' + pid + '/files')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var files = data.files || [];
          if (data.error) {
            document.getElementById('printFileList').innerHTML =
              '<span class="text-danger p-1">' + escHtml(data.error) + '</span>';
            return;
          }
          if (!files.length) {
            document.getElementById('printFileList').innerHTML =
              '<span class="text-muted fst-italic p-1">No .3mf files found on SD card.</span>';
            return;
          }
          document.getElementById('printFileList').innerHTML = files.map(function(f) {
            var name = f.name || f;
            var url  = f.url  || '';
            return '<div class="list-group-item list-group-item-dark d-flex align-items-center gap-2 py-1 px-3" style="font-size:0.82rem">'
              + '<button type="button" class="btn btn-link text-decoration-none mono p-0 flex-grow-1 text-start" style="color:var(--cy-text);font-size:0.82rem" data-file="' + escHtml(name) + '" data-url="' + escHtml(url) + '">'
              + '<i class="bi bi-file-earmark-zip me-2 text-muted"></i>' + escHtml(name)
              + '</button>'
              + '<button type="button" class="btn btn-outline-danger btn-sm py-0 px-1" data-delete-file="' + escHtml(name) + '" title="Delete file">'
              + '<i class="bi bi-trash3" style="font-size:0.7rem"></i></button>'
              + '</div>';
          }).join('');
        })
        .catch(function(err) {
          document.getElementById('printFileList').innerHTML =
            '<span class="text-danger p-1">Error: ' + escHtml(err.message) + '</span>';
        });
    }

    document.getElementById('printFileList').addEventListener('click', function(e) {
      var delBtn = e.target.closest('[data-delete-file]');
      if (delBtn) {
        e.stopPropagation();
        var fname = delBtn.dataset.deleteFile;
        var pid = document.getElementById('printPid').value;
        if (!confirm('Delete "' + fname + '" from printer?')) return;
        fetch('/printer-monitor/printers/' + pid + '/files/' + encodeURIComponent(fname), { method: 'DELETE' })
          .then(function(r) { if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'Error'); }); })
          .then(function() { showPrintModal(pid); })
          .catch(function(err) { alert('Delete failed: ' + err.message); });
        return;
      }
      var btn = e.target.closest('[data-file]');
      if (!btn) return;
      document.querySelectorAll('#printFileList [data-file]').forEach(function(el) {
        el.closest('.list-group-item').classList.remove('active');
      });
      btn.closest('.list-group-item').classList.add('active');
      selectedPrintFile = { name: btn.dataset.file, url: btn.dataset.url };
      document.getElementById('confirmPrintBtn').disabled = false;
    });

    document.getElementById('confirmPrintBtn').addEventListener('click', function() {
      var pid = document.getElementById('printPid').value;
      if (!selectedPrintFile || !pid) return;
      fetch('/printer-monitor/printers/' + pid + '/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: selectedPrintFile.name, file_url: selectedPrintFile.url })
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
        bootstrap.Modal.getInstance(document.getElementById('printModal')).hide();
        loadPrinters();
      }).catch(function(err) { alert('Print failed: ' + err.message); });
    });

    // ── Recordings ───────────────────────────────────────────────────────────
    document.getElementById('recToggle').addEventListener('click', function() {
      var body    = document.getElementById('recBody');
      var chevron = document.getElementById('recChevron');
      var opening = body.style.display === 'none';
      body.style.display = opening ? 'block' : 'none';
      chevron.className  = opening ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
      if (opening) loadRecordings();
    });

    function loadRecordings() {
      fetch('/printer-monitor/recordings')
        .then(function(r) { return r.json(); })
        .then(function(files) {
          var el = document.getElementById('recList');
          if (!files.length) {
            el.innerHTML = '<span class="text-muted fst-italic">No recordings yet.</span>';
            return;
          }
          el.innerHTML = files.map(function(f) {
            var mb   = (f.size / 1048576).toFixed(1);
            var date = new Date(f.mtime * 1000).toLocaleString();
            return '<div class="d-flex align-items-center gap-2 py-1 border-bottom border-secondary">'
              + '<i class="bi bi-file-play text-muted"></i>'
              + '<span class="mono small flex-grow-1" style="font-size:0.8rem">' + escHtml(f.name) + '</span>'
              + '<span class="text-muted small">' + mb + ' MB</span>'
              + '<span class="text-muted small d-none d-md-inline">' + escHtml(date) + '</span>'
              + '<button class="btn btn-outline-success btn-sm" data-play="' + escHtml(f.name) + '">'
              + '<i class="bi bi-play-fill"></i></button>'
              + '<a href="/printer-monitor/recordings/' + encodeURIComponent(f.name) + '" '
              + 'class="btn btn-outline-primary btn-sm" download><i class="bi bi-download"></i></a>'
              + '<button class="btn btn-outline-danger btn-sm" data-rec="' + escHtml(f.name) + '">'
              + '<i class="bi bi-trash3"></i></button>'
              + '</div>';
          }).join('');
        })
        .catch(function() {
          document.getElementById('recList').innerHTML =
            '<span class="text-danger small">Failed to load recordings.</span>';
        });
    }

    document.getElementById('recList').addEventListener('click', function(e) {
      var playBtn = e.target.closest('[data-play]');
      if (playBtn) {
        var url = '/printer-monitor/recordings/' + encodeURIComponent(playBtn.dataset.play);
        document.getElementById('recVideoTitle').innerText = playBtn.dataset.play;
        var vid = document.getElementById('recVideo');
        vid.src = url;
        vid.load();
        new bootstrap.Modal(document.getElementById('recVideoModal')).show();
        return;
      }
      var btn = e.target.closest('[data-rec]');
      if (!btn) return;
      if (!confirm('Delete ' + btn.dataset.rec + '?')) return;
      fetch('/printer-monitor/recordings/' + encodeURIComponent(btn.dataset.rec), { method: 'DELETE' })
        .then(function() { loadRecordings(); });
    });

    document.getElementById('recVideoModal').addEventListener('hidden.bs.modal', function() {
      var vid = document.getElementById('recVideo');
      vid.pause();
      vid.src = '';
    });

    // ── Printer loader ────────────────────────────────────────────────────────
    function loadPrinters() {
      fetch('/printer-monitor/printers')
        .then(function(r) { return r.json(); })
        .then(function(printers) {
          currentPrinters = printers;
          updateHistory(printers);
          renderPrinters(printers);
        })
        .catch(function() {});
    }

    loadPrinters();
    setInterval(loadPrinters, 5000);
  </script>
</body>
</html>`)
})

app.listen(port, () => console.log(`Web dashboard listening on port ${port}`))
