// Small touches for the site. Everything still reads fine if this file fails to load.
(function () {
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- playing surfaces: draw one, hold, then move to the next sport ----
  var fields = Array.prototype.slice.call(document.querySelectorAll(".field"));
  var nameEl = document.querySelector(".field-name");
  var ticks = document.querySelectorAll(".ticks button");
  fields.forEach(function (f) {
    f.querySelectorAll(".marks circle").forEach(function (c, i) { c.style.setProperty("--i", i); });
  });
  // a ball (or puck) travels the dotted route once the drawing is finished
  var NS = "http://www.w3.org/2000/svg", playTimers = [];
  fields.forEach(function (f) {
    var route = f.querySelector(".route");
    if (!route || calm) return;
    var ball = document.createElementNS(NS, "circle");
    ball.setAttribute("r", "4.5"); ball.setAttribute("class", "ball");
    var move = document.createElementNS(NS, "animateMotion");
    move.setAttribute("dur", "1.8s"); move.setAttribute("begin", "indefinite"); move.setAttribute("fill", "freeze");
    move.setAttribute("calcMode", "spline"); move.setAttribute("keyTimes", "0;1"); move.setAttribute("keySplines", "0.4 0 0.2 1");
    move.setAttribute("path", route.getAttribute("d"));
    ball.appendChild(move); f.appendChild(ball);
  });
  function play(f) {
    playTimers.forEach(clearTimeout); playTimers = [];
    fields.forEach(function (x) { x.classList.remove("live", "hit"); });
    var move = f.querySelector("animateMotion");
    if (!move) return;
    playTimers.push(setTimeout(function () {
      if (!f.classList.contains("on")) return;
      f.classList.add("live");
      try { move.beginElement(); } catch (e) {}
    }, 2400));
    playTimers.push(setTimeout(function () { if (f.classList.contains("on")) f.classList.add("hit"); }, 4200));
  }
  function show(n) {
    fields.forEach(function (f, i) { f.classList.toggle("on", i === n); });
    ticks.forEach(function (t, i) { t.classList.toggle("on", i === n); });
    play(fields[n]);
    if (nameEl) {
      nameEl.style.opacity = 0;
      setTimeout(function () { nameEl.textContent = fields[n].dataset.name; nameEl.style.opacity = 1; }, 300);
    }
  }
  var current = 0, cycle = null;
  function startCycle() {
    if (calm) return;
    clearInterval(cycle);
    cycle = setInterval(function () {
      if (document.hidden) return;
      current = (current + 1) % fields.length;
      show(current);
    }, 6500);
  }
  // click the card (or a tick under it) to switch sports; the auto-rotation restarts from there
  function pick(n) {
    current = (n + fields.length) % fields.length;
    show(current);
    startCycle();
  }
  var stage = document.querySelector(".stage");
  if (stage && fields.length) {
    stage.addEventListener("click", function () { pick(current + 1); });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); pick(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); pick(current - 1); }
    });
  }
  ticks.forEach(function (t, i) { t.addEventListener("click", function () { pick(i); }); });
  if (fields.length && !calm) {
    fields[0].classList.remove("on");                 // start empty so the first one draws in
    setTimeout(function () { show(0); }, 250);
    startCycle();
  }

  // ---- headline arrives one word at a time ----
  var h1 = document.querySelector(".hero h1");
  if (h1 && !calm) {
    var wi = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 1) { split(c); return; }
        if (c.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span"), inner = document.createElement("span");
          w.className = "w"; inner.textContent = part; inner.style.setProperty("--wi", wi++);
          w.appendChild(inner); frag.appendChild(w);
        });
        node.replaceChild(frag, c);
      });
    })(h1);
    h1.classList.add("words");
  }

  // ---- the playing-surface card tilts gently toward the pointer ----
  var tiltCard = document.querySelector(".fields");
  if (tiltCard && !calm && window.matchMedia("(hover: hover)").matches) {
    tiltCard.addEventListener("pointermove", function (e) {
      var r = tiltCard.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tiltCard.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      tiltCard.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
    });
    tiltCard.addEventListener("pointerleave", function () {
      tiltCard.style.setProperty("--rx", "0deg"); tiltCard.style.setProperty("--ry", "0deg");
    });
  }

  // ---- reading progress line, header border, and the experience line that fills as you scroll ----
  var bar = document.querySelector(".progress"), top = document.querySelector(".top"), ticking = false;
  var timeline = document.querySelector(".timeline");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    if (timeline) {
      var tr = timeline.getBoundingClientRect();
      var fill = (window.innerHeight * 0.62 - tr.top) / tr.height;
      timeline.style.setProperty("--fill", Math.max(0, Math.min(1, fill)).toFixed(3));
    }
    if (top) top.classList.toggle("scrolled", window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---- numbers count up the first time they are seen ----
  function countUp(el) {
    var end = parseInt(el.dataset.count, 10), suffix = el.dataset.suffix || "";
    if (calm || isNaN(end)) return;
    var start = Date.now(), dur = 1400;
    var timer = setInterval(function () {
      var p = Math.min((Date.now() - start) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + (p === 1 ? suffix : "");
      if (p === 1) clearInterval(timer);
    }, 30);
  }

  // ---- sections fade up as they scroll into view ----
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    // items that enter together arrive slightly one after another
    document.querySelectorAll(".hero-text, .cards, .clubs, .pillars, .gallery, .awards, .timeline, .split").forEach(function (group) {
      group.querySelectorAll(":scope > .reveal").forEach(function (el, i) { el.style.setProperty("--d", i * 90 + "ms"); });
    });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        seen.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { seen.observe(el); });

    // ---- menu shows which section you are reading ----
    var links = {};
    document.querySelectorAll(".top nav a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute("aria-current"); });
        if (links[e.target.id]) links[e.target.id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  // ---- click an award photo to see it large; click again or press Escape to close ----
  var box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = "<img alt=\"\">";
  document.body.appendChild(box);
  function closeBox() { box.classList.remove("open"); }
  box.addEventListener("click", closeBox);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBox(); });
  document.querySelectorAll(".award-photo").forEach(function (img) {
    img.addEventListener("click", function () {
      var big = box.querySelector("img");
      big.src = img.src; big.alt = img.alt;
      box.classList.add("open");
    });
  });

  // ---- soft light follows the pointer across project cards ----
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });
})();
