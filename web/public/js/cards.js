// Printer cards: render, incremental update, delegated click handler.
// Globals exposed: currentPrinters, tempHistory, getTempRate, makeRateHtml,
// makeLoopHtml, buildCard, updateCardData, renderPrinters, updateHistory.

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
  if (phase === 'scheduled' && s.loop_start_at) {
    var ssecs = Math.max(0, Math.round(s.loop_start_at - Date.now() / 1000));
    var sm    = Math.floor(ssecs / 60);
    var sss   = ssecs % 60;
    var scd   = sm + ':' + (sss < 10 ? '0' : '') + sss;
    return '<div class="d-flex align-items-center gap-2 mt-1" style="font-size:0.78rem">'
      + '<i class="bi bi-clock-history" style="color:var(--cy-yellow)"></i>'
      + '<span style="color:var(--cy-yellow)">Scheduled</span>'
      + '<span class="mono text-muted">' + escHtml(name) + '</span>'
      + '<span class="text-muted">starts in ' + scd + '</span>'
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

// Build full card HTML (called once per printer per list change).
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

// Patch only the live data fields — iframes/static parts are untouched.
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

// Smart render: full rebuild only when printer list changes.
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
    printers.forEach(updateCardData);  // data poll: patch in-place
    return;
  }
  _renderedIds = newIds;
  grid.innerHTML = printers.map(buildCard).join('');
}

// Single delegated click handler for every card button.
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
    document.getElementById('editPreheatTemp').value    = printer.preheat_temp    || 100;
    document.getElementById('editPreheatMinutes').value = printer.preheat_minutes || 10;
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
