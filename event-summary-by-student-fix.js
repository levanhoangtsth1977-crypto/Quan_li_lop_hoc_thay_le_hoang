/* ============================================================
   EVENT SUMMARY BY STUDENT FIX 1.0
   - 1 học sinh = 1 dòng trong thống kê sự kiện
   - Không xóa/sửa dữ liệu gốc
   - Điểm danh hằng ngày vẫn giữ nguyên để giáo viên nhập
   - Bổ sung bảng tổng hợp học sinh vắng: tổng, có phép, không phép, ngày vắng
   - Vi phạm/Khen thưởng: gom theo học sinh và đếm số lần
   ============================================================ */
(function () {
    "use strict";

    if (window.__LH_EVENT_SUMMARY_BY_STUDENT_10__) return;
    window.__LH_EVENT_SUMMARY_BY_STUDENT_10__ = true;

    const $ = id => document.getElementById(id);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const esc = value => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const clean = value => String(value ?? "").trim();
    const key = value => clean(value).toLocaleLowerCase("vi");

    function students() {
        try {
            if (typeof window.getStudentsSafe === "function") {
                const list = window.getStudentsSafe();
                if (Array.isArray(list)) return list;
            }
        } catch (_) {}
        return Array.isArray(window.students) ? window.students : [];
    }

    function studentName(id) {
        try {
            const s = typeof window.getStudentById === "function"
                ? window.getStudentById(id)
                : students().find(x => String(x.id) === String(id));
            return s?.name || "Học sinh";
        } catch (_) {
            return "Học sinh";
        }
    }

    function records(name, getter) {
        try {
            if (typeof window[getter] === "function") {
                const value = window[getter]();
                if (Array.isArray(value)) return value.slice();
            }
        } catch (_) {}
        return Array.isArray(window[name]) ? window[name].slice() : [];
    }

    function formatDate(value) {
        const text = clean(value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            const [y, m, d] = text.split("-");
            return `${d}/${m}/${y}`;
        }
        return text;
    }

    function groupByStudent(list) {
        const map = new Map();
        list.forEach(record => {
            if (!record || !clean(record.studentId)) return;
            const id = clean(record.studentId);
            if (!map.has(id)) map.set(id, []);
            map.get(id).push(record);
        });
        return map;
    }

    function periodStart(period) {
        const now = new Date();
        if (period === "month") {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        if (period === "semester") {
            const month = now.getMonth();
            return new Date(now.getFullYear(), month < 5 ? 0 : month < 8 ? 5 : 8, 1);
        }
        if (period === "week") {
            const day = now.getDay() || 7;
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            start.setDate(now.getDate() - day + 1);
            return start;
        }
        return null;
    }

    function inPeriod(record, period) {
        if (!period || period === "all") return true;
        const start = periodStart(period);
        if (!start) return true;
        const date = new Date(clean(record?.date) + "T00:00:00");
        return !Number.isNaN(date.getTime()) && date >= start;
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
        if (summary) summary.insertAdjacentElement("afterend", box);
        else {
            const table = page.querySelector(".table-container");
            if (table) table.insertAdjacentElement("beforebegin", box);
            else page.appendChild(box);
        }
        return box;
    }

    function renderAbsenceSummary() {
        const box = ensureAbsenceSummary();
        if (!box) return;

        const list = records("attendanceRecords", "getAttendanceRecords")
            .filter(r => {
                const s = key(r.status);
                return s === "absent" || s === "excused" || s === "vắng" || s === "có phép" || s === "co phep";
            });

        const groups = groupByStudent(list);
        const rows = Array.from(groups.entries())
            .map(([id, items]) => {
                const excused = items.filter(r => {
                    const s = key(r.status);
                    return s === "excused" || s === "có phép" || s === "co phep";
                }).length;
                const absent = items.length - excused;
                const dates = [...new Set(items.map(r => formatDate(r.date)).filter(Boolean))];
                return { id, name: studentName(id), total: items.length, excused, absent, dates };
            })
            .sort((a, b) => a.name.localeCompare(b.name, "vi"));

        if (!rows.length) {
            box.innerHTML = '<div class="panel-header"><div><h3>📌 Tổng hợp học sinh vắng</h3><p>Chỉ hiển thị học sinh có phát sinh vắng.</p></div></div><div class="empty-state"><strong>Chưa có học sinh vắng</strong><p>Dữ liệu vắng sẽ tự động tổng hợp theo từng học sinh.</p></div>';
            return;
        }

        box.innerHTML = `<div class="panel-header"><div><h3>📌 Tổng hợp học sinh vắng</h3><p>${rows.length} học sinh có phát sinh vắng · 1 học sinh = 1 dòng</p></div></div>
            <div class="table-container"><table class="data-table"><thead><tr><th>STT</th><th>Học sinh</th><th>Tổng vắng</th><th>Có phép</th><th>Không phép</th><th>Ngày vắng</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.total}</strong></td><td>${r.excused}</td><td>${r.absent}</td><td>${esc(r.dates.join(", "))}</td></tr>`).join("")}</tbody></table></div>`;
    }

    function renderGroupedViolations() {
        const tbody = $("violationTableBody");
        if (!tbody) return;

        let list = records("violationRecords", "getViolationRecords");
        const search = key(typeof window.getValue === "function" ? window.getValue("violationSearch") : $("violationSearch")?.value);
        const type = $("violationTypeFilter")?.value || "all";
        const period = $("violationPeriodFilter")?.value || "all";

        list = list.filter(r => {
            if (type !== "all" && clean(r.type) !== type) return false;
            if (!inPeriod(r, period)) return false;
            if (!search) return true;
            return key(studentName(r.studentId)).includes(search) || key(r.type).includes(search) || key(r.note).includes(search);
        });

        const groups = groupByStudent(list);
        const rows = Array.from(groups.entries()).map(([id, items]) => {
            items.sort((a, b) => clean(b.date).localeCompare(clean(a.date)));
            return { id, name: studentName(id), items };
        }).sort((a, b) => a.name.localeCompare(b.name, "vi"));

        const table = tbody.closest("table");
        const head = table?.querySelector("thead tr");
        if (head) head.innerHTML = "<th>STT</th><th>Học sinh</th><th>Số lần</th><th>Ngày vi phạm</th><th>Nội dung</th><th>Mức độ</th><th>Thao tác</th>";

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Không có học sinh nào phù hợp bộ lọc.</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((r, i) => {
            const latest = r.items[0];
            const dates = [...new Set(r.items.map(x => formatDate(x.date)).filter(Boolean))];
            const actions = r.items.map(x => `<button type="button" class="icon-button danger" title="Xóa lượt ${esc(formatDate(x.date))}" data-violation-delete="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button>`).join(" ");
            return `<tr><td>${i + 1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.items.length}</strong></td><td>${esc(dates.join(", "))}</td><td>${esc(latest?.type || "")}</td><td>${esc(latest?.level || "")}</td><td>${actions}</td></tr>`;
        }).join("");
    }

    function renderGroupedRewards() {
        const tbody = $("rewardTableBody");
        if (!tbody) return;

        const list = records("rewardRecords", "getRewardRecords");
        const groups = groupByStudent(list);
        const rows = Array.from(groups.entries()).map(([id, items]) => {
            items.sort((a, b) => clean(b.date).localeCompare(clean(a.date)));
            return { id, name: studentName(id), items };
        }).sort((a, b) => a.name.localeCompare(b.name, "vi"));

        const table = tbody.closest("table");
        const head = table?.querySelector("thead tr");
        if (head) head.innerHTML = "<th>STT</th><th>Học sinh</th><th>Số lần</th><th>Ngày khen thưởng</th><th>Thành tích gần nhất</th><th>Hình thức</th><th>Thao tác</th>";

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><strong>Chưa có dữ liệu khen thưởng</strong><p>Chưa có học sinh được ghi nhận khen thưởng.</p></div></td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((r, i) => {
            const latest = r.items[0];
            const dates = [...new Set(r.items.map(x => formatDate(x.date)).filter(Boolean))];
            const actions = r.items.map(x => `<button type="button" class="icon-button danger" title="Xóa lượt ${esc(formatDate(x.date))}" data-reward-delete="${esc(x.id)}"><i class="fa-solid fa-trash"></i></button>`).join(" ");
            return `<tr><td>${i + 1}</td><td><strong>${esc(r.name)}</strong></td><td><strong>${r.items.length}</strong></td><td>${esc(dates.join(", "))}</td><td>${esc(latest?.type || "")}</td><td>${esc(latest?.formType || "")}</td><td>${actions}</td></tr>`;
        }).join("");
    }

    function install() {
        const oldAttendance = window.renderAttendance;
        if (typeof oldAttendance === "function" && !oldAttendance.__LH_GROUPED_WRAPPED__) {
            const wrapped = function () {
                oldAttendance.apply(this, arguments);
                renderAbsenceSummary();
            };
            wrapped.__LH_GROUPED_WRAPPED__ = true;
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

        ["violationSearch", "violationTypeFilter", "violationPeriodFilter"].forEach(id => {
            const el = $(id);
            if (el && !el.__LH_GROUPED_BOUND__) {
                el.__LH_GROUPED_BOUND__ = true;
                el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderGroupedViolations);
            }
        });

        renderAbsenceSummary();
        renderGroupedViolations();
        renderGroupedRewards();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();

    window.__LH_EVENT_SUMMARY_API__ = {
        renderAbsenceSummary,
        renderGroupedViolations,
        renderGroupedRewards
    };
})();