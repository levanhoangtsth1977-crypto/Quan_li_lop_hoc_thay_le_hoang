/* ============================================================
   UI ACTION PATCH 1.1.0
   UNIVERSAL FALLBACK FOR ALL CURRENT HTML CONTROLS
   ------------------------------------------------------------
   - Bridges actual index.html controls to MASTER script.js APIs.
   - Stops duplicate handling after a successful fallback action.
   - Does not modify data.js or LocalStorage.
   - Works with dynamically rendered elements.
   ============================================================ */
(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    function toast(message, type = "info") {
        if (typeof window.showToast === "function") window.showToast(message, type);
        else console.info(message);
    }

    function call(name, ...args) {
        const fn = window[name];
        if (typeof fn !== "function") return false;
        try {
            fn(...args);
            return true;
        } catch (error) {
            console.error(`[UI ACTION PATCH] ${name}`, error);
            toast(`Không thể thực hiện: ${name}.`, "error");
            return true;
        }
    }

    function go(page) {
        if (!page) return false;
        if (call("navigateToPage", page)) return true;
        const safe = String(page).replace(/[^a-zA-Z0-9_-]/g, "");
        const section = document.querySelector(`[data-page-section="${safe}"]`) || $("page-" + safe);
        if (!section) {
            toast(`Không tìm thấy trang: ${page}.`, "warning");
            return false;
        }
        document.querySelectorAll("[data-page-section]").forEach(item => {
            const active = item === section;
            item.hidden = !active;
            item.classList.toggle("active", active);
        });
        document.querySelectorAll(".menu-item[data-page]").forEach(item => {
            item.classList.toggle("active", item.dataset.page === page);
        });
        if ($("pageTitle")) $("pageTitle").textContent = page;
        return true;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function openDialog(title, message) {
        if (typeof window.showDynamicDialog === "function") {
            window.showDynamicDialog(title, message);
            return;
        }
        const old = $("uiActionPatchDialog");
        if (old) old.remove();
        const overlay = document.createElement("div");
        overlay.className = "modal";
        overlay.id = "uiActionPatchDialog";
        overlay.hidden = false;
        overlay.innerHTML = `<div class="modal-backdrop" data-ui-patch-close></div><div class="modal-dialog"><div class="modal-header"><div><span class="modal-eyebrow">Hệ thống</span><h2>${escapeHTML(title)}</h2></div><button type="button" class="icon-button" data-ui-patch-close aria-label="Đóng">×</button></div><div style="padding:20px;white-space:pre-wrap;line-height:1.7">${escapeHTML(message)}</div><div class="modal-footer"><button type="button" class="button primary" data-ui-patch-close>Đóng</button></div></div>`;
        document.body.appendChild(overlay);
        document.body.classList.add("modal-open");
    }

    function handled(event) {
        event.preventDefault();
        event.stopPropagation();
        return true;
    }

    function handleAction(action, event) {
        const map = {
            "add-student": ["openAddStudentModal"],
            "import-students": ["openImportStudents"],
            "attendance": ["navigateToPage", "attendance"],
            "add-violation": ["prepareViolationModal"],
            "add-reward": ["prepareRewardModal"],
            "add-learning": ["openLearningEditor"],
            "add-comment": ["openCommentEditor"],
            "add-progress": ["openProgressEditor"],
            "progress": ["openProgressEditor"],
            "statistics": ["navigateToPage", "statistics"],
            "student-links": ["navigateToPage", "student-links"],
            "materials": ["navigateToPage", "materials"],
            "ai": ["navigateToPage", "ai"],
            "settings": ["navigateToPage", "settings"],
            "refresh": ["refreshAll"],
            "refresh-data": ["refreshAll"],
            "refresh-all": ["refreshAll"],
            "export": ["exportReportSafe"],
            "export-report": ["exportReportSafe"],
            "backup": ["exportReportSafe"]
        };
        const spec = map[action];
        if (!spec) return false;
        const fn = spec[0];
        const args = spec.slice(1);
        if (fn === "navigateToPage") go(args[0]);
        else call(fn, ...args);
        return handled(event);
    }

    function handleAI(action, event) {
        if (!action) return false;
        if (!call("handleAIAction", action)) openDialog("AI giáo viên", `Chức năng AI: ${action}`);
        return handled(event);
    }

    function handleSetting(action, event) {
        if (!action) return false;
        if (!call("handleSetting", action)) openDialog("Cài đặt", `Mục cài đặt: ${action}`);
        return handled(event);
    }

    function handleMaterial(element, event) {
        if (typeof window.handleMaterialAction === "function") {
            try {
                event.preventDefault();
                event.stopPropagation();
                window.handleMaterialAction(event);
                return true;
            } catch (error) {
                console.error("handleMaterialAction", error);
            }
        }
        const labels = { "lesson-plans": "Giáo án", tests: "Đề kiểm tra", worksheets: "Phiếu học tập", slides: "Bài giảng", documents: "Tài liệu", images: "Thư viện ảnh" };
        openDialog("Kho học liệu", `${labels[element.dataset.material] || "Học liệu"}\n\nChưa có URL dữ liệu được cấu hình.`);
        return handled(event);
    }

    function handleTopButton(id, event) {
        switch (id) {
            case "notificationButton":
                openDialog("Thông báo", "Không có thông báo mới.\n\nCác hoạt động mới của lớp sẽ xuất hiện tại đây.");
                return handled(event);
            case "profileButton":
            case "teacherMenuButton":
                openDialog("Thầy Lê Hoàng", "Giáo viên chủ nhiệm\nLớp 5C\nNăm học 2026–2027");
                return handled(event);
            case "refreshActivity":
            case "refreshDashboard":
            case "refreshAllButton":
                call("refreshAll");
                return handled(event);
            case "sidebarToggle":
                call("openMobileSidebar");
                return handled(event);
            case "sidebarClose":
            case "closeSidebar":
                call("closeMobileSidebar");
                return handled(event);
            default:
                return false;
        }
    }

    function handleSearch(event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.id !== "globalSearch") return;
        const query = input.value.trim();
        if (!query) return;
        const studentSearch = $("studentSearch");
        if (studentSearch) studentSearch.value = query;
        go("students");
        if (typeof window.renderStudents === "function") window.renderStudents();
    }

    document.addEventListener("click", function (event) {
        const close = event.target.closest("[data-ui-patch-close]");
        if (close) {
            event.preventDefault();
            event.stopPropagation();
            const dialog = $("uiActionPatchDialog");
            if (dialog) dialog.remove();
            document.body.classList.remove("modal-open");
            return;
        }

        const menu = event.target.closest(".menu-item[data-page]");
        if (menu) {
            go(menu.dataset.page);
            handled(event);
            return;
        }

        const pageLink = event.target.closest("[data-page-link]");
        if (pageLink) {
            go(pageLink.dataset.pageLink);
            handled(event);
            return;
        }

        const action = event.target.closest("[data-action]");
        if (action && handleAction(action.dataset.action, event)) return;

        const ai = event.target.closest("[data-ai-action]");
        if (ai && handleAI(ai.dataset.aiAction, event)) return;

        const setting = event.target.closest("[data-setting]");
        if (setting && handleSetting(setting.dataset.setting, event)) return;

        const material = event.target.closest("[data-material]");
        if (material && handleMaterial(material, event)) return;

        const button = event.target.closest("button, [role=button]");
        if (button && handleTopButton(button.id, event)) return;
    }, true);

    document.addEventListener("input", handleSearch, true);

    document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            event.stopPropagation();
            const search = $("globalSearch");
            if (search) {
                search.focus();
                search.select();
            }
        }
    }, true);

    console.info("UI ACTION PATCH 1.1.0: READY");
})();
