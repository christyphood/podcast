(function () {
  'use strict';

  const phoneScreen = document.getElementById('phoneScreen');
  const viewPlaylist = document.getElementById('viewPlaylist');
  const viewPlayer = document.getElementById('viewPlayer');
  const heroTrigger = document.getElementById('heroTrigger');
  const discLongPress = document.getElementById('discLongPress');
  const playerFrame = document.getElementById('playerFrame');

  const SLIDE_MS = 680;
  const LONG_PRESS_MS = 480;
  const PULL_COMMIT_RATIO = 0.22;
  const DISC_LONG_PRESS_PULL = 48;

  let currentView = 'playlist';
  let isNavigating = false;
  let pagePull = null;

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
    viewPlayer.classList.remove('is-mounted', 'active', 'exit', 'is-page-pulling');
    viewPlayer.style.display = 'none';
    viewPlayer.style.transform = '';
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

  function getPullMax() {
    if (!phoneScreen) return 400;
    return Math.max(280, phoneScreen.clientHeight * 0.92);
  }

  function getPullThreshold() {
    return Math.max(56, getPullMax() * PULL_COMMIT_RATIO);
  }

  function clearPagePullStyles() {
    if (!viewPlaylist || !viewPlayer) return;
    viewPlaylist.classList.remove('is-page-pulling');
    viewPlayer.classList.remove('is-page-pulling');
    viewPlaylist.style.transform = '';
    viewPlayer.style.transform = '';
  }

  function setPagePullOffset(px) {
    if (!viewPlaylist || !viewPlayer) return;
    const y = Math.max(0, Math.min(getPullMax(), px));
    viewPlaylist.style.transform = 'translateY(' + y + 'px)';
    viewPlayer.style.transform = 'translateY(calc(-100% + ' + y + 'px))';
    if (pagePull) pagePull.pullY = y;
  }

  function cancelPagePull() {
    clearPagePullStyles();
    if (currentView === 'playlist') unmountPlayer();
  }

  function goToPlayer() {
    if (currentView !== 'playlist' || isNavigating) return;
    isNavigating = true;
    clearPagePullStyles();

    ensurePlayerFrame();
    mountPlayer();
    currentView = 'player';
    syncPhoneScreenView();

    viewPlayer.setAttribute('aria-hidden', 'false');
    viewPlaylist.setAttribute('aria-hidden', 'true');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        viewPlayer.classList.remove('is-page-pulling');
        viewPlayer.style.transform = '';
        viewPlayer.classList.add('active');
        postToPlayer('embed-ready');
        postToPlayer('reveal-sheet');
      });
    });

    afterSlide(viewPlayer, function () {
      viewPlaylist.classList.remove('active', 'is-page-pulling');
      viewPlaylist.style.transform = '';
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
      clearPagePullStyles();
      isNavigating = false;
    });
  }

  function setupPagePullDown() {
    if (!viewPlaylist || !viewPlayer) return;

    pagePull = {
      active: false,
      startX: 0,
      startY: 0,
      pullY: 0,
      moved: false,
      fromHero: false
    };

    function canStartPull(e) {
      if (currentView !== 'playlist' || isNavigating) return false;
      if (e.target.closest('.app-nav__btn')) return false;
      if (e.target.closest('#discLongPress')) return false;
      return true;
    }

    function endPagePull(e) {
      if (!pagePull.active) return;
      pagePull.active = false;
      viewPlaylist.classList.remove('is-page-pulling');
      viewPlayer.classList.remove('is-page-pulling');
      try { viewPlaylist.releasePointerCapture(e.pointerId); } catch (_) { /* */ }

      if (pagePull.pullY >= getPullThreshold()) {
        goToPlayer();
        return;
      }

      cancelPagePull();

      if (!pagePull.moved && pagePull.fromHero) {
        goToPlayer();
      }
    }

    viewPlaylist.addEventListener('pointerdown', function (e) {
      if (!canStartPull(e)) return;
      pagePull.active = true;
      pagePull.startX = e.clientX;
      pagePull.startY = e.clientY;
      pagePull.pullY = 0;
      pagePull.moved = false;
      pagePull.fromHero = !!(heroTrigger && e.target.closest('#heroTrigger'));

      ensurePlayerFrame();
      mountPlayer();
      viewPlayer.setAttribute('aria-hidden', 'false');

      viewPlaylist.classList.add('is-page-pulling');
      viewPlayer.classList.add('is-page-pulling');
      setPagePullOffset(0);
      viewPlaylist.setPointerCapture(e.pointerId);
    });

    viewPlaylist.addEventListener('pointermove', function (e) {
      if (!pagePull.active) return;
      const dx = e.clientX - pagePull.startX;
      const dy = e.clientY - pagePull.startY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 6) pagePull.moved = true;
      if (dy > 0) setPagePullOffset(dy * 0.92);
    });

    viewPlaylist.addEventListener('pointerup', endPagePull);
    viewPlaylist.addEventListener('pointercancel', endPagePull);
  }

  function setupDiscLongPress() {
    if (!discLongPress) return;

    let longPressTimer = null;

    function clearLongPress() {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    discLongPress.addEventListener('pointerdown', function (e) {
      if (currentView !== 'playlist' || isNavigating) return;
      e.stopPropagation();
      clearLongPress();
      longPressTimer = window.setTimeout(function () {
        longPressTimer = null;
        if (pagePull && pagePull.pullY >= DISC_LONG_PRESS_PULL) {
          goToPlayer();
          return;
        }
        if (pagePull && pagePull.active) {
          setPagePullOffset(getPullThreshold());
          goToPlayer();
        }
      }, LONG_PRESS_MS);
      discLongPress.setPointerCapture(e.pointerId);
    });

    function endLongPress(e) {
      clearLongPress();
      try { discLongPress.releasePointerCapture(e.pointerId); } catch (_) { /* */ }
    }

    discLongPress.addEventListener('pointerup', endLongPress);
    discLongPress.addEventListener('pointercancel', endLongPress);
    discLongPress.addEventListener('pointerleave', endLongPress);
  }

  setupPagePullDown();
  setupDiscLongPress();

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
