/* V2 route compatibility: one Student ID context across module navigation. */
(() => {
  const KEY = "LH_V2_SELECTED_STUDENT";
  const DATA_KEY = "LH_V2_2026_2027";
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const canon = v => String(v ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "");
  const setSelected = id => { if (id) sessionStorage.setItem(KEY, id); };
  const getSelected = () => sessionStorage.getItem(KEY) || "";
  const clearSelected = () => sessionStorage.removeItem(KEY);
  const readData = () => { try { return JSON.parse(localStorage.getItem(DATA_KEY) || "null"); } catch { return null; } };
  const getStudent = id => readData()?.students?.find(s => s.id === id) || null;

  function markMatchingTableRows(student) {
    if (!student?.name) return;
    const wanted = canon(student.name);
    qsa("#mainContent tbody tr").forEach(row => {
      row.classList.remove("v2-selected-student");
      const text = canon(row.cells?.[1]?.textContent || "");
      if (text === wanted || text.includes(wanted)) {
        row.classList.add("v2-selected-student");
        row.dataset.studentRow = student.id;
      }
    });
  }

  function flashStudentContext() {
    const id = getSelected();
    if (!id) return;
    const s = getStudent(id);
    qsa(`[data-student-row="${CSS.escape(id)}"]`).forEach(row => {
      row.classList.add("v2-selected-student");
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    qsa('select[name="studentId"]').forEach(sel => {
      if ([...sel.options].some(o => o.value === id)) {
        sel.value = id;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    qsa('input[name="studentId"]').forEach(input => { if (!input.value) input.value = id; });
    qsa(`[data-student="${CSS.escape(id)}"]`).forEach(el => el.setAttribute("aria-current", "true"));
    if (!s) return;
    markMatchingTableRows(s);
    const route = qs("#pageTitle")?.textContent?.trim() || "";
    const supported = ["Vi phạm", "Khen thưởng", "Tiến bộ", "Nhận xét", "Điểm danh", "Link học sinh"];
    if (!supported.includes(route)) return;
    const main = qs("#mainContent");
    if (!main || main.querySelector(".v2-student-context")) return;
    const bar = document.createElement("div");
    bar.className = "notice v2-student-context";
    bar.style.cssText = "margin:0 0 12px;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap";
    bar.innerHTML = `👤 <strong>Đang làm việc với:</strong> ${esc(s.name)} <button type="button" class="mini-btn" data-v2-open-profile="${esc(id)}">Mở trang tổng hợp</button>`;
    const content = main.querySelector(".content");
    if (content) content.insertBefore(bar, content.firstChild);
  }

  function wireContextButton() {
    qsa("[data-v2-open-profile]").forEach(btn => {
      if (btn.dataset.v2Bound === "1") return;
      btn.dataset.v2Bound = "1";
      btn.addEventListener("click", () => {
        const id = btn.dataset.v2OpenProfile;
        setSelected(id);
        qs('[data-route="profiles"]')?.click();
        setTimeout(() => qs(`[data-action="profile"][data-student="${CSS.escape(id)}"]`)?.click(), 150);
      });
    });
  }

  document.addEventListener("click", e => {
    const route = e.target.closest("[data-route][data-student]");
    if (route?.dataset.student) setSelected(route.dataset.student);
    const action = e.target.closest("[data-action][data-student]");
    if (action?.dataset.student) setSelected(action.dataset.student);
    if (e.target.closest('[data-route="profiles"]') && !e.target.closest('[data-student]')) clearSelected();
  }, true);

  const observer = new MutationObserver(() => window.requestAnimationFrame(() => { flashStudentContext(); wireContextButton(); }));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("load", () => { flashStudentContext(); wireContextButton(); });
})();
