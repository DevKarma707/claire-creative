/* ============ Landing "field" — projets récents, scroll infini + hover façon villaeugenie.com ============
   Cartes = projets (une image de couverture chacun), grille uniforme 4 colonnes, scroll vertical
   infini avec inertie (molette, drag, tactile). Au survol : la carte grossit et passe devant,
   les autres floutent, rétrécissent et sont repoussées ; le titre du projet suit le curseur.
   Clic (sans drag) : le projet s'ouvre en grand et on scrolle ses images.
   Le menu du header disparaît quand on scrolle vers le bas, réapparaît vers le haut. */

(() => {
  const field = document.getElementById("field");
  if (!field || typeof PROJECTS === "undefined") return;

  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const header = document.querySelector("header");
  const titleEl = document.getElementById("field-title");
  const overlay = document.getElementById("project-overlay");
  const overlayTitle = overlay.querySelector(".po-title");
  const overlayBody = overlay.querySelector(".po-images");

  let cards = [];        // {el, col, baseX, baseY, hx, hy, hs, thx, thy, ths, project, idx}
  let colH = [0, 0];
  let scroll = 0, target = 0;
  let hovered = null;
  let current = [];      // projets filtrés courants
  let CW = 0, CH = 0;
  let COLS = 2;
  let colX = [];
  let overlayOpen = false;

  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (n, m) => ((n % m) + m) % m;

  function layoutParams() {
    const w = window.innerWidth;
    COLS = w < 640 ? 2 : 4;
    const margin = w * 0.036;
    const gap = w * 0.036;
    CW = (w - margin * 2 - gap * (COLS - 1)) / COLS;
    CH = CW * 0.57; // cartes paysage comme la référence
    colX = Array.from({ length: COLS }, (_, c) => margin + c * (CW + gap));
  }

  function build() {
    current = activeClient
      ? PROJECTS.filter((p) => p.client === activeClient)
      : activeCat === "all" ? PROJECTS : PROJECTS.filter((p) => p.service === activeCat);
    if (!current.length) current = PROJECTS; // filtre inconnu → tout afficher
    field.innerHTML = "";
    cards = [];
    colH = [];
    layoutParams();
    const gapY = CH * 0.55;
    const rows = Math.ceil(current.length / COLS);
    // espace blanc au chargement : sous le menu complet
    const firstOffset = Math.max(window.innerHeight * 0.42, header.offsetHeight + 30);
    for (let c = 0; c < COLS; c++) colH[c] = Math.max(rows * (CH + gapY) + firstOffset, window.innerHeight + CH);

    current.forEach((project, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const el = document.createElement("div");
      el.className = "fcard";
      el.style.width = CW + "px";
      el.style.height = CH + "px";
      el.innerHTML = `<img src="${project.images[0]}" loading="lazy" draggable="false" alt="${project.title.join(" — ")}">`;
      el.dataset.i = i;
      field.appendChild(el);
      cards.push({
        el, col,
        baseX: colX[col],
        baseY: firstOffset + row * (CH + gapY),
        hx: 0, hy: 0, hs: 1, thx: 0, thy: 0, ths: 1,
        project, idx: i,
      });
    });
    scroll = target = 0;
    field.classList.remove("dimmed");
    hovered = null;
  }

  // ---- boucle de rendu ----
  function tick() {
    scroll = lerp(scroll, target, 0.075);
    const vh = window.innerHeight;
    for (const c of cards) {
      const H = colH[c.col];
      let y = mod(c.baseY - scroll + CH, H) - CH;
      c.hx = lerp(c.hx, c.thx, 0.12);
      c.hy = lerp(c.hy, c.thy, 0.12);
      c.hs = lerp(c.hs, c.ths, 0.12);
      const visible = y > -CH * 1.6 && y < vh + CH * 0.6;
      c.el.style.visibility = visible ? "visible" : "hidden";
      if (visible) {
        c.el.style.transform =
          `translate3d(${Math.round(c.baseX + c.hx)}px, ${Math.round(y + c.hy)}px, 0) scale(${c.hs.toFixed(3)})`;
      }
      if (c === hovered) {
        titleEl.style.left = c.baseX + c.hx + CW / 2 + "px";
        titleEl.style.top = y + c.hy + CH / 2 + "px";
      }
    }
    requestAnimationFrame(tick);
  }

  // ---- menu : disparaît au scroll vers le bas, réapparaît vers le haut ----
  function navOnScroll(delta) {
    if (overlayOpen) return;
    if (delta > 2 && target > 120) header.classList.add("nav-hidden");
    else if (delta < -2 || target <= 120) header.classList.remove("nav-hidden");
  }

  // ---- survol ----
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
    titleEl.innerHTML = card.project.title.join("<br>");
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
    if (isTouch || dragging || overlayOpen) return;
    const el = e.target.closest(".fcard");
    if (!el) return;
    const card = cards[+el.dataset.i];
    if (card !== hovered) { if (hovered) leave(); enter(card); }
  });
  field.addEventListener("pointerout", (e) => {
    if (isTouch) return;
    if (!e.relatedTarget || !e.relatedTarget.closest(".fcard")) leave();
  });

  // ---- molette ----
  window.addEventListener("wheel", (e) => {
    if (overlayOpen) return;
    target += e.deltaY;
    navOnScroll(e.deltaY);
  }, { passive: true });

  // ---- drag / tactile ----
  let dragging = false, lastY = 0, vel = 0, downX = 0, downY = 0, moved = 0;
  let downCard = null; // mémorisé au pointerdown : avec setPointerCapture, le
                       // pointerup est re-ciblé sur le conteneur et perd la carte
  field.addEventListener("pointerdown", (e) => {
    if (overlayOpen) return;
    dragging = true; moved = 0; vel = 0;
    downCard = e.target.closest(".fcard");
    lastY = e.clientY; downX = e.clientX; downY = e.clientY;
    try { field.setPointerCapture(e.pointerId); } catch (_) {}
  });
  field.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - lastY;
    lastY = e.clientY;
    target -= dy;
    vel = -dy;
    navOnScroll(-dy);
    moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
  });
  field.addEventListener("pointerup", () => {
    dragging = false;
    target += vel * 14;
    if (moved < 10 && downCard) openProject(cards[+downCard.dataset.i].project);
    downCard = null;
  });
  field.addEventListener("pointercancel", () => { dragging = false; });

  // ---- overlay projet : l'image s'agrandit, on scrolle les images du projet ----
  function openProject(project) {
    leave();
    overlayOpen = true;
    overlayTitle.innerHTML = project.title.join(" — ");
    overlayBody.innerHTML = project.images
      .map((src) => `<img src="${src}" alt="${project.title.join(" — ")}" loading="lazy">`)
      .join("");
    // bento : classe selon l'orientation réelle de chaque image
    overlayBody.querySelectorAll("img").forEach((im) => {
      const tag = () => im.classList.toggle("port", im.naturalHeight > im.naturalWidth);
      im.complete && im.naturalWidth ? tag() : im.addEventListener("load", tag, { once: true });
    });
    overlay.classList.add("open");
    overlay.scrollTop = 0;
    header.classList.add("nav-hidden");
    document.body.classList.add("po-open");
  }
  function closeProject() {
    overlayOpen = false;
    overlay.classList.remove("open");
    header.classList.remove("nav-hidden");
    document.body.classList.remove("po-open");
  }
  overlay.querySelector(".po-close").addEventListener("click", closeProject);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayOpen) closeProject();
  });

  // ---- filtres : mentions du menu + clients ----
  const catsNav = document.getElementById("cats-nav");
  const nav = catsNav.closest("nav");
  const chip = document.getElementById("client-chip");
  const params = new URLSearchParams(location.search);
  let activeCat = params.get("cat") || "all";
  let activeClient = params.get("client") || null;
  if (activeClient && !PROJECTS.some((p) => p.client === activeClient)) activeClient = null;

  function setNavState() {
    nav.classList.toggle("client-mode", !!activeClient);
    if (activeClient) {
      chip.hidden = false;
      chip.querySelector(".name").textContent =
        (CLIENTS.find((c) => c.slug === activeClient) || { label: activeClient }).label;
    } else {
      chip.hidden = true;
      catsNav.classList.toggle("has-category", activeCat !== "all");
      catsNav.querySelectorAll("li").forEach((li) =>
        li.classList.toggle("is-active", li.dataset.cat === activeCat)
      );
    }
  }

  function applyFilter() {
    if (overlayOpen) closeProject();
    document.getElementById("clients-overlay")?.classList.remove("open");
    setNavState();
    field.style.opacity = 0;
    setTimeout(() => { build(); field.style.opacity = 1; }, 350);
    const url = activeClient ? `index.html?client=${activeClient}`
      : activeCat === "all" ? "index.html" : `index.html?cat=${activeCat}`;
    history.replaceState(null, "", url);
  }

  catsNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const li = a.closest("li");
      activeClient = null;
      activeCat = li.classList.contains("is-active") ? "all" : li.dataset.cat;
      applyFilter();
    });
  });

  // clic sur un client dans l'overlay → filtre par client, le nav affiche son nom + ✕
  document.getElementById("clients-overlay")?.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-client]");
    if (!a) return;
    e.preventDefault();
    activeClient = a.dataset.client;
    activeCat = "all";
    field.classList.remove("dimmed");
    applyFilter();
  });

  chip.addEventListener("click", () => { activeClient = null; applyFilter(); });

  window.addEventListener("resize", () => build());

  setNavState();
  build();
  tick();
})();
