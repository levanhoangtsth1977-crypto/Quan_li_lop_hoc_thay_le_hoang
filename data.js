/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   DATA.JS - MASTER DATA ENGINE
   VERSION 3.1.1 - MASTER / IMPORT SAFE / SCRIPT.JS 4.0.0 SYNC
   ------------------------------------------------------------
   Đồng bộ với:
   - script.js VERSION 4.0.0
   - HTML quản lý lớp học hiện tại
   - Excel danh sách học sinh
   - LocalStorage
   - Backup / Restore JSON
   - Điểm danh
   - Vi phạm
   - Khen thưởng
   - Học tập
   - Tiến bộ
   - Nhận xét
   - Hồ sơ học sinh
   - Link cá nhân
   ------------------------------------------------------------
   NGUYÊN TẮC:
   - Không tạo học sinh mẫu.
   - Không mặc định lớp có 50 học sinh.
   - 50 chỉ là giới hạn tối đa.
   - Không tự xóa học sinh hợp lệ.
   - Không loại học sinh chỉ vì trùng tên.
   - Không initialize dữ liệu lần thứ hai.
   - students[] là nguồn dữ liệu chính.
   - Không thay reference của students khi thêm/sửa/xóa.
   - Import phải có kiểm tra và rollback.
   - Không lưu dữ liệu không hợp lệ.
   - Không hard-code secret/API key.
   - Tương thích với script.js 4.0.0.
   ============================================================ */

"use strict";

/* ============================================================
   1. CẤU HÌNH HỆ THỐNG
   ============================================================ */

const CLASS_CONFIG = {
    systemName: "QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG",
    teacherName: "Lê Hoàng",
    schoolYear: "2026–2027",
    className: "5A3",
    grade: "5",
    maxStudents: 50,
    dataVersion: "3.1.1",
    storageKey: "QL_LOP_HOC_LE_HOANG_2026_2027"
};

/* ============================================================
   2. CẤU HÌNH LINK HỌC SINH
   ============================================================ */

const STUDENT_LINK_CONFIG = {
    enabled: true,
    parameterName: "student",
    showLearning: true,
    showAttendance: true,
    showViolations: true,
    showRewards: true,
    showProgress: true,
    showComments: true,
    showPrivateInformation: false
};

/* ============================================================
   3. NGUỒN DỮ LIỆU CHÍNH
   ============================================================ */

let students = [];
let attendanceRecords = [];
let violationRecords = [];
let rewardRecords = [];
let learningRecords = [];
let progressRecords = [];
let commentRecords = [];

/* ============================================================
   4. APP DATA
   ============================================================ */

const APP_DATA = {
    config: CLASS_CONFIG,
    students: students,
    attendance: attendanceRecords,
    violations: violationRecords,
    rewards: rewardRecords,
    learning: learningRecords,
    progress: progressRecords,
    comments: commentRecords
};

/* ============================================================
   5. TIỆN ÍCH CHUẨN HÓA TEXT
   ============================================================ */

function safeString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}

function normalizeText(value) {
    return safeString(value).replace(/\s+/g, " ").trim();
}

function normalizeName(value) {
    return normalizeText(value);
}

function normalizeKey(value) {
    return normalizeText(value).toLocaleLowerCase("vi");
}

function normalizeBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1" || value === 1 || value === "yes" || value === "y") return true;
    if (value === "false" || value === "0" || value === 0 || value === "no" || value === "n") return false;
    return defaultValue;
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

/* ============================================================
   6. TẠO ID
   ============================================================ */

function createId(prefix = "ID") {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return String(prefix) + "_" + time + "_" + random;
}

/* ============================================================
   7. NGÀY
   ============================================================ */

function getTodayISO() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function getNowISO() {
    return new Date().toISOString();
}

/* ============================================================
   8. LOCAL STORAGE
   ============================================================ */

