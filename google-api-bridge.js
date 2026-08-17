/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   GOOGLE API BRIDGE 1.0.0
   ------------------------------------------------------------
   Mục tiêu:
   - Kết nối Website với Google Apps Script API 2.0.0.
   - Đọc toàn bộ HOC_SINH từ Google Sheets.
   - Không tạo học sinh mẫu.
   - Không giới hạn 15/16 học sinh.
   - Nếu API lỗi: giữ nguyên dữ liệu cục bộ, không phá giao diện.
   ============================================================ */

"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
    url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
    timeout: 15000,
    version: "1.0.0"
});

function googleApiRequest(action, params = {}) {
    const controller = new AbortController();
    const timer = setTimeout(
        () => controller.abort(),
        GOOGLE_API_CONFIG.timeout
    );

    const query = new URLSearchParams({
        action,
        ...params
    });

    return fetch(
        `${GOOGLE_API_CONFIG.url}?${query.toString()}`,
        {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
            headers: {
                Accept: "application/json"
            }
        }
    )
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    `API HTTP ${response.status}`
                );
            }
            return response.json();
        })
        .finally(() => clearTimeout(timer));
}

function syncStudentsFromGoogle() {
    return googleApiRequest("getStudents")
        .then(result => {
            if (!result || result.ok !== true) {
                throw new Error(
                    result?.message ||
                    "API không trả về dữ liệu hợp lệ."
                );
            }

            const remoteStudents =
                Array.isArray(result.students)
                    ? result.students
                    : [];

            if (!remoteStudents.length) {
                throw new Error(
                    "Google Sheets trả về 0 học sinh; không ghi đè dữ liệu cục bộ."
                );
            }

            if (typeof window.replaceStudents !== "function") {
                throw new Error(
                    "Data Engine chưa sẵn sàng: thiếu replaceStudents()."
                );
            }

            window.replaceStudents(
                remoteStudents,
                {
                    source: "google-sheets",
                    persist: true,
                    allowEmpty: false
                }
            );

            const count = remoteStudents.length;

            window.__GOOGLE_CLASS_SYNC__ = {
                ok: true,
                count,
                total: Number(result.total) || count,
                syncedAt: new Date().toISOString(),
                apiVersion: result.version || "2.0.0"
            };

            console.info(
                "[GOOGLE API] Đã đồng bộ học sinh:",
                count
            );

            return window.__GOOGLE_CLASS_SYNC__;
        });
}

function refreshAfterGoogleSync() {
    const functions = [
        "renderDashboard",
        "renderStudents",
        "renderAttendance",
        "renderViolations",
        "renderRewards",
        "renderStatistics",
        "renderStudentLinks"
    ];

    functions.forEach(name => {
        if (typeof window[name] === "function") {
            try {
                window[name]();
            } catch (error) {
                console.warn(
                    `[GOOGLE API] Không thể refresh ${name}:`,
                    error
                );
            }
        }
    });
}

function initializeGoogleApiBridge() {
    syncStudentsFromGoogle()
        .then(result => {
            refreshAfterGoogleSync();

            if (typeof window.showToast === "function") {
                window.showToast(
                    `Đã đồng bộ ${result.count} học sinh từ Google Sheets.`,
                    "success"
                );
            }
        })
        .catch(error => {
            console.warn(
                "[GOOGLE API] Đồng bộ thất bại; giữ dữ liệu cục bộ:",
                error
            );
        });
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeGoogleApiBridge,
        { once: true }
    );
} else {
    initializeGoogleApiBridge();
}
