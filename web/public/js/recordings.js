// Recordings panel: toggle, list, play, delete.

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