function isLocalStorageAvailable() {
    try {
        const testKey = "__QL_LOP_HOC_TEST__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

/* ============================================================
   9. ĐỒNG BỘ APP_DATA
   ============================================================ */

function syncAppDataReferences() {
    APP_DATA.config = CLASS_CONFIG;
    APP_DATA.students = students;
    APP_DATA.attendance = attendanceRecords;
    APP_DATA.violations = violationRecords;
    APP_DATA.rewards = rewardRecords;
    APP_DATA.learning = learningRecords;
    APP_DATA.progress = progressRecords;
    APP_DATA.comments = commentRecords;
}

/* ============================================================
   10. CHUẨN HÓA HỌC SINH
   ============================================================ */

function normalizeStudent(source, index = 0) {
    const data = source && typeof source === "object" ? source : {};
    const now = getNowISO();
    const id = normalizeText(data.id) || createId("STU");
    const name = normalizeName(data.name);
    const studentCode = normalizeText(data.studentCode) || normalizeText(data.code) || ("HS" + String(index + 1).padStart(2, "0"));
    return {
        id: id,
        name: name,
        gender: normalizeText(data.gender),
        birthDate: normalizeText(data.birthDate),
        status: normalizeText(data.status) || "active",
        parentName: normalizeText(data.parentName),
        phone: normalizeText(data.phone),
        address: normalizeText(data.address),
        note: normalizeText(data.note),
        studentCode: studentCode,
        createdAt: normalizeText(data.createdAt) || now,
        updatedAt: normalizeText(data.updatedAt) || now,
        shareEnabled: normalizeBoolean(data.shareEnabled, true)
    };
}

/* ============================================================
   11. CHUẨN HÓA ĐIỂM DANH
   ============================================================ */

function normalizeAttendanceRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    const validStatuses = ["present", "excused", "absent"];
    const status = validStatuses.includes(data.status) ? data.status : "present";
    return {
        id: normalizeText(data.id) || createId("ATT"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        status: status,
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   12. CHUẨN HÓA VI PHẠM
   ============================================================ */

function normalizeViolationRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    const validLevels = ["light", "attention", "serious"];
    const validStatuses = ["monitoring", "resolved"];
    const level = validLevels.includes(data.level) ? data.level : "light";
    const status = validStatuses.includes(data.status) ? data.status : "monitoring";
    return {
        id: normalizeText(data.id) || createId("VIO"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        type: normalizeText(data.type) || "other",
        level: level,
        status: status,
        action: normalizeText(data.action),
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   13. CHUẨN HÓA KHEN THƯỞNG
   ============================================================ */

function normalizeRewardRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    return {
        id: normalizeText(data.id) || createId("REW"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        type: normalizeText(data.type) || "other",
        formType: normalizeText(data.formType) || "praise",
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   14. CHUẨN HÓA HỌC TẬP
   ============================================================ */

function normalizeLearningRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    return {
        id: normalizeText(data.id) || createId("LRN"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        subject: normalizeText(data.subject),
        result: normalizeText(data.result),
        level: normalizeText(data.level),
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   15. CHUẨN HÓA TIẾN BỘ
   ============================================================

function normalizeProgressRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    return {
        id: normalizeText(data.id) || createId("PRO"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        subject: normalizeText(data.subject),
        result: normalizeText(data.result),
        level: normalizeText(data.level),
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   16. CHUẨN HÓA NHẬN XÉT
   ============================================================ */

function normalizeCommentRecord(source) {
    const data = source && typeof source === "object" ? source : {};
    return {
        id: normalizeText(data.id) || createId("COM"),
        studentId: normalizeText(data.studentId),
        date: normalizeText(data.date) || getTodayISO(),
        subject: normalizeText(data.subject),
        content: normalizeText(data.content),
        note: normalizeText(data.note),
        createdAt: normalizeText(data.createdAt) || getNowISO(),
        updatedAt: normalizeText(data.updatedAt) || getNowISO()
    };
}

/* ============================================================
   17. KHỞI TẠO / API GLOBAL
   ============================================================ */

function initDataEngine() {
    syncAppDataReferences();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDataEngine, { once: true });
} else {
    initDataEngine();
}
