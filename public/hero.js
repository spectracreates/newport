/*
 * Hero: Third Mainland Bridge at night, rendered live as a long exposure.
 * The bridge sweeps in from the right foreground and recedes toward Lagos Island.
 * Static parts (sky, skyline, deck, lamps) are drawn once per resize; each frame only
 * advances the light trails, adds bloom from a downscaled copy, and mirrors it all in the lagoon.
 */
(function () {
  var hero = document.querySelector(".hero");
  var canvas = hero && hero.querySelector(".scene");
  var toggle = hero && hero.querySelector(".motion-toggle");
  if (!canvas || !canvas.getContext) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ctx = canvas.getContext("2d");
  function layer() { var c = document.createElement("canvas"); return { c: c, g: c.getContext("2d") }; }
  var bg = layer(), fx = layer(), bloom = layer(), refl = layer();

  var W = 0, H = 0, DPR = 1, small = false;
  var cars = [], beacons = [];
  var running = false, userPaused = false, onScreen = true, last = 0, raf = 0, frameSkip = 0, clock = 0;

  var seed = 1;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ---------- Geometry: u = 0 near (right foreground) .. 1 far (Lagos Island) ----------
  var G = {};
  function setupGeometry() {
    small = W < 700;
    G.horizon = H * (small ? 0.27 : 0.33);
    G.water = G.horizon + H * 0.012;
    G.near = { x: W * 1.08, y: H * (small ? 0.355 : 0.455) };
    G.far = { x: W * (small ? 0.06 : 0.16), y: G.horizon - H * 0.004 };
    G.ctrl = { x: W * (small ? 0.62 : 0.66), y: H * (small ? 0.31 : 0.37) };
  }
  function deck(u) {
    // Quadratic curve with a perspective-style easing: near end covers more screen.
    var t = 1 - Math.pow(1 - u, 1.8);
    var a = 1 - t;
    return {
      x: a * a * G.near.x + 2 * a * t * G.ctrl.x + t * t * G.far.x,
      y: a * a * G.near.y + 2 * a * t * G.ctrl.y + t * t * G.far.y,
      s: Math.max(0.045, Math.pow(1 - u, 1.35)), // scale with distance
    };
  }

  // ---------- Static background ----------
  function drawBackground() {
    var g = bg.g;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    var hz = G.horizon;

    var sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, "#050d1a");
    sky.addColorStop(0.55, "#0c1f37");
    sky.addColorStop(1, "#2b2a3d");
    g.fillStyle = sky;
    g.fillRect(0, 0, W, hz + 1);

    // Light pollution over the island.
    var glow = g.createRadialGradient(G.far.x + W * 0.08, hz, 0, G.far.x + W * 0.08, hz, W * 0.55);
    glow.addColorStop(0, "rgba(255,150,70,0.28)");
    glow.addColorStop(0.4, "rgba(255,120,60,0.08)");
    glow.addColorStop(1, "rgba(255,120,60,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, hz + 1);

    seed = 7;
    for (var s = 0; s < Math.round(W / 14); s++) {
      var a = 0.15 + rand() * 0.45;
      g.fillStyle = "rgba(255,244,220," + a + ")";
      var sz = rand() < 0.08 ? 1.6 : 1;
      g.fillRect(rand() * W, rand() * hz * 0.6, sz, sz);
    }

    // Skyline: a hazy far row, then the island towers.
    var span0 = Math.max(0, G.far.x - W * 0.2), span1 = Math.min(W, G.far.x + W * (small ? 0.62 : 0.5));
    function row(alpha, minH, maxH, seedStart, windows) {
      seed = seedStart;
      var x = span0;
      var unit = Math.max(0.6, H / 900);
      while (x < span1) {
        var bw = (10 + rand() * 30) * unit;
        var tall = rand() < 0.14;
        var bh = (tall ? maxH * (0.6 + rand() * 0.4) : minH + rand() * (maxH * 0.45)) * unit;
        // Taper the skyline toward the edges of the island.
        var mid = (x - span0) / (span1 - span0);
        bh *= 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, Math.max(0, mid)));
        g.fillStyle = "rgba(8,18,33," + alpha + ")";
        g.fillRect(x, hz - bh, bw, bh + 1);
        if (tall && bw > 16) { // setback crown
          g.fillRect(x + bw * 0.2, hz - bh - bh * 0.08, bw * 0.6, bh * 0.08 + 1);
          if (rand() < 0.6) beacons.push({ x: x + bw * 0.5, y: hz - bh - bh * 0.08 - 3, p: rand() * 6.28 });
        }
        if (windows) {
          for (var wy = hz - bh + 4; wy < hz - 3; wy += 4.2 * unit) {
            var floorLit = rand() < 0.55;
            for (var wx = x + 2; wx < x + bw - 2; wx += 3.6 * unit) {
              if (floorLit && rand() < 0.42) {
                var warm = rand() < 0.72;
                g.fillStyle = warm ? "rgba(255,186,96," + (0.5 + rand() * 0.45) + ")" : "rgba(220,235,255," + (0.35 + rand() * 0.4) + ")";
                g.fillRect(wx, wy, 1.4 * unit, 1.9 * unit);
              }
            }
          }
        }
        x += bw + rand() * 4 * unit;
      }
    }
    beacons = [];
    row(0.55, 8, 70, 41, false);
    row(1, 12, 150, 528, true);

    // Haze band sitting on the waterline.
    var haze = g.createLinearGradient(0, hz - H * 0.05, 0, hz + H * 0.02);
    haze.addColorStop(0, "rgba(60,70,95,0)");
    haze.addColorStop(0.7, "rgba(70,78,105,0.16)");
    haze.addColorStop(1, "rgba(70,78,105,0)");
    g.fillStyle = haze;
    g.fillRect(0, hz - H * 0.05, W, H * 0.07);

    // Lagoon.
    var water = g.createLinearGradient(0, G.water, 0, H);
    water.addColorStop(0, "#1a2236");
    water.addColorStop(0.12, "#0d1d33");
    water.addColorStop(0.5, "#07142a");
    water.addColorStop(1, "#040b18");
    g.fillStyle = water;
    g.fillRect(0, G.water, W, H - G.water);

    // Bridge: piers, deck slab, parapet. Drawn far to near so the near end overlaps.
    var N = 160;
    for (var i = N; i >= 0; i--) {
      var u = i / N, p = deck(u);
      if (i % 4 === 0) {
        var pierW = Math.max(1, 7 * p.s), pierH = (G.water + (H * 0.03) * p.s) - p.y;
        g.fillStyle = "rgba(3,9,18,0.95)";
        g.fillRect(p.x - pierW / 2, p.y + 6 * p.s, pierW, Math.max(0, pierH + 30 * p.s));
      }
    }
    g.lineCap = "round";
    for (var k = 0; k < N; k++) {
      var p0 = deck(k / N), p1 = deck((k + 1) / N);
      g.strokeStyle = "#02070f";
      g.lineWidth = Math.max(1.2, 22 * p0.s);
      g.beginPath(); g.moveTo(p0.x, p0.y + 6 * p0.s); g.lineTo(p1.x, p1.y + 6 * p1.s); g.stroke();
      g.strokeStyle = "rgba(120,140,170,0.22)";
      g.lineWidth = Math.max(0.6, 1.5 * p0.s);
      g.beginPath(); g.moveTo(p0.x, p0.y - 4 * p0.s); g.lineTo(p1.x, p1.y - 4 * p1.s); g.stroke();
    }

    // Sodium lamps, spaced evenly in world space so they bunch up with distance.
    for (var L = 0; L < 1; L += 0.035) {
      var q = deck(L), poleH = 46 * q.s, r = Math.max(2, 26 * q.s);
      g.strokeStyle = "rgba(30,45,65,0.9)";
      g.lineWidth = Math.max(0.6, 2 * q.s);
      g.beginPath(); g.moveTo(q.x, q.y - 3 * q.s); g.lineTo(q.x, q.y - poleH); g.stroke();
      var lg = g.createRadialGradient(q.x, q.y - poleH, 0, q.x, q.y - poleH, r);
      lg.addColorStop(0, "rgba(255,214,140,1)");
      lg.addColorStop(0.18, "rgba(255,178,63,0.55)");
      lg.addColorStop(1, "rgba(255,178,63,0)");
      g.fillStyle = lg;
      g.fillRect(q.x - r, q.y - poleH - r, r * 2, r * 2);
      // Pool of light on the deck.
      g.fillStyle = "rgba(255,178,63," + 0.10 * Math.min(1, q.s * 2) + ")";
      g.beginPath(); g.ellipse(q.x, q.y, 20 * q.s, 4 * q.s, 0, 0, Math.PI * 2); g.fill();
    }
  }

  // ---------- Traffic ----------
  function makeCar(dir, anywhere) {
    // dir 1 = driving away (tail lights, red), -1 = coming toward us (headlights, white)
    return {
      dir: dir,
      u: anywhere ? Math.random() : (dir > 0 ? -0.02 : 1.02),
      v: 0.05 + Math.random() * 0.06,
      lane: dir > 0 ? 6 + Math.random() * 4 : -6 - Math.random() * 4,
      b: 0.75 + Math.random() * 0.25,
    };
  }
  function populate() {
    cars = [];
    var n = small ? 40 : 90;
    for (var i = 0; i < n; i++) cars.push(makeCar(i % 2 ? 1 : -1, true));
  }

  function step(dt) {
    var g = fx.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "rgba(0,0,0," + Math.min(1, 0.03 * dt * 60) + ")";
    g.fillRect(0, 0, fx.c.width, fx.c.height);
    g.globalCompositeOperation = "lighter";
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.lineCap = "round";
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i], u0 = c.u;
      c.u += c.dir * c.v * dt;
      if (c.u < 0 && c.dir < 0 || c.u > 1 && c.dir > 0) { cars[i] = makeCar(c.dir, false); continue; }
      var a = deck(Math.max(0, u0)), b = deck(Math.max(0, c.u));
      var off = c.lane;
      var col = c.dir > 0 ? "255,64,52" : "255,246,226";
      var w = Math.max(0.5, 5.2 * b.s);
      var alpha = c.b * (0.45 + 0.55 * Math.min(1, b.s * 1.6));
      g.strokeStyle = "rgba(" + col + "," + alpha + ")";
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(a.x, a.y + off * a.s * 0.5);
      g.lineTo(b.x, b.y + off * b.s * 0.5);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
  }

  // Bloom: shrink the light layer to 1/6 size, then stretch it back up. Cheap, smooth glow.
  function makeBloom() {
    var g = bloom.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, bloom.c.width, bloom.c.height);
    g.imageSmoothingEnabled = true;
    g.drawImage(fx.c, 0, 0, bloom.c.width, bloom.c.height);
  }

  function compose(time) {
    var g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.drawImage(bg.c, 0, 0);

    // Aircraft warning lights on the towers.
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (var i = 0; i < beacons.length; i++) {
      var bcn = beacons[i];
      var on = reduce.matches ? 0.8 : Math.max(0, Math.sin(time * 2.2 + bcn.p));
      if (on > 0.05) {
        var rg = g.createRadialGradient(bcn.x, bcn.y, 0, bcn.x, bcn.y, 6);
        rg.addColorStop(0, "rgba(255,70,60," + on + ")");
        rg.addColorStop(1, "rgba(255,70,60,0)");
        g.fillStyle = rg;
        g.fillRect(bcn.x - 6, bcn.y - 6, 12, 12);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);

    // Lights and their glow.
    makeBloom();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.9;
    g.drawImage(bloom.c, 0, 0, canvas.width, canvas.height);
    g.globalAlpha = 1;
    g.drawImage(fx.c, 0, 0);

    // Lagoon reflection: flipped about the waterline, squashed and smeared.
    var wl = G.water * DPR;
    var rg2 = refl.g;
    rg2.setTransform(1, 0, 0, 1, 0, 0);
    rg2.clearRect(0, 0, refl.c.width, refl.c.height);
    rg2.globalCompositeOperation = "source-over";
    rg2.drawImage(bg.c, 0, 0, bg.c.width, wl, 0, 0, refl.c.width, refl.c.height);
    rg2.globalCompositeOperation = "lighter";
    rg2.drawImage(fx.c, 0, 0, fx.c.width, wl, 0, 0, refl.c.width, refl.c.height);
    g.save();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 0.22;
    g.translate(0, wl * 1.7);
    g.scale(1, -0.7);
    g.drawImage(refl.c, 0, 0, refl.c.width, refl.c.height, 0, 0, canvas.width, wl);
    g.restore();
    g.globalCompositeOperation = "source-over";
  }

  function frame(t) {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(frame);
    // Phones draw every other frame: half the battery for the same look.
    if (small && (frameSkip = (frameSkip + 1) % 2)) return;
    var dt = last ? Math.min(0.06, (t - last) / 1000) : 1 / 60;
    last = t;
    clock += dt;
    step(dt);
    compose(clock);
  }

  function updateRunning() {
    var should = !userPaused && onScreen && !document.hidden && !reduce.matches;
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 1.75);
    // Keep the pixel budget fixed so big monitors don't cost more per frame.
    var budget = 2.4e6;
    if (W * H * DPR * DPR > budget) DPR = Math.sqrt(budget / (W * H));
    var pw = Math.round(W * DPR), ph = Math.round(H * DPR);
    canvas.width = bg.c.width = fx.c.width = pw;
    canvas.height = bg.c.height = fx.c.height = ph;
    bloom.c.width = Math.max(1, Math.round(pw / 6));
    bloom.c.height = Math.max(1, Math.round(ph / 6));
    refl.c.width = Math.max(1, Math.round(pw / 3));
    refl.c.height = Math.max(1, Math.round((ph * 0.5) / 3));
    setupGeometry();
    drawBackground();
    fx.g.setTransform(1, 0, 0, 1, 0, 0);
    fx.g.clearRect(0, 0, pw, ph);
    populate();
    var warm = reduce.matches ? 260 : 90;
    for (var i = 0; i < warm; i++) step(1 / 60);
    compose(clock);
  }

  var resizeTimer = 0, lastW = 0;
  window.addEventListener("resize", function () {
    // Ignore the height-only resizes phones fire when the URL bar shows and hides.
    if (Math.abs(window.innerWidth - lastW) < 2 && small) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { lastW = window.innerWidth; build(); }, 150);
  });

  if (toggle) {
    toggle.addEventListener("click", function () {
      userPaused = !userPaused;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.textContent = userPaused ? "Play motion" : "Pause motion";
      updateRunning();
    });
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; updateRunning(); }).observe(hero);
  }
  document.addEventListener("visibilitychange", updateRunning);

  function applyMotionPreference() {
    if (toggle) toggle.hidden = reduce.matches;
    lastW = window.innerWidth;
    build();
    updateRunning();
  }
  if (reduce.addEventListener) reduce.addEventListener("change", applyMotionPreference);
  applyMotionPreference();
})();
