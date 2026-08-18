/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   STUDENT SYNC DEDUPE PATCH 1.0.1
   ------------------------------------------------------------
   MỤC ĐÍCH:
   - Chặn học sinh bị nhân bản khi Google Sheets trả về record trùng.
   - Khóa định danh ưu tiên: studentCode -> id.
   - KHÔNG dedupe theo tên.
   - Giữ bản ghi có updatedAt mới nhất khi cùng khóa.
   - Không xóa dữ liệu LocalStorage.
   - Không tự tạo học sinh mới.
   - Không ghi ngược Google Sheets.
   ============================================================ */

(function installStudentSyncDedupe() {
    "use strict";

    if (window.__STUDENT_SYNC_DEDUPE_INSTALLED_101__) return;

    function text(value) {
        return String(value ?? "").trim();
    }

    function timeOf(student) {
        const value = text(student?.updatedAt || student?.createdAt);
        const time = Date.parse(value);
        return Number.isFinite(time) ? time : 0;
    }

    function identityOf(student) {
        const code = text(student?.studentCode || student?.code);
        if (code) return `code:${code.toLocaleLowerCase("vi")}`;

        const id = text(student?.id || student?.studentId);
        if (id) return `id:${id}`;

        return "";
    }

    function dedupeStudents(input) {
        if (!Array.isArray(input)) return [];

        const byIdentity = new Map();
        const noIdentity = [];

        input.forEach(student => {
            if (!student || typeof student !== "object") return;

            const key = identityOf(student);

            if (!key) {
                noIdentity.push(student);
                return;
            }

            const current = byIdentity.get(key);

            if (!current || timeOf(student) >= timeOf(current)) {
                byIdentity.set(key, student);
            }
        });

        return [
            ...byIdentity.values(),
            ...noIdentity
        ];
    }

    function installWhenReady() {
        const originalReplaceStudents = window.replaceStudents;

        if (typeof originalReplaceStudents !== "function") {
            return false;
        }

        if (originalReplaceStudents.__STUDENT_SYNC_DEDUPE_WRAPPED_101__) {
            window.__STUDENT_SYNC_DEDUPE_INSTALLED_101__ = true;
            return true;
        }

        window.dedupeStudentsForSync = dedupeStudents;

        const patchedReplaceStudents = function patchedReplaceStudents(incoming, options = {}) {
            const source = Array.isArray(incoming) ? incoming : [];
            const unique = dedupeStudents(source);

            const result = originalReplaceStudents.call(
                this,
                unique,
                {
                    ...options,
                    dedupeApplied: true,
                    sourceCount: source.length,
                    uniqueCount: unique.length
                }
            );

            const removed = Math.max(0, source.length - unique.length);

            if (result && typeof result === "object") {
                result.dedupe = {
                    applied: true,
                    sourceCount: source.length,
                    uniqueCount: unique.length,
                    removed
                };
            }

            window.__STUDENT_SYNC_DEDUPE_LAST__ = {
                sourceCount: source.length,
                uniqueCount: unique.length,
                removed,
                at: new Date().toISOString()
            };

            return result;
        };

        patchedReplaceStudents.__STUDENT_SYNC_DEDUPE_WRAPPED_101__ = true;
        window.replaceStudents = patchedReplaceStudents;
        window.__STUDENT_SYNC_DEDUPE_INSTALLED_101__ = true;
        return true;
    }

    if (installWhenReady()) return;

    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;

        if (installWhenReady() || attempts >= 200) {
            clearInterval(timer);
        }
    }, 50);
})();
