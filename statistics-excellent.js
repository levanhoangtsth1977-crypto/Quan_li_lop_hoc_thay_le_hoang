/* ============================================================
   THỐNG KÊ — HỌC SINH XUẤT SẮC TOÀN DIỆN
   Không sửa Data Engine / không tạo dữ liệu giả.
   UI duy nhất trong #statisticsGrid.
   ============================================================ */
(function () {
    "use strict";

    const TOP_VALUES = [5, 10, 15, 20];
    let rendering = false;

    function esc(v) {
        return String(v ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function arr(name) {
        return Array.isArray(window[name]) ? window[name] : [];
    }

    function sid(r) {
        return String(r?.studentId ?? r?.studentID ?? r?.idStudent ?? "");
    }

    function num(v) {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(String(v).replace(",", ".").replace(/[^0-9.-]/g, ""));
        return Number.isFinite(n) ? n : null;
    }

    function normalizeLevel(v) {
        const s = String(v ?? "").toLowerCase().trim();
        if (/mức?\s*1|^m1$|chưa đạt|chua dat|yếu|yeu|cđ/.test(s)) return 1;
        if (/mức?\s*2|^m2$|đạt|dat|trung bình|trung binh/.test(s)) return 2;
        if (/mức?\s*3|^m3$|tốt|tot|khá|kha|hoàn thành|hoan thanh/.test(s)) return 3;
        if (/^t$|excellent|xuất sắc|xuat sac/.test(s)) return 4;
        return null;
    }

    function qualityValue(record) {
        const values = [
            record?.nangLuc, record?.năngLực, record?.competency, record?.competencies,
            record?.phamChat, record?.phẩmChất, record?.quality, record?.qualities,
            record?.mucDo, record?.mứcĐộ, record?.level, record?.result
        ];
        let best = null;
        values.forEach(v => {
            const n = num(v);
            if (n !== null) best = best === null ? n : Math.max(best, n);
            const l = normalizeLevel(v);
            if (l !== null) best = best === null ? l : Math.max(best, l);
        });
        return best;
    }

    function averageLearning(records) {
        const vals = [];
        records.forEach(r => {
            const n = num(r?.score ?? r?.diem ?? r?.resultScore ?? r?.average ?? r?.ketQua);
            if (n !== null) vals.push(n <= 10 ? n * 10 : Math.min(n, 100));
            else {
                const l = normalizeLevel(r?.level ?? r?.result ?? r?.mucDo);
                if (l !== null) vals.push(l * 25);
            }
        });
        if (!vals.length) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    function progressScore(records) {
        const vals = [];
        records.forEach(r => {
            const n = num(r?.score ?? r?.percent ?? r?.value ?? r?.progress);
            if (n !== null) vals.push(n <= 10 ? n * 10 : Math.min(n, 100));
            else {
                const l = normalizeLevel(r?.level ?? r?.result ?? r?.mucDo);
                if (l !== null) vals.push(l * 25);
            }
        });
        if (!vals.length) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    function buildRows() {
        const students = Array.isArray(window.students) ? window.students : [];
        const attendance = arr("attendanceRecords");
        const violations = arr("violationRecords");
        const rewards = arr("rewardRecords");
        const learning = arr("learningRecords");
        const progress = arr("progressRecords");
        const comments = arr("commentRecords");

        return students.map((student, index) => {
            const id = String(student?.id ?? "");
            const att = attendance.filter(r => sid(r) === id);
            const vio = violations.filter(r => sid(r) === id);
            const rew = rewards.filter(r => sid(r) === id);
            const learn = learning.filter(r => sid(r) === id);
            const prog = progress.filter(r => sid(r) === id);
            const comm = comments.filter(r => sid(r) === id);

            const absent = att.filter(r => String(r?.status).toLowerCase() === "absent").length;
            const excused = att.filter(r => String(r?.status).toLowerCase() === "excused").length;
            const violationCount = vio.length;
            const rewardCount = rew.length;

            const learningScore = averageLearning(learn);
            const progressScoreValue = progressScore(prog);
            const qpValues = [...comm, ...prog, ...learn].map(qualityValue).filter(v => v !== null);
            const qp = qpValues.length ? Math.min(100, (qpValues.reduce((a,b)=>a+b,0) / qpValues.length) * 25) : null;

            const attendanceTotal = att.length;
            const attendanceScore = attendanceTotal
                ? Math.max(0, 100 - ((absent * 100) / attendanceTotal))
                : 100;
            const disciplineScore = Math.max(0, 100 - violationCount * 10);
            const rewardScore = Math.min(100, rewardCount * 20);

            /* Không phạt học sinh vì thiếu dữ liệu học tập/năng lực/phẩm chất.
               Các thành phần có dữ liệu được chuẩn hóa theo trọng số động. */
            const parts = [
                [learningScore, 0.40],
                [qp, 0.20],
                [progressScoreValue, 0.15],
                [attendanceScore, 0.10],
                [disciplineScore, 0.10],
                [rewardScore, 0.05]
            ].filter(x => x[0] !== null);
            const weight = parts.reduce((s, x) => s + x[1], 0);
            const score = weight ? parts.reduce((s, x) => s + x[0] * x[1], 0) / weight : 0;

            return {
                index: index + 1,
                id,
                name: String(student?.name ?? "").trim() || "Chưa có tên",
                learningScore,
                qp,
                progress: progressScoreValue,
                absent,
                excused,
                violationCount,
                rewardCount,
                score
            };
        }).sort((a, b) => b.score - a.score || a.absent - b.absent || b.rewardCount - a.rewardCount || a.name.localeCompare(b.name, "vi"));
    }

    function scoreText(v) {
        return v === null ? "—" : `${v.toFixed(1)}%`;
    }

    function render() {
        const grid = document.getElementById("statisticsGrid");
        if (!grid || rendering) return;
        rendering = true;
        try {
            const current = Number(document.getElementById("excellentTopSelect")?.value) || 5;
            const rows = buildRows().slice(0, TOP_VALUES.includes(current) ? current : 5);
            grid.innerHTML = `
                <section class="dashboard-panel excellent-statistics-panel" id="excellentStatisticsPanel">
                    <div class="panel-header">
                        <div>
                            <h3>🏆 Học sinh xuất sắc toàn diện</h3>
                            <p>Xếp hạng theo học tập, năng lực/phẩm chất, tiến bộ, chuyên cần, vi phạm và khen thưởng.</p>
                        </div>
                        <label style="display:flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap">
                            <span>Chọn Top</span>
                            <select id="excellentTopSelect" class="period-select" aria-label="Số học sinh xuất sắc">
                                ${TOP_VALUES.map(n => `<option value="${n}" ${n === current ? "selected" : ""}>Top ${n}</option>`).join("")}
                            </select>
                        </label>
                    </div>
                    <div class="info-banner" style="margin:0 0 16px 0">
                        <i class="fa-solid fa-circle-info"></i>
                        <div><strong>Tiêu chí xếp hạng</strong><p>Ưu tiên dữ liệu thực tế đã có; thiếu dữ liệu không bị quy thành điểm 0.</p></div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr>
                                <th>Hạng</th><th>Học sinh</th><th>Học tập</th><th>Năng lực / phẩm chất</th><th>Tiến bộ</th>
                                <th>Vắng</th><th>Vi phạm</th><th>Khen thưởng</th><th>Điểm toàn diện</th>
                            </tr></thead>
                            <tbody>
                                ${rows.length ? rows.map((r, i) => `
                                    <tr>
                                        <td><strong>${i + 1}</strong></td>
                                        <td><strong>${esc(r.name)}</strong></td>
                                        <td>${scoreText(r.learningScore)}</td>
                                        <td>${scoreText(r.qp)}</td>
                                        <td>${scoreText(r.progress)}</td>
                                        <td>${r.absent}${r.excused ? ` <small>(phép ${r.excused})</small>` : ""}</td>
                                        <td>${r.violationCount}</td>
                                        <td>${r.rewardCount}</td>
                                        <td><strong>${r.score.toFixed(1)}%</strong></td>
                                    </tr>`).join("") : `<tr><td colspan="9"><div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-trophy"></i></span><strong>Chưa có dữ liệu học sinh</strong><p>Hãy đồng bộ dữ liệu lớp trước khi xếp hạng.</p></div></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </section>`;

            const select = document.getElementById("excellentTopSelect");
            if (select) select.addEventListener("change", render, { once: true });
        } finally {
            setTimeout(() => { rendering = false; }, 0);
        }
    }

    function schedule() {
        setTimeout(render, 0);
    }

    function init() {
        schedule();
        const grid = document.getElementById("statisticsGrid");
        if (grid) {
            const observer = new MutationObserver(() => schedule());
            observer.observe(grid, { childList: true, subtree: false });
        }
        document.addEventListener("click", e => {
            const menu = e.target.closest?.('[data-page="statistics"], [data-page-link="statistics"]');
            if (menu) schedule();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
