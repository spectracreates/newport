/*
 * Two moments of motion, nothing else:
 * 1. The hero: Third Mainland Bridge at night as a live long exposure.
 *    Headlights stream one way, tail lights the other, and every light leaves a trail.
 *    Pauses off screen and on demand; one still frame under reduced motion.
 * 2. "Six lanes": scrolling draws one light trail per discipline until they meet.
 *    Pinned on wide screens; drawn in full on phones and with reduced motion.
 */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. Hero scene ---------- */
  var hero = document.querySelector(".hero");
  var canvas = hero && hero.querySelector(".scene");
  var toggle = hero && hero.querySelector(".motion-toggle");

  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var bg = document.createElement("canvas");
    var fx = document.createElement("canvas");
    var bgx = bg.getContext("2d");
    var fxx = fx.getContext("2d");
    var W = 0, H = 0, DPR = 1;
    var cars = [];
    var running = false, userPaused = false, onScreen = true, last = 0, raf = 0;

    // Seeded random so the skyline is the same on every visit.
    var seed = 528;
    function rand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function deckY(x) {
      var t = x / W;
      var base = W < 700 ? 0.25 : 0.33;
      return H * (base - 0.035 * t + 0.014 * Math.sin(t * Math.PI));
    }
    function waterY() {
      return H * (W < 700 ? 0.29 : 0.37);
    }

    function drawBackground() {
      var g = bgx;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      var horizon = H * (W < 700 ? 0.22 : 0.3);

      // Sky: deep night blue, warm city haze at the horizon.
      var sky = g.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, "#06111f");
      sky.addColorStop(0.7, "#10243d");
      sky.addColorStop(1, "#2a2b3f");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, horizon + 2);

      // A few stars.
      seed = 7;
      g.fillStyle = "rgba(255,244,220,0.5)";
      for (var s = 0; s < Math.round(W / 22); s++) {
        g.fillRect(rand() * W, rand() * horizon * 0.55, 1, 1);
      }

      // Lagos Island skyline on the far shore.
      seed = 528;
      var x = W * 0.38;
      while (x < W * 1.02) {
        var bw = 14 + rand() * 34;
        var tall = rand() < 0.16;
        var bh = (tall ? 70 + rand() * 90 : 14 + rand() * 46) * Math.max(0.7, H / 900);
        g.fillStyle = "#0a1729";
        g.fillRect(x, horizon - bh, bw, bh + 4);
        // Lit windows.
        for (var wy = horizon - bh + 5; wy < horizon - 3; wy += 6) {
          for (var wx = x + 3; wx < x + bw - 3; wx += 5) {
            if (rand() < 0.16) {
              g.fillStyle = rand() < 0.7 ? "rgba(255,190,90,0.75)" : "rgba(255,244,220,0.6)";
              g.fillRect(wx, wy, 1.6, 2.2);
            }
          }
        }
        x += bw + rand() * 6;
      }
      // Low mainland shore on the left.
      g.fillStyle = "#091526";
      g.fillRect(0, horizon - 8, W * 0.38, 10);

      // Lagoon.
      var wY = waterY();
      var water = g.createLinearGradient(0, horizon, 0, H);
      water.addColorStop(0, "#0d2036");
      water.addColorStop(1, "#050c18");
      g.fillStyle = water;
      g.fillRect(0, horizon, W, H - horizon);

      // Skyline reflected as soft vertical smears.
      seed = 99;
      for (var r = 0; r < Math.round(W / 16); r++) {
        var rx = W * 0.38 + rand() * W * 0.62;
        g.fillStyle = rand() < 0.6 ? "rgba(255,178,63,0.10)" : "rgba(255,244,220,0.07)";
        g.fillRect(rx, horizon + 4 + rand() * 30, 1.5, 10 + rand() * 40);
      }

      // Bridge piers into the water.
      g.fillStyle = "#040b16";
      for (var px = 10; px < W; px += 52) {
        var dy = deckY(px);
        g.fillRect(px, dy + 6, 5, wY - dy + 10);
      }

      // Deck.
      g.lineCap = "round";
      g.strokeStyle = "#030912";
      g.lineWidth = 11;
      g.beginPath();
      for (var dx = -10; dx <= W + 10; dx += 8) {
        var y = deckY(dx) + 6;
        if (dx === -10) g.moveTo(dx, y); else g.lineTo(dx, y);
      }
      g.stroke();

      // Sodium street lamps and their reflections.
      for (var lx = 30; lx < W; lx += 118) {
        var ly = deckY(lx);
        g.strokeStyle = "#16263a";
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(lx, ly);
        g.lineTo(lx, ly - 28);
        g.stroke();
        var glow = g.createRadialGradient(lx, ly - 29, 0, lx, ly - 29, 18);
        glow.addColorStop(0, "rgba(255,190,90,0.95)");
        glow.addColorStop(0.25, "rgba(255,178,63,0.35)");
        glow.addColorStop(1, "rgba(255,178,63,0)");
        g.fillStyle = glow;
        g.fillRect(lx - 18, ly - 47, 36, 36);
        var ry = wY + (wY - (ly - 29)) * 0.6;
        var refl = g.createLinearGradient(0, ry - 30, 0, ry + 30);
        refl.addColorStop(0, "rgba(255,178,63,0)");
        refl.addColorStop(0.5, "rgba(255,178,63,0.22)");
        refl.addColorStop(1, "rgba(255,178,63,0)");
        g.fillStyle = refl;
        g.fillRect(lx - 1.5, ry - 30, 3, 60);
      }
    }

    function makeCar(dir, anywhere) {
      return {
        dir: dir,
        x: anywhere ? Math.random() * W : dir > 0 ? -20 - Math.random() * W * 0.4 : W + 20 + Math.random() * W * 0.4,
        v: W * (0.09 + Math.random() * 0.1),
        lane: (dir > 0 ? 3 : -3) + (Math.random() - 0.5) * 2,
      };
    }

    function populate() {
      cars = [];
      var n = Math.round(Math.min(64, Math.max(18, W / 24)));
      for (var i = 0; i < n; i++) {
        cars.push(makeCar(i % 2 ? 1 : -1, true));
      }
    }

    function step(dt) {
      var g = fxx;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      // Fade the previous frame so lights leave long-exposure trails.
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0," + Math.min(1, 0.024 * dt * 60) + ")";
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      var wY = waterY();
      for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        var x0 = c.x;
        c.x += c.dir * c.v * dt;
        var y0 = deckY(x0) + c.lane;
        var y1 = deckY(c.x) + c.lane;
        var col = c.dir > 0 ? "255,74,61" : "255,244,220";
        g.strokeStyle = "rgba(" + col + ",0.95)";
        g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(c.x, y1);
        g.stroke();
        g.strokeStyle = "rgba(" + col + ",0.18)";
        g.lineWidth = 7;
        g.stroke();
        // Reflection on the lagoon.
        g.strokeStyle = "rgba(" + col + ",0.12)";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x0, wY + (wY - y0) * 0.6);
        g.lineTo(c.x, wY + (wY - y1) * 0.6);
        g.stroke();
        if ((c.dir > 0 && c.x > W + 30) || (c.dir < 0 && c.x < -30)) {
          cars[i] = makeCar(c.dir, false);
        }
      }
      g.globalCompositeOperation = "source-over";
    }

    function compose() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(bg, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(fx, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }

    function frame(t) {
      raf = 0;
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      step(dt);
      compose();
      raf = requestAnimationFrame(frame);
    }

    function updateRunning() {
      var should = !userPaused && onScreen && !document.hidden && !reduce.matches;
      if (should && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function build() {
      var rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
      [canvas, bg, fx].forEach(function (c) {
        c.width = Math.round(W * DPR);
        c.height = Math.round(H * DPR);
      });
      drawBackground();
      fxx.clearRect(0, 0, fx.width, fx.height);
      populate();
      // Start with trails already on the bridge: a still long exposure under reduced motion.
      var warm = reduce.matches ? 240 : 70;
      for (var i = 0; i < warm; i++) step(1 / 60);
      compose();
    }

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
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
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        updateRunning();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", updateRunning);

    function applyMotionPreference() {
      if (toggle) toggle.hidden = reduce.matches;
      build();
      updateRunning();
    }
    if (reduce.addEventListener) reduce.addEventListener("change", applyMotionPreference);
    applyMotionPreference();
  }

  /* ---------- Motion studies: play muted while on screen ---------- */
  var studies = Array.prototype.slice.call(document.querySelectorAll("video[data-autoplay]"));
  if (studies.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce.matches && !v.dataset.userPaused) {
          v.play().catch(function () {});
        } else if (!e.isIntersecting && !v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.4 });
    studies.forEach(function (v) {
      // Respect a pause the visitor made with the controls.
      v.addEventListener("pause", function () { if (v.dataset.inview === "1") v.dataset.userPaused = "1"; });
      v.addEventListener("play", function () { delete v.dataset.userPaused; });
      new IntersectionObserver(function (es) { v.dataset.inview = es[0].isIntersecting ? "1" : "0"; }, { threshold: 0.4 }).observe(v);
      vio.observe(v);
    });
  }

  /* ---------- 2. Six lanes ---------- */
  var lanes = document.getElementById("lanes");
  if (!lanes) return;
  var trails = Array.prototype.slice.call(lanes.querySelectorAll(".trail"));
  var items = Array.prototype.slice.call(lanes.querySelectorAll(".lane"));
  var wide = window.matchMedia("(min-width: 900px)");
  var geo = null, ticking = false;

  function measure() {
    geo = {
      top: lanes.getBoundingClientRect().top + window.scrollY,
      travel: lanes.offsetHeight - window.innerHeight,
    };
  }

  function render() {
    ticking = false;
    if (!geo) return;
    var p = Math.min(1, Math.max(0, (window.scrollY - geo.top) / geo.travel));
    var q = Math.min(1, p / 0.85);
    for (var i = 0; i < trails.length; i++) {
      var f = Math.min(1, Math.max(0, q * trails.length - i));
      trails[i].style.strokeDashoffset = String(1 - f);
      items[i].classList.toggle("on", f > 0.12);
    }
    lanes.classList.toggle("arrived", q >= 0.999);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }
  function onResize() {
    measure();
    render();
  }

  function setupLanes() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    trails.forEach(function (t) { t.style.strokeDashoffset = ""; });
    if (!wide.matches || reduce.matches) {
      geo = null;
      lanes.classList.add("static", "arrived");
      items.forEach(function (it) { it.classList.add("on"); });
      return;
    }
    lanes.classList.remove("static", "arrived");
    measure();
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
  }

  if (wide.addEventListener) {
    wide.addEventListener("change", setupLanes);
    reduce.addEventListener("change", setupLanes);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (geo) onResize(); });
  }
  setupLanes();
})();
