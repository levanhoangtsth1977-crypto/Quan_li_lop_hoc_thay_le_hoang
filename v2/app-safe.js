/* V2 safe bootstrap: validate local data before loading the single app router. */
const KEY = "LH_V2_2026_2027";
const RESET_ONCE = "LH_V2_SAFE_BOOT_RESET_ONCE";

function makeSafeData(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = { ...raw };
  const arrayKeys = ["students", "attendance", "violations", "rewards", "learning", "progress", "comments"];
  for (const key of arrayKeys) if (!Array.isArray(out[key])) out[key] = [];
  if (!out.config || typeof out.config !== "object" || Array.isArray(out.config)) {
    out.config = {
      school: "Trường Tiểu học Nghĩa Hành",
      className: "5A3",
      schoolYear: "2026–2027",
      teacher: "Lê Hoàng"
    };
  }
  if (!out.links || typeof out.links !== "object" || Array.isArray(out.links)) out.links = {};
  if (!out.smasImports || typeof out.smasImports !== "object" || Array.isArray(out.smasImports)) out.smasImports = {};
  return out;
}

function normalizeStoredData() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const safe = makeSafeData(parsed);
    if (!safe) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(safe));
  } catch {
    localStorage.removeItem(KEY);
  }
}

function showFatal(err) {
  const main = document.getElementById("mainContent");
  if (!main) return;
  const message = String(err?.message || err || "Lỗi không xác định");
  main.innerHTML = `<section class="content"><div class="card"><h1>V2 chưa khởi động được</h1><p class="muted">Hệ thống đã chặn màn hình trắng và giữ nguyên giao diện menu.</p><div class="notice">${message.replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}</div><p style="margin-top:12px">Hãy tải lại trang. Nếu dữ liệu trình duyệt bị hỏng, lớp khởi động an toàn sẽ tự khôi phục cấu trúc dữ liệu V2.</p></div></section>`;
}

(async () => {
  try {
    normalizeStoredData();
    await import("./app.js");
  } catch (err) {
    console.error("V2 app bootstrap failed", err);
    if (!sessionStorage.getItem(RESET_ONCE)) {
      sessionStorage.setItem(RESET_ONCE, "1");
      localStorage.removeItem(KEY);
      location.reload();
      return;
    }
    showFatal(err);
  }
})();
