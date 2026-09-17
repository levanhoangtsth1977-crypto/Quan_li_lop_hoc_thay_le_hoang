/* V2 mobile menu guard: keep a visible MENU control independent of app.js. */
(() => {
  const boot = () => {
    if (document.getElementById("v2MenuGuard")) return;
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (!sidebar) return;

    const btn = document.createElement("button");
    btn.id = "v2MenuGuard";
    btn.type = "button";
    btn.textContent = "☰ MENU";
    btn.setAttribute("aria-label", "Mở menu chính");
    btn.style.cssText = [
      "position:fixed",
      "left:12px",
      "top:12px",
      "z-index:120",
      "display:none",
      "border:0",
      "border-radius:10px",
      "padding:9px 12px",
      "background:#1d4ed8",
      "color:#fff",
      "font-weight:700",
      "box-shadow:0 6px 18px rgba(15,23,42,.20)",
      "cursor:pointer"
    ].join(";");

    const sync = () => {
      const mobile = window.matchMedia("(max-width:800px)").matches;
      btn.style.display = mobile ? "block" : "none";
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      sidebar.classList.add("open");
      overlay?.classList.add("active");
    });

    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });

    document.body.appendChild(btn);
    window.addEventListener("resize", sync, { passive: true });
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
