/* ============================================================
   UI COMPLETE FIX 2.1.0
   UNIVERSAL ACTION ROUTER
   - Preserve 42/42 student links
   - Do not modify data.js / LocalStorage
   - Do not hijack the MASTER script event router
   - Add delegated fallback for dynamically rendered buttons/forms
   ============================================================ */
(function () {
    "use strict";

    const $ = id => document.getElementById(id);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const esc = value => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function toast(message, type = "info") {
        if (typeof window.showToast === "function") window.showToast(message, type);
        else console.info(message);
    }

    function students() {
        try {
            if (typeof window.getStudentsSafe === "function") {
                const value = window.getStudentsSafe();
                if (Array.isArray(value)) return value.slice();
            }
        } catch (error) { console.error(error); }
        if (Array.isArray(window.students)) return window.students.slice();
        if (Array.isArray(window.classData?.students)) return window.classData.students.slice();
        if (Array.isArray(window.appData?.students)) return window.appData.students.slice();
        return [];
    }

    function studentLink(student) {
        try {
            if (typeof window.getStudentLink === "function") {
                const link = window.getStudentLink(student.id);
                if (link) return String(link);
            }
        } catch (error) { console.error(error); }
        return location.origin + location.pathname + "?student=" + encodeURIComponent(student.id);
    }

    function renderStudentLinksFull() {
        const box = $("studentLinksList") || $("studentLinkList");
        if (!box) return;

        const all = students().filter(s => s && s.id && String(s.name || "").trim());
        const list = all.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "vi"));

        box.style.maxHeight = "none";
        box.style.height = "auto";
        box.style.overflowY = "visible";
        box.style.overflowX = "hidden";
        box.dataset.studentCount = String(list.length);

        $$("[data-student-link-count]").forEach(el => { el.textContent = `${list.length}/${all.length}`; });
        box.parentElement?.querySelectorAll("[data-student-link-counter]").forEach(el => {
            el.textContent = `Đang hiển thị ${list.length}/${all.length} học sinh`;
        });

        if (!list.length) {
            box.innerHTML = '<div class="empty-state"><strong>Chưa có học sinh</strong><p>Data Engine chưa trả về danh sách học sinh.</p></div>';
            return;
        }

        box.innerHTML = list.map((student, index) => {
            const link = studentLink(student);
            return `<div class="student-link-item" data-student-id="${esc(student.id)}">
                <div class="student-link-main">
                    <strong>${index + 1}. ${esc(student.name)}</strong>
                    <input type="text" readonly value="${esc(link)}" aria-label="Link ${esc(student.name)}">
                </div>
                <div class="student-link-actions">
                    <button type="button" class="button secondary" data-open-student-link="${esc(link)}"><i class="fa-solid fa-arrow-up-right-from-square"></i> Mở</button>
                    <button type="button" class="button secondary" data-copy-student-link="${esc(link)}"><i class="fa-solid fa-copy"></i> Sao chép</button>
                </div>
            </div>`;
        }).join("");
    }

    function pageSection(page) {
        const safe = String(page || "").replace(/[^a-zA-Z0-9_-]/g, "");
        return document.querySelector(`[data-page-section="${safe}"]`) || $("page-" + safe);
    }

    function go(page) {
        if (typeof window.navigateToPage === "function") {
            try {
                window.navigateToPage(page);
            } catch (error) {
                console.error("navigateToPage", error);
            }
        }

        const section = pageSection(page);
        if (!section) {
            toast(`Trang "${page}" chưa có trong HTML.`, "warning");
            return false;
        }

        $$("[data-page-section]").forEach(item => {
            const active = item === section;
            item.classList.toggle("active", active);
            item.hidden = !active;
        });
        $$(".menu-item[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === page));

        const titles = {
            dashboard: "Trang chủ", students: "Học sinh", attendance: "Điểm danh", violations: "Vi phạm",
            rewards: "Khen thưởng", learning: "Học tập", comments: "Nhận xét", statistics: "Thống kê",
            "student-links": "Link học sinh", materials: "Kho học liệu", ai: "AI giáo viên", settings: "Cài đặt"
        };
        if ($("pageTitle")) $("pageTitle").textContent = titles[page] || page;

        if (page === "student-links") {
            renderStudentLinksFull();
            [100, 300, 700, 1500].forEach(ms => setTimeout(renderStudentLinksFull, ms));
        }
        return true;
    }

    function ensurePage(page, title, description, cards) {
        const section = pageSection(page);
        if (!section) return;
        let root = section.querySelector("[data-ui-complete-page]");
        if (!root) {
            root = document.createElement("div");
            root.dataset.uiCompletePage = page;
            root.className = "ui-complete-page";
            section.appendChild(root);
        }
        root.innerHTML = `<div class="section-heading"><div><h2>${esc(title)}</h2><p>${esc(description)}</p></div></div><div class="stats-grid ui-complete-grid">${cards.map(card => `<article class="stat-card ui-complete-card"><div class="stat-card-top"><span class="stat-icon student"><i class="fa-solid ${esc(card[3] || "fa-circle-check")}"></i></span></div><strong class="stat-label">${esc(card[0])}</strong><p>${esc(card[1])}</p><button type="button" class="button secondary" data-ui-action="${esc(card[2])}"><i class="fa-solid fa-arrow-right"></i> Mở</button></article>`).join("")}</div>`;
    }

    function renderMaterials() {
        ensurePage("materials", "Kho học liệu", "Các nhóm học liệu sẵn sàng để mở.", [
            ["Giáo án", "Kho giáo án.", "materials-lesson", "fa-file-lines"],
            ["Đề kiểm tra", "Kho đề kiểm tra.", "materials-tests", "fa-file-circle-check"],
            ["Phiếu học tập", "Kho phiếu học tập.", "materials-worksheets", "fa-sheet-plastic"],
            ["Bài giảng", "Kho slide và bài giảng.", "materials-slides", "fa-display"],
            ["Tài liệu", "Tài liệu tham khảo.", "materials-documents", "fa-folder-open"],
            ["Thư viện ảnh", "Kho hình ảnh.", "materials-images", "fa-images"]
        ]);
    }

    function renderAI() {
        ensurePage("ai", "AI giáo viên", "Các công cụ hỗ trợ giáo viên.", [
            ["Phân tích lớp học", "Tổng hợp dữ liệu lớp.", "ai-analyze", "fa-chart-line"],
            ["Hỗ trợ học sinh", "Xác định học sinh cần quan tâm.", "ai-support", "fa-user-graduate"],
            ["Gợi ý nhận xét", "Tạo nhận xét tham khảo.", "ai-comments", "fa-pen-to-square"],
            ["Phân tích tiến bộ", "Tổng hợp dữ liệu tiến bộ.", "ai-progress", "fa-arrow-trend-up"]
        ]);
    }

    function renderSettings() {
        ensurePage("settings", "Cài đặt", "Quản lý năm học, dữ liệu, Drive, bảo mật và sao lưu.", [
            ["Năm học", "Kiểm tra bộ chọn năm học.", "setting-years", "fa-calendar-days"],
            ["Dữ liệu lớp", "Kiểm tra số học sinh hiện có.", "setting-data", "fa-database"],
            ["Google Drive", "Kiểm tra cấu hình Drive.", "setting-drive", "fa-hard-drive"],
            ["Bảo mật", "Kiểm tra bảo vệ dữ liệu.", "setting-security", "fa-shield-halved"],
            ["Sao lưu", "Xuất dữ liệu nếu Data Engine hỗ trợ.", "setting-backup", "fa-download"]
        ]);
    }

    function copyText(value) {
        const fallback = () => {
            const textarea = document.createElement("textarea");
            textarea.value = value;
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            let ok = false;
            try { ok = document.execCommand("copy"); } catch (error) {}
            textarea.remove();
            return ok;
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(() => toast("Đã sao chép link học sinh.", "success")).catch(() => {
                if (fallback()) toast("Đã sao chép link học sinh.", "success");
                else toast("Không thể sao chép link.", "error");
            });
        } else if (fallback()) toast("Đã sao chép link học sinh.", "success");
        else toast("Không thể sao chép link.", "error");
    }

    function call(name, ...args) {
        if (typeof window[name] !== "function") return false;
        try {
            window[name](...args);
            return true;
        } catch (error) {
            console.error(`[UI ROUTER] ${name}`, error);
            toast(`Chức năng ${name} gặp lỗi.`, "error");
            return true;
        }
    }

    const actionMap = {
        "add-student": "openAddStudentModal",
        "import-students": "openImportStudents",
        "attendance": "navigateToPage",
        "add-violation": "prepareViolationModal",
        "add-reward": "prepareRewardModal",
        "add-learning": "openLearningEditor",
        "add-comment": "openCommentEditor",
        "add-progress": "openProgressEditor",
        "progress": "openProgressEditor",
        "export": "exportReportSafe",
        "export-report": "exportReportSafe",
        "backup": "exportReportSafe",
        "refresh": "refreshAll",
        "refresh-all": "refreshAll"
    };

    function handleAction(action, event) {
        if (!action) return false;

        if (actionMap[action] === "navigateToPage") {
            event?.preventDefault();
            return call("navigateToPage", "attendance") || go("attendance");
        }

        const fn = actionMap[action];
        if (!fn) return false;
        event?.preventDefault();
        return call(fn);
    }

    function handleStudentAction(button, event) {
        const action = button.dataset.studentAction;
        const id = button.dataset.studentId;
        if (!action || !id) return false;
        event.preventDefault();
        switch (action) {
            case "view":
            case "profile": return call("showStudentProfile", id);
            case "edit": return call("openEditStudentModal", id);
            case "delete": return call("deleteStudentConfirm", id);
            default: return false;
        }
    }

    function handleUIAction(action) {
        const ai = {
            "ai-analyze": "analyze-class", "ai-support": "student-support",
            "ai-comments": "comments", "ai-progress": "progress"
        };
        const settings = {
            "setting-years": "school-years", "setting-data": "database",
            "setting-drive": "drive", "setting-security": "security"
        };
        if (ai[action]) return call("handleAIAction", ai[action]);
        if (settings[action]) return call("handleSetting", settings[action]);
        if (action === "setting-backup") return call("exportReportSafe");
        if (action.startsWith("materials-")) {
            toast("Kho học liệu đã mở. Chưa có URL Drive được cấu hình cho nhóm này nên hệ thống không tự tạo link giả.", "info");
            return true;
        }
        if (action === "setting-data") {
            toast(`Data Engine hiện có ${students().length} học sinh.`, "success");
            return true;
        }
        return false;
    }

    function handleButtonId(button, event) {
        const id = button.id;
        if (!id) return false;
        const idMap = {
            refreshActivity: "refreshAll",
            refreshDashboard: "refreshAll",
            refreshAllButton: "refreshAll",
            saveAttendance: "saveAttendance",
            closeSidebar: "closeMobileSidebar",
            sidebarClose: "closeMobileSidebar",
            sidebarToggle: "openMobileSidebar",
            closeAllModals: "closeAllModals"
        };
        const fn = idMap[id];
        if (!fn) return false;
        event.preventDefault();
        return call(fn);
    }

    function bind() {
        if (window.__UI_COMPLETE_FIX_210__) return;
        window.__UI_COMPLETE_FIX_210__ = true;

        document.addEventListener("click", event => {
            const menu = event.target.closest(".menu-item[data-page]");
            if (menu) {
                setTimeout(() => go(menu.dataset.page), 0);
                return;
            }

            const pageLink = event.target.closest("[data-page-link]");
            if (pageLink) {
                event.preventDefault();
                go(pageLink.dataset.pageLink);
                return;
            }

            const openLink = event.target.closest("[data-open-student-link]");
            if (openLink) {
                event.preventDefault();
                window.open(openLink.dataset.openStudentLink, "_blank", "noopener,noreferrer");
                return;
            }

            const copyLink = event.target.closest("[data-copy-student-link]");
            if (copyLink) {
                event.preventDefault();
                copyText(copyLink.dataset.copyStudentLink);
                return;
            }

            const studentAction = event.target.closest("[data-student-action]");
            if (studentAction && handleStudentAction(studentAction, event)) return;

            const uiAction = event.target.closest("[data-ui-action]");
            if (uiAction && handleUIAction(uiAction.dataset.uiAction)) {
                event.preventDefault();
                return;
            }

            const action = event.target.closest("[data-action]");
            if (action && handleAction(action.dataset.action, event)) return;

            const button = event.target.closest("button, [role=" + '"button"' + "]");
            if (button) handleButtonId(button, event);
        }, false);

        document.addEventListener("submit", event => {
            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;
            const map = {
                studentForm: "saveStudentForm",
                violationForm: "saveViolationForm",
                rewardForm: "saveRewardForm",
                learningForm: "saveLearningForm",
                commentForm: "saveCommentForm"
            };
            const fn = map[form.id];
            if (fn && typeof window[fn] === "function") {
                event.preventDefault();
                call(fn, event);
            }
        }, false);
    }

    function install() {
        bind();
        window.renderStudentLinks = renderStudentLinksFull;
        window.renderMaterialsPage = renderMaterials;
        window.renderAIPage = renderAI;
        window.renderSettingsPage = renderSettings;
        renderMaterials();
        renderAI();
        renderSettings();
        renderStudentLinksFull();
        [100, 300, 700, 1500, 3000].forEach(ms => setTimeout(renderStudentLinksFull, ms));
        setInterval(() => {
            if (document.visibilityState !== "hidden") renderStudentLinksFull();
        }, 5000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
})();
