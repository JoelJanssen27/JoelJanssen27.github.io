// Small touches for the site. Everything still reads fine if this file fails to load.
(function () {
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- playing surfaces: draw one, hold, then move to the next sport ----
  var fields = Array.prototype.slice.call(document.querySelectorAll(".field"));
  var nameEl = document.querySelector(".field-name");
  var ticks = document.querySelectorAll(".ticks i");
  fields.forEach(function (f) {
    f.querySelectorAll(".marks circle").forEach(function (c, i) { c.style.setProperty("--i", i); });
  });
  function show(n) {
    fields.forEach(function (f, i) { f.classList.toggle("on", i === n); });
    ticks.forEach(function (t, i) { t.classList.toggle("on", i === n); });
    if (nameEl) {
      nameEl.style.opacity = 0;
      setTimeout(function () { nameEl.textContent = fields[n].dataset.name; nameEl.style.opacity = 1; }, 300);
    }
  }
  if (fields.length && !calm) {
    var current = 0;
    fields[0].classList.remove("on");                 // start empty so the first one draws in
    setTimeout(function () { show(0); }, 250);
    setInterval(function () {
      if (document.hidden) return;
      current = (current + 1) % fields.length;
      show(current);
    }, 6500);
  }

  // ---- reading progress line and header border ----
  var bar = document.querySelector(".progress"), top = document.querySelector(".top"), ticking = false;
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
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
    document.querySelectorAll(".hero-text, .cards, .clubs, .pillars, .awards, .timeline, .split").forEach(function (group) {
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
