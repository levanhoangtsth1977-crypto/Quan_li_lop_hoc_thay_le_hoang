/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   STUDENT SYNC DEDUPE + MASTER ROSTER SYNC 1.1.1
   ------------------------------------------------------------
   MỤC ĐÍCH:
   - Chặn học sinh bị nhân bản khi Google Sheets trả về record trùng.
   - Khóa định danh ưu tiên: studentCode -> id.
   - KHÔNG dedupe theo tên.
   - Giữ bản ghi có updatedAt mới nhất khi cùng khóa.
   - Đồng bộ Master Roster 5C 2026–2027 từ GitHub Pages.
   - Laptop và điện thoại dùng cùng một nguồn danh sách 42 học sinh.
   - Chỉ thay danh sách students; không xóa attendance/violations/
     rewards/learning/progress/comments trong LocalStorage.
   - Không tự ghi ngược Google Sheets.
   - Không cho phép một phản hồi Google không đầy đủ (ví dụ 1/42 HS)
     ghi đè Master Roster 42 HS.
   ============================================================ */

(function installStudentSyncDedupe() {
    "use strict";

    if (window.__STUDENT_SYNC_DEDUPE_INSTALLED_111__) return;

    const TARGET_COUNT = 42;

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

        if (originalReplaceStudents.__STUDENT_SYNC_DEDUPE_WRAPPED_111__) {
            window.__STUDENT_SYNC_DEDUPE_INSTALLED_111__ = true;
            return true;
        }

        window.dedupeStudentsForSync = dedupeStudents;

        const patchedReplaceStudents = function patchedReplaceStudents(incoming, options = {}) {
            const source = Array.isArray(incoming) ? incoming : [];
            const unique = dedupeStudents(source);

            /*
             * SAFETY GUARD:
             * Google API hiện tại có thể trả về danh sách không đầy đủ.
             * Không cho một payload Google nhỏ hơn Master Roster ghi đè
             * danh sách 42 học sinh đã được khôi phục.
             */
            const sourceName = text(options?.source).toLowerCase();
            const isGoogleSync =
                sourceName === "google-sheets" ||
                sourceName === "google" ||
                sourceName.includes("google-sheets");

            if (
                isGoogleSync &&
                unique.length > 0 &&
                unique.length < TARGET_COUNT
            ) {
                const blockedResult = {
                    success: true,
                    ok: true,
                    blocked: true,
                    reason: "incomplete-google-roster",
                    sourceCount: source.length,
                    uniqueCount: unique.length,
                    expectedCount: TARGET_COUNT,
                    dedupeApplied: true
                };

                window.__STUDENT_SYNC_DEDUPE_LAST__ = {
                    sourceCount: source.length,
                    uniqueCount: unique.length,
                    removed: Math.max(0, source.length - unique.length),
                    blocked: true,
                    reason: "incomplete-google-roster",
                    expectedCount: TARGET_COUNT,
                    at: new Date().toISOString()
                };

                console.warn(
                    `[STUDENT SYNC] Bỏ qua Google roster không đầy đủ: ${unique.length}/${TARGET_COUNT}. Master Roster được giữ nguyên.`
                );

                return blockedResult;
            }

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
                blocked: false,
                at: new Date().toISOString()
            };

            return result;
        };

        patchedReplaceStudents.__STUDENT_SYNC_DEDUPE_WRAPPED_111__ = true;
        window.replaceStudents = patchedReplaceStudents;
        window.__STUDENT_SYNC_DEDUPE_INSTALLED_111__ = true;
        return true;
    }

    installWhenReady();

    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;

        if (installWhenReady() || attempts >= 200) {
            clearInterval(timer);
        }
    }, 50);
})();


/* ============================================================
   MASTER ROSTER SYNC
   ------------------------------------------------------------
   Nguồn chuẩn:
   DANH_SACH_HOC_SINH_5C_2026_2027.json

   Cơ chế:
   1. Đọc Master Roster cùng domain GitHub Pages.
   2. Chuẩn hóa ID/mã HS ổn định theo STT.
   3. So sánh với danh sách hiện có.
   4. Chỉ khi khác mới gọi replaceStudents().
   5. replaceStudents() lưu LocalStorage qua Data Engine.
   6. Reload một lần để toàn bộ UI đọc danh sách mới.
   ------------------------------------------------------------
   Quan trọng:
   - Không xóa các mảng điểm danh, vi phạm, khen thưởng...
   - Không tự tạo học sinh ngoài Master Roster.
   - Không ghi dữ liệu ngược lên Google Sheets.
   ============================================================ */

