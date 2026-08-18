/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 2.8.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
    url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
    timeout: 15000,
    verifyRetries: 8,
    verifyDelay: 1000,
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

function googleApiJsonp(action, params = {}) {
    return new Promise((resolve, reject) => {
        const callback = `__googleApi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const script = document.createElement("script");
        const query = new URLSearchParams({ action, callback, ...params });
        let finished = false;
        let timer;
        const cleanup = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            delete window[callback];
            script.remove();
        };
        timer = setTimeout(() => { cleanup(); reject(new Error("API JSONP timeout.")); }, GOOGLE_API_CONFIG.timeout);
        window[callback] = result => {
            cleanup();
            if (result && result.ok === true) resolve(result);
            else reject(new Error(result?.error || result?.message || "API không trả dữ liệu hợp lệ."));
        };
        script.onerror = () => { cleanup(); reject(new Error("Không tải được phản hồi JSONP từ Apps Script.")); };
        script.async = true;
        script.src = `${GOOGLE_API_CONFIG.url}?${query.toString()}`;
        document.head.appendChild(script);
    });
}

function googleApiPost(action, payload = {}) {
    return fetch(GOOGLE_API_CONFIG.url, {
        method: "POST", mode: "no-cors", cache: "no-store", redirect: "follow", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action, ...payload })
    }).then(() => ({ ok: true, action, dispatched: true }));
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function verifyAttendanceRecord(record, attempt = 0) {
    const studentId = String(record?.studentId || "").trim();
    const date = String(record?.date || "").trim();
    const status = String(record?.status || "").trim();
    if (!studentId || !date || !status) throw new Error("Thiếu studentId, date hoặc status để xác minh.");
    try {
        const result = await googleApiJsonp("getAttendance", { studentId });
        const rows = Array.isArray(result.records) ? result.records : [];
        const found = rows.some(row => String(row.studentId || "").trim() === studentId && String(row.date || "").trim() === date && String(row.status || "").trim() === status);
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
    return { studentId: String(studentId || "").trim(), date: String(date || "").trim(), status: String(status || "").trim(), note: String(note || "") };
}

async function syncOneAttendance(record) {
    if (!record.studentId || !record.date || !record.status) throw new Error("Bản ghi điểm danh thiếu studentId, date hoặc status.");
    await googleApiPost("saveAttendance", { record });
    return verifyAttendanceRecord(record);
}

function installAttendanceWriteBridge() {
    if (window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_271__) return true;
    const original = window.saveAttendanceRecord;
    if (typeof original !== "function") return false;
    window.saveAttendanceRecord = function (studentId, date, status, note) {
        const record = normalizeAttendanceRecord(studentId, date, status, note);
        const localResult = original.apply(this, arguments);
        if (!record.studentId || !record.date || !record.status) return localResult;
        syncOneAttendance(record).then(result => {
            window.__GOOGLE_LAST_WRITE__ = { ok: true, action: "saveAttendance", verified: true, count: 1, record: result, at: new Date().toISOString() };
            if (typeof window.showToast === "function") window.showToast("Đã đồng bộ điểm danh lên Google Sheets.", "success");
        }).catch(error => {
            console.error("[GOOGLE WRITE] saveAttendance:", error);
            window.__GOOGLE_LAST_WRITE__ = { ok: false, action: "saveAttendance", verified: false, error: error.message, at: new Date().toISOString() };
            if (typeof window.showToast === "function") window.showToast("Đã lưu cục bộ nhưng chưa đồng bộ Google Sheets.", "warning");
        });
        return localResult;
    };
    window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_271__ = true;
    return true;
}

function waitAndInstallAttendanceBridge(attempt = 0) {
    if (installAttendanceWriteBridge()) return;
    if (attempt >= 200) {
        console.error("[GOOGLE WRITE] Không tìm thấy saveAttendanceRecord() sau 20 giây.");
        return;
    }
    setTimeout(() => waitAndInstallAttendanceBridge(attempt + 1), 100);
}

function installWriteBridge() {
    if (window.__GOOGLE_WRITE_BRIDGE_271__) return;
    const saveMap = [
        ["addViolation", "saveViolation"], ["addReward", "saveReward"], ["addLearningRecord", "saveLearning"],
        ["addProgressRecord", "saveProgress"], ["addComment", "saveComment"]
    ];
    saveMap.forEach(([functionName, apiAction]) => {
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
    window.__GOOGLE_WRITE_BRIDGE_271__ = true;
}

async function getStudentsFromGoogle() {
    try {
        return await googleApiRequest("getStudents");
    } catch (fetchError) {
        console.warn("[GOOGLE READ] fetch getStudents thất bại, chuyển sang JSONP:", fetchError);
        return googleApiJsonp("getStudents");
    }
}

function getLocalStudentsForRecovery() {
    try {
        if (typeof window.getStudentsSafe === "function") {
            const list = window.getStudentsSafe();
            if (Array.isArray(list)) return list;
        }
        if (typeof window.getStudents === "function") {
            const list = window.getStudents();
            if (Array.isArray(list)) return list;
        }
        if (typeof window.APP_DATA !== "undefined" && Array.isArray(window.APP_DATA.students)) {
            return window.APP_DATA.students;
        }
    } catch (error) {
        console.warn("[GOOGLE RECOVERY] Không đọc được dữ liệu local:", error);
    }
    return [];
}

async function verifyStudentImport(expectedCount, attempt = 0) {
    try {
        const result = await googleApiJsonp("getStudents");
        const actual = Array.isArray(result.students) ? result.students.length : 0;
        if (actual >= expectedCount) return { ok: true, verified: true, count: actual, total: Number(result.total) || actual };
        throw new Error(`Google Sheets mới có ${actual}/${expectedCount} học sinh.`);
    } catch (error) {
        if (attempt < GOOGLE_API_CONFIG.verifyRetries) {
            await sleep(GOOGLE_API_CONFIG.verifyDelay);
            return verifyStudentImport(expectedCount, attempt + 1);
        }
        throw error;
    }
}

async function recoverStudentsToGoogle(localStudents) {
    if (!Array.isArray(localStudents) || !localStudents.length) {
        throw new Error("Không có danh sách học sinh local để khôi phục.");
    }
    if (localStudents.length > 50) {
        throw new Error("Danh sách local vượt giới hạn 50 học sinh.");
    }
    const normalized = localStudents.map((student, index) => ({
        id: String(student?.id || "").trim(),
        studentCode: String(student?.studentCode || student?.code || `HS${String(index + 1).padStart(2, "0")}`).trim(),
        name: String(student?.name || "").trim(),
        gender: String(student?.gender || "").trim(),
        birthDate: String(student?.birthDate || "").trim(),
        status: String(student?.status || "active").trim(),
        parentName: String(student?.parentName || "").trim(),
        phone: String(student?.phone || "").trim(),
        address: String(student?.address || "").trim(),
        note: String(student?.note || "").trim(),
        shareEnabled: student?.shareEnabled !== false,
        createdAt: String(student?.createdAt || "").trim(),
        updatedAt: String(student?.updatedAt || "").trim()
    }));
    if (normalized.some(student => !student.name)) throw new Error("Danh sách local có học sinh thiếu họ tên; không ghi Google Sheets.");
    await googleApiPost("importStudents", { students: normalized });
    const verified = await verifyStudentImport(normalized.length);
    return { ok: true, recovered: true, count: verified.count, total: verified.total, source: "local-to-google" };
}

async function syncStudentsFromGoogle() {
    const result = await getStudentsFromGoogle();
    if (!result || result.ok !== true) throw new Error(result?.message || result?.error || "API không hợp lệ.");
    const students = Array.isArray(result.students) ? result.students : [];

    if (!students.length) {
        const localStudents = getLocalStudentsForRecovery();
        if (!localStudents.length) throw new Error("Google Sheets và dữ liệu local đều không có học sinh.");
        const recovered = await recoverStudentsToGoogle(localStudents);
        const verifiedStudents = await getStudentsFromGoogle();
        const finalStudents = Array.isArray(verifiedStudents.students) ? verifiedStudents.students : [];
        if (!finalStudents.length) throw new Error("Đã gửi dữ liệu nhưng chưa đọc lại được danh sách Google Sheets.");
        if (typeof window.replaceStudents !== "function") throw new Error("Thiếu replaceStudents().");
        window.replaceStudents(finalStudents, { source: "google-sheets-recovered", persist: true, allowEmpty: false });
        window.__GOOGLE_CLASS_SYNC__ = { ok: true, count: finalStudents.length, total: Number(verifiedStudents.total) || finalStudents.length, syncedAt: new Date().toISOString(), apiVersion: verifiedStudents.version || "2.0.0", source: "local-to-google-recovery", recovered: recovered.count };
        return window.__GOOGLE_CLASS_SYNC__;
    }

    if (typeof window.replaceStudents !== "function") throw new Error("Thiếu replaceStudents().");
    const localResult = window.replaceStudents(students, { source: "google-sheets", persist: true, allowEmpty: false });
    if (localResult === false || localResult?.success === false) throw new Error(localResult?.message || "Không cập nhật được Data Engine.");
    window.__GOOGLE_CLASS_SYNC__ = { ok: true, count: students.length, total: Number(result.total) || students.length, syncedAt: new Date().toISOString(), apiVersion: result.version || "2.0.0", source: "google-sheets" };
    return window.__GOOGLE_CLASS_SYNC__;
}

function refreshAfterGoogleSync() {
    ["renderDashboard", "renderStudents", "renderAttendance", "renderViolations", "renderRewards", "renderLearningSafe", "renderCommentsSafe", "renderStatistics", "renderStudentLinks"].forEach(name => {
        if (typeof window[name] === "function") { try { window[name](); } catch (_) {} }
    });
    if (typeof window.updateStudentSelects === "function") {
        try { window.updateStudentSelects(); } catch (_) {}
    }
}

function initializeGoogleApiBridge() {
    if (window.__GOOGLE_CLASS_BRIDGE_271__) return;
    window.__GOOGLE_CLASS_BRIDGE_271__ = true;
    waitAndInstallAttendanceBridge();
    installWriteBridge();
    syncStudentsFromGoogle().then(result => {
        refreshAfterGoogleSync();
        if (typeof window.showToast === "function") {
            const message = result.recovered
                ? `Đã khôi phục ${result.count} học sinh từ laptop lên Google Sheets và đồng bộ toàn hệ thống.`
                : `Đã đồng bộ ${result.count} học sinh từ Google Sheets.`;
            window.showToast(message, "success");
        }
    }).catch(error => {
        window.__GOOGLE_CLASS_SYNC__ = { ok: false, error: error.message, at: new Date().toISOString() };
        console.warn("[GOOGLE API] Sync failed:", error);
    });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeGoogleApiBridge, { once: true });
else initializeGoogleApiBridge();