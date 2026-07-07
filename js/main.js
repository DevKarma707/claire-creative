/* ============ CLAIRE CREATIVE — interactions ============ */

// ---- eyes: pupils follow cursor, blink occasionally ----
const EYE_SVG = `
  <svg class="eye" viewBox="0 0 46 46" aria-hidden="true">
    <circle class="eyeball" cx="23" cy="23" r="21"/>
    <circle class="pupil" cx="23" cy="23" r="9"/>
  </svg>`;

function buildEyes(el) {
  el.innerHTML = EYE_SVG + EYE_SVG;
}

document.querySelectorAll(".eyes").forEach(buildEyes);

document.addEventListener("mousemove", (e) => {
  document.querySelectorAll(".eyes .eye").forEach((eye) => {
    const r = eye.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d = Math.min(6, Math.hypot(e.clientX - cx, e.clientY - cy) / 30);
    const p = eye.querySelector(".pupil");
    p.setAttribute("cx", 23 + Math.cos(a) * d);
    p.setAttribute("cy", 23 + Math.sin(a) * d);
  });
});

setInterval(() => {
  document.querySelectorAll(".eyes").forEach((el) => {
    el.classList.add("blink");
    setTimeout(() => el.classList.remove("blink"), 320);
  });
}, 4200);

// ---- preloader ----
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) setTimeout(() => loader.classList.add("done"), 700);
});

// ---- bouton … du menu : révèle À propos / Contact ----
const dots = document.querySelector(".nav-dots");
if (dots) dots.addEventListener("click", () => dots.closest("nav").classList.toggle("show-secondary"));

// ---- reveal on scroll ----
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---- marquee: duplicate content for seamless loop ----
document.querySelectorAll(".marquee .track").forEach((t) => {
  t.innerHTML += t.innerHTML;
});

// ---- portfolio page: filters + masonry + lightbox ----
const grid = document.getElementById("masonry");
if (grid && typeof GALLERY !== "undefined") {
  let current = [];

  function render(cat) {
    current = cat === "all" ? GALLERY : GALLERY.filter((g) => g.cat === cat);
    grid.innerHTML = current
      .map(
        (g, i) =>
          `<figure style="animation-delay:${Math.min(i * 40, 500)}ms" data-i="${i}">
             <img src="${g.src}" loading="lazy" alt="Claire Creative — ${g.cat}">
           </figure>`
      )
      .join("");
  }

  const params = new URLSearchParams(location.search);
  const initial = params.get("cat") || "all";
  render(initial);

  document.querySelectorAll(".filters button").forEach((b) => {
    if (b.dataset.cat === initial) {
      document.querySelector(".filters .active")?.classList.remove("active");
      b.classList.add("active");
    }
    b.addEventListener("click", () => {
      document.querySelector(".filters .active")?.classList.remove("active");
      b.classList.add("active");
      render(b.dataset.cat);
      history.replaceState(null, "", b.dataset.cat === "all" ? "portfolio.html" : `portfolio.html?cat=${b.dataset.cat}`);
    });
  });

  // lightbox
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  const count = lb.querySelector(".count");
  let idx = 0;

  function show(i) {
    idx = (i + current.length) % current.length;
    lbImg.src = current[idx].src;
    count.textContent = `${idx + 1} / ${current.length}`;
  }
  grid.addEventListener("click", (e) => {
    const fig = e.target.closest("figure");
    if (!fig) return;
    show(+fig.dataset.i);
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  });
  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  lb.querySelector(".close").addEventListener("click", close);
  lb.querySelector(".prev").addEventListener("click", () => show(idx - 1));
  lb.querySelector(".next").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => e.target === lb && close());
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
}
