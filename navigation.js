(function () {
  'use strict';

  const phoneScreen = document.getElementById('phoneScreen');
  const viewPlaylist = document.getElementById('viewPlaylist');
  const viewPlayer = document.getElementById('viewPlayer');
  const heroTrigger = document.getElementById('heroTrigger');
  const playerFrame = document.getElementById('playerFrame');

  const SLIDE_MS = 680;

  let currentView = 'playlist';
  let isNavigating = false;

  function syncPhoneScreenView() {
    if (!phoneScreen) return;
    phoneScreen.classList.toggle('is-player-view', currentView === 'player');
  }

  function postToPlayer(action) {
    try {
      if (playerFrame && playerFrame.contentWindow) {
        playerFrame.contentWindow.postMessage({ type: 'aero-nav', action: action }, '*');
      }
    } catch (_) { /* file:// */ }
  }

  function ensurePlayerFrame() {
    if (!playerFrame || playerFrame.dataset.loaded === '1') return;
    playerFrame.src = 'player.html?embed=1';
    playerFrame.dataset.loaded = '1';
  }

  function mountPlayer() {
    if (!viewPlayer) return;
    viewPlayer.classList.add('is-mounted');
    viewPlayer.classList.remove('exit');
    viewPlayer.style.display = 'block';
  }

  function unmountPlayer() {
    if (!viewPlayer) return;
    viewPlayer.classList.remove('is-mounted', 'active', 'exit');
    viewPlayer.style.display = 'none';
    viewPlayer.setAttribute('aria-hidden', 'true');
  }

  function afterSlide(view, cb) {
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      view.removeEventListener('transitionend', onEnd);
      cb();
    }
    function onEnd(e) {
      if (e.target !== view || e.propertyName !== 'transform') return;
      finish();
    }
    view.addEventListener('transitionend', onEnd);
    window.setTimeout(finish, SLIDE_MS + 80);
  }

  function goToPlayer() {
    if (currentView !== 'playlist' || isNavigating) return;
    isNavigating = true;

    ensurePlayerFrame();
    mountPlayer();
    currentView = 'player';
    syncPhoneScreenView();

    viewPlayer.setAttribute('aria-hidden', 'false');
    viewPlaylist.setAttribute('aria-hidden', 'true');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        viewPlayer.classList.add('active');
        postToPlayer('embed-ready');
        postToPlayer('reveal-sheet');
      });
    });

    afterSlide(viewPlayer, function () {
      viewPlaylist.classList.remove('active');
      viewPlaylist.style.display = 'none';
      isNavigating = false;
    });
  }

  function goToPlaylist() {
    if (currentView !== 'player' || isNavigating) return;
    isNavigating = true;
    currentView = 'playlist';
    syncPhoneScreenView();

    postToPlayer('collapse-sheet');
    postToPlayer('pause');

    viewPlaylist.style.display = 'block';
    viewPlaylist.classList.add('active');
    viewPlaylist.setAttribute('aria-hidden', 'false');
    viewPlayer.setAttribute('aria-hidden', 'true');

    viewPlayer.classList.remove('active');
    viewPlayer.classList.add('exit');

    afterSlide(viewPlayer, function () {
      unmountPlayer();
      isNavigating = false;
    });
  }

  if (heroTrigger) {
    heroTrigger.addEventListener('click', goToPlayer);
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'aero-nav') return;
    if (event.data.action === 'back') goToPlaylist();
  });

  if (playerFrame) {
    playerFrame.addEventListener('load', function () {
      postToPlayer('embed-ready');
    });
  }

  if (viewPlaylist) {
    viewPlaylist.classList.add('active');
    viewPlaylist.style.display = 'block';
    viewPlaylist.setAttribute('aria-hidden', 'false');
  }

  unmountPlayer();
  syncPhoneScreenView();
  ensurePlayerFrame();

  const statusTime = document.getElementById('statusTime');
  if (statusTime) {
    function tickStatusTime() {
      const d = new Date();
      statusTime.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    tickStatusTime();
    setInterval(tickStatusTime, 60000);
  }
})();
