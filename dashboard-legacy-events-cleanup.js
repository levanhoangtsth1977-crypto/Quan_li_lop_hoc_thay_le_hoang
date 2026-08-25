/* ============================================================
   TRANG CHỦ — DỌN DỮ LIỆU VI PHẠM / KHEN THƯỞNG CŨ
   Chạy đúng 1 lần trên mỗi trình duyệt.
   Không xóa học sinh, điểm danh, học tập, nhận xét...
   ============================================================ */
(function () {
    "use strict";

    const FLAG = "QL_LOP_HOC_LE_HOANG_LEGACY_EVENTS_CLEANED_V1";
    if (localStorage.getItem(FLAG) === "1") return;

    try {
        const KEY = "QL_LOP_HOC_LE_HOANG_2026_2027";
        const raw = localStorage.getItem(KEY);

        if (raw) {
            const data = JSON.parse(raw);
            if (data && typeof data === "object") {
                data.violations = [];
                data.rewards = [];
                data.savedAt = new Date().toISOString();
                localStorage.setItem(KEY, JSON.stringify(data));
            }
        }

        /* Đồng bộ ngay nếu Data Engine đã tồn tại. */
        if (Array.isArray(window.violationRecords)) {
            window.violationRecords.splice(0, window.violationRecords.length);
        }
        if (Array.isArray(window.rewardRecords)) {
            window.rewardRecords.splice(0, window.rewardRecords.length);
        }

        if (typeof window.syncAppDataReferences === "function") {
            window.syncAppDataReferences();
        }

        if (typeof window.saveClassData === "function") {
            window.saveClassData();
        }

        localStorage.setItem(FLAG, "1");

        /* Cập nhật các chỉ số Trang chủ ngay lập tức. */
        ["statViolations", "statRewards", "violationBadge", "rewardBadge"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.textContent = "0";
        });

        const activity = document.getElementById("recentActivityList");
        if (activity) {
            activity.innerHTML = '<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></span><strong>Chưa có hoạt động</strong><p>Các hoạt động mới sẽ xuất hiện tại đây.</p></div>';
        }

        const attention = document.getElementById("attentionStudentList");
        if (attention) {
            attention.innerHTML = '<div class="empty-state"><span class="empty-icon"><i class="fa-solid fa-heart"></i></span><strong>Chưa có dữ liệu</strong><p>Hệ thống sẽ tổng hợp khi có dữ liệu.</p></div>';
        }

        console.info("Legacy violation/reward data cleaned once.");
    } catch (error) {
        console.error("Legacy event cleanup failed:", error);
    }
})();
