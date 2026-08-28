/* ============================================================
   UI ACTION PATCH 2.2.0 — INDEPENDENT MENU ROUTER
   - Menu navigation is independent from Data Engine/renderers.
   - Does not delete LocalStorage.
   - Preserves attendance sync wrapper and game launcher.
   ============================================================ */
(function () {
    "use strict";

    var GOOGLE_URL = "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuw2OvE1tR1QKI-nkIQ/exec";
    var QUEUE_KEY = "QL_LOP_HOC_ATTENDANCE_SYNC_QUEUE_2026_2027";
    var PAGE_TITLES = {
        dashboard: "Trang chủ",
        students: "Học sinh",
        attendance: "Điểm danh",
        violations: "Vi phạm",
        rewards: "Khen thưởng",
        learning: "Học tập",
        comments: "Nhận xét",
        statistics: "Thống kê",
        "student-links": "Link học sinh",
        materials: "Kho học liệu",
        ai: "AI giáo viên",
        settings: "Cài đặt",
        game: "Triệu Phú Học Đường",
        "lucky-wheel": "Vòng quay may mắn"
    };

    var $ = function (id) { return document.getElementById(id); };

    function safeText(v) {
        return String(v == null ? "" : v).trim();
    }

    function openMobileSidebarDirect() {
        var s = $("sidebar"), o = $("sidebarOverlay");
        if (!s) return false;
        s.classList.add("open");
        s.classList.remove("collapsed");
        if (o) {
            o.classList.add("active");
            o.hidden = false;
            o.setAttribute("aria-hidden", "false");
        }
        document.body.classList.add("sidebar-open");
        return true;
    }

    function closeMobileSidebarDirect() {
        var s = $("sidebar"), o = $("sidebarOverlay");
        if (s) s.classList.remove("open");
        if (o) {
            o.classList.remove("active");
            o.hidden = true;
            o.setAttribute("aria-hidden", "true");
        }
        document.body.classList.remove("sidebar-open");
        return true;
    }

    function pageSection(page) {
        var key = safeText(page).replace(/[^a-zA-Z0-9_-]/g, "");
        return document.querySelector('[data-page-section="' + key + '"]') || $("page-" + key);
    }

    function hardNavigate(page) {
        page = safeText(page);
        if (!page) return false;

        if (page === "game") {
            ensureGameSection();
        }

        var section = pageSection(page);
        if (!section) {
            if (page === "lucky-wheel" && typeof window.openLuckyWheel === "function") {
                try { window.openLuckyWheel(); return true; } catch (e) { console.error(e); }
            }
            if (page === "lucky-wheel" && typeof window.showLuckyWheel === "function") {
                try { window.showLuckyWheel(); return true; } catch (e2) { console.error(e2); }
            }
            return false;
        }

        var sections = document.querySelectorAll("[data-page-section]");
        for (var i = 0; i < sections.length; i++) {
            var active = sections[i] === section;
            sections[i].classList.toggle("active", active);
            sections[i].hidden = !active;
        }

        var menuItems = document.querySelectorAll(".menu-item[data-page]");
        for (var j = 0; j < menuItems.length; j++) {
            menuItems[j].classList.toggle("active", safeText(menuItems[j].dataset.page) === page);
        }

        var title = $("pageTitle");
        if (title) title.textContent = PAGE_TITLES[page] || page;

        if (window.LopHocApp && typeof window.LopHocApp.navigateToPage === "function") {
            try { window.LopHocApp.navigateToPage(page); } catch (e3) { console.warn("LopHocApp navigation fallback:", e3); }
        }

        if (page === "attendance" && typeof window.renderAttendance === "function") {
            try { window.renderAttendance(); } catch (e4) { console.warn("renderAttendance:", e4); }
        } else if (page === "students" && typeof window.renderStudents === "function") {
            try { window.renderStudents(); } catch (e5) { console.warn("renderStudents:", e5); }
        } else if (page === "violations" && typeof window.renderViolations === "function") {
            try { window.renderViolations(); } catch (e6) { console.warn("renderViolations:", e6); }
        } else if (page === "rewards" && typeof window.renderRewards === "function") {
            try { window.renderRewards(); } catch (e7) { console.warn("renderRewards:", e7); }
        } else if (page === "statistics" && typeof window.renderStatistics === "function") {
            try { window.renderStatistics(); } catch (e8) { console.warn("renderStatistics:", e8); }
        } else if (page === "student-links" && typeof window.renderStudentLinks === "function") {
            try { window.renderStudentLinks(); } catch (e9) { console.warn("renderStudentLinks:", e9); }
        }

        closeMobileSidebarDirect();
        var main = $("mainContent");
        if (main) {
            try { main.scrollTo({ top: 0, behavior: "smooth" }); }
            catch (_) { main.scrollTop = 0; }
        }
        return true;
    }

    function call(name) {
        var args = [].slice.call(arguments, 1);
        var fn = window[name];
        if (typeof fn !== "function") return false;
        try { fn.apply(window, args); return true; }
        catch (e) { console.error("[UI ACTION] " + name, e); return false; }
    }

    function ensureGameMenu() {
        var nav = document.querySelector(".main-menu");
        if (!nav || nav.querySelector('[data-page="game"]')) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "menu-item";
        b.dataset.page = "game";
        b.innerHTML = '<i class="fa-solid fa-gamepad"></i><span>🎮 Triệu Phú Học Đường</span><span class="menu-label">Mới</span>';
        var divider = nav.querySelector(".menu-divider");
        if (divider) nav.insertBefore(b, divider); else nav.appendChild(b);
    }

    function ensureGameSection() {
        var main = $("mainContent");
        if (!main || $("page-game")) return;
        var s = document.createElement("section");
        s.className = "page-section";
        s.id = "page-game";
        s.dataset.pageSection = "game";
        s.innerHTML = '<div class="page-header"><div><span class="page-eyebrow">🎮 GAME HỌC TẬP</span><h1>Triệu Phú Học Đường</h1><p>Ôn luyện lớp 5 dùng chung dữ liệu học sinh của hệ thống.</p></div><div class="page-actions"><a class="button primary" href="game/index.html">🎮 Mở Game</a></div></div><div class="dashboard-panel"><h3>4 môn học • 4 mức độ • 15 câu/lượt</h3><p>Toán • Tiếng Việt • Khoa học • Lịch sử &amp; Địa lí</p><p>50:50 • Hỏi cả lớp • Đổi câu • Lưu kết quả.</p></div>';
        main.appendChild(s);
    }

    function handleMenuClick(e) {
        var t = e.target instanceof Element ? e.target : null;
        if (!t) return;

        var toggle = t.closest("#sidebarToggle,#sidebarClose,#closeSidebar");
        if (toggle) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (toggle.id === "sidebarToggle") openMobileSidebarDirect(); else closeMobileSidebarDirect();
            return;
        }

        if (t.closest("#sidebarOverlay")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            closeMobileSidebarDirect();
            return;
        }

        var menu = t.closest(".menu-item[data-page]");
        if (menu) {
            e.preventDefault();
            e.stopImmediatePropagation();
            hardNavigate(menu.dataset.page);
            return;
        }

        var pageLink = t.closest("[data-page-link]");
        if (pageLink) {
            e.preventDefault();
            e.stopImmediatePropagation();
            hardNavigate(pageLink.dataset.pageLink);
            return;
        }
    }

    function readQueue() {
        try {
            var d = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
            return Array.isArray(d) ? d : [];
        } catch (_) { return []; }
    }

    function writeQueue(q) {
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (_) {}
    }

    function qid(r) { return [r.studentId, r.date, r.status].join("|"); }

    function enqueue(r) {
        var q = readQueue(), k = qid(r), found = false;
        q = q.map(function (x) {
            if (qid(x) === k) {
                found = true;
                return Object.assign({}, x, r, { queuedAt: x.queuedAt || new Date().toISOString() });
            }
            return x;
        });
        if (!found) q.push(Object.assign({}, r, { queuedAt: new Date().toISOString() }));
        writeQueue(q);
    }

    function jsonp(action, params) {
        params = params || {};
        return new Promise(function (resolve, reject) {
            var cb = "__LH_ATT_" + Date.now() + "_" + Math.random().toString(36).slice(2);
            var sc = document.createElement("script");
            var query = new URLSearchParams(Object.assign({ action: action, callback: cb }, params));
            var done = false;
            var timer = setTimeout(function () { finish(new Error("JSONP timeout")); }, 10000);
            function finish(err, val) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (_) {}
                sc.remove();
                err ? reject(err) : resolve(val);
            }
            window[cb] = function (v) { finish(null, v); };
            sc.onerror = function () { finish(new Error("JSONP error")); };
            sc.src = GOOGLE_URL + "?" + query.toString();
            document.head.appendChild(sc);
        });
    }

    function postAttendance(r) {
        return fetch(GOOGLE_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-store",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify({ action: "saveAttendance", record: r })
        }).then(function () { return true; });
    }

    function flush() {
        var q = readQueue();
        if (!q.length) return;
        var rem = q.slice(), chain = Promise.resolve();
        q.forEach(function (r) {
            chain = chain.then(function () {
                return postAttendance(r).then(function () {
                    return jsonp("getAttendance", { studentId: r.studentId }).then(function (v) {
                        var rows = Array.isArray(v && v.records) ? v.records : [];
                        if (rows.some(function (x) {
                            return String(x.studentId) === String(r.studentId) && String(x.date) === String(r.date) && String(x.status) === String(r.status);
                        })) {
                            rem = rem.filter(function (x) { return qid(x) !== qid(r); });
                        }
                    });
                }).catch(function () {});
            });
        });
        chain.finally(function () {
            writeQueue(rem);
            window.__LH_ATTENDANCE_SYNC__ = {
                queued: rem.length,
                synced: q.length - rem.length,
                at: new Date().toISOString()
            };
        });
    }

    function installAttendance() {
        if (window.__LH_ATTENDANCE_SYNC_WRAPPER_220__) return true;
        var original = window.saveAttendanceRecord;
        if (typeof original !== "function") return false;
        var wrapped = function (studentId, date, status, note) {
            var out = original.apply(this, arguments);
            enqueue({
                id: "ATT_" + studentId + "_" + date,
                studentId: String(studentId),
                date: String(date),
                status: String(status || "present"),
                note: String(note || ""),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setTimeout(flush, 100);
            return out;
        };
        wrapped.__LH_ATTENDANCE_WRAPPED_220__ = true;
        window.saveAttendanceRecord = wrapped;
        window.__LH_ATTENDANCE_SYNC_WRAPPER_220__ = true;
        flush();
        return true;
    }

    function install() {
        if (window.__UI_ACTION_PATCH_220__) return;
        window.__UI_ACTION_PATCH_220__ = true;
        ensureGameMenu();
        ensureGameSection();
        document.addEventListener("click", handleMenuClick, true);
        window.openMobileSidebar = openMobileSidebarDirect;
        window.closeMobileSidebar = closeMobileSidebarDirect;

        var n = 0;
        var t = setInterval(function () {
            n++;
            if (installAttendance() || n >= 200) clearInterval(t);
        }, 50);

        console.info("UI ACTION PATCH 2.2.0: HARD MENU ROUTER READY");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
})();
