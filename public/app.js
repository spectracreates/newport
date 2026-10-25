// The route: the page's one scroll-driven set-piece.
// Wide screens: the section pins and the bus drives the route as you scroll.
// Phones: a vertical route; stops light up as they reach the middle of the screen.
// Reduced motion: a plain list with every stop shown.
(function () {
  var route = document.getElementById("route");
  if (!route) return;

  var stops = Array.prototype.slice.call(route.querySelectorAll(".stop"));
  var fill = route.querySelector(".route-fill");
  var bus = route.querySelector(".bus");
  var line = route.querySelector(".route-line");
  var wide = window.matchMedia("(min-width: 900px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var observer = null;
  var geometry = null;
  var ticking = false;

  function setStops(lit) {
    stops.forEach(function (s, i) {
      s.classList.toggle("on", i < lit);
      s.classList.toggle("done", i < lit - 1);
    });
  }

  // Read layout once per resize, never inside the scroll handler.
  function measure() {
    var rect = route.getBoundingClientRect();
    var lineRect = line.getBoundingClientRect();
    var wrapRect = line.parentNode.getBoundingClientRect();
    geometry = {
      top: rect.top + window.scrollY,
      travel: route.offsetHeight - window.innerHeight,
      lineLeft: lineRect.left - wrapRect.left,
      lineWidth: lineRect.width,
      busWidth: bus.getBoundingClientRect().width,
    };
  }

  function render() {
    ticking = false;
    if (!geometry) return;
    var p = (window.scrollY - geometry.top) / geometry.travel;
    p = Math.min(1, Math.max(0, p));
    // Arrive at the last stop a little before the pin releases, so it dwells.
    var q = Math.min(1, p / 0.86);
    fill.style.transform = "scaleX(" + q + ")";
    var x = geometry.lineLeft + q * geometry.lineWidth - geometry.busWidth / 2;
    bus.style.transform = "translateX(" + x + "px)";
    var lit = q <= 0 ? 0 : Math.min(stops.length, Math.floor(q * (stops.length - 1) + 0.0001) + 1);
    setStops(lit);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function teardown() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    route.classList.remove("static", "vertical");
    geometry = null;
  }

  function onResize() {
    measure();
    render();
  }

  function setup() {
    teardown();

    if (reduce.matches) {
      route.classList.add("static", "vertical");
      setStops(stops.length);
      return;
    }

    if (!wide.matches) {
      route.classList.add("vertical");
      setStops(0);
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                var i = stops.indexOf(e.target);
                stops.forEach(function (s, j) {
                  if (j <= i) s.classList.add("on");
                  if (j < i) s.classList.add("done");
                });
              }
            });
          },
          { rootMargin: "0px 0px -45% 0px" }
        );
        stops.forEach(function (s) { observer.observe(s); });
      } else {
        setStops(stops.length);
      }
      return;
    }

    measure();
    render();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
  }

  function onChange() { setup(); }
  if (wide.addEventListener) {
    wide.addEventListener("change", onChange);
    reduce.addEventListener("change", onChange);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (geometry) onResize(); });
  }
  setup();
})();
