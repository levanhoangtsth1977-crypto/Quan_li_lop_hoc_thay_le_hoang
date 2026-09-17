/* V2 mobile menu guard: keep a visible MENU control independent of app.js. */
(() => {
  const boot = () => {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    let btn = document.getElementById("v2MenuGuard");
    if (!sidebar) return;

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "v2MenuGuard";
      btn.type = "button";
      btn.textContent = "☰ MENU";
      btn.setAttribute("aria-label", "Mở menu chính");
      document.body.appendChild(btn);
    }

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
      if (mobile) {
        sidebar.classList.add("open");
        overlay?.classList.add("active");
      } else {
        sidebar.classList.remove("open");
        overlay?.classList.remove("active");
      }
    };

    if (btn.dataset.v2Bound !== "1") {
      btn.dataset.v2Bound = "1";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        sidebar.classList.add("open");
        overlay?.classList.add("active");
      });
    }

    if (overlay?.dataset.v2Bound !== "1") {
      overlay.dataset.v2Bound = "1";
      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }

    window.addEventListener("resize", sync, { passive: true });
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
