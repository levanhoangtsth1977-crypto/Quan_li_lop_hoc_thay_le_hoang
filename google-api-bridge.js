/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 3.0.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
    url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
    timeout: 15000,
    verifyRetries: 8,
    verifyDelay: 1000,
    version: "3.0.0",
    masterRosterUrl: "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-2",
    masterRosterCount: 42
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

function normalizeStudentForBridge(student, index) {
    const source = student && typeof student === "object" ? student : {};
    const fallbackId = `HS${String(index + 1).padStart(2, "0")}`;
    return {
        id: String(source.id || source.studentId || fallbackId).trim(),
        studentCode: String(source.studentCode || source.code || fallbackId).trim(),
        name: String(source.name || source.studentName || "").trim(),
        gender: String(source.gender || "").trim(),
        birthDate: String(source.birthDate || source.dateOfBirth || "").trim(),
        status: String(source.status || "active").trim(),
        parentName: String(source.parentName || "").trim(),
        phone: String(source.phone || "").trim(),
        address: String(source.address || "").trim(),
        note: String(source.note || "").trim(),
        shareEnabled: source.shareEnabled !== false,
        createdAt: String(source.createdAt || "").trim(),
        updatedAt: String(source.updatedAt || "").trim()
    };
}

function installReplaceStudentsBridge() {
    if (typeof window.replaceStudents === "function") return true;
    try {
        if (typeof students === "undefined" || !Array.isArray(students)) return false;
        window.replaceStudents = function (incoming, options = {}) {
            if (!Array.isArray(incoming)) throw new Error("Danh sách học sinh không hợp lệ.");
            if (!incoming.length && options.allowEmpty !== true) throw new Error("Từ chối thay danh sách bằng 0 học sinh.");
            if (incoming.length > 50) throw new Error("Danh sách vượt giới hạn 50 học sinh.");
            const normalized = incoming.map(normalizeStudentForBridge).filter(student => student.name);
            if (!normalized.length && options.allowEmpty !== true) throw new Error("Không có học sinh hợp lệ để cập nhật Data Engine.");
            students.splice(0, students.length, ...normalized);
            try { if (typeof saveClassData === "function" && options.persist !== false) saveClassData(); }
            catch (error) { console.warn("[DATA ENGINE] LocalStorage:", error); }
            try { if (typeof refreshAll === "function") refreshAll(); } catch (_) {}
            return { success: true, ok: true, count: normalized.length, source: options.source || "google" };
        };
        return true;
    } catch (error) {
        console.error("[DATA ENGINE] replaceStudents:", error);
        return false;
    }
}

function waitForDataEngine(attempt = 0) {
    if (installReplaceStudentsBridge()) return Promise.resolve(true);
    if (attempt >= 100) return Promise.resolve(false);
    return new Promise(resolve => setTimeout(() => resolve(waitForDataEngine(attempt + 1)), 100));
}

