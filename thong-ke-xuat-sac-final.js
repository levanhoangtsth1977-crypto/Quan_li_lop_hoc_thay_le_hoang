/* THỐNG KÊ — HỌC SINH XUẤT SẮC TOÀN DIỆN — SINGLE UI */
(function () {
  "use strict";

  const PAGE = "#page-statistics";
  const BTN_ID = "btnHSXuatSacToanDien";
  const PANEL_ID = "hsXuatSacToanDienPanel";

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const arr = name => Array.isArray(window[name]) ? window[name] : [];
  const sid = r => String(r?.studentId ?? r?.studentID ?? r?.idStudent ?? "").trim();
  const studentId = s => String(s?.id ?? s?.studentId ?? s?.studentCode ?? "").trim();
  const studentName = s => String(s?.name ?? s?.studentName ?? s?.fullName ?? "").trim() || "Chưa có tên";

  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function level(v) {
    const s = String(v ?? "").toLowerCase().trim();
    if (/mức?\s*1|^m1$|chưa đạt|chua dat|yếu|yeu/.test(s)) return 1;
    if (/mức?\s*2|^m2$|đạt|dat|trung bình|trung binh/.test(s)) return 2;
    if (/mức?\s*3|^m3$|tốt|tot|khá|kha|hoàn thành/.test(s)) return 3;
    if (/^t$|excellent|xuất sắc|xuat sac/.test(s)) return 4;
    return null;
  }

  function average(records) {
    const values = [];
    records.forEach(r => {
      const n = num(r?.score ?? r?.diem ?? r?.resultScore ?? r?.average ?? r?.ketQua);
      if (n !== null) values.push(n <= 10 ? n * 10 : Math.min(n, 100));
      else {
        const l = level(r?.level ?? r?.result ?? r?.mucDo);
        if (l !== null) values.push(l * 25);
      }
    });
    return values.length ? values.reduce((a,b) => a+b, 0) / values.length : null;
  }

  function buildRows() {
    const students = Array.isArray(window.students) ? window.students : [];
    const attendance = arr("attendanceRecords");
    const violations = arr("violationRecords");
    const rewards = arr("rewardRecords");
    const learning = arr("learningRecords");
    const progress = arr("progressRecords");
    const comments = arr("commentRecords");

    return students.map(s => {
      const id = studentId(s);
      const a = attendance.filter(r => sid(r) === id);
      const v = violations.filter(r => sid(r) === id);
      const re = rewards.filter(r => sid(r) === id);
      const l = learning.filter(r => sid(r) === id);
      const p = progress.filter(r => sid(r) === id);
      const c = comments.filter(r => sid(r) === id);

      const absent = a.filter(r => /vắng|absent/i.test(String(r?.status ?? ""))).length;
      const excused = a.filter(r => /có phép|excused/i.test(String(r?.status ?? ""))).length;

      const learningScore = average(l);
      const progressScore = average(p);
      const qualityValues = [...c, ...p, ...l].map(r => {
        const n = num(r?.nangLuc ?? r?.phamChat ?? r?.score ?? r?.diem);
        if (n !== null) return n <= 10 ? n * 10 : Math.min(n, 100);
        const lv = level(r?.mucDo ?? r?.level ?? r?.result);
        return lv === null ? null : lv * 25;
      }).filter(x => x !== null);

      const qualityScore = qualityValues.length
        ? qualityValues.reduce((x,y) => x+y, 0) / qualityValues.length
        : null;

      const attendanceScore = a.length
        ? Math.max(0, 100 - absent * 100 / a.length)
        : 100;

      const violationScore = Math.max(0, 100 - v.length * 10);
      const rewardScore = Math.min(100, re.length * 20);

      const parts = [
        [learningScore, .40],
        [qualityScore, .20],
        [progressScore, .15],
        [attendanceScore, .10],
        [violationScore, .10],
        [rewardScore, .05]
      ].filter(x => x[0] !== null);

      const weight = parts.reduce((x,y) => x + y[1], 0);
      const total = weight
        ? parts.reduce((x,y) => x + y[0] * y[1], 0) / weight
        : 0;

      return {
        id,
        name: studentName(s),
        learningScore,
        qualityScore,
        progressScore,
        absent,
        excused,
        violations: v.length,
        rewards: re.length,
        total
      };
    }).sort((a,b) =>
      b.total - a.total ||
      a.absent - b.absent ||
      a.violations - b.violations ||
      b.rewards - a.rewards ||
      a.name.localeCompare(b.name, "vi")
    );
  }

  function score(v) {
    return v === null ? "—" : `${v.toFixed(1)}%`;
  }

  function removeOldDuplicatePanels() {
    const page = document.querySelector(PAGE);
    if (!page) return;

    page.querySelectorAll(
      "#excellentStatisticsPanel,#thongKeXuatSacPanel,#thongKeXuatSacPanelOld"
    ).forEach(el => el.remove());

    const buttons = [...page.querySelectorAll("button")].filter(b =>
      /HS xuất sắc toàn diện/i.test(b.textContent || "")
    );
    buttons.slice(1).forEach(b => b.remove());
  }

  function renderPanel() {
    const page = document.querySelector(PAGE);
    if (!page) return;

    removeOldDuplicatePanels();

    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = PANEL_ID;
      panel.className = "dashboard-panel excellent-statistics-panel";
      page.appendChild(panel);
    }

    const rows = buildRows();
    const currentInput = panel.querySelector("#excellentTopInput");
    const current = Math.max(1, Math.min(999, Number(currentInput?.value) || 5));
    const list = rows.slice(0, current);

    panel.innerHTML = `
      <div class="panel-header" style="gap:16px;flex-wrap:wrap">
        <div>
          <h3 style="margin:0">🏆 Học sinh xuất sắc toàn diện</h3>
          <p style="margin:5px 0 0;color:#64748b">
            Xếp hạng theo học tập, năng lực/phẩm chất, tiến bộ, chuyên cần,
            vi phạm và khen thưởng.
          </p>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap">
          <span>Số lượng</span>
          <input id="excellentTopInput"
                 class="period-select"
                 type="number"
                 min="1"
                 max="999"
                 step="1"
                 value="${current}"
                 style="width:82px">
        </label>
      </div>

      <div class="table-container" style="margin-top:14px">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Học sinh</th>
              <th>Học tập</th>
              <th>Năng lực / phẩm chất</th>
              <th>Tiến bộ</th>
              <th>Vắng</th>
              <th>Vi phạm</th>
              <th>Khen thưởng</th>
              <th>Điểm toàn diện</th>
            </tr>
          </thead>
          <tbody>
            ${
              list.length
              ? list.map((r,i) => `
                <tr>
                  <td><strong>${i + 1}</strong></td>
                  <td><strong>${esc(r.name)}</strong></td>
                  <td>${score(r.learningScore)}</td>
                  <td>${score(r.qualityScore)}</td>
                  <td>${score(r.progressScore)}</td>
                  <td>${r.absent}${r.excused ? ` <small>(phép ${r.excused})</small>` : ""}</td>
                  <td>${r.violations}</td>
                  <td>${r.rewards}</td>
                  <td><strong>${r.total.toFixed(1)}%</strong></td>
                </tr>
              `).join("")
              : `
                <tr>
                  <td colspan="9">
                    <div class="empty-state">
                      <strong>Chưa có dữ liệu học sinh</strong>
                      <p>Hãy đồng bộ dữ liệu lớp trước khi xếp hạng.</p>
                    </div>
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
    `;

    panel.querySelector("#excellentTopInput")?.addEventListener("change", renderPanel);
    panel.querySelector("#excellentTopInput")?.addEventListener("keydown", e => {
      if (e.key === "Enter") renderPanel();
    });
  }

  function ensureSingleButton() {
    const page = document.querySelector(PAGE);
    if (!page) return;

    removeOldDuplicatePanels();

    let button = document.getElementById(BTN_ID);
    if (!button) {
      const header = page.querySelector(".page-header");
      const actions = header?.querySelector(".page-actions") || header;
      if (!actions) return;

      button = document.createElement("button");
      button.id = BTN_ID;
      button.type = "button";
      button.className = "button primary";
      button.innerHTML = '<i class="fa-solid fa-medal"></i> HS xuất sắc toàn diện';
      actions.appendChild(button);
    }

    button.onclick = () => {
      renderPanel();
      document.getElementById(PANEL_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    };
  }

  function init() {
    ensureSingleButton();
    renderPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  document.addEventListener("click", e => {
    if (e.target.closest?.('[data-page="statistics"],[data-page-link="statistics"]')) {
      setTimeout(init, 50);
    }
  });

  const observer = new MutationObserver(() => {
    if (document.querySelector(PAGE)) setTimeout(ensureSingleButton, 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
