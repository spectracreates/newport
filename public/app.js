// The page's one moment of motion: the hero workflow runs once, step by step.
(function () {
  var steps = document.querySelectorAll("#run-steps .step");
  var status = document.getElementById("run-status");
  var label = document.getElementById("run-label");
  if (!steps.length) return;

  function finish() {
    status.className = "status ok";
    label.textContent = "Order flow completed";
  }

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    steps.forEach(function (s) { s.classList.add("done"); });
    finish();
    return;
  }

  steps.forEach(function (s, i) {
    setTimeout(function () {
      s.classList.add("done");
      if (i === steps.length - 1) finish();
    }, 700 + i * 650);
  });
})();