(function installMasterRosterSync() {
    "use strict";

    const MASTER_URL =
        "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-1";

    const SYNC_MARKER =
        "QL_LOP_HOC_MASTER_ROSTER_SYNC_111";

    const TARGET_COUNT = 42;

    function waitForReplaceStudents(maxAttempts = 240) {
        return new Promise(resolve => {
            let attempts = 0;

            const timer = setInterval(() => {
                attempts += 1;

                if (typeof window.replaceStudents === "function") {
                    clearInterval(timer);
                    resolve(true);
                    return;
                }

                if (attempts >= maxAttempts) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, 50);
        });
    }

    function normalizeMasterStudent(source, index) {
        const stt = Number(source?.stt) || index + 1;
        const code = text(source?.studentCode) ||
            `5C-2026-${String(stt).padStart(3, "0")}`;
        const id = `STU_5C_2026_${String(stt).padStart(3, "0")}`;

        return {
            id,
            studentCode: code,
            name: text(source?.name),
            gender: text(source?.gender),
            birthDate: text(source?.birthDate),
            parentName: text(source?.parentName),
            phone: text(source?.phone),
            address: text(source?.address),
            status: "active",
            note: "",
            createdAt: "2026-08-18T00:00:00.000Z",
            updatedAt: "2026-08-18T00:00:00.000Z",
            shareEnabled: true
        };
    }

    function rosterSignature(list) {
        return list.map(student => [
            text(student?.studentCode || student?.code),
            text(student?.name),
            text(student?.gender),
            text(student?.birthDate),
            text(student?.parentName),
            text(student?.phone),
            text(student?.address)
        ].join("\u001F")).join("\u001E");
    }

    function currentStudents() {
        try {
            if (typeof window.getStudentsSafe === "function") {
                const result = window.getStudentsSafe();
                if (Array.isArray(result)) return result;
            }
        } catch (error) {
            console.warn("[MASTER ROSTER] Không đọc được students:", error);
        }

        return [];
    }

    async function fetchMasterRoster() {
        const response = await fetch(MASTER_URL, {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(`Master Roster HTTP ${response.status}`);
        }

        const payload = await response.json();
        const source = Array.isArray(payload?.students)
            ? payload.students
            : [];

        return source.map(normalizeMasterStudent);
    }

    async function syncMasterRoster() {
        try {
            const master = await fetchMasterRoster();

            if (master.length !== TARGET_COUNT) {
                throw new Error(
                    `Master Roster không hợp lệ: ${master.length}/${TARGET_COUNT} học sinh.`
                );
            }

            const ready = await waitForReplaceStudents();
            if (!ready) {
                throw new Error("Data Engine chưa sẵn sàng.");
            }

            const current = currentStudents();
            const same =
                current.length === master.length &&
                rosterSignature(current) === rosterSignature(master);

            if (same) {
                window.__MASTER_ROSTER_SYNC_STATUS__ = {
                    status: "already-synced",
                    count: master.length,
                    at: new Date().toISOString()
                };
                return;
            }

            const result = window.replaceStudents(
                master,
                {
                    source: "MASTER_ROSTER_GITHUB",
                    replaceMode: "authoritative",
                    preserveRelatedRecords: true,
                    allowEmpty: false,
                    expectedCount: TARGET_COUNT
                }
            );

            if (result === false || result?.success === false) {
                throw new Error("replaceStudents() không hoàn tất đồng bộ.");
            }

            window.__MASTER_ROSTER_SYNC_STATUS__ = {
                status: "synced",
                count: master.length,
                previousCount: current.length,
                at: new Date().toISOString()
            };

            /*
             * Chỉ reload một lần cho mỗi tab sau khi danh sách thực sự thay đổi.
             * Dùng sessionStorage để không tạo vòng lặp reload.
             */
            const alreadyReloaded =
                sessionStorage.getItem(SYNC_MARKER) === "1";

            if (!alreadyReloaded) {
                sessionStorage.setItem(SYNC_MARKER, "1");
                setTimeout(() => location.reload(), 150);
            } else {
                sessionStorage.removeItem(SYNC_MARKER);
            }

        } catch (error) {
            window.__MASTER_ROSTER_SYNC_STATUS__ = {
                status: "error",
                message: String(error?.message || error),
                at: new Date().toISOString()
            };

            console.error(
                "[MASTER ROSTER] Đồng bộ thất bại:",
                error
            );
        }
    }

    function start() {
        /* Đợi toàn bộ script hiện tại hoàn tất khởi tạo. */
        setTimeout(syncMasterRoster, 700);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
