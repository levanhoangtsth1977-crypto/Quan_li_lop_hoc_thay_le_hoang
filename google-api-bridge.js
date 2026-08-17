/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 2.4.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
    url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
    timeout: 15000,
    version: "2.0.0"
});

function googleApiRequest(action, params = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GOOGLE_API_CONFIG.timeout);
    const query = new URLSearchParams({ action, ...params });
    return fetch(`${GOOGLE_API_CONFIG.url}?${query.toString()}`, {
        method: "GET", cache: "no-store", signal: controller.signal,
        headers: { Accept: "application/json" }
    }).then(response => {
        if (!response.ok) throw new Error(`API HTTP ${response.status}`);
        return response.json();
    }).finally(() => clearTimeout(timer));
}

function googleApiPost(action, payload = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GOOGLE_API_CONFIG.timeout);
    return fetch(GOOGLE_API_CONFIG.url, {
        method: "POST", cache: "no-store", redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, ...payload })
    }).then(async response => {
        if (!response.ok) throw new Error(`API HTTP ${response.status}`);
        const text = await response.text();
        if (!text) return { ok: true, action, responseEmpty: true };
        try { return JSON.parse(text); }
        catch (_) { return { ok: true, action, raw: text }; }
    }).finally(() => clearTimeout(timer));
}

function verifyAttendanceRecord(record) {
    const studentId = String(record?.studentId || "").trim();
    const date = String(record?.date || "").trim();
    if (!studentId || !date) return Promise.reject(new Error("Thiếu studentId hoặc date để xác minh."));
    return googleApiRequest("getAttendance", { studentId, from: date, to: date }).then(result => {
        if (!result || result.ok !== true) throw new Error(result?.error || result?.message || "Không đọc được dữ liệu điểm danh sau khi ghi.");
        const rows = Array.isArray(result.records) ? result.records : [];
        const found = rows.some(row => String(row.studentId || "").trim() === studentId && String(row.date || "").trim() === date && String(row.status || "").trim() === String(record.status || "").trim());
        if (!found) throw new Error("Google Sheets chưa xuất hiện bản ghi điểm danh vừa ghi.");
        return { ok: true, verified: true, studentId, date };
    });
}

function syncAttendanceRecords(records) {
    const valid = records.filter(record => record && record.studentId && record.date);
    if (!valid.length) return Promise.reject(new Error("Không có bản ghi điểm danh hợp lệ để đồng bộ."));
    return Promise.all(valid.map(record =>
        googleApiPost("saveAttendance", { record })
            .then(() => verifyAttendanceRecord(record))
    )).then(results => ({ ok: true, count: results.length, verified: true, results }));
}

function syncStudentsFromGoogle() {
    return googleApiRequest("getStudents").then(result => {
        if (!result || result.ok !== true) throw new Error(result?.message || result?.error || "API không hợp lệ.");
        const students = Array.isArray(result.students) ? result.students : [];
        if (!students.length) throw new Error("Google Sheets trả về 0 học sinh; giữ dữ liệu hiện tại.");
        if (typeof window.replaceStudents !== "function") throw new Error("Thiếu replaceStudents().");
        const localResult = window.replaceStudents(students, { source: "google-sheets", persist: true, allowEmpty: false });
        if (localResult === false || localResult?.success === false) throw new Error(localResult?.message || "Không cập nhật được Data Engine.");
        window.__GOOGLE_CLASS_SYNC__ = { ok: true, count: students.length, total: Number(result.total) || students.length, syncedAt: new Date().toISOString(), apiVersion: result.version || "2.0.0" };
        return window.__GOOGLE_CLASS_SYNC__;
    });
}

function buildRecord(type, args, localResult) {
    const base = localResult?.record && typeof localResult.record === "object" ? { ...localResult.record } : {};
    if (type === "attendance") return { ...base, studentId: args[0], date: args[1], status: args[2], note: args[3] || "" };
    if (args[0] && typeof args[0] === "object") return { ...base, ...args[0] };
    return base;
}

function installWriteBridge() {
    if (window.__GOOGLE_WRITE_BRIDGE_240__) return;
    const saveMap = [
        ["saveAttendanceRecord", "saveAttendance", "attendance"],
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
            const record = buildRecord(type, args, localResult);
            googleApiPost(apiAction, { record })
                .then(() => {
                    window.__GOOGLE_LAST_WRITE__ = { ok: true, action: apiAction, at: new Date().toISOString() };
                })
                .catch(error => {
                    console.error(`[GOOGLE WRITE] ${apiAction}:`, error);
                    window.__GOOGLE_LAST_WRITE__ = { ok: false, action: apiAction, error: error.message, at: new Date().toISOString() };
                });
            return localResult;
        };
    });
    window.__GOOGLE_WRITE_BRIDGE_240__ = true;
}

function installAttendanceButtonBridge() {
    if (window.__GOOGLE_ATTENDANCE_BUTTON_BRIDGE_240__) return;
    const button = document.getElementById("saveAttendance");
    if (!button) return;
    button.addEventListener("click", () => {
        setTimeout(() => {
            const records = Array.isArray(window.attendanceRecords) ? window.attendanceRecords : [];
            const date = document.getElementById("attendanceDate")?.value || "";
            const selected = records.filter(r => !date || String(r.date || "") === date);
            syncAttendanceRecords(selected)
                .then(result => {
                    window.__GOOGLE_LAST_WRITE__ = { ok: true, action: "saveAttendance", count: result.count, verified: true, at: new Date().toISOString() };
                    if (typeof window.showToast === "function") window.showToast(`Đã ghi và xác minh ${result.count} bản ghi trên Google Sheets.`, "success");
                })
                .catch(error => {
                    console.error("[GOOGLE WRITE] saveAttendance:", error);
                    window.__GOOGLE_LAST_WRITE__ = { ok: false, action: "saveAttendance", error: error.message, verified: false, at: new Date().toISOString() };
                    if (typeof window.showToast === "function") window.showToast("Chưa xác minh được dữ liệu trên Google Sheets.", "warning");
                });
        }, 300);
    }, false);
    window.__GOOGLE_ATTENDANCE_BUTTON_BRIDGE_240__ = true;
}

function refreshAfterGoogleSync() {
    ["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks"].forEach(name => {
        if (typeof window[name] === "function") { try { window[name](); } catch (_) {} }
    });
}

function initializeGoogleApiBridge() {
    const wait = () => {
        if (typeof window.replaceStudents !== "function") return setTimeout(wait, 50);
        syncStudentsFromGoogle().then(result => {
            installWriteBridge();
            installAttendanceButtonBridge();
            refreshAfterGoogleSync();
            if (typeof window.showToast === "function") window.showToast(`Đã đồng bộ ${result.count} học sinh từ Google Sheets.`, "success");
        }).catch(error => {
            console.warn("[GOOGLE API] Sync failed:", error);
            installWriteBridge();
            installAttendanceButtonBridge();
        });
    };
    wait();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeGoogleApiBridge, { once: true });
else initializeGoogleApiBridge();
