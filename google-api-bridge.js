/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 2.6.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
    url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
    timeout: 15000,
    verifyRetries: 6,
    verifyDelay: 1000,
    version: "2.0.0"
});

function googleApiRequest(action, params = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GOOGLE_API_CONFIG.timeout);
    const query = new URLSearchParams({ action, ...params });
    return fetch(`${GOOGLE_API_CONFIG.url}?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" }
    }).then(response => {
        if (!response.ok) throw new Error(`API HTTP ${response.status}`);
        return response.json();
    }).finally(() => clearTimeout(timer));
}

function googleApiJsonp(action, params = {}) {
    return new Promise((resolve, reject) => {
        const callback = `__googleApi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement("script");
        const query = new URLSearchParams({ action, callback, ...params });
        let finished = false;

        const cleanup = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            delete window[callback];
            script.remove();
        };

        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("API JSONP timeout."));
        }, GOOGLE_API_CONFIG.timeout);

        window[callback] = result => {
            cleanup();
            if (result && result.ok === true) resolve(result);
            else reject(new Error(result?.error || result?.message || "API không trả dữ liệu hợp lệ."));
        };

        script.onerror = () => {
            cleanup();
            reject(new Error("Không tải được phản hồi JSONP từ Apps Script."));
        };
        script.async = true;
        script.src = `${GOOGLE_API_CONFIG.url}?${query.toString()}`;
        document.head.appendChild(script);
    });
}

function googleApiPost(action, payload = {}) {
    return fetch(GOOGLE_API_CONFIG.url, {
        method: "POST",
        mode: "no-cors",
        cache: "no-store",
        redirect: "follow",
        keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, ...payload })
    }).then(() => ({ ok: true, action, dispatched: true }));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyAttendanceRecord(record, attempt = 0) {
    const studentId = String(record?.studentId || "").trim();
    const date = String(record?.date || "").trim();
    const status = String(record?.status || "").trim();
    if (!studentId || !date) throw new Error("Thiếu studentId hoặc date để xác minh.");

    try {
        const result = await googleApiJsonp("getAttendance", {
            studentId,
            from: date,
            to: date
        });
        const rows = Array.isArray(result.records) ? result.records : [];
        const found = rows.some(row =>
            String(row.studentId || "").trim() === studentId &&
            String(row.date || "").trim() === date &&
            String(row.status || "").trim() === status
        );
        if (found) return { ok: true, verified: true, studentId, date };
        throw new Error("Bản ghi chưa xuất hiện trong Google Sheets.");
    } catch (error) {
        if (attempt < GOOGLE_API_CONFIG.verifyRetries) {
            await sleep(GOOGLE_API_CONFIG.verifyDelay);
            return verifyAttendanceRecord(record, attempt + 1);
        }
        throw error;
    }
}

function normalizeAttendanceRecord(studentId, date, status, note) {
    return {
        studentId: String(studentId || "").trim(),
        date: String(date || "").trim(),
        status: String(status || "").trim(),
        note: String(note || "")
    };
}

async function syncOneAttendance(record) {
    if (!record.studentId || !record.date || !record.status) {
        throw new Error("Bản ghi điểm danh thiếu studentId, date hoặc status.");
    }
    await googleApiPost("saveAttendance", { record });
    return verifyAttendanceRecord(record);
}

function installAttendanceWriteBridge() {
    if (window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_260__) return;
    const original = window.saveAttendanceRecord;
    if (typeof original !== "function") {
        console.warn("[GOOGLE WRITE] Không tìm thấy saveAttendanceRecord().");
        return;
    }

    window.saveAttendanceRecord = function (studentId, date, status, note) {
        const record = normalizeAttendanceRecord(studentId, date, status, note);
        const localResult = original.apply(this, arguments);

        if (!record.studentId || !record.date || !record.status) {
            return localResult;
        }

        syncOneAttendance(record).then(result => {
            window.__GOOGLE_LAST_WRITE__ = {
                ok: true,
                action: "saveAttendance",
                verified: true,
                count: 1,
                record: result,
                at: new Date().toISOString()
            };
            if (typeof window.showToast === "function") {
                window.showToast("Đã đồng bộ điểm danh lên Google Sheets.", "success");
            }
        }).catch(error => {
            console.error("[GOOGLE WRITE] saveAttendance:", error);
            window.__GOOGLE_LAST_WRITE__ = {
                ok: false,
                action: "saveAttendance",
                verified: false,
                error: error.message,
                at: new Date().toISOString()
            };
            if (typeof window.showToast === "function") {
                window.showToast("Đã lưu cục bộ nhưng chưa đồng bộ Google Sheets.", "warning");
            }
        });

        return localResult;
    };

    window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_260__ = true;
}

