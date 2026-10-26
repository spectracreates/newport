/*
 * Workbench interactions:
 * 1. Rulers printed along the cutting mat.
 * 2. The robot arm: a two-link arm solved with inverse kinematics every frame.
 *    Hero: follows the pointer (idles when there is none); click or tap to grab.
 *    Bench: reaches for the project you hover or focus. Folds away elsewhere.
 * 3. Project dialogs, the pricing calculator, and video housekeeping.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Rulers ---------- */
  function printRulers() {
    var x = $(".ruler-x"), y = $(".ruler-y");
    if (!x || !y) return;
    x.textContent = ""; y.textContent = "";
    for (var i = 1; i * 80 < window.innerWidth; i++) {
      var s = document.createElement("span"); s.style.left = i * 80 + "px"; s.textContent = i * 5; x.appendChild(s);
    }
    var h = $(".hero").offsetHeight;
    for (var j = 1; j * 80 < h; j++) {
      var t = document.createElement("span"); t.style.top = j * 80 + "px"; t.textContent = j * 5; y.appendChild(t);
    }
  }

  /* ---------- 2. Robot arm ---------- */
  var svg = $(".arm"), hero = $(".hero"), bench = $(".bench"), robo = $(".robotics"), mount = $(".robo-mount");
  var reads = { shoulder: $('[data-read="shoulder"]'), elbow: $('[data-read="elbow"]'), reach: $('[data-read="reach"]') };
  var NS = "http://www.w3.org/2000/svg";
  var parts = $$(".part[data-case]");

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Build the arm once: base, two links, wrist and a two-jaw gripper.
  // Each link is drawn pointing along +x from its joint, then rotated into place.
  function buildArm(root, shadow) {
    var fill = shadow ? "#05140e" : null;
    var g = {};
    g.base = el("g", {}, root);
    el("ellipse", { cx: 0, cy: 6, rx: 46, ry: 18, fill: fill || "#1d2021" }, g.base);
    el("rect", { x: -34, y: -22, width: 68, height: 30, rx: 10, fill: fill || "#2a2d2e" }, g.base);
    if (!shadow) {
      for (var b = -1; b <= 1; b += 2) el("circle", { cx: b * 24, cy: -7, r: 3, fill: "#6d7476" }, g.base);
      el("rect", { x: -30, y: -20, width: 60, height: 4, rx: 2, fill: "rgba(255,255,255,0.08)" }, g.base);
    }
    g.upper = el("g", {}, root);
    g.upperLink = el("rect", { rx: 16, fill: fill || "#ff6b1a" }, g.upper);
    if (!shadow) {
      g.upperShine = el("rect", { rx: 4, fill: "rgba(255,255,255,0.28)" }, g.upper);
      g.cable1 = el("path", { fill: "none", stroke: "#1b1b1b", "stroke-width": 3, "stroke-linecap": "round" }, g.upper);
    }
    g.fore = el("g", {}, root);
    g.foreLink = el("rect", { rx: 13, fill: fill || "#ff6b1a" }, g.fore);
    if (!shadow) {
      g.foreShine = el("rect", { rx: 3, fill: "rgba(255,255,255,0.28)" }, g.fore);
      g.cable2 = el("path", { fill: "none", stroke: "#1b1b1b", "stroke-width": 2.5, "stroke-linecap": "round" }, g.fore);
    }
    g.wrist = el("g", {}, root);
    el("rect", { x: -6, y: -12, width: 30, height: 24, rx: 6, fill: fill || "#2a2d2e" }, g.wrist);
    g.jawA = el("path", { fill: fill || "#3b4042" }, g.wrist);
    g.jawB = el("path", { fill: fill || "#3b4042" }, g.wrist);
    // Joints on top of links
    g.shoulder = el("g", {}, root);
    el("circle", { r: 24, fill: fill || "#2a2d2e" }, g.shoulder);
    if (!shadow) { el("circle", { r: 10, fill: "none", stroke: "#6d7476", "stroke-width": 2.5 }, g.shoulder); el("circle", { r: 3, fill: "#9aa1a3" }, g.shoulder); }
    g.elbow = el("g", {}, root);
    el("circle", { r: 19, fill: fill || "#2a2d2e" }, g.elbow);
    if (!shadow) { el("circle", { r: 8, fill: "none", stroke: "#6d7476", "stroke-width": 2.2 }, g.elbow); el("circle", { r: 2.5, fill: "#9aa1a3" }, g.elbow); }
    return g;
  }

  var A = null, S = null; // arm and its shadow
  var geo = { scale: 1, L1: 300, L2: 280, baseL: 300, mult: 1 };
  var state = {
    mode: "hero",               // hero | bench | away
    base: { x: 0, y: 0 }, baseV: { x: 0, y: 0 },
    tip: { x: 0, y: 0 }, tipV: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    grip: 0, gripTarget: 0,     // 0 open .. 1 closed
    pointer: null, lastPointer: 0,
    active: null,
    running: false, raf: 0, t: 0, last: 0,
  };

  function sizeArm() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var small = vw < 760;
    var L = small ? Math.min(vw * 0.34, 150) : Math.min(vw * 0.3, vh * 0.48, 420);
    geo.baseL = L;
    geo.small = small;
    applyLength(geo.mult || 1);
  }

  function baseFor(mode) {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (mode === "hero") {
      var r = hero.getBoundingClientRect();
      // Phones: mounted on the right edge in the empty space above the headline.
      if (geo.small) return { x: vw - 34, y: r.top + vh * 0.24 };
      return { x: vw - 130, y: Math.min(vh, r.bottom) - 80 };
    }
    if (mode === "robo" && mount) {
      var m = mount.getBoundingClientRect();
      return { x: m.left + 40, y: m.bottom - 28 };
    }
    if (mode === "bench") {
      // A gantry along the top edge: the base slides to sit up and right of what it reaches for,
      // so the arm comes down from above instead of across the project.
      var tx = state.active ? partTarget(state.active).x : vw * 0.78;
      return { x: Math.max(geo.L1 * 0.4, Math.min(vw - 40, tx + geo.L1 * 0.7)), y: -18 };
    }
    return { x: vw - 120, y: -geo.L1 * 2.6 };
  }

  // Inverse kinematics for a two-link arm. Returns the shoulder and elbow angles
  // (elbow-up solution) that put the wrist at (tx, ty) relative to the base.
  function solve(bx, by, tx, ty) {
    var L1 = geo.L1, L2 = geo.L2;
    var dx = tx - bx, dy = ty - by;
    var d = Math.sqrt(dx * dx + dy * dy);
    // Never fully straight: a robot arm reads as a robot when its elbow is bent.
    d = Math.max(Math.abs(L1 - L2) + 1, Math.min((L1 + L2) * 0.9, d));
    var aim = Math.atan2(dy, dx);
    var cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    var a1 = aim - Math.acos(Math.max(-1, Math.min(1, cosA))) * (dx < 0 ? -1 : 1);
    var ex = bx + L1 * Math.cos(a1), ey = by + L1 * Math.sin(a1);
    var a2 = Math.atan2(by + d * Math.sin(aim) - ey, bx + d * Math.cos(aim) - ex);
    return { a1: a1, a2: a2, ex: ex, ey: ey, wx: ex + L2 * Math.cos(a2), wy: ey + L2 * Math.sin(a2) };
  }

  var deg = function (r) { return (r * 180) / Math.PI; };

  // The arm can shrink to fit a smaller workspace (the robotics section).
  function applyLength(mult) {
    geo.mult = mult;
    geo.L1 = geo.baseL * mult; geo.L2 = geo.L1 * 0.94;
    geo.scale = geo.L1 / 300;
  }
  function multFor(mode) {
    if (mode !== "robo" || !mount) return 1;
    var m = mount.getBoundingClientRect();
    return Math.min(1, (m.height * 0.6) / geo.baseL, (m.width * 0.46) / geo.baseL);
  }
  function clampToMount(p) {
    var m = mount.getBoundingClientRect(), pad = 24;
    return { x: Math.max(m.left + pad, Math.min(m.right - pad, p.x)), y: Math.max(m.top + pad, Math.min(m.bottom - pad, p.y)) };
  }

  function pose(g, bx, by, k, grip, isShadow) {
    var s = geo.scale;
    var w1 = 44 * s, w2 = 34 * s;
    g.base.setAttribute("transform", "translate(" + bx + "," + by + ") scale(" + s + ")");
    g.upper.setAttribute("transform", "translate(" + bx + "," + by + ") rotate(" + deg(k.a1) + ")");
    g.upperLink.setAttribute("x", -w1 / 2); g.upperLink.setAttribute("y", -w1 / 2);
    g.upperLink.setAttribute("width", geo.L1 + w1); g.upperLink.setAttribute("height", w1);
    g.fore.setAttribute("transform", "translate(" + k.ex + "," + k.ey + ") rotate(" + deg(k.a2) + ")");
    g.foreLink.setAttribute("x", -w2 / 2); g.foreLink.setAttribute("y", -w2 / 2);
    g.foreLink.setAttribute("width", geo.L2 + w2 / 2); g.foreLink.setAttribute("height", w2);
    if (!isShadow) {
      g.upperShine.setAttribute("x", 8 * s); g.upperShine.setAttribute("y", -w1 / 2 + 4 * s);
      g.upperShine.setAttribute("width", Math.max(0, geo.L1 - 16 * s)); g.upperShine.setAttribute("height", 3.5 * s);
      g.foreShine.setAttribute("x", 6 * s); g.foreShine.setAttribute("y", -w2 / 2 + 3.5 * s);
      g.foreShine.setAttribute("width", Math.max(0, geo.L2 - 12 * s)); g.foreShine.setAttribute("height", 3 * s);
      var c1 = w1 * 0.62, c2 = w2 * 0.62;
      g.cable1.setAttribute("d", "M" + 6 * s + "," + c1 + " C" + geo.L1 * 0.4 + "," + (c1 + 6 * s) + " " + geo.L1 * 0.7 + "," + (c1 + 6 * s) + " " + (geo.L1 - 4 * s) + "," + c1 * 0.5);
      g.cable2.setAttribute("d", "M" + 4 * s + "," + c2 + " C" + geo.L2 * 0.4 + "," + (c2 + 5 * s) + " " + geo.L2 * 0.7 + "," + (c2 + 5 * s) + " " + (geo.L2 - 6 * s) + "," + c2 * 0.6);
    }
    g.shoulder.setAttribute("transform", "translate(" + bx + "," + by + ") scale(" + s + ")");
    g.elbow.setAttribute("transform", "translate(" + k.ex + "," + k.ey + ") scale(" + s + ")");
    g.wrist.setAttribute("transform", "translate(" + k.wx + "," + k.wy + ") rotate(" + deg(k.a2) + ") scale(" + s + ")");
    // Jaws: open = spread 13px, closed = 4px
    var o = 13 - 9 * grip;
    g.jawA.setAttribute("d", "M18,-" + (o + 6) + " h22 a4,4 0 0 1 4,4 v2 h-22 a4,4 0 0 1 -4,-4z");
    g.jawB.setAttribute("d", "M18," + (o + 6) + " h22 a4,4 0 0 0 4,-4 v-2 h-22 a4,4 0 0 0 -4,4z");
  }

  // Critically damped spring step (stiffness k). Smooth, never overshoots.
  function spring(p, v, target, k, dt) {
    var c = 2 * Math.sqrt(k);
    var ax = k * (target.x - p.x) - c * v.x, ay = k * (target.y - p.y) - c * v.y;
    v.x += ax * dt; v.y += ay * dt;
    p.x += v.x * dt; p.y += v.y * dt;
  }

  function restTarget(b) {
    // Folded: wrist tucked in near the base, on the side facing the page.
    var down = b.y < window.innerHeight / 2 ? 1 : -1;
    return { x: b.x - geo.L1 * 0.6, y: b.y + down * geo.L1 * 0.75 };
  }

  function idleTarget(b, t) {
    // A slow figure of eight over the mat when nobody is pointing.
    var r = geo.L1 * 0.55;
    if (geo.small) return { x: b.x - geo.L1 * 1.05 + Math.sin(t * 0.45) * r * 0.7, y: b.y - geo.L1 * 0.1 + Math.sin(t * 0.9) * r * 0.45 };
    return { x: b.x - geo.L1 * 0.95 + Math.sin(t * 0.45) * r, y: b.y - geo.L1 * 0.85 + Math.sin(t * 0.9) * r * 0.35 };
  }

  function roboIdle(b, t) {
    // Sweep slowly through the workspace above the mount.
    var r = geo.L1 * 0.7;
    return { x: b.x + geo.L1 * 0.9 + Math.cos(t * 0.5) * r, y: b.y - geo.L1 * 0.9 + Math.sin(t * 0.8) * r * 0.45 };
  }

  var readTick = 0;
  function readout(k) {
    if (state.mode !== "robo" || !reads.shoulder) return;
    if ((readTick = (readTick + 1) % 5)) return;
    var sh = Math.round(-deg(k.a1));
    var el = Math.round(180 - Math.abs(((deg(k.a2 - k.a1) + 540) % 360) - 180));
    var d = Math.hypot(k.wx - state.base.x, k.wy - state.base.y) / (geo.L1 + geo.L2);
    reads.shoulder.textContent = sh + "°";
    reads.elbow.textContent = el + "°";
    reads.reach.textContent = Math.round(d * 100) + "%";
  }

  function partTarget(p) {
    var tape = p.querySelector(".tape") || p;
    var r = tape.getBoundingClientRect();
    return { x: r.left + r.width * 0.45, y: r.top - 6 };
  }

  function frame(now) {
    state.raf = 0;
    if (!state.running) return;
    var dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now; state.t += dt;

    var mt = multFor(state.mode);
    if (Math.abs(mt - geo.mult) > 0.001) applyLength(geo.mult + (mt - geo.mult) * Math.min(1, dt * 6));
    var bTarget = baseFor(state.mode);
    spring(state.base, state.baseV, bTarget, 60, dt);

    var tgt;
    if (state.mode === "hero" || state.mode === "robo") {
      var fresh = state.pointer && now - state.lastPointer < 6000;
      tgt = fresh ? state.pointer : state.mode === "hero" ? idleTarget(state.base, state.t) : roboIdle(state.base, state.t);
      if (state.mode === "robo" && mount) tgt = clampToMount(tgt);
    } else if (state.mode === "bench" && state.active) {
      tgt = partTarget(state.active);
    } else {
      tgt = restTarget(state.base);
    }
    spring(state.tip, state.tipV, tgt, state.mode === "hero" ? 38 : 30, dt);
    state.grip += (state.gripTarget - state.grip) * Math.min(1, dt * 14);

    render();
    state.raf = requestAnimationFrame(frame);
  }

  function render() {
    var k = solve(state.base.x, state.base.y, state.tip.x, state.tip.y);
    pose(A, state.base.x, state.base.y, k, state.grip, false);
    readout(k);
    // Lamp is top left, so the shadow falls down and to the right.
    var off = 14 * geo.scale;
    var ks = solve(state.base.x + off, state.base.y + off, state.tip.x + off * 1.6, state.tip.y + off * 1.6);
    pose(S, state.base.x + off, state.base.y + off, ks, state.grip, true);
  }

  function start() {
    if (state.running || reduce.matches) return;
    state.running = true; state.last = 0;
    state.raf = requestAnimationFrame(frame);
  }
  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function staticPose() {
    // Reduced motion: one still pose in the hero, pointing at the headline.
    stop();
    state.base = baseFor("hero");
    var h = $("#hero-title").getBoundingClientRect();
    state.tip = { x: Math.min(h.right + 30, state.base.x - geo.L1 * 0.4), y: h.top + h.height * 0.35 };
    render();
  }

  function setMode(m) {
    if (m === state.mode) return;
    state.mode = m;
    state.lastPointer = 0;
    if (m !== "bench") setActive(null);
  }

  function setActive(p) {
    if (state.active === p) return;
    if (state.active) state.active.classList.remove("lift");
    state.active = p;
    state.gripTarget = p ? 1 : 0;
    if (p) p.classList.add("lift");
  }

  function initArm() {
    if (!svg || !hero) return;
    var shadowRoot = $(".arm-shadow", svg), bodyRoot = $(".arm-body", svg);
    S = buildArm(shadowRoot, true);
    A = buildArm(bodyRoot, false);
    sizeArm();
    state.base = baseFor("hero");
    state.tip = idleTarget(state.base, 0);

    // Which part of the page are we on?
    var vis = { hero: 0, bench: 0, robo: 0 };
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { vis[e.target === hero ? "hero" : e.target === robo ? "robo" : "bench"] = e.intersectionRatio; });
        var m = vis.hero > 0.35 ? "hero" : vis.robo > 0.45 ? "robo" : (vis.bench > 0.12 && fine.matches && !geo.small) ? "bench" : "away";
        setMode(m);
        // Stop drawing entirely once the arm has folded away and nothing is in view.
        if (m === "away" && vis.hero === 0 && vis.bench === 0 && vis.robo === 0) { setTimeout(function () { if (state.mode === "away") stop(); }, 900); }
        else if (!reduce.matches) start();
      }, { threshold: [0, 0.12, 0.2, 0.35, 0.5, 0.75, 1] });
      io.observe(hero); if (bench) io.observe(bench); if (robo) io.observe(robo);
    }

    // Pointer in the hero
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      state.pointer = { x: e.clientX, y: e.clientY }; state.lastPointer = performance.now();
    });
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      state.pointer = { x: e.clientX, y: e.clientY }; state.lastPointer = performance.now();
      state.gripTarget = 1;
    });
    window.addEventListener("pointerup", function () { if (state.mode === "hero" || state.mode === "robo") state.gripTarget = 0; });
    hero.addEventListener("pointerleave", function () { state.lastPointer = 0; });

    // Pointer in the robotics section drives the arm too
    if (robo) {
      robo.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch" || state.mode !== "robo") return;
        state.pointer = { x: e.clientX, y: e.clientY }; state.lastPointer = performance.now();
      });
      robo.addEventListener("pointerdown", function (e) {
        if (state.mode !== "robo" || e.target.closest("a, button")) return;
        state.pointer = { x: e.clientX, y: e.clientY }; state.lastPointer = performance.now();
        state.gripTarget = 1;
      });
      robo.addEventListener("pointerleave", function () { state.lastPointer = 0; });
    }

    // Projects on the bench
    parts.forEach(function (p) {
      p.addEventListener("pointerenter", function () { if (state.mode === "bench") setActive(p); });
      p.addEventListener("pointerleave", function () { if (state.active === p) setActive(null); });
      p.addEventListener("focus", function () { if (state.mode === "bench") setActive(p); });
      p.addEventListener("blur", function () { if (state.active === p) setActive(null); });
    });

    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (state.mode !== "away" && !reduce.matches) start(); });

    var rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeArm(); printRulers(); if (reduce.matches) staticPose(); }, 120);
    });

    function applyMotion() {
      if (reduce.matches) staticPose();
      else start();
    }
    if (reduce.addEventListener) reduce.addEventListener("change", applyMotion);
    applyMotion();
  }

  /* ---------- 3. Project dialogs ---------- */
  var dialog = $("#case");
  var opener = null;

  function openCase(id, from) {
    var tpl = document.getElementById("case-" + id);
    if (!tpl || !dialog) return;
    var inner = $(".case-inner", dialog);
    inner.textContent = "";
    inner.appendChild(tpl.content.cloneNode(true));
    $$("[data-clone]", inner).forEach(function (slot) {
      var src = document.querySelector(slot.getAttribute("data-clone"));
      if (src) slot.appendChild(src.cloneNode(true));
    });
    initCalc(inner);
    opener = from || null;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.documentElement.style.overflow = "hidden";
    var close = $(".case-close", dialog);
    if (close) close.focus();
  }

  function closeCase() {
    if (!dialog) return;
    $$("video", dialog).forEach(function (v) { v.pause(); });
    if (dialog.open) dialog.close();
  }

  if (dialog) {
    dialog.addEventListener("close", function () {
      $$("video", dialog).forEach(function (v) { v.pause(); });
      document.documentElement.style.overflow = "";
      if (opener) opener.focus();
    });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) closeCase(); });
    $(".case-close", dialog).addEventListener("click", closeCase);
  }
  parts.forEach(function (p) {
    p.addEventListener("click", function () {
      // The arm closes its grip as the project opens.
      state.gripTarget = 1;
      openCase(p.getAttribute("data-case"), p);
    });
  });

  /* ---------- SpectraXpress pricing, same formula as the store's server ---------- */
  var naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  function initCalc(root) {
    var c = $("[data-calc]", root);
    if (!c) return;
    var out = $("[data-out]", c);
    function num(k) { var v = parseFloat($('[data-k="' + k + '"]', c).value); return isFinite(v) && v >= 0 ? v : 0; }
    function update() {
      var rate = num("rate");
      var price = 5000 + num("usd") * rate + num("lb") * 5 * rate;
      out.textContent = naira.format(Math.ceil(price / 100) * 100);
    }
    $$("input", c).forEach(function (i) { i.addEventListener("input", update); });
    update();
  }

  printRulers();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(printRulers);
  initArm();
})();
