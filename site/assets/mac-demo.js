/* mac.html: the app demo in the hero and the two drawings in "Mac or Chrome".
   Pane geometry follows desktop/src/lib/pane-layout.js (grid, a 72% spotlight
   with a rail, fill). Motion uses cie's expo curve and stops for reduced motion. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
  var MOVE_MS = 560;
  var KEY_PRESS_MS = 330;
  var SPOTLIGHT_SHARE = 0.72;
  var uid = 0;

  function t(key) { return window.awd ? window.awd.t(key) : key; }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // cubic-bezier(.76, 0, .18, 1), the --cie-ease-expo curve.
  function bezier(x1, y1, x2, y2) {
    function at(a1, a2, s) { return ((1 - 3 * a2 + 3 * a1) * s + (3 * a2 - 6 * a1)) * s * s + 3 * a1 * s; }
    function slope(a1, a2, s) { return 3 * (1 - 3 * a2 + 3 * a1) * s * s + 2 * (3 * a2 - 6 * a1) * s + 3 * a1; }
    return function (x) {
      if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
      var s = x;
      for (var i = 0; i < 8; i++) {
        var d = slope(x1, x2, s);
        if (Math.abs(d) < 1e-6) break;
        s -= (at(x1, x2, s) - x) / d;
      }
      return at(y1, y2, Math.min(1, Math.max(0, s)));
    };
  }
  var ease = bezier(0.76, 0, 0.18, 1);

  function paneBoxes(mode, focus, count, area, gap) {
    var boxes = [];
    var i;
    if (mode === 'grid') {
      var cols = Math.ceil(Math.sqrt(count));
      var rows = Math.ceil(count / cols);
      var w = (area.w - gap * (cols - 1)) / cols;
      var h = (area.h - gap * (rows - 1)) / rows;
      for (i = 0; i < count; i++) {
        boxes.push({ x: area.x + (i % cols) * (w + gap), y: area.y + Math.floor(i / cols) * (h + gap), w: w, h: h, o: 1 });
      }
      return boxes;
    }
    var mainW = (area.w - gap) * SPOTLIGHT_SHARE;
    var railX = area.x + mainW + gap;
    var railW = area.w - mainW - gap;
    var others = count - 1;
    var railH = (area.h - gap * (others - 1)) / Math.max(1, others);
    var slot = 0;
    for (i = 0; i < count; i++) {
      if (i === focus) {
        boxes.push(mode === 'fill'
          ? { x: area.x, y: area.y, w: area.w, h: area.h, o: 1 }
          : { x: area.x, y: area.y, w: mainW, h: area.h, o: 1 });
      } else {
        var rail = { x: railX, y: area.y + slot * (railH + gap), w: railW, h: railH, o: 1 };
        if (mode === 'fill') { rail.x = area.x + area.w + gap; rail.o = 0; }
        boxes.push(rail);
        slot++;
      }
    }
    return boxes;
  }

  function lerpBox(a, b, k) {
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k, o: a.o + (b.o - a.o) * k };
  }

  // Tweens a list of boxes; draw(boxes) runs every frame.
  function tweener(draw) {
    var current = null;
    var frame = 0;
    return {
      get: function () { return current; },
      to: function (target, animate, done) {
        cancelAnimationFrame(frame);
        if (!current || !animate) {
          current = target;
          draw(current);
          if (done) done();
          return;
        }
        var from = current;
        var start = performance.now();
        var step = function (now) {
          var k = ease(Math.min(1, (now - start) / MOVE_MS));
          current = target.map(function (box, i) { return lerpBox(from[i] || box, box, k); });
          draw(current);
          if (k < 1) frame = requestAnimationFrame(step);
          else if (done) done();
        };
        frame = requestAnimationFrame(step);
      }
    };
  }

  /* ---------- The app window ---------- */
  var PANES = [
    { name: 'Claude Code', host: 'claude.ai/code' },
    { name: 'Codex', host: 'chatgpt.com/codex' },
    { name: 'ChatGPT', host: 'chatgpt.com' },
    { name: 'Docs', host: 'developer.mozilla.org' }
  ];
  var MODES = [
    { id: 'grid', key: 'mac.demo.grid', w: 74 },
    { id: 'spotlight', key: 'mac.demo.spotlight', w: 96 },
    { id: 'fill', key: 'mac.demo.fill', w: 58 }
  ];

  function AppWindow(container, options) {
    var id = 'md' + (++uid);
    var W = 960, H = 600;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-hidden': 'true' }, container);
    var defs = el('defs', {}, svg);
    el('rect', { class: 'md-window', x: .75, y: .75, width: W - 1.5, height: H - 1.5, rx: 14 }, svg);
    [22, 42, 62].forEach(function (cx) { el('circle', { class: 'md-light', cx: cx, cy: 22, r: 5.5 }, svg); });
    el('text', { class: 'md-title', x: 86, y: 27 }, svg).textContent = 'AI Window Deck';
    el('line', { class: 'md-titlebar-rule', x1: 0, x2: W, y1: 44, y2: 44 }, svg);

    var chips = [];
    var chipX = W - 14;
    MODES.slice().reverse().forEach(function (mode) {
      chipX -= mode.w;
      var g = el('g', { class: 'md-chip' }, svg);
      el('rect', { x: chipX, y: 10, width: mode.w, height: 24, rx: 12 }, g);
      var label = el('text', { x: chipX + mode.w / 2, y: 26, 'text-anchor': 'middle' }, g);
      chips.unshift({ id: mode.id, key: mode.key, g: g, label: label });
      chipX -= 6;
    });

    var sideLabel = el('text', { class: 'md-side-label', x: 20, y: 76 }, svg);
    var cards = PANES.map(function (pane, i) {
      var y = 92 + i * 58;
      var g = el('g', { class: 'md-card' }, svg);
      el('rect', { x: 12, y: y, width: 180, height: 48, rx: 10 }, g);
      el('text', { class: 'md-num', x: 24, y: y + 20 }, g).textContent = String(i + 1).padStart(2, '0');
      el('text', { x: 50, y: y + 20 }, g).textContent = pane.name;
      el('text', { class: 'md-num', x: 50, y: y + 37 }, g).textContent = pane.host;
      return g;
    });

    var area = { x: 204, y: 54, w: W - 204 - 12, h: H - 54 - 12 };
    var panes = PANES.map(function (pane, i) {
      var clipId = id + '-clip-' + i;
      var clip = el('rect', { rx: 10 }, el('clipPath', { id: clipId }, defs));
      var g = el('g', { class: 'md-pane' }, svg);
      var frame = el('rect', { class: 'md-frame', rx: 10 }, g);
      var inner = el('g', { 'clip-path': 'url(#' + clipId + ')' }, g);
      var num = el('text', { class: 'md-num' }, inner);
      num.textContent = String(i + 1).padStart(2, '0');
      var name = el('text', { class: 'md-name' }, inner);
      name.textContent = pane.name;
      var rule = el('line', { class: 'md-head-rule' }, inner);
      var bars = [0.46, 0.3, 0.38].map(function () { return el('rect', { class: 'md-bar', height: 5, rx: 2.5 }, inner); });
      return { g: g, clip: clip, frame: frame, num: num, name: name, rule: rule, bars: bars };
    });

    var cursor = el('g', { class: 'md-cursor', opacity: 0 }, svg);
    var ripple = el('circle', { class: 'md-ripple', cx: 0, cy: 0, r: 14 }, cursor);
    el('path', { d: 'M0 0 L0 19 L5 14.5 L8.5 22 L11.5 20.6 L8.2 13.4 L14.5 13.4 Z' }, cursor);

    function set(node, attrs) { for (var key in attrs) node.setAttribute(key, attrs[key]); }
    function draw(boxes) {
      boxes.forEach(function (b, i) {
        var p = panes[i];
        var shape = { x: b.x + 3, y: b.y + 3, width: Math.max(0, b.w - 6), height: Math.max(0, b.h - 6) };
        set(p.frame, shape);
        set(p.clip, shape);
        p.g.setAttribute('opacity', b.o.toFixed(3));
        var x = shape.x, y = shape.y, w = shape.width, h = shape.height;
        set(p.num, { x: x + 12, y: y + 19 });
        set(p.name, { x: x + 38, y: y + 19 });
        set(p.rule, { x1: x, x2: x + w, y1: y + 29, y2: y + 29 });
        var widths = [0.46, 0.3, 0.38];
        p.bars.forEach(function (bar, j) {
          var by = y + 46 + j * 13;
          set(bar, { x: x + 14, y: by, width: Math.max(0, (w - 28) * widths[j]), opacity: by + 6 < y + h ? 1 : 0 });
        });
      });
    }
    var tween = tweener(draw);
    var state = { mode: 'grid', focus: 0 };

    function paint() {
      panes.forEach(function (p, i) { p.g.classList.toggle('is-focused', i === state.focus); });
      cards.forEach(function (g, i) { g.classList.toggle('is-focused', i === state.focus); });
      chips.forEach(function (chip) { chip.g.classList.toggle('is-on', chip.id === state.mode); });
    }
    function translate() {
      sideLabel.textContent = t('mac.demo.windows');
      chips.forEach(function (chip) { chip.label.textContent = t(chip.key); });
    }

    var cursorPos = { x: W - 80, y: H - 60 };
    function placeCursor(p, opacity) {
      cursorPos = p;
      cursor.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      cursor.setAttribute('opacity', String(opacity));
    }

    translate();
    paint();
    tween.to(paneBoxes(state.mode, state.focus, PANES.length, area, 8), false);
    placeCursor(cursorPos, 0);

    return {
      setState: function (mode, focus, animate) {
        state = { mode: mode, focus: focus };
        paint();
        tween.to(paneBoxes(mode, focus, PANES.length, area, 8), animate);
      },
      // Moves the pointer onto pane `index`'s title bar and clicks it.
      click: function (index, done) {
        var box = tween.get()[index];
        var target = { x: box.x + Math.min(box.w * 0.55, 150), y: box.y + 18 };
        var from = { x: Math.min(W - 40, target.x + 120), y: Math.min(H - 30, target.y + 140) };
        placeCursor(from, 1);
        var start = performance.now();
        var step = function (now) {
          var k = ease(Math.min(1, (now - start) / 640));
          placeCursor({ x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k }, 1);
          if (k < 1) return requestAnimationFrame(step);
          cursor.classList.remove('is-clicking');
          void cursor.getBBox();
          cursor.classList.add('is-clicking');
          setTimeout(done, 160);
        };
        requestAnimationFrame(step);
      },
      hideCursor: function () { cursor.setAttribute('opacity', '0'); },
      translate: translate
    };
  }

  /* ---------- Hero demo ---------- */
  var STEPS = [
    { mode: 'grid', focus: 0, hold: 1700, phase: 'mac.demo.phase.grid' },
    { mode: 'spotlight', focus: 0, key: 'X', hold: 2600, phase: 'mac.demo.phase.spotlight', caption: 'mac.demo.cap.spotlight' },
    { mode: 'spotlight', focus: 2, click: true, hold: 2600, phase: 'mac.demo.phase.click', caption: 'mac.demo.cap.click' },
    { mode: 'fill', focus: 2, key: 'Q', hold: 2300, phase: 'mac.demo.phase.fill', caption: 'mac.demo.cap.fill' },
    { mode: 'grid', focus: 2, key: 'Z', hold: 2100, phase: 'mac.demo.phase.grid', caption: 'mac.demo.cap.grid' }
  ];

  function keyCaps(key) {
    var parts = isMac ? ['⌥', key] : ['Alt', key];
    return parts.map(function (part) { return '<kbd class="keycap">' + part + '</kbd>'; }).join(isMac ? '' : '<span class="keycap-plus">+</span>');
  }

  function initHero() {
    var root = document.querySelector('[data-mac-demo]');
    if (!root) return;
    var live = root.querySelector('[data-demo-live]');
    var still = root.querySelector('[data-demo-static]');
    var keyRow = root.querySelector('.stage-key-row');
    var pause = root.querySelector('.stage-pause');
    var app = AppWindow(root.querySelector('[data-demo-stage]'));
    var stills = [];
    [['grid', 0, 'mac.demo.phase.grid'], ['spotlight', 0, 'mac.demo.phase.spotlight'], ['fill', 0, 'mac.demo.phase.fill']].forEach(function (s) {
      var fig = document.createElement('figure');
      var holder = document.createElement('div');
      var caption = document.createElement('figcaption');
      fig.appendChild(holder);
      fig.appendChild(caption);
      still.appendChild(fig);
      var mini = AppWindow(holder);
      mini.setState(s[0], s[1], false);
      stills.push({ app: mini, caption: caption, key: s[2] });
    });

    var index = 0;
    var paused = false;
    var visible = true;
    var timer = 0;

    function showKey(step) {
      keyRow.replaceChildren();
      if (!step.caption) return;
      var row = document.createElement('div');
      row.className = 'stage-key' + (paused ? ' is-frozen' : '');
      row.setAttribute('aria-hidden', 'true');
      row.innerHTML = (step.key ? '<span class="stage-key-caps">' + keyCaps(step.key) + '</span>' : '') + '<span class="stage-key-caption"></span>';
      row.querySelector('.stage-key-caption').textContent = t(step.caption);
      keyRow.appendChild(row);
    }
    function translate() {
      root.querySelector('[data-demo-label]').textContent = t('focusPreviewLabel');
      root.querySelector('[data-demo-phase]').textContent = t(STEPS[index].phase);
      root.querySelector('[data-demo-pause]').textContent = t('obPause');
      var caption = keyRow.querySelector('.stage-key-caption');
      if (caption && STEPS[index].caption) caption.textContent = t(STEPS[index].caption);
      app.translate();
      stills.forEach(function (s) { s.app.translate(); s.caption.textContent = t(s.key); });
    }
    function schedule() {
      clearTimeout(timer);
      if (paused || !visible || reduce.matches) return;
      timer = setTimeout(function () { run((index + 1) % STEPS.length); }, STEPS[index].hold);
    }
    function run(next) {
      index = next;
      var step = STEPS[index];
      root.querySelector('[data-demo-phase]').textContent = t(step.phase);
      showKey(step);
      if (step.click) {
        app.click(step.focus, function () { app.setState(step.mode, step.focus, true); setTimeout(app.hideCursor, MOVE_MS + 500); });
      } else {
        app.hideCursor();
        setTimeout(function () { app.setState(step.mode, step.focus, true); }, step.key ? KEY_PRESS_MS : 0);
      }
      schedule();
    }
    function render() {
      live.hidden = reduce.matches;
      still.hidden = !reduce.matches;
      pause.hidden = reduce.matches;
      pause.setAttribute('aria-pressed', String(paused));
      schedule();
    }

    pause.addEventListener('click', function () {
      paused = !paused;
      var key = keyRow.querySelector('.stage-key');
      if (key) key.classList.toggle('is-frozen', paused);
      render();
    });
    reduce.addEventListener('change', render);
    document.addEventListener('awd:lang', translate);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }).observe(root);
    }
    translate();
    render();
  }

  /* ---------- Mac or Chrome drawings ---------- */
  function miniWindows(svg, count) {
    return Array.from({ length: count }, function () {
      var g = el('g', { class: 'cmp-win' }, svg);
      return { g: g, frame: el('rect', { class: 'cmp-frame', rx: 4 }, g), bar: el('rect', { class: 'cmp-bar', rx: 1.5, height: 3 }, g) };
    });
  }
  function drawMini(wins) {
    return function (boxes) {
      boxes.forEach(function (b, i) {
        var w = wins[i];
        var x = b.x + 2, y = b.y + 2, ww = Math.max(0, b.w - 4), hh = Math.max(0, b.h - 4);
        w.frame.setAttribute('x', x); w.frame.setAttribute('y', y);
        w.frame.setAttribute('width', ww); w.frame.setAttribute('height', hh);
        w.bar.setAttribute('x', x + 6); w.bar.setAttribute('y', y + 6);
        w.bar.setAttribute('width', Math.max(0, ww * 0.4));
        w.g.setAttribute('opacity', b.o.toFixed(3));
      });
    };
  }
  function loop(root, frames, apply) {
    var i = 0;
    var timer = 0;
    var visible = false;
    function tick() {
      clearTimeout(timer);
      if (!visible || reduce.matches) return;
      timer = setTimeout(function () {
        i = (i + 1) % frames.length;
        apply(frames[i], true);
        tick();
      }, frames[i].hold);
    }
    apply(frames[reduce.matches ? frames.length - 1 : 0], false);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; tick(); }).observe(root);
    }
    reduce.addEventListener('change', function () { if (reduce.matches) apply(frames[frames.length - 1], false); tick(); });
  }

  function initCompare() {
    var ext = document.querySelector('[data-compare="extension"]');
    if (ext) {
      var svg = el('svg', { viewBox: '0 0 480 210', 'aria-hidden': 'true' }, ext);
      var displays = [{ x: 8, y: 14, w: 222, h: 140 }, { x: 250, y: 14, w: 222, h: 140 }];
      displays.forEach(function (d) {
        el('rect', { class: 'cmp-display', x: d.x, y: d.y, width: d.w, height: d.h, rx: 8 }, svg);
        el('rect', { class: 'cmp-stand', x: d.x + d.w / 2 - 18, y: d.y + d.h + 6, width: 36, height: 4, rx: 2 }, svg);
      });
      var wins = miniWindows(svg, 4);
      var tween = tweener(drawMini(wins));
      var inset = function (d) { return { x: d.x + 8, y: d.y + 8, w: d.w - 16, h: d.h - 16 }; };
      var a = inset(displays[0]), b = inset(displays[1]);
      var tiled = [
        { x: a.x, y: a.y, w: a.w / 2, h: a.h, o: 1 }, { x: a.x + a.w / 2, y: a.y, w: a.w / 2, h: a.h, o: 1 },
        { x: b.x, y: b.y, w: b.w / 2, h: b.h, o: 1 }, { x: b.x + b.w / 2, y: b.y, w: b.w / 2, h: b.h, o: 1 }
      ];
      var scattered = [
        { x: 40, y: 40, w: 120, h: 80, o: 1 }, { x: 110, y: 70, w: 130, h: 70, o: 1 },
        { x: 200, y: 30, w: 110, h: 90, o: 1 }, { x: 330, y: 60, w: 120, h: 76, o: 1 }
      ];
      var focused = tiled.slice();
      focused[0] = { x: a.x + a.w * 0.1, y: a.y + a.h * 0.1, w: a.w * 0.8, h: a.h * 0.8, o: 1 };
      var label = el('text', { class: 'cmp-label', x: 240, y: 196, 'text-anchor': 'middle' }, svg);
      var frames = [
        { boxes: scattered, focus: -1, hold: 1500, label: 'mac.cmp.ext.f1' },
        { boxes: tiled, focus: -1, hold: 2000, label: 'mac.cmp.ext.f2' },
        { boxes: focused, focus: 0, hold: 2200, label: 'mac.cmp.ext.f3' },
        { boxes: tiled, focus: -1, hold: 1800, label: 'mac.cmp.ext.f2' }
      ];
      var current = frames[0];
      var applyExt = function (frame, animate) {
        current = frame;
        label.textContent = t(frame.label);
        wins.forEach(function (w, i) {
          w.g.classList.toggle('is-focused', i === frame.focus);
          if (i === frame.focus) svg.appendChild(w.g);
        });
        tween.to(frame.boxes, animate && !reduce.matches);
      };
      document.addEventListener('awd:lang', function () { label.textContent = t(current.label); });
      loop(ext, frames, applyExt);
    }

    var appArt = document.querySelector('[data-compare="app"]');
    if (appArt) {
      var svg2 = el('svg', { viewBox: '0 0 480 210', 'aria-hidden': 'true' }, appArt);
      var screen = { x: 8, y: 14, w: 464, h: 140 };
      el('rect', { class: 'cmp-display', x: screen.x, y: screen.y, width: screen.w, height: screen.h, rx: 8 }, svg2);
      el('rect', { class: 'cmp-stand', x: 222, y: screen.y + screen.h + 6, width: 36, height: 4, rx: 2 }, svg2);
      var shell = { x: 120, y: 24, w: 240, h: 120 };
      el('rect', { class: 'md-window', x: shell.x, y: shell.y, width: shell.w, height: shell.h, rx: 7 }, svg2);
      [0, 1, 2].forEach(function (k) { el('circle', { class: 'md-light', cx: shell.x + 9 + k * 8, cy: shell.y + 8, r: 2.4 }, svg2); });
      var wins2 = miniWindows(svg2, 4);
      var tween2 = tweener(drawMini(wins2));
      var area = { x: shell.x + 6, y: shell.y + 16, w: shell.w - 12, h: shell.h - 22 };
      var label2 = el('text', { class: 'cmp-label', x: 240, y: 196, 'text-anchor': 'middle' }, svg2);
      var frames2 = [
        { mode: 'grid', focus: 0, hold: 1700, label: 'mac.cmp.app.f1' },
        { mode: 'spotlight', focus: 0, hold: 2000, label: 'mac.cmp.app.f2' },
        { mode: 'spotlight', focus: 2, hold: 2000, label: 'mac.cmp.app.f3' },
        { mode: 'grid', focus: 2, hold: 1700, label: 'mac.cmp.app.f1' }
      ];
      var current2 = frames2[0];
      var applyApp = function (frame, animate) {
        current2 = frame;
        label2.textContent = t(frame.label);
        wins2.forEach(function (w, i) { w.g.classList.toggle('is-focused', i === frame.focus); });
        tween2.to(paneBoxes(frame.mode, frame.focus, 4, area, 3), animate && !reduce.matches);
      };
      document.addEventListener('awd:lang', function () { label2.textContent = t(current2.label); });
      loop(appArt, frames2, applyApp);
    }
  }

  initHero();
  initCompare();
})();
