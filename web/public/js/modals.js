// Edit, Add, Loop, Print modals. Uses currentPrinters (cards.js) and escHtml (utils.js).

// ── Edit modal save ─────────────────────────────────────────────────────────
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

// ── Add Printer submit ──────────────────────────────────────────────────────
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

// ── Loop print modal ────────────────────────────────────────────────────────
var selectedLoopFile = null;

function renderLoopExtraPrinters(sourcePid) {
  var el = document.getElementById('loopExtraPrinters');
  var others = currentPrinters.filter(function(p) { return p.id !== sourcePid; });
  if (!others.length) {
    el.innerHTML = '<span class="text-muted fst-italic" style="font-size:0.78rem">No other printers configured.</span>';
    return;
  }
  el.innerHTML = others.map(function(p) {
    return '<div class="form-check form-check-inline m-0">'
      + '<input class="form-check-input loop-extra-printer" type="checkbox" value="' + escHtml(p.id) + '" id="loop-extra-' + escHtml(p.id) + '">'
      + '<label class="form-check-label small" for="loop-extra-' + escHtml(p.id) + '">' + escHtml(p.name) + '</label>'
      + '</div>';
  }).join('');
}

function showLoopModal(pid) {
  selectedLoopFile = null;
  document.getElementById('loopPid').value = pid;
  document.getElementById('startLoopBtn').disabled = true;
  document.getElementById('loopFileList').innerHTML =
    '<span class="text-muted fst-italic p-1">Loading files…</span>';
  document.getElementById('loopContinueOnFailed').checked = false;
  document.getElementById('loopStallTimeout').value = 0;
  renderLoopExtraPrinters(pid);
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
          + '<button type="button" class="btn btn-link text-decoration-none mono p-0 flex-grow-1 text-start" style="color:#ffffff;font-size:0.95rem;font-weight:600" data-file="' + escHtml(name) + '" data-url="' + escHtml(url) + '">'
          + '<i class="bi bi-file-earmark-zip me-2" style="color:var(--cy-cyan)"></i>' + escHtml(name)
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
  var preheatEnabled    = document.getElementById('loopPreheatEnabled').checked;
  var continueOnFailed  = document.getElementById('loopContinueOnFailed').checked;
  var stallTimeoutMin   = parseFloat(document.getElementById('loopStallTimeout').value) || 0;
  var MULTILOOP_STAGGER_SEC = 5 * 60;  // extra printers start staggered 5 min apart
  var body = {
    file_name: selectedLoopFile.name,
    file_url:  selectedLoopFile.url,
    preheat_enabled: preheatEnabled,
    preheat_temp:    parseFloat(document.getElementById('loopPreheatTemp').value) || 100,
    preheat_minutes: parseFloat(document.getElementById('loopPreheatMinutes').value) || 10,
    continue_on_failed: continueOnFailed,
    stall_timeout_min:  stallTimeoutMin,
    start_delay_sec:    0
  };
  var extraIds = Array.prototype.map.call(
    document.querySelectorAll('#loopExtraPrinters .loop-extra-printer:checked'),
    function(el) { return el.value; }
  );
  // Target the source printer (start immediately) + each extra, staggered
  // MULTILOOP_STAGGER_SEC apart so the printers don't all start in lockstep.
  var targets = [{ id: pid, body: body }];
  extraIds.forEach(function(id, i) {
    targets.push({
      id: id,
      body: {
        file_name: selectedLoopFile.name,
        file_url:  'file:///sdcard/' + encodeURIComponent(selectedLoopFile.name),
        preheat_enabled: preheatEnabled,
        preheat_temp:    body.preheat_temp,
        preheat_minutes: body.preheat_minutes,
        continue_on_failed: continueOnFailed,
        stall_timeout_min:  stallTimeoutMin,
        start_delay_sec:    (i + 1) * MULTILOOP_STAGGER_SEC
      }
    });
  });
  Promise.all(targets.map(function(t) {
    return fetch('/printer-monitor/printers/' + t.id + '/loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t.body)
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(e) {
        throw new Error((currentPrinters.find(function(p){return p.id===t.id;}) || {}).name + ': ' + (e.error || 'HTTP ' + r.status));
      });
    });
  })).then(function() {
    bootstrap.Modal.getInstance(document.getElementById('loopModal')).hide();
    loadPrinters();
  }).catch(function(err) { alert('Loop start failed: ' + err.message); });
});

// ── Manual print modal ──────────────────────────────────────────────────────
var selectedPrintFile = null;

function updateBulkDeleteBtn() {
  var n = document.querySelectorAll('#printFileList .file-check:checked').length;
  document.getElementById('bulkDeleteCount').innerText = n;
  document.getElementById('bulkDeleteBtn').disabled = (n === 0);
}

function renderExtraPrinters(sourcePid) {
  var el = document.getElementById('printExtraPrinters');
  var others = currentPrinters.filter(function(p) { return p.id !== sourcePid; });
  if (!others.length) {
    el.innerHTML = '<span class="text-muted fst-italic" style="font-size:0.78rem">No other printers configured.</span>';
    return;
  }
  el.innerHTML = others.map(function(p) {
    return '<div class="form-check form-check-inline m-0">'
      + '<input class="form-check-input extra-printer" type="checkbox" value="' + escHtml(p.id) + '" id="extra-' + escHtml(p.id) + '">'
      + '<label class="form-check-label small" for="extra-' + escHtml(p.id) + '">' + escHtml(p.name) + '</label>'
      + '</div>';
  }).join('');
}