async function loadMasterRoster() {
    const response = await fetch(GOOGLE_API_CONFIG.masterRosterUrl, {
        method: "GET", cache: "no-store", credentials: "same-origin",
        headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Master Roster HTTP ${response.status}`);
    const payload = await response.json();
    const source = Array.isArray(payload?.students) ? payload.students : [];
    if (source.length !== GOOGLE_API_CONFIG.masterRosterCount) {
        throw new Error(`Master Roster không hợp lệ: ${source.length}/${GOOGLE_API_CONFIG.masterRosterCount}.`);
    }
    return source.map(normalizeStudentForBridge);
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
        if (typeof window.APP_DATA !== "undefined" && Array.isArray(window.APP_DATA.students)) return window.APP_DATA.students;
    } catch (error) { console.warn("[GOOGLE RECOVERY] local:", error); }
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
    if (!Array.isArray(localStudents) || !localStudents.length) throw new Error("Không có danh sách học sinh để khôi phục.");
    if (localStudents.length > 50) throw new Error("Danh sách vượt giới hạn 50 học sinh.");
    const normalized = localStudents.map(normalizeStudentForBridge);
    if (normalized.some(student => !student.name)) throw new Error("Danh sách có học sinh thiếu họ tên; không ghi Google Sheets.");
    await googleApiPost("importStudents", { students: normalized });
    return verifyStudentImport(normalized.length);
}

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
        if (attempt < GOOGLE_API_CONFIG.verifyRetries) { await sleep(GOOGLE_API_CONFIG.verifyDelay); return verifyAttendanceRecord(record, attempt + 1); }
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
    if (window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_300__) return true;
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
    window.__GOOGLE_ATTENDANCE_WRITE_BRIDGE_300__ = true;
    return true;
}

function waitAndInstallAttendanceBridge(attempt = 0) {
    if (installAttendanceWriteBridge()) return;
    if (attempt >= 200) { console.error("[GOOGLE WRITE] Không tìm thấy saveAttendanceRecord() sau 20 giây."); return; }
    setTimeout(() => waitAndInstallAttendanceBridge(attempt + 1), 100);
}

function installWriteBridge() {
    if (window.__GOOGLE_WRITE_BRIDGE_300__) return;
    const saveMap = [["addViolation", "saveViolation"], ["addReward", "saveReward"], ["addLearningRecord", "saveLearning"], ["addProgressRecord", "saveProgress"], ["addComment", "saveComment"]];
    saveMap.forEach(([functionName, apiAction]) => {
        const original = window[functionName];
        if (typeof original !== "function") return;
        window[functionName] = function (...args) {
            const localResult = original.apply(this, args);
            const base = localResult?.record && typeof localResult.record === "object" ? { ...localResult.record } : {};
            const record = args[0] && typeof args[0] === "object" ? { ...base, ...args[0] } : base;
            googleApiPost(apiAction, { record }).then(() => { window.__GOOGLE_LAST_WRITE__ = { ok: true, action: apiAction, at: new Date().toISOString() }; }).catch(error => { console.error(`[GOOGLE WRITE] ${apiAction}:`, error); window.__GOOGLE_LAST_WRITE__ = { ok: false, action: apiAction, error: error.message, at: new Date().toISOString() }; });
            return localResult;
        };
    });
    window.__GOOGLE_WRITE_BRIDGE_300__ = true;
}

async function getStudentsFromGoogle() {
    try { return await googleApiRequest("getStudents"); }
    catch (fetchError) { console.warn("[GOOGLE READ] fetch getStudents thất bại, chuyển JSONP:", fetchError); return googleApiJsonp("getStudents"); }
}

async function syncStudentsFromGoogle() {
    const dataReady = await waitForDataEngine();
    if (!dataReady) throw new Error("Data Engine chưa sẵn sàng sau 10 giây.");

    const result = await getStudentsFromGoogle();
    if (!result || result.ok !== true) throw new Error(result?.message || result?.error || "API không hợp lệ.");

    const remoteStudents = Array.isArray(result.students) ? result.students : [];
    const remoteCount = remoteStudents.length;

    /*
     * QUY TẮC BẢO VỆ MASTER ROSTER:
     * Google trả thiếu (<42) KHÔNG BAO GIỜ được phép ghi đè LocalStorage.
     * Thay vào đó lấy Master Roster 42 HS, khôi phục Google Sheets,
     * xác minh lại rồi mới dùng dữ liệu Google làm nguồn đồng bộ.
     */
    if (remoteCount < GOOGLE_API_CONFIG.masterRosterCount) {
        console.warn(`[GOOGLE SYNC] Remote chỉ có ${remoteCount}/42. Kích hoạt recovery.`);

        const masterStudents = await loadMasterRoster();

        /* Khôi phục ngay trên thiết bị hiện tại trước khi gọi Google. */
        const localMasterResult = window.replaceStudents(masterStudents, {
            source: "master-roster-recovery",
            persist: true,
            allowEmpty: false,
            expectedCount: GOOGLE_API_CONFIG.masterRosterCount,
            preserveRelatedRecords: true
        });
        if (!localMasterResult || localMasterResult.success !== true || localMasterResult.count !== 42) {
            throw new Error("Không thể khôi phục 42 học sinh vào LocalStorage.");
        }

        /* Đồng bộ ngược Master Roster lên Google Sheets. */
        await recoverStudentsToGoogle(masterStudents);
        const verifiedStudents = await getStudentsFromGoogle();
        const finalStudents = Array.isArray(verifiedStudents.students) ? verifiedStudents.students : [];

        if (finalStudents.length < GOOGLE_API_CONFIG.masterRosterCount) {
            throw new Error(`Google Sheets vẫn chỉ có ${finalStudents.length}/42 sau recovery.`);
        }

        const finalResult = window.replaceStudents(finalStudents, {
            source: "google-sheets-recovered",
            persist: true,
            allowEmpty: false,
            expectedCount: GOOGLE_API_CONFIG.masterRosterCount,
            preserveRelatedRecords: true
        });
        if (!finalResult || finalResult.success !== true) throw new Error("Không cập nhật được dữ liệu sau recovery.");

        window.__GOOGLE_CLASS_SYNC__ = {
            ok: true,
            recovered: true,
            previousRemoteCount: remoteCount,
            count: finalStudents.length,
            total: Number(verifiedStudents.total) || finalStudents.length,
            syncedAt: new Date().toISOString(),
            apiVersion: verifiedStudents.version || GOOGLE_API_CONFIG.version,
            source: "master-roster-recovery"
        };
        return window.__GOOGLE_CLASS_SYNC__;
    }

    const localResult = window.replaceStudents(remoteStudents, {
        source: "google-sheets",
        persist: true,
        allowEmpty: false,
        preserveRelatedRecords: true
    });
    if (!localResult || localResult.success !== true) throw new Error("Không cập nhật được Data Engine.");

    window.__GOOGLE_CLASS_SYNC__ = {
        ok: true,
        recovered: false,
        count: remoteCount,
        total: Number(result.total) || remoteCount,
        syncedAt: new Date().toISOString(),
        apiVersion: result.version || GOOGLE_API_CONFIG.version,
        source: "google-sheets"
    };
    return window.__GOOGLE_CLASS_SYNC__;
}

function refreshAfterGoogleSync() {
    ["renderDashboard", "renderStudents", "renderAttendance", "renderViolations", "renderRewards", "renderLearningSafe", "renderCommentsSafe", "renderStatistics", "renderStudentLinks"].forEach(name => {
        if (typeof window[name] === "function") { try { window[name](); } catch (_) {} }
    });
    if (typeof window.updateStudentSelects === "function") { try { window.updateStudentSelects(); } catch (_) {} }
}

function initializeGoogleApiBridge() {
    if (window.__GOOGLE_CLASS_BRIDGE_300__) return;
    window.__GOOGLE_CLASS_BRIDGE_300__ = true;
    waitAndInstallAttendanceBridge();
    installWriteBridge();
    syncStudentsFromGoogle().then(result => {
        refreshAfterGoogleSync();
        if (typeof window.showToast === "function") {
            const message = result.recovered
                ? `Đã khôi phục và đồng bộ ${result.count} học sinh.`
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
