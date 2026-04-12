// Top-level wiring: Add-Printer panel, global servo sliders, Open/Close All,
// printer poll loop. Runs last — depends on globals from cards.js + modals.js.

// ── Add Printer toggle + submit ─────────────────────────────────────────────
document.getElementById('addToggle').addEventListener('click', function() {
  var body    = document.getElementById('addBody');
  var chevron = document.getElementById('addChevron');
  var opening = body.style.display === 'none';
  body.style.display    = opening ? 'block' : 'none';
  chevron.className     = opening ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
});
document.getElementById('addSubmitBtn').addEventListener('click', addPrinter);

// ── Global servo settings ───────────────────────────────────────────────────
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

// ── Open All / Close All ────────────────────────────────────────────────────
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

// ── Printer poll loop ───────────────────────────────────────────────────────
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
