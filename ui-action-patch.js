/* ============================================================
   UI ACTION PATCH 2.0.0 — VIP PRO MAX
   Mobile menu + attendance Google sync queue
   ============================================================ */
(function () {
    "use strict";

    var GOOGLE_URL = "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec";
    var QUEUE_KEY = "QL_LOP_HOC_ATTENDANCE_SYNC_QUEUE_2026_2027";
    var $ = function (id) { return document.getElementById(id); };

    function openMobileSidebarDirect() {
        var sidebar = $("sidebar");
        var overlay = $("sidebarOverlay");
        if (!sidebar) return false;
        sidebar.classList.add("open");
        sidebar.classList.remove("collapsed");
        if (overlay) {
            overlay.classList.add("active");
            overlay.hidden = false;
            overlay.setAttribute("aria-hidden", "false");
        }
        document.body.classList.add("sidebar-open");
        return true;
    }

    function closeMobileSidebarDirect() {
        var sidebar = $("sidebar");
        var overlay = $("sidebarOverlay");
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) {
            overlay.classList.remove("active");
            overlay.hidden = true;
            overlay.setAttribute("aria-hidden", "true");
        }
        document.body.classList.remove("sidebar-open");
        return true;
    }

    function call(name) {
        var args = Array.prototype.slice.call(arguments, 1);
        var fn = window[name];
        if (typeof fn !== "function") return false;
        try { fn.apply(window, args); return true; }
        catch (error) { console.error("[UI ACTION] " + name, error); return false; }
    }

    function go(page) {
        if (!page) return false;
        if (call("navigateToPage", page)) return true;
        var target = String(page).replace(/[^a-zA-Z0-9_-]/g, "");
        var section = document.querySelector('[data-page-section="' + target + '"]') || $("page-" + target);
        if (!section) return false;
        document.querySelectorAll("[data-page-section]").forEach(function (item) {
            var active = item === section;
            item.hidden = !active;
            item.classList.toggle("active", active);
        });
        document.querySelectorAll(".menu-item[data-page]").forEach(function (item) {
            item.classList.toggle("active", item.dataset.page === page);
        });
        var title = $("pageTitle");
        if (title) title.textContent = page;
        closeMobileSidebarDirect();
        return true;
    }

    function handleMenuClick(event) {
        var target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        var button = target.closest("#sidebarToggle, #sidebarClose, #closeSidebar");
        if (button) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (button.id === "sidebarToggle") openMobileSidebarDirect();
            else closeMobileSidebarDirect();
            return;
        }
        var overlay = target.closest("#sidebarOverlay");
        if (overlay) {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeMobileSidebarDirect();
            return;
        }
        var menu = target.closest(".menu-item[data-page]");
        if (menu) {
            event.preventDefault();
            event.stopImmediatePropagation();
            go(menu.dataset.page);
        }
    }

    function readQueue() {
        try {
            var raw = localStorage.getItem(QUEUE_KEY);
            var data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch (_) { return []; }
    }

    function writeQueue(queue) {
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch (_) {}
    }

    function makeQueueId(record) {
        return [record.studentId, record.date, record.status].join("|");
    }

    function enqueueAttendance(record) {
        var queue = readQueue();
        var key = makeQueueId(record);
        var found = false;
        queue = queue.map(function (item) {
            if (makeQueueId(item) === key) {
                found = true;
                return Object.assign({}, item, record, { queuedAt: item.queuedAt || new Date().toISOString() });
            }
            return item;
        });
        if (!found) queue.push(Object.assign({}, record, { queuedAt: new Date().toISOString() }));
        writeQueue(queue);
    }

    function jsonp(action, params) {
        params = params || {};
        return new Promise(function (resolve, reject) {
            var callback = "__LH_ATT_" + Date.now() + "_" + Math.random().toString(36).slice(2);
            var script = document.createElement("script");
            var query = new URLSearchParams(Object.assign({ action: action, callback: callback }, params));
            var done = false;
            var timer = setTimeout(function () { finish(new Error("JSONP timeout")); }, 10000);
            function finish(error, value) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { delete window[callback]; } catch (_) {}
                script.remove();
                if (error) reject(error); else resolve(value);
            }
            window[callback] = function (value) { finish(null, value); };
            script.onerror = function () { finish(new Error("JSONP error")); };
            script.src = GOOGLE_URL + "?" + query.toString();
            document.head.appendChild(script);
        });
    }

    function postAttendance(record) {
        return fetch(GOOGLE_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-store",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify({ action: "saveAttendance", record: record })
        }).then(function () { return true; });
    }

    function flushAttendanceQueue() {
        var queue = readQueue();
        if (!queue.length) return;
        var remaining = queue.slice();
        var chain = Promise.resolve();
        queue.forEach(function (record) {
            chain = chain.then(function () {
                return postAttendance(record).then(function () {
                    return jsonp("getAttendance", { studentId: record.studentId })
                        .then(function (response) {
                            var rows = Array.isArray(response && response.records) ? response.records : [];
                            var found = rows.some(function (row) {
                                return String(row.studentId) === String(record.studentId) && String(row.date) === String(record.date) && String(row.status) === String(record.status);
                            });
                            if (found) {
                                remaining = remaining.filter(function (item) { return makeQueueId(item) !== makeQueueId(record); });
                            }
                        });
                }).catch(function () {});
            });
        });
        chain.finally(function () {
            writeQueue(remaining);
            window.__LH_ATTENDANCE_SYNC__ = {
                queued: remaining.length,
                synced: queue.length - remaining.length,
                at: new Date().toISOString()
            };
        });
    }

    function installAttendanceSync() {
        if (window.__LH_ATTENDANCE_SYNC_WRAPPER_200__) return true;
        var original = window.saveAttendanceRecord;
        if (typeof original !== "function") return false;
        if (original.__LH_ATTENDANCE_WRAPPED_200__) return true;
        var wrapped = function (studentId, date, status, note) {
            var result;
            try { result = original.apply(this, arguments); }
            catch (error) { console.error("[ATTENDANCE LOCAL]", error); return false; }
            enqueueAttendance({
                id: "ATT_" + String(studentId) + "_" + String(date),
                studentId: String(studentId),
                date: String(date),
                status: String(status || "present"),
                note: String(note || ""),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setTimeout(flushAttendanceQueue, 100);
            return result;
        };
        wrapped.__LH_ATTENDANCE_WRAPPED_200__ = true;
        window.saveAttendanceRecord = wrapped;
        window.__LH_ATTENDANCE_SYNC_WRAPPER_200__ = true;
        flushAttendanceQueue();
        return true;
    }

    function install() {
        if (window.__UI_ACTION_PATCH_200__) return;
        window.__UI_ACTION_PATCH_200__ = true;
        document.addEventListener("click", handleMenuClick, true);
        window.openMobileSidebar = openMobileSidebarDirect;
        window.closeMobileSidebar = closeMobileSidebarDirect;
        var attempts = 0;
        var timer = setInterval(function () {
            attempts += 1;
            if (installAttendanceSync() || attempts >= 200) clearInterval(timer);
        }, 50);
        console.info("UI ACTION PATCH 2.0.0: READY");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
    else install();
})();
