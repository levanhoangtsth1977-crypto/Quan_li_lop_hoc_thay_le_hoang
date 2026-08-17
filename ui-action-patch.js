/* ============================================================
   UI ACTION PATCH 1.0.0
   UNIVERSAL FALLBACK FOR ALL CURRENT HTML CONTROLS
   ------------------------------------------------------------
   Purpose:
   - Bridge actual index.html attributes to MASTER script.js APIs.
   - Do not modify data.js or LocalStorage.
   - Do not replace the MASTER router.
   - Work with dynamically rendered elements.
   ============================================================ */
(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    function toast(message, type = "info") {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
        } else {
            console.info(message);
        }
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

        const section = document.querySelector(`[data-page-section="${CSS.escape(page)}"]`);
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
        overlay.innerHTML = `
            <div class="modal-backdrop" data-ui-patch-close></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <div><span class="modal-eyebrow">Hệ thống</span><h2>${escapeHTML(title)}</h2></div>
                    <button type="button" class="icon-button" data-ui-patch-close aria-label="Đóng">×</button>
                </div>
                <div style="padding:20px;white-space:pre-wrap;line-height:1.7">${escapeHTML(message)}</div>
                <div class="modal-footer"><button type="button" class="button primary" data-ui-patch-close>Đóng</button></div>
            </div>`;
        document.body.appendChild(overlay);
        document.body.classList.add("modal-open");
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function handleAction(action, event) {
        if (!action) return false;
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
        event.preventDefault();
        const fn = spec[0];
        const args = spec.slice(1);
        if (fn === "navigateToPage") return go(args[0]);
        return call(fn, ...args);
    }

    function handleAI(action, event) {
        if (!action) return false;
        event.preventDefault();
        if (call("handleAIAction", action)) return true;
        openDialog("AI giáo viên", `Chức năng AI: ${action}`);
        return true;
    }

    function handleSetting(action, event) {
        if (!action) return false;
        event.preventDefault();
        if (call("handleSetting", action)) return true;
        openDialog("Cài đặt", `Mục cài đặt: ${action}`);
        return true;
    }

    function handleMaterial(element, event) {
        event.preventDefault();
        if (typeof window.handleMaterialAction === "function") {
            try {
                window.handleMaterialAction(event);
                return true;
            } catch (error) {
                console.error(error);
            }
        }
        const labels = {
            "lesson-plans": "Giáo án",
            tests: "Đề kiểm tra",
            worksheets: "Phiếu học tập",
            slides: "Bài giảng",
            documents: "Tài liệu",
            images: "Thư viện ảnh"
        };
        openDialog("Kho học liệu", `${labels[element.dataset.material] || "Học liệu"}\n\nChưa có URL dữ liệu được cấu hình.`);
        return true;
    }

    function handleTopButton(id, event) {
        if (!id) return false;
        switch (id) {
            case "notificationButton":
                event.preventDefault();
                openDialog("Thông báo", "Không có thông báo mới.\n\nCác hoạt động mới của lớp sẽ xuất hiện tại đây.");
                return true;
            case "profileButton":
            case "teacherMenuButton":
                event.preventDefault();
                openDialog("Thầy Lê Hoàng", "Giáo viên chủ nhiệm\nLớp 5C\nNăm học 2026–2027");
                return true;
            case "refreshActivity":
            case "refreshDashboard":
            case "refreshAllButton":
                event.preventDefault();
                return call("refreshAll");
            case "sidebarToggle":
                event.preventDefault();
                return call("openMobileSidebar");
            case "sidebarClose":
            case "closeSidebar":
                event.preventDefault();
                return call("closeMobileSidebar");
            default:
                return false;
        }
    }

    function handleSearch(event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (input.id !== "globalSearch") return;
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
            const dialog = $("uiActionPatchDialog");
            if (dialog) dialog.remove();
            document.body.classList.remove("modal-open");
            return;
        }

        const menu = event.target.closest(".menu-item[data-page]");
        if (menu) {
            event.preventDefault();
            go(menu.dataset.page);
            return;
        }

        const pageLink = event.target.closest("[data-page-link]");
        if (pageLink) {
            event.preventDefault();
            go(pageLink.dataset.pageLink);
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
            const search = $("globalSearch");
            if (search) {
                search.focus();
                search.select();
            }
        }
    }, true);

    console.info("UI ACTION PATCH 1.0.0: READY");
})();