function installWriteBridge() {
    if (window.__GOOGLE_WRITE_BRIDGE_260__) return;
    const saveMap = [
        ["addViolation", "saveViolation", "violation"],
        ["addReward", "saveReward", "reward"],
        ["addLearningRecord", "saveLearning", "learning"],
        ["addProgressRecord", "saveProgress", "progress"],
        ["addComment", "saveComment", "comment"]
    ];

    saveMap.forEach(([functionName, apiAction, type]) => {
        const original = window[functionName];
        if (typeof original !== "function") return;
        window[functionName] = function (...args) {
            const localResult = original.apply(this, args);
            const base = localResult?.record && typeof localResult.record === "object" ? { ...localResult.record } : {};
            const record = args[0] && typeof args[0] === "object" ? { ...base, ...args[0] } : base;
            googleApiPost(apiAction, { record }).then(() => {
                window.__GOOGLE_LAST_WRITE__ = { ok: true, action: apiAction, at: new Date().toISOString() };
            }).catch(error => {
                console.error(`[GOOGLE WRITE] ${apiAction}:`, error);
                window.__GOOGLE_LAST_WRITE__ = { ok: false, action: apiAction, error: error.message, at: new Date().toISOString() };
            });
            return localResult;
        };
    });

    window.__GOOGLE_WRITE_BRIDGE_260__ = true;
}

function syncStudentsFromGoogle() {
    return googleApiRequest("getStudents").then(result => {
        if (!result || result.ok !== true) throw new Error(result?.message || result?.error || "API không hợp lệ.");
        const students = Array.isArray(result.students) ? result.students : [];
        if (!students.length) throw new Error("Google Sheets trả về 0 học sinh; giữ dữ liệu hiện tại.");
        if (typeof window.replaceStudents !== "function") throw new Error("Thiếu replaceStudents().");
        const localResult = window.replaceStudents(students, { source: "google-sheets", persist: true, allowEmpty: false });
        if (localResult === false || localResult?.success === false) throw new Error(localResult?.message || "Không cập nhật được Data Engine.");
        window.__GOOGLE_CLASS_SYNC__ = {
            ok: true,
            count: students.length,
            total: Number(result.total) || students.length,
            syncedAt: new Date().toISOString(),
            apiVersion: result.version || "2.0.0"
        };
        return window.__GOOGLE_CLASS_SYNC__;
    });
}

function refreshAfterGoogleSync() {
    ["renderDashboard", "renderStudents", "renderAttendance", "renderViolations", "renderRewards", "renderLearningSafe", "renderCommentsSafe", "renderStatistics", "renderStudentLinks"].forEach(name => {
        if (typeof window[name] === "function") {
            try { window[name](); } catch (_) {}
        }
    });
}

function initializeGoogleApiBridge() {
    const wait = () => {
        if (typeof window.replaceStudents !== "function") return setTimeout(wait, 50);
        syncStudentsFromGoogle().then(result => {
            installAttendanceWriteBridge();
            installWriteBridge();
            refreshAfterGoogleSync();
            if (typeof window.showToast === "function") {
                window.showToast(`Đã đồng bộ ${result.count} học sinh từ Google Sheets.`, "success");
            }
        }).catch(error => {
            console.warn("[GOOGLE API] Sync failed:", error);
            installAttendanceWriteBridge();
            installWriteBridge();
        });
    };
    wait();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGoogleApiBridge, { once: true });
} else {
    initializeGoogleApiBridge();
}
