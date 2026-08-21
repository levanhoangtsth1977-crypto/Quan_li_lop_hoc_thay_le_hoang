/* ============================================================
   EVENT SUMMARY BY STUDENT FIX 2.0
   CHUẨN:
   - Điểm danh: 1 HS = 1 dòng; tổng/có phép/không phép/ngày vắng.
   - Vi phạm: 1 HS = 1 dòng; số lần + toàn bộ ngày/nội dung/mức độ.
   - Khen thưởng: 1 HS = 1 dòng; số lần + toàn bộ ngày/thành tích/hình thức.
   - Mỗi lượt vẫn là một record riêng, giữ nguyên ID.
   - Xóa chỉ xóa đúng record được chọn; không xóa/gộp dữ liệu khác.
   ============================================================ */
(function () {
    "use strict";

    if (window.__LH_EVENT_SUMMARY_BY_STUDENT_20__) return;
    window.__LH_EVENT_SUMMARY_BY_STUDENT_20__ = true;

    const $ = id => document.getElementById(id);
    const clean = v => String(v ?? "").trim();
    const norm = v => clean(v).toLocaleLowerCase("vi");
    const esc = v => clean(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function getStudents() {
        try {
            if (typeof window.getStudentsSafe === "function") {
                const a = window.getStudentsSafe();
                if (Array.isArray(a)) return a;
            }
        } catch (_) {}
        return Array.isArray(window.students) ? window.students : [];
    }

    function studentName(id) {
        const sid = clean(id);
        try {
            if (typeof window.getStudentById === "function") {
                const s = window.getStudentById(sid);
                if (s?.name) return s.name;
            }
        } catch (_) {}
        return getStudents().find(s => clean(s.id) === sid)?.name || "Học sinh";
    }

    function records(arrayName, getterName) {
        try {
            if (typeof window[getterName] === "function") {
                const a = window[getterName]();
                if (Array.isArray(a)) return a.slice();
            }
        } catch (_) {}
        return Array.isArray(window[arrayName]) ? window[arrayName].slice() : [];
    }

    function date(v) {
        const s = clean(v);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split("-");
            return `${d}/${m}/${y}`;
        }
        return s;
    }

    function group(list) {
        const map = new Map();
        list.forEach(r => {
            const sid = clean(r?.studentId);
            if (!sid) return;
            if (!map.has(sid)) map.set(sid, []);
            map.get(sid).push(r);
        });
        return [...map.entries()]
            .map(([studentId, items]) => ({
                studentId,
                name: studentName(studentId),
                items: items.sort((a, b) => clean(b.date).localeCompare(clean(a.date)))
            }))
            .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }

    function detailLines(items, mapper) {
        return items.map((r, i) => {
            const x = mapper(r);
            return `<div class="lh-event-detail" data-record-id="${esc(r.id)}"><span class="lh-event-index">${i + 1}.</span>${x}</div>`;
        }).join("");
    }

    function ensureAbsenceSummary() {
        const page = $("page-attendance");
        if (!page) return null;
        let box = $("lhAbsenceSummary");
        if (box) return box;
        box = document.createElement("div");
        box.id = "lhAbsenceSummary";
        box.className = "dashboard-panel";
        const summary = page.querySelector(".attendance-summary");
        const table = page.querySelector(".table-container");
        if (summary) summary.insertAdjacentElement("afterend", box);
        else if (table) table.insertAdjacentElement("beforebegin", box);
        else page.appendChild(box);
        return box;
    }

    function renderAbsenceSummary() {
        const box = ensureAbsenceSummary();
        if (!box) return;

        const list = records("attendanceRecords", "getAttendanceRecords").filter(r => {
            const s = norm(r.status);
            return s === "absent" || s === "excused" || s === "vắng" || s === "có phép" || s === "co phep";
        });
        const rows = group(list).map(r => {
            const excused = r.items.filter(x => {
                const s = norm(x.status);
                return s === "excused" || s === "có phép" || s === "co phep";
            }).length;
            return {
                ...r,
                total: r.items.length,
                excused,
                unexcused: r.items.length - excused,
                dates: [...new Set(r.items.map(x => date(x.date)).filter(Boolean))]
            };
        });

        box.innerHTML = `<div class="panel-header"><div><h3>📌 Tổng hợp học sinh vắng</h3><p>${rows.length} học sinh có phát sinh · 1 học sinh = 1 dòng</p></div></div>` +
            (rows.length ? `<div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Tổng vắng</th><th>Có phép</th><th>Không phép</th><th>Ngày vắng</th></tr></thead><tbody>${rows.map((r,i) => `<tr><td>${i+1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.total}</strong></td><td>${r.excused}</td><td>${r.unexcused}</td><td>${esc(r.dates.join(", "))}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>Chưa có học sinh vắng</strong><p>Dữ liệu vắng sẽ tự động tổng hợp theo từng học sinh.</p></div>`);
    }

    function renderGroupedViolations() {
        const tbody = $("violationTableBody");
        if (!tbody) return;
        let list = records("violationRecords", "getViolationRecords");
        const search = norm(typeof window.getValue === "function" ? window.getValue("violationSearch") : $("violationSearch")?.value);
        const typeFilter = clean($("violationTypeFilter")?.value || "all");
        const period = clean($("violationPeriodFilter")?.value || "all");
        const now = new Date();
        let start = null;
        if (period === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (period === "week") {
            start = new Date(now); start.setHours(0,0,0,0);
            start.setDate(now.getDate() - (now.getDay() || 7) + 1);
        }
        if (period === "semester") start = new Date(now.getFullYear(), now.getMonth() < 5 ? 0 : now.getMonth() < 8 ? 5 : 8, 1);
        if (start) list = list.filter(r => {
            const d = new Date(clean(r.date) + "T00:00:00");
            return !Number.isNaN(d.getTime()) && d >= start;
        });
        if (typeFilter !== "all") list = list.filter(r => clean(r.type) === typeFilter);
        if (search) list = list.filter(r => norm(studentName(r.studentId)).includes(search) || norm(r.type).includes(search) || norm(r.note).includes(search) || norm(r.level).includes(search));

        const rows = group(list);
        const table = tbody.closest("table");
        const head = table?.querySelector("thead tr");
        if (head) head.innerHTML = "<th>STT</th><th>Học sinh</th><th>Số lần vi phạm</th><th>Ngày / Nội dung / Mức độ</th><th>Thao tác</th>";
        tbody.innerHTML = rows.length ? rows.map((r,i) => `<tr><td>${i+1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.items.length}</strong></td><td>${detailLines(r.items, x => `<strong>${esc(date(x.date))}</strong> — ${esc(x.type || x.note || "Chưa ghi nội dung")} — <span>${esc(x.level || "Chưa ghi mức độ")}</span>`)}</td><td>${r.items.map(x => `<button type="button" class="icon-button danger" title="Xóa lượt ${esc(date(x.date))} — ID ${esc(x.id)}" data-violation-delete="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button>`).join(" ")}</td></tr>`).join("") : '<tr><td colspan="5"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Không có học sinh nào phù hợp bộ lọc.</p></div></td></tr>';
    }

    function renderGroupedRewards() {
        const tbody = $("rewardTableBody");
        if (!tbody) return;
        const rows = group(records("rewardRecords", "getRewardRecords"));
        const table = tbody.closest("table");
        const head = table?.querySelector("thead tr");
        if (head) head.innerHTML = "<th>STT</th><th>Học sinh</th><th>Số lần khen thưởng</th><th>Ngày / Thành tích / Hình thức</th><th>Thao tác</th>";
        tbody.innerHTML = rows.length ? rows.map((r,i) => `<tr><td>${i+1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.items.length}</strong></td><td>${detailLines(r.items, x => `<strong>${esc(date(x.date))}</strong> — ${esc(x.type || x.note || "Chưa ghi thành tích")} — <span>${esc(x.formType || "Chưa ghi hình thức")}</span>`)}</td><td>${r.items.map(x => `<button type="button" class="icon-button danger" title="Xóa lượt ${esc(date(x.date))} — ID ${esc(x.id)}" data-reward-delete="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button>`).join(" ")}</td></tr>`).join("") : '<tr><td colspan="5"><div class="empty-state"><strong>Chưa có dữ liệu khen thưởng</strong><p>Chưa có học sinh được ghi nhận khen thưởng.</p></div></td></tr>';
    }

    async function deleteOne(kind, id) {
        const sid = clean(id);
        if (!sid) return;
        const fnName = kind === "violation" ? "deleteViolation" : "deleteReward";
        const label = kind === "violation" ? "vi phạm" : "khen thưởng";
        const fn = window[fnName];
        if (typeof fn !== "function") {
            console.error(`[EVENT SUMMARY] Thiếu API ${fnName}`);
            return;
        }
        const ok = window.confirm(`Xóa đúng 1 lượt ${label} này?\nID: ${sid}\n\nCác lượt khác của học sinh vẫn được giữ nguyên.`);
        if (!ok) return;
        try {
            const result = fn(sid);
            if (result && typeof result.then === "function") await result;
            if (typeof window.syncAppDataReferences === "function") window.syncAppDataReferences();
            renderGroupedViolations();
            renderGroupedRewards();
            if (typeof window.renderDashboard === "function") window.renderDashboard();
            if (typeof window.updateBadges === "function") window.updateBadges();
            if (typeof window.showToast === "function") window.showToast(`Đã xóa đúng lượt ${label}.`, "success");
        } catch (error) {
            console.error(`[EVENT SUMMARY] ${fnName}:`, error);
            if (typeof window.showToast === "function") window.showToast(`Không thể xóa lượt ${label}.`, "error");
        }
    }

    function bind() {
        document.addEventListener("click", event => {
            const vb = event.target.closest?.("[data-violation-delete]");
            if (vb) {
                event.preventDefault();
                event.stopPropagation();
                deleteOne("violation", vb.getAttribute("data-violation-delete"));
                return;
            }
            const rb = event.target.closest?.("[data-reward-delete]");
            if (rb) {
                event.preventDefault();
                event.stopPropagation();
                deleteOne("reward", rb.getAttribute("data-reward-delete"));
            }
        }, true);

        ["violationSearch", "violationTypeFilter", "violationPeriodFilter"].forEach(id => {
            const el = $(id);
            if (!el || el.__LH_EVENT_SUMMARY_BOUND__) return;
            el.__LH_EVENT_SUMMARY_BOUND__ = true;
            el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderGroupedViolations);
        });
    }

    function install() {
        const oldAttendance = window.renderAttendance;
        if (typeof oldAttendance === "function" && !oldAttendance.__LH_ATTENDANCE_SUMMARY_WRAPPED__) {
            const wrapped = function () {
                const result = oldAttendance.apply(this, arguments);
                renderAbsenceSummary();
                return result;
            };
            wrapped.__LH_ATTENDANCE_SUMMARY_WRAPPED__ = true;
            window.renderAttendance = wrapped;
            try { if (typeof PAGE_RENDERERS !== "undefined") PAGE_RENDERERS.attendance = wrapped; } catch (_) {}
        }
        window.renderViolations = renderGroupedViolations;
        window.renderRewards = renderGroupedRewards;
        try {
            if (typeof PAGE_RENDERERS !== "undefined") {
                PAGE_RENDERERS.violations = renderGroupedViolations;
                PAGE_RENDERERS.rewards = renderGroupedRewards;
            }
        } catch (_) {}
        bind();
        renderAbsenceSummary();
        renderGroupedViolations();
        renderGroupedRewards();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();

    window.__LH_EVENT_SUMMARY_API__ = { renderAbsenceSummary, renderGroupedViolations, renderGroupedRewards };
})();