function showPrintModal(pid) {
  selectedPrintFile = null;
  document.getElementById('printPid').value = pid;
  document.getElementById('confirmPrintBtn').disabled = true;
  document.getElementById('bulkDeleteBtn').disabled = true;
  document.getElementById('bulkDeleteCount').innerText = '0';
  document.getElementById('printFileList').innerHTML =
    '<span class="text-muted fst-italic p-1">Loading files…</span>';
  renderExtraPrinters(pid);
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
          + '<input type="checkbox" class="form-check-input file-check m-0" data-name="' + escHtml(name) + '" title="Select for bulk delete">'
          + '<button type="button" class="btn btn-link text-decoration-none mono p-0 flex-grow-1 text-start" style="color:#ffffff;font-size:0.95rem;font-weight:600" data-file="' + escHtml(name) + '" data-url="' + escHtml(url) + '">'
          + '<i class="bi bi-file-earmark-zip me-2" style="color:var(--cy-cyan)"></i>' + escHtml(name)
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

// ── File upload ─────────────────────────────────────────────────────────────
document.getElementById('uploadFile').addEventListener('change', function() {
  document.getElementById('uploadBtn').disabled = !this.files.length;
  document.getElementById('uploadStatus').innerHTML = '';
});

document.getElementById('uploadBtn').addEventListener('click', function() {
  var fileInput = document.getElementById('uploadFile');
  var file = fileInput.files[0];
  if (!file) return;
  var pid = document.getElementById('printPid').value;
  var toAll = document.getElementById('uploadToAll').checked;
  var statusEl = document.getElementById('uploadStatus');
  var btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  statusEl.innerHTML = '<span style="color:var(--cy-cyan)"><i class="bi bi-hourglass-split me-1"></i>Uploading ' + escHtml(file.name) + '…</span>';

  var form = new FormData();
  form.append('file', file);

  if (toAll && currentPrinters.length > 1) {
    form.append('printer_ids', currentPrinters.map(function(p) { return p.id; }).join(','));
    fetch('/printer-monitor/multi-upload', { method: 'POST', body: form })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) throw new Error(d.error);
        var failed = (d.results || []).filter(function(x) { return x.status !== 'uploaded'; });
        if (failed.length) {
          statusEl.innerHTML = '<span style="color:var(--cy-yellow)"><i class="bi bi-exclamation-triangle me-1"></i>'
            + failed.map(function(x) { return escHtml(x.name) + ' failed'; }).join(', ') + '</span>';
        } else {
          statusEl.innerHTML = '<span style="color:var(--cy-green)"><i class="bi bi-check-lg me-1"></i>Uploaded to '
            + d.results.length + ' printer(s)</span>';
        }
        fileInput.value = '';
        btn.disabled = true;
        showPrintModal(pid);
      })
      .catch(function(err) {
        statusEl.innerHTML = '<span style="color:var(--cy-magenta)"><i class="bi bi-x-circle me-1"></i>' + escHtml(err.message) + '</span>';
        btn.disabled = false;
      });
  } else {
    fetch('/printer-monitor/printers/' + pid + '/files/upload', { method: 'POST', body: form })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.error) throw new Error(d.error);
        statusEl.innerHTML = '<span style="color:var(--cy-green)"><i class="bi bi-check-lg me-1"></i>'
          + escHtml(d.file) + ' uploaded</span>';
        fileInput.value = '';
        btn.disabled = true;
        showPrintModal(pid);
      })
      .catch(function(err) {
        statusEl.innerHTML = '<span style="color:var(--cy-magenta)"><i class="bi bi-x-circle me-1"></i>' + escHtml(err.message) + '</span>';
        btn.disabled = false;
      });
  }
});

document.getElementById('printFileList').addEventListener('click', function(e) {
  if (e.target.classList.contains('file-check')) {
    updateBulkDeleteBtn();
    return;
  }
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

document.getElementById('bulkDeleteBtn').addEventListener('click', function() {
  var pid = document.getElementById('printPid').value;
  var names = Array.prototype.map.call(
    document.querySelectorAll('#printFileList .file-check:checked'),
    function(el) { return el.dataset.name; }
  );
  if (!names.length) return;
  if (!confirm('Delete ' + names.length + ' file(s) from printer?')) return;
  fetch('/printer-monitor/printers/' + pid + '/files/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filenames: names })
  })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, d: d }; }); })
    .then(function(res) {
      if (!res.ok) throw new Error(res.d.error || 'Error');
      var failed = (res.d.results || []).filter(function(x) { return x.status !== 'deleted'; });
      if (failed.length) {
        alert('Some files failed: ' + failed.map(function(x) { return x.file; }).join(', '));
      }
      showPrintModal(pid);
    })
    .catch(function(err) { alert('Bulk delete failed: ' + err.message); });
});

document.getElementById('confirmPrintBtn').addEventListener('click', function() {
  var pid = document.getElementById('printPid').value;
  if (!selectedPrintFile || !pid) return;
  var extraIds = Array.prototype.map.call(
    document.querySelectorAll('#printExtraPrinters .extra-printer:checked'),
    function(el) { return el.value; }
  );

  var startSource = fetch('/printer-monitor/printers/' + pid + '/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: selectedPrintFile.name, file_url: selectedPrintFile.url })
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
  });

  var startExtras = extraIds.length
    ? fetch('/printer-monitor/multi-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: selectedPrintFile.name, printer_ids: extraIds })
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
        return r.json();
      }).then(function(d) {
        var failed = (d.results || []).filter(function(x) { return x.status !== 'sent'; });
        if (failed.length) {
          alert('Some printers failed: ' + failed.map(function(x) { return x.name; }).join(', '));
        }
      })
    : Promise.resolve();

  Promise.all([startSource, startExtras])
    .then(function() {
      bootstrap.Modal.getInstance(document.getElementById('printModal')).hide();
      loadPrinters();
    })
    .catch(function(err) { alert('Print failed: ' + err.message); });
});
