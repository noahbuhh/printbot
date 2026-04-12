// Rendering helpers shared by cards.js and modals.js.
// All functions are global (plain <script> tags, no module system).

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
