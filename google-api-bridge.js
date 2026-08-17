/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   GOOGLE API BRIDGE 2.1.0
   ------------------------------------------------------------
   - Kết nối Website với Google Apps Script API 2.0.0.
   - Đọc toàn bộ HOC_SINH từ Google Sheets.
   - Đồng bộ ghi dữ liệu từ các handler hiện có.
   - Có fallback trực tiếp cho nút Lưu điểm danh.
   - Không giới hạn 15/16 học sinh.
   - Không xóa dữ liệu cục bộ khi API lỗi.
   - POST dùng text/plain để tránh preflight CORS không cần thiết.
   ============================================================ */

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
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" }
    })
        .then(response => {
            if (!response.ok) throw new Error(`API HTTP ${response.status}`);
            return response.json();
        })
        .finally(() => clearTimeout(timer));
}

function googleApiPost(action, payload = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GOOGLE_API_CONFIG.timeout);

    return fetch(GOOGLE_API_CONFIG.url, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            Accept: "application/json"
        },
        body: JSON.stringify({ action, ...payload })
    })
        .then(response => {
            if (!response.ok) throw new Error(`API HTTP ${response.status}`);
            return response.json();
        })
        .finally(() => clearTimeout(timer));
}

function syncStudentsFromGoogle() {
    return googleApiRequest("getStudents")
        .then(result => {
            if (!result || result.ok !== true) {
                throw new Error(result?.message || result?.error || "API không trả về dữ liệu hợp lệ.");
            }

            const remoteStudents = Array.isArray(result.students) ? result.students : [];
            if (!remoteStudents.length) {
                throw new Error("Google Sheets trả về 0 học sinh; không ghi đè dữ liệu cục bộ.");
            }

            if (typeof window.replaceStudents !== "function") {
                throw new Error("Data Engine chưa sẵn sàng: thiếu replaceStudents().");
            }

            const localResult = window.replaceStudents(remoteStudents, {
                source: "google-sheets",
                persist: true,
                allowEmpty: false
            });

            if (localResult === false || (localResult && localResult.success === false)) {
                throw new Error(localResult?.message || "Không thể cập nhật Data Engine.");
            }

            const count = remoteStudents.length;
            window.__GOOGLE_CLASS_SYNC__ = {
                ok: true,
                count,
                total: Number(result.total) || count,
                syncedAt: new Date().toISOString(),
                apiVersion: result.version || "2.0.0"
            };

            console.info("[GOOGLE API] Đã đồng bộ học sinh:", count);
            return window.__GOOGLE_CLASS_SYNC__;
        });
}

function buildRecord(type, args, localResult) {
    const resultRecord = localResult?.record && typeof localResult.record === "object"
        ? { ...localResult.record }
        : {};

    if (type === "attendance") {
        return {
            ...resultRecord,
            studentId: args[0],
            date: args[1],
            status: args[2],
            note: args[3] || ""
        };
    }

    if (args[0] && typeof args[0] === "object") {
        return { ...resultRecord, ...args[0] };
    }

    return resultRecord;
}

function installWriteBridge() {
    if (window.__GOOGLE_WRITE_BRIDGE_210__) return;

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
            let localResult;

            try {
                localResult = original.apply(this, args);
            } catch (error) {
                console.error(`[GOOGLE WRITE] ${functionName} local`, error);
                throw error;
            }

            const record = buildRecord(type, args, localResult);

            googleApiPost(apiAction, { record })
                .then(result => {
                    if (!result || result.ok !== true) {
                        throw new Error(result?.error || "API không xác nhận ghi dữ liệu.");
                    }
                    console.info(`[GOOGLE WRITE] ${apiAction}: OK`, result.record || result);
                    window.__GOOGLE_LAST_WRITE__ = {
                        ok: true,
                        action: apiAction,
                        at: new Date().toISOString()
                    };
                })
                .catch(error => {
                    console.error(`[GOOGLE WRITE] ${apiAction}: FAILED`, error);
                    window.__GOOGLE_LAST_WRITE__ = {
                        ok: false,
                        action: apiAction,
                        error: error.message,
                        at: new Date().toISOString()
                    };
                    if (typeof window.showToast === "function") {
                        window.showToast(`Đã lưu cục bộ nhưng chưa đồng bộ Google: ${type}.`, "warning");
                    }
                });

            return localResult;
        };
    });

    window.__GOOGLE_WRITE_BRIDGE_210__ = true;
    console.info("[GOOGLE API] Write Bridge 2.1.0: READY");
}

