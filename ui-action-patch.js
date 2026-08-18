/* ============================================================
   UI ACTION PATCH 1.2.0
   Mobile menu direct DOM fallback
   ============================================================ */
(function () {
    "use strict";
    const $ = id => document.getElementById(id);

    function toast(message, type = "info") {
        if (typeof window.showToast === "function") window.showToast(message, type);
        else console.info(message);
    }

    function openMobileSidebarDirect() {
        const sidebar = $("sidebar");
        const overlay = $("sidebarOverlay");
        if (!sidebar) return false;
        sidebar.classList.add("open");
        sidebar.classList.remove("collapsed");
        if (overlay) {
            overlay.classList.add("active");
            overlay.hidden = false;
        }
        document.body.classList.add("sidebar-open");
        return true;
    }

    function closeMobileSidebarDirect() {
        const sidebar = $("sidebar");
        const overlay = $("sidebarOverlay");
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) {
            overlay.classList.remove("active");
            overlay.hidden = true;
        }
        document.body.classList.remove("sidebar-open");
        return true;
    }

    function call(name, ...args) {
        const fn = window[name];
        if (typeof fn !== "function") return false;
        try { fn(...args); return true; }
        catch (error) { console.error(`[UI ACTION PATCH] ${name}`, error); return false; }
    }

    function go(page) {
        if (!page) return false;
        if (call("navigateToPage", page)) return true;
        const safe = String(page).replace(/[^a-zA-Z0-9_-]/g, "");
        const section = document.querySelector(`[data-page-section="${safe}"]`) || $("page-" + safe);
        if (!section) return false;
        document.querySelectorAll("[data-page-section]").forEach(item => {
            const active = item === section;
            item.hidden = !active;
            item.classList.toggle("active", active);
        });
        document.querySelectorAll(".menu-item[data-page]").forEach(item => item.classList.toggle("active", item.dataset.page === page));
        if ($("pageTitle")) $("pageTitle").textContent = page;
        closeMobileSidebarDirect();
        return true;
    }

    function handleTopButton(id, event) {
        if (id === "sidebarToggle") {
            event.preventDefault();
            event.stopImmediatePropagation();
            openMobileSidebarDirect();
            return true;
        }
        if (id === "sidebarClose" || id === "closeSidebar") {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeMobileSidebarDirect();
            return true;
        }
        return false;
    }

    function handleClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const button = target.closest("#sidebarToggle, #sidebarClose, #closeSidebar");
        if (button && handleTopButton(button.id, event)) return;
        const overlay = target.closest("#sidebarOverlay");
        if (overlay) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeMobileSidebarDirect();
            return;
        }
        const menu = target.closest(".menu-item[data-page]");
        if (menu) {
            event.preventDefault();
            event.stopImmediatePropagation();
            go(menu.dataset.page);
        }
    }

    function install() {
        if (window.__UI_ACTION_PATCH_120__) return;
        window.__UI_ACTION_PATCH_120__ = true;
        document.addEventListener("click", handleClick, true);
        window.openMobileSidebar = openMobileSidebarDirect;
        window.closeMobileSidebar = closeMobileSidebarDirect;
        console.info("UI ACTION PATCH 1.2.0: READY");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
})();
