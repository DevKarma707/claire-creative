/* Voile d'intro de la page d'accueil : nom du studio + traînée d'images,
   un clic (ou une touche, ou un scroll) le fait disparaître en fondu sur le site.
   Construit en JS : le contenu de la page reste intact pour les moteurs de recherche,
   et sans JS le site s'ouvre normalement. Vu une fois par visite ; « ?intro » le force. */
(function () {
  const force = location.search.includes("intro");
  if (!force && sessionStorage.getItem("cc-intro-vu")) return;

  const intro = document.createElement("div");
  intro.id = "intro";
  intro.className = "trail";
  intro.setAttribute("role", "button");
  intro.setAttribute("tabindex", "0");
  intro.setAttribute("aria-label", "Entrer sur le site");
  intro.innerHTML =
    '<div class="trail-copy">' +
      '<span class="eyes intro-eyes"></span>' +
      '<p class="intro-name">Claire<br>Creative</p>' +
    "</div>" +
    '<span class="intro-cue" aria-hidden="true"></span>';

  document.documentElement.classList.add("intro-on");
  document.body.prepend(intro);

  let parti = false;
  function entrer() {
    if (parti) return;
    parti = true;
    sessionStorage.setItem("cc-intro-vu", "1");
    intro.classList.add("out");
    document.documentElement.classList.remove("intro-on");
    setTimeout(() => intro.remove(), 1200);
  }

  intro.addEventListener("click", entrer);
  intro.addEventListener("wheel", entrer, { passive: true });
  intro.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") entrer(); });
  document.addEventListener("DOMContentLoaded", () => {
    intro.focus({ preventScroll: true });
    if (window.initTrail) window.initTrail(intro); /* les photos, une fois projects.js chargé */
  });
})();
