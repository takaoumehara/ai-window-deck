/* Vanilla port of setup/FocusPreview.jsx and onboarding/ShortcutKey.jsx.
   Geometry is the large + center branch of lib/focus-view.js (LARGE_RATIO=.8).
   The extension calls the unchanged sibling positions 'behind' in its preview. */
(function () {
  'use strict';
  const preview = document.querySelector('[data-focus-preview]');
  if (!preview) return;
  const PHASE_MS = [1400, 3000, 2400];
  const PHASE_KEYS = ['focusPhaseTiled', 'focusPhaseFocused', 'focusPhaseBack'];
  const FALLBACK = [[0, 0, 4, 6], [4, 0, 4, 6], [8, 0, 4, 6], [0, 6, 4, 6], [4, 6, 8, 6]];
  const aspect = 1.6;
  function focusLayout(workArea) {
    const width = Math.round(workArea.width * .8);
    const height = Math.round(workArea.height * .8);
    return { left: workArea.left + Math.round((workArea.width - width) / 2), top: workArea.top + Math.round((workArea.height - height) / 2), width, height };
  }
  function focusFrames() {
    const wa = { left: 0, top: 0, width: 1600, height: Math.round(1600 / aspect) };
    const target = focusLayout(wa);
    return {
      tiles: FALLBACK.map(([x, y, w, h]) => ({ left: x / 12 * 100, top: y / 12 * 100, width: w / 12 * 100, height: h / 12 * 100 })),
      hero: { left: (target.left - wa.left) / wa.width * 100, top: (target.top - wa.top) / wa.height * 100, width: target.width / wa.width * 100, height: target.height / wa.height * 100 }
    };
  }
  function splitShortcut(shortcut) {
    if (shortcut.includes('+')) return shortcut.split('+').map(part => part.trim()).filter(Boolean);
    const keys = []; let rest = '';
    for (const ch of shortcut.replace(/\s+/g, '')) {
      if ('⌘⌥⇧⌃'.includes(ch) && !rest) keys.push(ch); else rest += ch;
    }
    if (rest) keys.push(rest);
    return keys;
  }
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  const shortcut = isMac ? '⌥X' : 'Alt+X';
  const frames = focusFrames();
  const requested = new URLSearchParams(location.search).get('fvPhase');
  const frozen = /^[0-2]$/.test(requested || '');
  let phase = frozen ? Number(requested) : 0;
  let paused = false;
  let timer;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const live = preview.querySelector('[data-focus-live]');
  const stage = live.querySelector('.focus-stage');
  const staticPair = preview.querySelector('.focus-static');
  const pause = preview.querySelector('.stage-pause');
  const keyRow = preview.querySelector('.stage-key-row');
  const t = key => window.awd.t(key);

  function Stage(node, value, animate) {
    node.classList.toggle('deck-diagram-animated', animate);
    node.dataset.diagramPhase = value;
    const display = node.querySelector('.focus-display');
    display.style.aspectRatio = String(aspect);
    if (!display.children.length) {
      frames.tiles.forEach((_, i) => {
        const tile = document.createElement('div');
        tile.dataset.role = i === 0 ? 'hero' : 'other';
        tile.innerHTML = '<div class="diagram-tile-inner"><span class="diagram-bar"></span><span class="diagram-num">' + String(i + 1).padStart(2, '0') + '</span></div>';
        display.appendChild(tile);
      });
    }
    Array.from(display.children).forEach((tile, i) => {
      const state = value !== 1 ? 'tile' : i === 0 ? 'hero' : 'behind';
      const box = value === 1 && i === 0 ? frames.hero : frames.tiles[i];
      tile.className = 'diagram-tile focus-tile is-' + state;
      tile.dataset.state = state;
      Object.keys(box).forEach(key => { tile.style[key] = box[key] + '%'; });
      tile.style.zIndex = i === 0 ? 3 : 1;
    });
    node.setAttribute('aria-hidden', 'true');
  }
  function StageKey() {
    keyRow.replaceChildren();
    if (phase === 0) return;
    const key = document.createElement('div');
    key.className = 'stage-key' + (frozen || paused ? ' is-frozen' : '');
    key.setAttribute('aria-hidden', 'true');
    key.innerHTML = '<span class="stage-key-caps">' + splitShortcut(shortcut).map(k => '<kbd class="keycap">' + k + '</kbd>').join(isMac ? '' : '<span class="keycap-plus">+</span>') + '</span><span class="stage-key-caption"></span>';
    keyRow.appendChild(key);
  }
  function translate() {
    preview.querySelector('[data-focus-label]').textContent = t('focusPreviewLabel');
    preview.querySelector('[data-focus-phase]').textContent = t(PHASE_KEYS[phase]);
    preview.querySelector('[data-focus-pause]').textContent = t('obPause');
    const caption = keyRow.querySelector('.stage-key-caption');
    if (caption) caption.textContent = t(phase === 1 ? 'obKeyEnlarge' : 'obKeyBack');
    staticPair.querySelectorAll('[data-caption]').forEach(el => { el.textContent = t(el.dataset.caption); });
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && !frozen && !media.matches) timer = setTimeout(() => { phase = (phase + 1) % 3; render(); }, PHASE_MS[phase]);
  }
  function render() {
    preview.dataset.phase = media.matches ? 'static' : String(phase);
    preview.dataset.paused = String(paused);
    preview.classList.toggle('is-static', media.matches);
    live.hidden = media.matches;
    staticPair.hidden = !media.matches;
    pause.hidden = media.matches;
    pause.setAttribute('aria-pressed', String(paused));
    Stage(stage, phase, !frozen && !paused && !media.matches);
    StageKey();
    translate();
    schedule();
  }
  [0, 1].forEach((value, i) => {
    if (i) {
      const arrow = document.createElement('div'); arrow.className = 'diagram-arrow';
      arrow.innerHTML = '<span aria-hidden="true">→</span><kbd class="key-cap">' + shortcut + '</kbd>';
      staticPair.appendChild(arrow);
    }
    const panel = document.createElement('div');
    panel.innerHTML = '<p class="focus-static-caption" data-caption="' + PHASE_KEYS[value] + '"></p><div class="focus-stage"><div class="focus-display deck-diagram"></div><div class="focus-dock"></div></div>';
    staticPair.appendChild(panel);
    Stage(panel.querySelector('.focus-stage'), value, false);
  });
  pause.addEventListener('click', () => { paused = !paused; render(); });
  media.addEventListener('change', render);
  document.addEventListener('awd:lang', translate);
  render();
})();
