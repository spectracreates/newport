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

  /* ---------- Project covers: generative light trails in each project's discipline colours ---------- */
  (function () {
    var NS = "http://www.w3.org/2000/svg";
    var css = getComputedStyle(document.documentElement);
    function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    Array.prototype.slice.call(document.querySelectorAll(".cover")).forEach(function (el) {
      var seed = hash(el.getAttribute("data-seed") || "x") || 1;
      function r() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var cols = (el.getAttribute("data-colors") || "headlight").split(",").map(function (c) { return css.getPropertyValue("--" + c).trim() || "#fff"; });
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 320 200");
      svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      var meetX = 200 + r() * 90, meetY = 60 + r() * 80;
      var n = 7 + Math.floor(r() * 5);
      for (var i = 0; i < n; i++) {
        var y0 = 10 + r() * 180, c = cols[i % cols.length];
        var path = document.createElementNS(NS, "path");
        var c1x = 80 + r() * 80, c2x = meetX - 40 - r() * 60;
        var d = "M-10," + y0.toFixed(1) + " C" + c1x.toFixed(1) + "," + y0.toFixed(1) + " " + c2x.toFixed(1) + "," + (meetY + (y0 - meetY) * 0.2).toFixed(1) + " " + meetX.toFixed(1) + "," + meetY.toFixed(1);
        path.setAttribute("d", d);
        path.setAttribute("pathLength", "1");
        path.setAttribute("stroke", c);
        path.style.color = c;
        path.setAttribute("stroke-width", (1 + r() * 1.6).toFixed(2));
        path.setAttribute("opacity", (0.45 + r() * 0.55).toFixed(2));
        path.style.setProperty("--d", (r() * 0.25).toFixed(2) + "s");
        svg.appendChild(path);
      }
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", meetX.toFixed(1)); dot.setAttribute("cy", meetY.toFixed(1)); dot.setAttribute("r", "4.5");
      dot.setAttribute("fill", cols[0]);
      svg.appendChild(dot);
      if (r() < 0.5) {
        // Mirror some covers so the set doesn't all flow the same way.
        var gwrap = document.createElementNS(NS, "g");
        gwrap.setAttribute("transform", "translate(320,0) scale(-1,1)");
        while (svg.firstChild) gwrap.appendChild(svg.firstChild);
        svg.appendChild(gwrap);
      }
      el.appendChild(svg);
    });
  })();

  /* ---------- Video players: a quiet custom control instead of browser chrome ---------- */
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
  Array.prototype.slice.call(document.querySelectorAll(".feature-media video")).forEach(function (v) {
    var box = v.parentNode;
    var name = v.getAttribute("aria-label") || "video";
    v.removeAttribute("controls");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vbtn";
    var bar = document.createElement("span");
    bar.className = "vbar";
    bar.setAttribute("aria-hidden", "true");
    box.appendChild(btn);
    box.appendChild(bar);
    function sync() {
      var playing = !v.paused && !v.ended;
      box.classList.toggle("playing", playing);
      btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute("aria-label", (playing ? "Pause " : "Play ") + name);
    }
    function progress() {
      if (v.duration) bar.style.transform = "scaleX(" + (v.currentTime / v.duration) + ")";
    }
    btn.addEventListener("click", function () {
      if (v.paused || v.ended) {
        // A visitor pressing play on a film with sound wants the sound.
        if (!v.hasAttribute("data-autoplay")) v.muted = false;
        v.play().catch(function () {});
      } else {
        v.pause();
      }
    });
    v.addEventListener("click", function () { btn.click(); });
    ["play", "pause", "ended"].forEach(function (e) { v.addEventListener(e, sync); });
    v.addEventListener("timeupdate", progress);
    sync();
  });

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
