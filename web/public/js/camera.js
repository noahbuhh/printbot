// Camera zoom / rotate controls with localStorage persistence.
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
