/* ============ Portfolio "field" — scroll infini + hover façon villaeugenie.com ============
   Mécanique : cartes en 2 colonnes décalées, scroll vertical infini avec inertie (molette,
   drag, tactile). Au survol : la carte grossit et passe devant, les autres floutent,
   rétrécissent et sont repoussées proportionnellement à leur distance ; le titre du projet
   suit le curseur. Clic (sans drag) : lightbox. */

(() => {
  const field = document.getElementById("field");
  if (!field || typeof GALLERY === "undefined") return;

  const CAT_LABELS = Object.fromEntries(GALLERY_CATS.map((c) => [c.slug, c.label]));
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  const titleEl = document.getElementById("field-title");
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  const lbCount = lb.querySelector(".count");

  let cards = [];        // {el, col, baseX, baseY, hx, hy, hs, thx, thy, ths, item, idx}
  let colH = [0, 0];     // hauteur totale de chaque colonne (pour le wrap infini)
  let scroll = 0, target = 0;
  let hovered = null;
  let current = [];      // items filtrés courants
  let CW = 0, CH = 0;    // taille carte
  let COLS = 2;
  let colX = [];
  let raf = null;

  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (n, m) => ((n % m) + m) % m;

  function layoutParams() {
    const w = window.innerWidth;
    COLS = w < 700 ? 1 : 2;
    CW = COLS === 1 ? w * 0.72 : Math.min(w * 0.36, 620);
    CH = CW * 0.664; // même ratio que la référence
    const span = COLS === 1 ? w * 0.82 : w * 0.78;
    const left = (w - span) / 2;
    colX = COLS === 1 ? [w / 2 - CW / 2] : [left, left + span - CW];
  }

  function build(cat) {
    current = cat === "all" ? GALLERY : GALLERY.filter((g) => g.cat === cat);
    field.innerHTML = "";
    cards = [];
    colH = [];
    layoutParams();
    const gapY = CH * 0.55;
    const stagger = (CH + gapY) / 2;
    const rows = Math.ceil(current.length / COLS);
    for (let c = 0; c < COLS; c++) colH[c] = rows * (CH + gapY);

    current.forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const el = document.createElement("div");
      el.className = "fcard";
      el.style.width = CW + "px";
      el.style.height = CH + "px";
      const num = String(i + 1).padStart(2, "0");
      const label = CAT_LABELS[item.cat] || item.cat;
      el.innerHTML = `<img src="${item.src}" loading="lazy" draggable="false" alt="${label} — ${num}">
                      <span class="fcard-label">${label} — ${num}</span>`;
      el.dataset.i = i;
      field.appendChild(el);
      cards.push({
        el, col,
        baseX: colX[col],
        baseY: row * (CH + gapY) + (col % 2 ? stagger : 0),
        hx: 0, hy: 0, hs: 1, thx: 0, thy: 0, ths: 1,
        item, idx: i,
      });
    });
    scroll = target = 0;
    field.classList.remove("dimmed");
    hovered = null;
  }

  // ---- boucle de rendu : inertie + wrap infini + offsets de survol ----
  function tick() {
    scroll = lerp(scroll, target, 0.075);
    const vh = window.innerHeight;
    for (const c of cards) {
      // wrap : la carte réapparaît en boucle dans sa colonne
      const H = colH[c.col];
      let y = mod(c.baseY - scroll + CH, H) - CH;
      // marge d'une carte au-dessus, le reste en dessous
      c.hx = lerp(c.hx, c.thx, 0.12);
      c.hy = lerp(c.hy, c.thy, 0.12);
      c.hs = lerp(c.hs, c.ths, 0.12);
      const visible = y > -CH * 1.6 && y < vh + CH * 0.6;
      c.el.style.visibility = visible ? "visible" : "hidden";
      if (visible) {
        c.el.style.transform =
          `translate3d(${Math.round(c.baseX + c.hx)}px, ${Math.round(y + c.hy)}px, 0) scale(${c.hs.toFixed(3)})`;
      }
    }
    raf = requestAnimationFrame(tick);
  }

  // ---- survol : même chorégraphie que la référence ----
  function enter(card) {
    hovered = card;
    field.classList.add("dimmed");
    card.el.classList.add("hot");
    for (const c of cards) {
      if (c === card) { c.ths = 1.5; c.thx = 0; c.thy = 0; continue; }
      let dx = 0.2 * (c.baseX - card.baseX);
      let dy = 0.2 * (c.baseY - card.baseY);
      dx = Math.min(Math.max(-300, dx), 300);
      dy = Math.min(Math.max(-300, dy), 300);
      if (c.col === 0) dx += CW / 4;
      if (c.col === COLS - 1) dx -= CW / 4;
      c.thx = dx; c.thy = dy; c.ths = 0.7;
    }
    const label = CAT_LABELS[card.item.cat] || card.item.cat;
    titleEl.innerHTML = `${label}<br>N°${String(card.idx + 1).padStart(2, "0")}`;
    titleEl.style.display = "block";
  }

  function leave() {
    hovered = null;
    field.classList.remove("dimmed");
    for (const c of cards) {
      c.el.classList.remove("hot");
      c.thx = 0; c.thy = 0; c.ths = 1;
    }
    titleEl.style.display = "none";
  }

  field.addEventListener("pointerover", (e) => {
    if (isTouch || dragging) return;
    const el = e.target.closest(".fcard");
    if (!el) return;
    const card = cards[+el.dataset.i];
    if (card !== hovered) { if (hovered) leave(); enter(card); }
  });
  field.addEventListener("pointerout", (e) => {
    if (isTouch) return;
    if (!e.relatedTarget || !e.relatedTarget.closest(".fcard")) leave();
  });
  document.addEventListener("mousemove", (e) => {
    titleEl.style.left = e.clientX + "px";
    titleEl.style.top = e.clientY + "px";
  });

  // ---- molette ----
  window.addEventListener("wheel", (e) => { target += e.deltaY; }, { passive: true });

  // ---- drag / tactile avec élan ----
  let dragging = false, lastY = 0, vel = 0, downX = 0, downY = 0, moved = 0;
  field.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; vel = 0;
    lastY = e.clientY; downX = e.clientX; downY = e.clientY;
    try { field.setPointerCapture(e.pointerId); } catch (_) {}
  });
  field.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - lastY;
    lastY = e.clientY;
    target -= dy;
    vel = -dy;
    moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
  });
  field.addEventListener("pointerup", (e) => {
    dragging = false;
    target += vel * 14; // élan
    if (moved < 10) {
      const el = e.target.closest(".fcard");
      if (el) openLightbox(+el.dataset.i);
    }
  });
  field.addEventListener("pointercancel", () => { dragging = false; });

  // ---- lightbox (clic sans drag) ----
  let lbIdx = 0;
  function showLb(i) {
    lbIdx = (i + current.length) % current.length;
    lbImg.src = current[lbIdx].src;
    lbCount.textContent = `${lbIdx + 1} / ${current.length}`;
  }
  function openLightbox(i) {
    leave();
    showLb(i);
    lb.classList.add("open");
  }
  function closeLb() { lb.classList.remove("open"); }
  lb.querySelector(".close").addEventListener("click", closeLb);
  lb.querySelector(".prev").addEventListener("click", () => showLb(lbIdx - 1));
  lb.querySelector(".next").addEventListener("click", () => showLb(lbIdx + 1));
  lb.addEventListener("click", (e) => e.target === lb && closeLb());
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIdx - 1);
    if (e.key === "ArrowRight") showLb(lbIdx + 1);
  });

  // ---- filtres : le menu de catégories du header (façon villaeugenie) ----
  // Clic sur une catégorie : filtre le champ, les autres mots disparaissent, un ✕
  // apparaît. Re-clic sur la catégorie active : retour à tout.
  const catsNav = document.getElementById("cats-nav");
  let activeCat = new URLSearchParams(location.search).get("cat") || "all";

  function setNavState(cat) {
    catsNav.classList.toggle("has-category", cat !== "all");
    catsNav.querySelectorAll("li").forEach((li) =>
      li.classList.toggle("is-active", li.dataset.cat === cat)
    );
  }

  catsNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const li = a.closest("li");
      activeCat = li.classList.contains("is-active") ? "all" : li.dataset.cat;
      setNavState(activeCat);
      field.style.opacity = 0;
      setTimeout(() => { build(activeCat); field.style.opacity = 1; }, 350);
      history.replaceState(null, "", activeCat === "all" ? "portfolio.html" : `portfolio.html?cat=${activeCat}`);
    });
  });

  window.addEventListener("resize", () => build(activeCat));

  setNavState(activeCat);
  build(activeCat);
  tick();
})();
