/* Traînée d'images qui suit le curseur (hero de la page À propos).
   Les photos viennent de TRAIL (js/projects.js, réglé dans l'admin) ;
   sans réglage, on prend la couverture des premiers projets. */
(function () {
  const host = document.getElementById("trail");
  if (!host) return;

  const fallback = () =>
    (typeof PROJECTS === "undefined" ? [] : PROJECTS).map((p) => p.images[0]).filter(Boolean).slice(0, 12);
  const srcs = typeof TRAIL !== "undefined" && TRAIL.length ? TRAIL : fallback();

  const still = srcs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still) { host.classList.add("no-trail"); return; }

  const copy = host.firstElementChild; /* .trail-copy : les images se glissent avant */
  const imgs = srcs.map((src, i) => {
    const el = document.createElement("img");
    el.src = src;
    el.alt = "";
    el.loading = i < 4 ? "eager" : "lazy";
    el.dataset.status = "inactive";
    host.insertBefore(el, copy);
    return el;
  });

  const TAIL = Math.min(5, imgs.length - 1);
  const wrap = (n) => ((n % imgs.length) + imgs.length) % imgs.length;
  let index = 0;
  let last = null;

  function activate(el, x, y) {
    const r = host.getBoundingClientRect();
    el.style.left = x - r.left + "px";
    el.style.top = y - r.top + "px";
    el.style.zIndex = wrap(index) + 1;
    el.dataset.status = "active";
    clearTimeout(el.timer);
    el.timer = setTimeout(() => { el.dataset.status = "inactive"; }, 1000);
  }

  function onMove(x, y) {
    /* une nouvelle photo tous les ~1/12e de la largeur du bloc */
    const step = Math.max(60, host.clientWidth / 12);
    if (last && Math.hypot(x - last.x, y - last.y) < step) return;
    last = { x, y };
    activate(imgs[wrap(index)], x, y);
    if (index >= TAIL) {
      const tail = imgs[wrap(index - TAIL)];
      clearTimeout(tail.timer);
      tail.dataset.status = "inactive";
    }
    index++;
  }

  host.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  host.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
})();
