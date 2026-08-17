/* ============================================================
   UI COMPLETE FIX 2.0.0
   - FIX 42/42 student links
   - FIX menu navigation
   - FIX action buttons
   - FIX Materials / AI / Settings
   - Does not modify data.js or delete LocalStorage
   ============================================================ */
(function () {
    "use strict";

    const $ = (id) => document.getElementById(id);
    const $$ = (s) => Array.from(document.querySelectorAll(s));
    const esc = (v) => String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function students() {
        try {
            if (typeof window.getStudentsSafe === "function") {
                const a = window.getStudentsSafe();
                if (Array.isArray(a)) return a.slice();
            }
        } catch (e) { console.error(e); }
        if (Array.isArray(window.students)) return window.students.slice();
        if (Array.isArray(window.classData?.students)) return window.classData.students.slice();
        if (Array.isArray(window.appData?.students)) return window.appData.students.slice();
        return [];
    }

    function toast(message, type = "info") {
        if (typeof window.showToast === "function") window.showToast(message, type);
        else console.info(message);
    }

    function studentLink(student) {
        try {
            if (typeof window.getStudentLink === "function") {
                const v = window.getStudentLink(student.id);
                if (v) return String(v);
            }
        } catch (e) { console.error(e); }
        return location.origin + location.pathname + "?student=" + encodeURIComponent(student.id);
    }

    function renderStudentLinksFull() {
        const box = $("studentLinksList") || $("studentLinkList");
        if (!box) return;

        const all = students().filter(s => s && s.id && String(s.name || "").trim());
        const list = all.slice().sort((a, b) =>
            String(a.name).localeCompare(String(b.name), "vi")
        );

        box.style.maxHeight = "none";
        box.style.height = "auto";
        box.style.overflowY = "visible";
        box.style.overflowX = "hidden";
        box.dataset.studentCount = String(list.length);

        const counter = box.parentElement?.querySelector("[data-student-link-counter]");
        if (counter) counter.textContent = `Đang hiển thị ${list.length}/${all.length} học sinh`;

        const countTargets = $$("[data-student-link-count]");
        countTargets.forEach(el => { el.textContent = `${list.length}/${all.length}`; });

        if (!list.length) {
            box.innerHTML = `<div class="empty-state"><strong>Chưa có học sinh</strong><p>Data Engine chưa trả về danh sách học sinh.</p></div>`;
            return;
        }

        box.innerHTML = list.map((s, i) => {
            const link = studentLink(s);
            return `
                <div class="student-link-item" data-student-id="${esc(s.id)}">
                    <div class="student-link-main">
                        <strong>${i + 1}. ${esc(s.name)}</strong>
                        <input type="text" readonly value="${esc(link)}" aria-label="Link ${esc(s.name)}">
                    </div>
                    <div class="student-link-actions">
                        <button type="button" class="button secondary" data-open-student-link="${esc(link)}">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở
                        </button>
                        <button type="button" class="button secondary" data-copy-student-link="${esc(link)}">
                            <i class="fa-solid fa-copy"></i> Sao chép
                        </button>
                    </div>
                </div>`;
        }).join("");
    }

    function pageSection(page) {
        return document.querySelector(`[data-page-section="${CSS.escape(page)}"]`) || $("page-" + page);
    }

    function go(page) {
        const section = pageSection(page);
        if (!section) {
            toast(`Trang "${page}" chưa có trong HTML.`, "warning");
            return false;
        }
        $$("[data-page-section]").forEach(s => {
            const active = s === section;
            s.classList.toggle("active", active);
            s.hidden = !active;
        });
        $$(".menu-item[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === page));
        const titles = {
            dashboard:"Trang chủ", students:"Học sinh", attendance:"Điểm danh", violations:"Vi phạm",
            rewards:"Khen thưởng", learning:"Học tập", comments:"Nhận xét", statistics:"Thống kê",
            "student-links":"Link học sinh", materials:"Kho học liệu", ai:"AI giáo viên", settings:"Cài đặt"
        };
        if ($("pageTitle")) $("pageTitle").textContent = titles[page] || page;
        try {
            if (typeof window.navigateToPage === "function") window.navigateToPage(page);
        } catch (e) { console.error(e); }
        if (page === "student-links") {
            renderStudentLinksFull();
            setTimeout(renderStudentLinksFull, 100);
            setTimeout(renderStudentLinksFull, 500);
        }
        if (page === "materials") renderMaterials();
        if (page === "ai") renderAI();
        if (page === "settings") renderSettings();
        return true;
    }

    function card(title, desc, action, icon = "fa-circle-check") {
        return `<article class="stat-card ui-complete-card">
            <div class="stat-card-top"><span class="stat-icon student"><i class="fa-solid ${icon}"></i></span></div>
            <strong class="stat-label">${esc(title)}</strong><p>${esc(desc)}</p>
            <button type="button" class="button secondary" data-ui-action="${esc(action)}"><i class="fa-solid fa-arrow-right"></i> Mở</button>
        </article>`;
    }

    function ensurePage(page, title, desc, cards) {
        const section = pageSection(page);
        if (!section) return;
        let root = section.querySelector("[data-ui-complete-page]");
        if (!root) {
            root = document.createElement("div");
            root.dataset.uiCompletePage = page;
            root.className = "ui-complete-page";
            section.appendChild(root);
        }
        root.innerHTML = `<div class="section-heading"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div></div><div class="stats-grid ui-complete-grid">${cards.map(c => card(c[0], c[1], c[2], c[3])).join("")}</div>`;
    }

    function renderMaterials() {
        ensurePage("materials", "Kho học liệu", "Các nhóm học liệu sẵn sàng để mở và kiểm tra.", [
            ["Giáo án", "Kho giáo án.", "materials-lesson", "fa-file-lines"],
            ["Đề kiểm tra", "Kho đề kiểm tra.", "materials-tests", "fa-file-circle-check"],
            ["Phiếu học tập", "Kho phiếu học tập.", "materials-worksheets", "fa-sheet-plastic"],
            ["Bài giảng", "Kho slide và bài giảng.", "materials-slides", "fa-display"],
            ["Tài liệu", "Tài liệu tham khảo.", "materials-documents", "fa-folder-open"],
            ["Thư viện ảnh", "Kho hình ảnh.", "materials-images", "fa-images"]
        ]);
    }

    function renderAI() {
        ensurePage("ai", "AI giáo viên", "Các công cụ phân tích dựa trên dữ liệu lớp học hiện có.", [
            ["Phân tích lớp học", "Tổng hợp sĩ số và dữ liệu lớp.", "ai-analyze", "fa-chart-line"],
            ["Hỗ trợ học sinh", "Xác định học sinh cần quan tâm.", "ai-support", "fa-user-graduate"],
            ["Gợi ý nhận xét", "Tạo nhận xét tham khảo.", "ai-comments", "fa-pen-to-square"],
            ["Phân tích tiến bộ", "Tổng hợp dữ liệu tiến bộ.", "ai-progress", "fa-arrow-trend-up"]
        ]);
    }

    function renderSettings() {
        ensurePage("settings", "Cài đặt", "Quản lý năm học, dữ liệu, sao lưu và bảo mật.", [
            ["Năm học", "Kiểm tra bộ chọn năm học.", "setting-years", "fa-calendar-days"],
            ["Dữ liệu lớp", "Kiểm tra số học sinh hiện có.", "setting-data", "fa-database"],
            ["Google Drive", "Kiểm tra cấu hình Drive hiện có.", "setting-drive", "fa-hard-drive"],
            ["Bảo mật", "Kiểm tra các nguyên tắc bảo vệ dữ liệu.", "setting-security", "fa-shield-halved"],
            ["Sao lưu", "Xuất dữ liệu nếu Data Engine hỗ trợ.", "setting-backup", "fa-download"]
        ]);
    }

    function doUIAction(action) {
        const map = {
            "materials-lesson": () => toast("Đang ở Kho học liệu. Giáo án chưa có URL Drive được cấu hình nên không tự tạo link giả.", "info"),
            "materials-tests": () => toast("Đang ở Kho học liệu. Đề kiểm tra chưa có URL Drive được cấu hình.", "info"),
            "materials-worksheets": () => toast("Đang ở Kho học liệu. Phiếu học tập chưa có URL Drive được cấu hình.", "info"),
            "materials-slides": () => toast("Đang ở Kho học liệu. Bài giảng chưa có URL Drive được cấu hình.", "info"),
            "materials-documents": () => toast("Đang ở Kho học liệu. Tài liệu chưa có URL Drive được cấu hình.", "info"),
            "materials-images": () => toast("Đang ở Kho học liệu. Thư viện ảnh chưa có URL Drive được cấu hình.", "info"),
            "ai-analyze": () => typeof window.handleAIAction === "function" ? window.handleAIAction("analyze-class") : toast("AI phân tích lớp chưa sẵn sàng.", "warning"),
            "ai-support": () => typeof window.handleAIAction === "function" ? window.handleAIAction("student-support") : toast("AI hỗ trợ học sinh chưa sẵn sàng.", "warning"),
            "ai-comments": () => typeof window.handleAIAction === "function" ? window.handleAIAction("comments") : toast("AI nhận xét chưa sẵn sàng.", "warning"),
            "ai-progress": () => typeof window.handleAIAction === "function" ? window.handleAIAction("progress") : toast("AI tiến bộ chưa sẵn sàng.", "warning"),
            "setting-years": () => typeof window.handleSetting === "function" ? window.handleSetting("school-years") : toast("Cài đặt năm học chưa sẵn sàng.", "warning"),
            "setting-data": () => toast(`Data Engine hiện có ${students().length} học sinh.`, "success"),
            "setting-drive": () => typeof window.handleSetting === "function" ? window.handleSetting("drive") : toast("Cấu hình Drive chưa sẵn sàng.", "warning"),
            "setting-security": () => typeof window.handleSetting === "function" ? window.handleSetting("security") : toast("Bảo mật chưa sẵn sàng.", "warning"),
            "setting-backup": () => typeof window.exportReportSafe === "function" ? window.exportReportSafe() : toast("Chức năng sao lưu chưa sẵn sàng.", "warning")
        };
        if (map[action]) map[action]();
        else toast(`Chức năng ${action} chưa được cấu hình.`, "warning");
    }

    function copy(value) {
        const fallback = () => {
            const t = document.createElement("textarea");
            t.value = value; t.style.position = "fixed"; t.style.left = "-9999px";
            document.body.appendChild(t); t.focus(); t.select();
            let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
            t.remove(); return ok;
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(() => toast("Đã sao chép link học sinh.", "success")).catch(() => fallback() ? toast("Đã sao chép link học sinh.", "success") : toast("Không thể sao chép link.", "error"));
        } else if (fallback()) toast("Đã sao chép link học sinh.", "success");
        else toast("Không thể sao chép link.", "error");
    }

    function bind() {
        if (window.__UI_COMPLETE_FIX_200__) return;
        window.__UI_COMPLETE_FIX_200__ = true;

        document.addEventListener("click", function (e) {
            const menu = e.target.closest(".menu-item[data-page]");
            if (menu) { e.preventDefault(); e.stopImmediatePropagation(); go(menu.dataset.page); return; }

            const pageLink = e.target.closest("[data-page-link]");
            if (pageLink) { e.preventDefault(); e.stopImmediatePropagation(); go(pageLink.dataset.pageLink); return; }

            const open = e.target.closest("[data-open-student-link]");
            if (open) { e.preventDefault(); e.stopImmediatePropagation(); window.open(open.dataset.openStudentLink, "_blank", "noopener,noreferrer"); return; }

            const cp = e.target.closest("[data-copy-student-link]");
            if (cp) { e.preventDefault(); e.stopImmediatePropagation(); copy(cp.dataset.copyStudentLink); return; }

            const ui = e.target.closest("[data-ui-action]");
            if (ui) { e.preventDefault(); e.stopImmediatePropagation(); doUIAction(ui.dataset.uiAction); return; }

            const action = e.target.closest("[data-action]");
            if (action && action.dataset.action) {
                const a = action.dataset.action;
                if (["statistics","student-links","materials","ai","ai-teacher","settings","attendance"].includes(a)) {
                    e.preventDefault(); e.stopImmediatePropagation();
                    go(a === "ai-teacher" ? "ai" : a);
                    return;
                }
            }
        }, true);
    }

    function install() {
        bind();
        window.renderStudentLinks = renderStudentLinksFull;
        window.renderMaterialsPage = renderMaterials;
        window.renderAIPage = renderAI;
        window.renderSettingsPage = renderSettings;
        renderMaterials(); renderAI(); renderSettings(); renderStudentLinksFull();
        [100, 300, 700, 1500, 3000].forEach(ms => setTimeout(renderStudentLinksFull, ms));
        setInterval(() => {
            if (document.visibilityState !== "hidden") renderStudentLinksFull();
        }, 5000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
})();
