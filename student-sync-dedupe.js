/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   STUDENT SYNC DEDUPE PATCH 1.0.0
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

    if (window.__STUDENT_SYNC_DEDUPE_100__) return;
    window.__STUDENT_SYNC_DEDUPE_100__ = true;

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

        input.forEach((student, index) => {
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

        const unique = Array.from(byIdentity.values());
        unique.push(...noIdentity);

        return unique;
    }

    window.dedupeStudentsForSync = dedupeStudents;

    const originalReplaceStudents = window.replaceStudents;

    if (typeof originalReplaceStudents === "function") {
        window.replaceStudents = function patchedReplaceStudents(incoming, options = {}) {
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

            if (result && typeof result === "object") {
                result.dedupe = {
                    applied: true,
                    sourceCount: source.length,
                    uniqueCount: unique.length,
                    removed: Math.max(0, source.length - unique.length)
                };
            }

            window.__STUDENT_SYNC_DEDUPE_LAST__ = {
                sourceCount: source.length,
                uniqueCount: unique.length,
                removed: Math.max(0, source.length - unique.length),
                at: new Date().toISOString()
            };

            return result;
        };
    } else {
        // data.js có thể chưa tải khi patch được thực thi.
        // Chờ một lần ngắn để bọc API trước khi Google Bridge đồng bộ.
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;

            if (typeof window.replaceStudents === "function") {
                clearInterval(timer);
                installStudentSyncDedupe();
                return;
            }

            if (attempts >= 100) clearInterval(timer);
        }, 50);
    }
})();
