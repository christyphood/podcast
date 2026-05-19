(function () {
  'use strict';

  var container = document.getElementById('playlistAmbient');
  if (!container || !window.AeroAmbient) return;

  var ambient = window.AeroAmbient.mount(container, { energy: 0 });
  if (!ambient) return;

  window.playlistAmbient = ambient;

  document.addEventListener('visibilitychange', function () {
    ambient.setPaused(document.hidden);
  });
})();