/* ============================================================
   FALLBACK ĐIỂM DANH
   ------------------------------------------------------------
   Bridge cũ chỉ bọc được handler nếu handler có đúng tên.
   Giao diện hiện tại có nút #saveAttendance, vì vậy ta bắt
   chính thao tác nút sau khi handler giao diện đã chạy.
   Chỉ gửi các bản ghi mới/thay đổi trong ngày được chọn.
   ============================================================ */
function installAttendanceButtonBridge() {
    if (window.__GOOGLE_ATTENDANCE_BUTTON_BRIDGE_210__) return;

    const button = document.getElementById("saveAttendance");
    if (!button) {
        console.warn("[GOOGLE API] Không tìm thấy #saveAttendance.");
        return;
    }

    button.addEventListener("click", () => {
        const records = Array.isArray(window.attendanceRecords)
            ? window.attendanceRecords
            : [];

        const dateElement = document.getElementById("attendanceDate");
        const selectedDate = dateElement?.value || "";
        const before = new Map(
            records.map(record => [
                String(record.id || `${record.studentId}|${record.date}`),
                JSON.stringify(record)
            ])
        );

        setTimeout(() => {
            const current = Array.isArray(window.attendanceRecords)
                ? window.attendanceRecords
                : [];

            const changed = current.filter(record => {
                if (selectedDate && String(record.date || "") !== selectedDate) return false;
                const key = String(record.id || `${record.studentId}|${record.date}`);
                return before.get(key) !== JSON.stringify(record);
            });

            const fallbackRecords = changed.length
                ? changed
                : current.filter(record => !selectedDate || String(record.date || "") === selectedDate);

            if (!fallbackRecords.length) {
                window.__GOOGLE_LAST_WRITE__ = {
                    ok: false,
                    action: "saveAttendance",
                    error: "Không tìm thấy bản ghi điểm danh sau khi bấm Lưu.",
                    at: new Date().toISOString()
                };
                return;
            }

            Promise.all(
                fallbackRecords.map(record =>
                    googleApiPost("saveAttendance", { record })
                )
            )
                .then(results => {
                    const failed = results.find(result => !result || result.ok !== true);
                    if (failed) throw new Error(failed.error || "API không xác nhận điểm danh.");

                    window.__GOOGLE_LAST_WRITE__ = {
                        ok: true,
                        action: "saveAttendance",
                        count: fallbackRecords.length,
                        at: new Date().toISOString()
                    };

                    console.info("[GOOGLE WRITE] saveAttendance fallback: OK", fallbackRecords.length);
                    if (typeof window.showToast === "function") {
                        window.showToast(`Đã đồng bộ ${fallbackRecords.length} bản ghi điểm danh lên Google Sheets.`, "success");
                    }
                })
                .catch(error => {
                    console.error("[GOOGLE WRITE] saveAttendance fallback: FAILED", error);
                    window.__GOOGLE_LAST_WRITE__ = {
                        ok: false,
                        action: "saveAttendance",
                        error: error.message,
                        at: new Date().toISOString()
                    };
                    if (typeof window.showToast === "function") {
                        window.showToast("Điểm danh đã lưu cục bộ nhưng chưa đồng bộ Google Sheets.", "warning");
                    }
                });
        }, 100);
    }, false);

    window.__GOOGLE_ATTENDANCE_BUTTON_BRIDGE_210__ = true;
    console.info("[GOOGLE API] Attendance Button Bridge 2.1.0: READY");
}

function refreshAfterGoogleSync() {
    const functions = [
        "renderDashboard",
        "renderStudents",
        "renderAttendance",
        "renderViolations",
        "renderRewards",
        "renderLearningSafe",
        "renderCommentsSafe",
        "renderStatistics",
        "renderStudentLinks"
    ];

    functions.forEach(name => {
        if (typeof window[name] === "function") {
            try { window[name](); }
            catch (error) { console.warn(`[GOOGLE API] Không thể refresh ${name}:`, error); }
        }
    });
}

function initializeGoogleApiBridge() {
    const waitForDataEngine = () => {
        if (typeof window.replaceStudents === "function") {
            syncStudentsFromGoogle()
                .then(result => {
                    installWriteBridge();
                    installAttendanceButtonBridge();
                    refreshAfterGoogleSync();

                    if (typeof window.showToast === "function") {
                        window.showToast(`Đã đồng bộ ${result.count} học sinh từ Google Sheets.`, "success");
                    }
                })
                .catch(error => {
                    console.warn("[GOOGLE API] Đồng bộ thất bại; giữ dữ liệu cục bộ:", error);
                    installWriteBridge();
                    installAttendanceButtonBridge();
                });
            return;
        }

        setTimeout(waitForDataEngine, 50);
    };

    waitForDataEngine();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeGoogleApiBridge, { once: true });
} else {
    initializeGoogleApiBridge();
}
