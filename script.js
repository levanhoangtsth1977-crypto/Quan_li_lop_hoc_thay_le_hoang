/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   SCRIPT.JS 4.1.1
   MASTER UI CONTROLLER FULL SYNC
   ------------------------------------------------------------
   BASELINE KẾ THỪA:
   - SCRIPT.JS 4.0.1 gần nhất
   - DATA.JS 3.1.1
   - INDEX.HTML hiện tại
   - STYLE.CSS hiện tại

   MỤC TIÊU:
   1. Không thay đổi data.js.
   2. Không thay đổi index.html.
   3. Không thay đổi style.css.
   4. Không xóa LocalStorage.
   5. Không tạo học sinh mẫu.
   6. Một module lỗi không làm chết toàn bộ giao diện.
   7. Toàn bộ menu dùng Event Router thống nhất.
   8. Toàn bộ data-action dùng Event Router thống nhất.
   9. Toàn bộ data-student-action dùng Event Router thống nhất.
   10. data-setting hoạt động.
   11. data-ai-action hoạt động.
   12. data-material hoạt động.
   13. Modal hoạt động.
   14. Form hoạt động.
   15. Danh sách học sinh luôn đọc trực tiếp từ Data Engine.
   16. Import Excel / XLS / CSV.
   17. Điểm danh.
   18. Vi phạm.
   19. Khen thưởng.
   20. Học tập.
   21. Nhận xét.
   22. Thống kê.
   23. Link học sinh.
   24. Cài đặt.
   25. Mobile sidebar.
   26. Refresh toàn hệ thống.
   27. Không phụ thuộc thứ tự render.
   28. Không đăng ký event trùng nhiều lần.
   29. Không dùng innerHTML với dữ liệu chưa escape.
   30. Không tự tạo URL Google Drive.
   ============================================================ */

"use strict";

/* ============================================================
   01. APPLICATION STATE
   ============================================================ */

const UI = {
    version: "4.1.1",

    currentPage: "dashboard",

    editingStudentId: null,

    importing: false,

    sheetJsLoaded: false,

    initialized: false,

    dataReady: false,

    dataLoading: false,

    eventsBound: false,

    navigationBound: false,

    renderLock: false,

    lastRenderAt: 0
};


/* ============================================================
   02. DOM HELPERS
   ============================================================ */

function $(selector) {
    try {
        return document.querySelector(selector);
    } catch (error) {
        return null;
    }
}


function $$(selector) {
    try {
        return Array.from(
            document.querySelectorAll(selector)
        );
    } catch (error) {
        return [];
    }
}


function byId(id) {
    return document.getElementById(id);
}


function setText(id, value) {

    const element = byId(id);

    if (!element) {
        return;
    }

    element.textContent =
        String(value ?? "");
}


function setValue(id, value) {

    const element = byId(id);

    if (!element) {
        return;
    }

    element.value =
        value ?? "";
}


function getValue(id) {

    const element = byId(id);

    return element
        ? element.value
        : "";
}


/* ============================================================
   03. HTML SAFETY
   ============================================================ */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   04. TEXT NORMALIZATION
   ============================================================ */

function normalizeText(value) {

    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}


function normalizeKey(value) {

    return normalizeText(value)
        .toLocaleLowerCase("vi");
}


/* ============================================================
   05. DATE
   ============================================================ */

function todayISO() {

    const date = new Date();

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


function normalizeDate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    if (
        Object.prototype.toString.call(value) ===
        "[object Date]"
    ) {

        if (Number.isNaN(value.getTime())) {
            return "";
        }

        return (
            value.getFullYear() +
            "-" +
            String(
                value.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                value.getDate()
            ).padStart(2, "0")
        );
    }

    const text =
        String(value).trim();

    if (
        /^\d{4}-\d{1,2}-\d{1,2}$/.test(text)
    ) {

        const parts =
            text.split("-");

        return (
            parts[0] +
            "-" +
            String(parts[1]).padStart(2, "0") +
            "-" +
            String(parts[2]).padStart(2, "0")
        );
    }

    if (
        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)
    ) {

        const parts =
            text.split("/");

        return (
            parts[2] +
            "-" +
            String(parts[1]).padStart(2, "0") +
            "-" +
            String(parts[0]).padStart(2, "0")
        );
    }

    return text;
}


function formatDate(value) {

    const normalized =
        normalizeDate(value);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ) {
        return normalized;
    }

    const parts =
        normalized.split("-");

    return (
        parts[2] +
        "/" +
        parts[1] +
        "/" +
        parts[0]
    );
}


/* ============================================================
   06. DATA BRIDGE
   ============================================================ */

function dataFunction(name) {

    if (
        typeof window[name] ===
        "function"
    ) {
        return window[name];
    }

    return null;
}


function safeCall(
    name,
    ...args
) {

    const fn =
        dataFunction(name);

    if (!fn) {

        console.warn(
            "[DATA BRIDGE] API chưa có:",
            name
        );

        return null;
    }

    try {

        return fn(...args);

    } catch (error) {

        console.error(
            "[DATA BRIDGE] Lỗi:",
            name,
            error
        );

        return null;
    }
}


function getStudentsSafe() {

    const getter =
        dataFunction("getStudentsSafe");

    if (getter) {

        try {

            const result =
                getter();

            if (
                Array.isArray(result)
            ) {
                return result;
            }

        } catch (error) {

            console.error(
                "getStudentsSafe:",
                error
            );
        }
    }

    if (
        Array.isArray(window.students)
    ) {
        return window.students;
    }

    if (
        Array.isArray(window.classData?.students)
    ) {
        return window.classData.students;
    }

    if (
        Array.isArray(window.appData?.students)
    ) {
        return window.appData.students;
    }

    return [];
}


function getArraySafe(name) {

    const value =
        window[name];

    return Array.isArray(value)
        ? value
        : [];
}


/* ============================================================
   07. DATA ENGINE LOADER
   ============================================================ */

function loadDataEngine() {

    if (UI.dataReady) {
        return Promise.resolve(true);
    }

    if (
        typeof window.loadClassData ===
            "function" &&
        (
            typeof window.getStudentsSafe ===
                "function" ||
            Array.isArray(window.students)
        )
    ) {

        UI.dataReady = true;

        return Promise.resolve(true);
    }

    if (UI.dataLoading) {

        return new Promise(resolve => {

            const timer =
                setInterval(() => {

                    if (UI.dataReady) {

                        clearInterval(timer);

                        resolve(true);
                    }

                }, 25);

            setTimeout(() => {

                clearInterval(timer);

                if (!UI.dataReady) {
                    resolve(false);
                }

            }, 5000);

        });
    }

    UI.dataLoading = true;

    return new Promise(resolve => {

        const existing =
            document.querySelector(
                'script[data-data-engine="true"]'
            );

        if (existing) {

            existing.addEventListener(
                "load",
                () => {

                    UI.dataReady = true;
                    UI.dataLoading = false;

                    resolve(true);

                },
                {
                    once: true
                }
            );

            existing.addEventListener(
                "error",
                () => {

                    UI.dataLoading = false;

                    resolve(false);

                },
                {
                    once: true
                }
            );

            return;
        }

        const script =
            document.createElement("script");

        script.src = "data.js";

        script.dataset.dataEngine =
            "true";

        script.onload = () => {

            UI.dataReady = true;
            UI.dataLoading = false;

            resolve(true);

        };

        script.onerror = () => {

            UI.dataLoading = false;

            console.error(
                "Không tải được data.js."
            );

            showToast(
                "Không tải được Data Engine: data.js",
                "error"
            );

            resolve(false);

        };

        document.head.appendChild(
            script
        );

    });
}


/* ============================================================
   08. DATA INITIALIZATION
   ============================================================ */

function initializeData() {

    const load =
        dataFunction(
            "loadClassData"
        );

    if (load) {

        try {
            load();
        } catch (error) {
            console.error(
                "loadClassData:",
                error
            );
        }
    }

    const sync =
        dataFunction(
            "syncAppDataReferences"
        );

    if (sync) {

        try {
            sync();
        } catch (error) {
            console.warn(
                "syncAppDataReferences:",
                error
            );
        }
    }
}


/* ============================================================
   09. DATA ENGINE CHECK
   ============================================================ */

function checkDataEngine() {

    const required = [
        "loadClassData",
        "saveClassData",
        "addStudent",
        "updateStudent",
        "deleteStudent",
        "getStudentById",
        "getStudentProfile",
        "getClassStatistics",
        "addViolation",
        "deleteViolation",
        "addReward",
        "deleteReward",
        "replaceStudents"
    ];

    const missing =
        required.filter(
            name =>
                typeof window[name] !==
                "function"
        );

    if (missing.length) {

        console.warn(
            "[DATA ENGINE] API thiếu:",
            missing
        );

        return false;
    }

    return true;
}


/* ============================================================
   10. TOAST
   ============================================================ */

function showToast(
    message,
    type = "info"
) {

    const container =
        byId("toastContainer");

    if (!container) {

        console.info(message);

        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    const content =
        document.createElement("div");

    content.className =
        "toast-content";

    const strong =
        document.createElement("strong");

    strong.textContent =
        String(message ?? "");

    content.appendChild(strong);

    toast.appendChild(content);

    container.appendChild(toast);

    setTimeout(
        () => toast.remove(),
        3500
    );
}


/* ============================================================
   11. LOADING
   ============================================================ */

function setLoading(active) {

    const overlay =
        byId("loadingOverlay");

    if (!overlay) {
        return;
    }

    overlay.hidden =
        !active;
}


/* ============================================================
   12. MODAL ENGINE
   ============================================================ */

function openModal(id) {

    const modal =
        byId(id);

    if (!modal) {

        showToast(
            `Không tìm thấy cửa sổ: ${id}`,
            "error"
        );

        return false;
    }

    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    return true;
}


function closeModal(id) {

    const modal =
        byId(id);

    if (!modal) {
        return false;
    }

    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    const visible =
        $$(".modal").some(
            item => !item.hidden
        );

    if (!visible) {

        document.body.classList.remove(
            "modal-open"
        );
    }

    return true;
}


function closeAllModals() {

    $$(".modal").forEach(
        modal => {

            modal.hidden = true;

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

    document.body.classList.remove(
        "modal-open"
    );
}


/* ============================================================
   13. MOBILE SIDEBAR
   ============================================================ */

function openMobileSidebar() {

    const sidebar =
        byId("sidebar");

    const overlay =
        byId("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.add("open");
    }

    if (overlay) {

        overlay.style.display =
            "block";

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );
    }
}


function closeMobileSidebar() {

    const sidebar =
        byId("sidebar");

    const overlay =
        byId("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (overlay) {

        overlay.style.display =
            "";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


/* ============================================================
   14. PAGE MAP
   ============================================================ */

const PAGE_TITLES = {

    dashboard:
        "Trang chủ",

    students:
        "Học sinh",

    attendance:
        "Điểm danh",

    violations:
        "Vi phạm",

    rewards:
        "Khen thưởng",

    learning:
        "Học tập",

    comments:
        "Nhận xét",

    statistics:
        "Thống kê",

    "student-links":
        "Link học sinh",

    materials:
        "Kho học liệu",

    ai:
        "AI giáo viên",

    settings:
        "Cài đặt"
};


/* ============================================================
   15. RENDER REGISTRY
   ============================================================ */

const PAGE_RENDERERS = {};


/* ============================================================
   16. SAFE RENDER
   ============================================================ */

function safeRender(
    page,
    renderer
) {

    if (
        typeof renderer !==
        "function"
    ) {
        return false;
    }

    try {

        renderer();

        return true;

    } catch (error) {

        console.error(
            `[RENDER] ${page}:`,
            error
        );

        showToast(
            `Module ${PAGE_TITLES[page] || page} gặp lỗi. Các module khác vẫn được giữ hoạt động.`,
            "error"
        );

        return false;
    }
}


/* ============================================================
   17. NAVIGATION
   ============================================================ */

function navigateToPage(page) {

    const target =
        normalizeText(page);

    if (!target) {
        return false;
    }

    const sections =
        $$("[data-page-section]");

    const section =
        sections.find(
            item =>
                item.dataset.pageSection ===
                target
        );

    if (!section) {

        console.warn(
            "Không tìm thấy page-section:",
            target
        );

        showToast(
            `Trang "${PAGE_TITLES[target] || target}" chưa có trong HTML.`,
            "warning"
        );

        return false;
    }

    UI.currentPage =
        target;

    /*
     * MENU
     */

    $$(".menu-item").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.page ===
                    target
            );

        }
    );

    /*
     * PAGE
     */

    sections.forEach(
        item => {

            const active =
                item.dataset.pageSection ===
                target;

            item.classList.toggle(
                "active",
                active
            );

            item.hidden =
                !active;

        }
    );

    /*
     * TITLE
     */

    setText(
        "pageTitle",
        PAGE_TITLES[target] ||
            target
    );

    /*
     * RENDER
     */

    const renderer =
        PAGE_RENDERERS[target];

    if (renderer) {

        safeRender(
            target,
            renderer
        );
    }

    /*
     * MOBILE
     */

    closeMobileSidebar();

    /*
     * SCROLL
     */

    const main =
        byId("mainContent");

    if (main) {

        try {

            main.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {

            main.scrollTop = 0;
        }
    }

    return true;
}


/* ============================================================
   18. STUDENT STATUS
   ============================================================ */

function studentIsActive(student) {

    if (!student) {
        return false;
    }

    const status =
        normalizeKey(
            student.status
        );

    if (
        status === "inactive" ||
        status === "không còn học" ||
        status === "chuyển trường" ||
        status === "nghỉ học"
    ) {
        return false;
    }

    return true;
}


function studentStatusLabel(
    status
) {

    const value =
        normalizeKey(status);

    if (
        value === "inactive" ||
        value === "không còn học" ||
        value === "chuyển trường" ||
        value === "nghỉ học"
    ) {
        return "Không còn học";
    }

    return "Đang học";
}


/* ============================================================
   19. DASHBOARD RENDER
   ============================================================ */

function renderDashboard() {

    const stats =
        safeCall(
            "getClassStatistics"
        ) || {};

    const students =
        getStudentsSafe();

    setText(
        "statTotalStudents",
        stats.totalStudents ??
            students.length
    );

    setText(
        "statPresent",
        stats.present ??
            stats.totalPresent ??
            0
    );

    setText(
        "statViolations",
        stats.totalViolations ??
            getArraySafe(
                "violationRecords"
            ).length
    );

    setText(
        "statRewards",
        stats.totalRewards ??
            getArraySafe(
                "rewardRecords"
            ).length
    );

    setText(
        "heroSchoolYear",
        stats.schoolYear ||
            "2026–2027"
    );

    setText(
        "heroClass",
        stats.className ||
            "5C"
    );

    setText(
        "violationBadge",
        stats.totalViolations ??
            getArraySafe(
                "violationRecords"
            ).length
    );

    setText(
        "rewardBadge",
        stats.totalRewards ??
            getArraySafe(
                "rewardRecords"
            ).length
    );
}


/* ============================================================
   20. STUDENT RENDER
   ============================================================ */

function renderStudents() {

    const tbody =
        byId(
            "studentTableBody"
        );

    if (!tbody) {
        return;
    }

    /*
     * QUAN TRỌNG:
     * Luôn đọc trực tiếp Data Engine.
     * Không dùng cache cũ.
     */

    let students =
        getStudentsSafe();

    const search =
        normalizeKey(
            getValue(
                "studentSearch"
            )
        );

    const status =
        getValue(
            "studentStatusFilter"
        ) || "all";

    /*
     * SEARCH
     */

    if (search) {

        students =
            students.filter(
                student =>
                    normalizeKey(
                        student.name
                    ).includes(search)
            );
    }

    /*
     * STATUS
     *
     * Không so sánh cứng
     * student.status === "active"
     *
     * vì Data Engine có thể lưu
     * "Đang học", "Chuyển trường",
     * "Nghỉ học", ...
     */

    if (status === "active") {

        students =
            students.filter(
                student =>
                    studentIsActive(student)
            );

    } else if (
        status === "inactive"
    ) {

        students =
            students.filter(
                student =>
                    !studentIsActive(student)
            );
    }

    /*
     * SORT A → Z
     */

    students =
        students
            .slice()
            .sort(
                (a, b) =>
                    normalizeText(
                        a.name
                    ).localeCompare(
                        normalizeText(
                            b.name
                        ),
                        "vi"
                    )
            );

    /*
     * EMPTY
     */

    if (!students.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <span class="empty-icon">
                            <i class="fa-solid fa-users"></i>
                        </span>
                        <strong>
                            Chưa có học sinh
                        </strong>
                        <p>
                            Hãy nhập danh sách hoặc kiểm tra Data Engine.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    /*
     * RENDER
     */

    tbody.innerHTML =
        students.map(
            (student, index) => {

                const id =
                    escapeHTML(
                        student.id
                    );

                const name =
                    escapeHTML(
                        student.name
                    );

                const gender =
                    escapeHTML(
                        student.gender ||
                            ""
                    );

                const birthDate =
                    escapeHTML(
                        formatDate(
                            student.birthDate
                        )
                    );

                const statusText =
                    studentStatusLabel(
                        student.status
                    );

                return `
                    <tr>
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${name}
                            </strong>
                        </td>

                        <td>
                            ${gender}
                        </td>

                        <td>
                            ${birthDate}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.attendance ??
                                    student.phone ??
                                    ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                statusText
                            )}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="icon-button"
                                title="Xem hồ sơ"
                                data-student-action="view"
                                data-student-id="${id}"
                            >
                                <i class="fa-solid fa-eye"></i>
                            </button>

                            <button
                                type="button"
                                class="icon-button"
                                title="Sửa"
                                data-student-action="edit"
                                data-student-id="${id}"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="icon-button danger"
                                title="Xóa"
                                data-student-action="delete"
                                data-student-id="${id}"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        ).join("");
}


/* ============================================================
   21. STUDENT SELECT BRIDGE
   ============================================================ */

function updateStudentSelects() {

    const students =
        getStudentsSafe();

    const selectIds = [

        "attendanceStudent",

        "violationStudent",

        "rewardStudent",

        "learningStudent",

        "progressStudent",

        "commentStudent"
    ];

    selectIds.forEach(
        id => {

            const select =
                byId(id);

            if (!select) {
                return;
            }

            const current =
                select.value;

            select.innerHTML = `
                <option value="">
                    Chọn học sinh
                </option>
            `;

            students.forEach(
                student => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        student.id;

                    option.textContent =
                        student.name;

                    select.appendChild(
                        option
                    );
                }
            );

            if (
                students.some(
                    student =>
                        String(
                            student.id
                        ) ===
                        String(current)
                )
            ) {

                select.value =
                    current;
            }
        }
    );
}


/* ============================================================
   22. ATTENDANCE
   ============================================================ */

function renderAttendance() {

    const tbody =
        byId(
            "attendanceTableBody"
        );

    if (!tbody) {
        return;
    }

    const date =
        getValue(
            "attendanceDate"
        ) ||
        todayISO();

    setValue(
        "attendanceDate",
        date
    );

    const students =
        getStudentsSafe();

    const records =
        safeCall(
            "getAttendanceRecords"
        ) || [];

    tbody.innerHTML =
        students.map(
            (student, index) => {

                const record =
                    Array.isArray(records)
                        ? records.find(
                            item =>
                                String(
                                    item.studentId
                                ) ===
                                    String(
                                        student.id
                                    ) &&
                                item.date ===
                                    date
                        )
                        : null;

                const status =
                    record?.status ||
                    "present";

                return `
                    <tr>
                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    student.name
                                )}
                            </strong>
                        </td>

                        <td>
                            <select
                                class="attendance-status"
                                data-student-id="${escapeHTML(
                                    student.id
                                )}"
                            >
                                <option
                                    value="present"
                                    ${status === "present" ? "selected" : ""}
                                >
                                    Có mặt
                                </option>

                                <option
                                    value="excused"
                                    ${status === "excused" ? "selected" : ""}
                                >
                                    Có phép
                                </option>

                                <option
                                    value="absent"
                                    ${status === "absent" ? "selected" : ""}
                                >
                                    Vắng
                                </option>
                            </select>
                        </td>

                        <td>
                            <input
                                type="text"
                                class="attendance-note"
                                data-student-id="${escapeHTML(
                                    student.id
                                )}"
                                value="${escapeHTML(
                                    record?.note || ""
                                )}"
                                placeholder="Ghi chú"
                            >
                        </td>
                    </tr>
                `;
            }
        ).join("");

    updateAttendanceSummary();
}


function updateAttendanceSummary() {

    let present = 0;

    let excused = 0;

    let absent = 0;

    $$(".attendance-status")
        .forEach(
            select => {

                if (
                    select.value ===
                    "present"
                ) {
                    present++;
                }

                if (
                    select.value ===
                    "excused"
                ) {
                    excused++;
                }

                if (
                    select.value ===
                    "absent"
                ) {
                    absent++;
                }
            }
        );

    setText(
        "attendancePresent",
        present
    );

    setText(
        "attendancePresentCount",
        present
    );

    setText(
        "attendanceExcused",
        excused
    );

    setText(
        "attendanceExcusedCount",
        excused
    );

    setText(
        "attendanceAbsent",
        absent
    );

    setText(
        "attendanceAbsentCount",
        absent
    );
}


function saveAttendance() {

    const date =
        getValue(
            "attendanceDate"
        ) ||
        todayISO();

    const statuses =
        $$(".attendance-status");

    if (!statuses.length) {

        showToast(
            "Chưa có danh sách học sinh để điểm danh.",
            "warning"
        );

        return;
    }

    let saved = 0;

    statuses.forEach(
        select => {

            const studentId =
                select.dataset.studentId;

            const note =
                document.querySelector(
                    `.attendance-note[data-student-id="${CSS.escape(
                        studentId
                    )}"]`
                );

            const result =
                safeCall(
                    "saveAttendanceRecord",
                    studentId,
                    date,
                    select.value,
                    note?.value || ""
                );

            if (
                result === true ||
                (
                    result &&
                    result.success !== false
                )
            ) {
                saved++;
            }
        }
    );

    initializeData();

    refreshAll();

    showToast(
        `Đã lưu điểm danh ${saved} học sinh.`,
        "success"
    );
}


/* ============================================================
   23. VIOLATIONS
   ============================================================ */

function renderViolations() {

    const tbody =
        byId(
            "violationTableBody"
        );

    if (!tbody) {
        return;
    }

    const records =
        safeCall(
            "getViolationRecords"
        ) || [];

    const search =
        normalizeKey(
            getValue(
                "violationSearch"
            )
        );

    const type =
        getValue(
            "violationTypeFilter"
        );

    let list =
        Array.isArray(records)
            ? records.slice()
            : [];

    if (search) {

        list =
            list.filter(
                record => {

                    const student =
                        safeCall(
                            "getStudentById",
                            record.studentId
                        );

                    return (
                        normalizeKey(
                            student?.name
                        ).includes(search) ||
                        normalizeKey(
                            record.type
                        ).includes(search)
                    );
                }
            );
    }

    if (type) {

        list =
            list.filter(
                record =>
                    String(
                        record.type
                    ) ===
                    String(type)
            );
    }

    list.sort(
        (a, b) =>
            String(
                b.date || ""
            ).localeCompare(
                String(
                    a.date || ""
                )
            )
    );

    if (!list.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <strong>
                            Chưa có dữ liệu vi phạm
                        </strong>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        list.map(
            record => {

                const student =
                    safeCall(
                        "getStudentById",
                        record.studentId
                    );

                return `
                    <tr>
                        <td>
                            ${escapeHTML(
                                formatDate(
                                    record.date
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student?.name ||
                                "Học sinh"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.type ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.level ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.note ||
                                record.description ||
                                ""
                            )}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="icon-button danger"
                                title="Xóa"
                                data-violation-delete="${escapeHTML(
                                    record.id
                                )}"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        ).join("");
}


/* ============================================================
   24. REWARDS
   ============================================================ */

function renderRewards() {

    const tbody =
        byId(
            "rewardTableBody"
        );

    if (!tbody) {
        return;
    }

    const records =
        safeCall(
            "getRewardRecords"
        ) || [];

    const list =
        Array.isArray(records)
            ? records
                .slice()
                .sort(
                    (a, b) =>
                        String(
                            b.date || ""
                        ).localeCompare(
                            String(
                                a.date || ""
                            )
                        )
                )
            : [];

    if (!list.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <strong>
                            Chưa có dữ liệu khen thưởng
                        </strong>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        list.map(
            record => {

                const student =
                    safeCall(
                        "getStudentById",
                        record.studentId
                    );

                return `
                    <tr>
                        <td>
                            ${escapeHTML(
                                formatDate(
                                    record.date
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student?.name ||
                                "Học sinh"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.type ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.formType ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                record.note ||
                                ""
                            )}
                        </td>

                        <td>
                            <button
                                type="button"
                                class="icon-button danger"
                                title="Xóa"
                                data-reward-delete="${escapeHTML(
                                    record.id
                                )}"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        ).join("");
}


/* ============================================================
   25. STUDENT CRUD
   ============================================================ */

function openAddStudentModal() {

    UI.editingStudentId =
        null;

    setValue(
        "studentId",
        ""
    );

    setValue(
        "studentName",
        ""
    );

    setValue(
        "studentGender",
        ""
    );

    setValue(
        "studentBirthDate",
        ""
    );

    setValue(
        "studentNote",
        ""
    );

    setText(
        "studentModalTitle",
        "Thêm học sinh"
    );

    openModal(
        "studentModal"
    );
}


function openEditStudentModal(
    studentId
) {

    const profile =
        safeCall(
            "getStudentProfile",
            studentId
        );

    const student =
        profile?.student ||
        safeCall(
            "getStudentById",
            studentId
        );

    if (!student) {

        showToast(
            "Không tìm thấy học sinh.",
            "error"
        );

        return;
    }

    UI.editingStudentId =
        student.id;

    setValue(
        "studentId",
        student.id
    );

    setValue(
        "studentName",
        student.name
    );

    setValue(
        "studentGender",
        student.gender
    );

    setValue(
        "studentBirthDate",
        normalizeDate(
            student.birthDate
        )
    );

    setValue(
        "studentNote",
        student.note || ""
    );

    setText(
        "studentModalTitle",
        "Sửa học sinh"
    );

    openModal(
        "studentModal"
    );
}


function showStudentProfile(
    studentId
) {

    const profile =
        safeCall(
            "getStudentProfile",
            studentId
        );

    const student =
        profile?.student ||
        safeCall(
            "getStudentById",
            studentId
        );

    if (!student) {

        showToast(
            "Không tìm thấy hồ sơ học sinh.",
            "error"
        );

        return;
    }

    setValue(
        "studentId",
        student.id
    );

    setValue(
        "studentName",
        student.name
    );

    setValue(
        "studentGender",
        student.gender
    );

    setValue(
        "studentBirthDate",
        normalizeDate(
            student.birthDate
        )
    );

    if (profile) {

        const note = [
            student.note || "",

            `Vi phạm: ${
                Array.isArray(
                    profile.violations
                )
                    ? profile.violations.length
                    : 0
            }`,

            `Khen thưởng: ${
                Array.isArray(
                    profile.rewards
                )
                    ? profile.rewards.length
                    : 0
            }`,

            `Học tập: ${
                Array.isArray(
                    profile.learning
                )
                    ? profile.learning.length
                    : 0
            }`,

            `Tiến bộ: ${
                Array.isArray(
                    profile.progress
                )
                    ? profile.progress.length
                    : 0
            }`,

            `Nhận xét: ${
                Array.isArray(
                    profile.comments
                )
                    ? profile.comments.length
                    : 0
            }`
        ];

        setValue(
            "studentNote",
            note.filter(Boolean)
                .join("\n")
        );

    } else {

        setValue(
            "studentNote",
            student.note || ""
        );
    }

    UI.editingStudentId =
        student.id;

    setText(
        "studentModalTitle",
        "Hồ sơ học sinh"
    );

    openModal(
        "studentModal"
    );
}


function handleStudentFormSubmit(
    event
) {

    event.preventDefault();

    const id =
        getValue(
            "studentId"
        );

    const data = {

        name:
            normalizeText(
                getValue(
                    "studentName"
                )
            ),

        gender:
            getValue(
                "studentGender"
            ),

        birthDate:
            getValue(
                "studentBirthDate"
            ),

        note:
            getValue(
                "studentNote"
            )
    };

    if (!data.name) {

        showToast(
            "Vui lòng nhập họ và tên học sinh.",
            "warning"
        );

        return;
    }

    let result;

    if (id) {

        result =
            safeCall(
                "updateStudent",
                id,
                data
            );

    } else {

        result =
            safeCall(
                "addStudent",
                data
            );
    }

    if (
        result === false ||
        (
            result &&
            result.success === false
        ) ||
        result === null
    ) {

        showToast(
            result?.message ||
                "Không thể lưu học sinh.",
            "error"
        );

        return;
    }

    closeModal(
        "studentModal"
    );

    UI.editingStudentId =
        null;

    refreshAll();

    showToast(
        id
            ? "Đã cập nhật học sinh."
            : "Đã thêm học sinh.",
        "success"
    );
}


function deleteStudentConfirm(
    studentId
) {

    const student =
        safeCall(
            "getStudentById",
            studentId
        );

    if (!student) {

        showToast(
            "Không tìm thấy học sinh.",
            "error"
        );

        return;
    }

    const confirmed =
        window.confirm(
            `Xóa học sinh "${student.name}"?`
        );

    if (!confirmed) {
        return;
    }

    const result =
        safeCall(
            "deleteStudent",
            studentId
        );

    if (
        result === false ||
        (
            result &&
            result.success === false
        )
    ) {

        showToast(
            result?.message ||
                "Không thể xóa học sinh.",
            "error"
        );

        return;
    }

    refreshAll();

    showToast(
        "Đã xóa học sinh.",
        "success"
    );
}


/* ============================================================
   26. IMPORT STUDENTS
   ============================================================ */

function openImportStudents() {

    if (UI.importing) {
        return;
    }

    const input =
        document.createElement(
            "input"
        );

    input.type =
        "file";

    input.accept =
        ".xlsx,.xls,.csv";

    input.style.display =
        "none";

    document.body.appendChild(
        input
    );

    input.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];

            if (!file) {

                input.remove();

                return;
            }

            try {

                await importStudentFile(
                    file
                );

            } finally {

                input.remove();
            }

        },
        {
            once: true
        }
    );

    input.click();
}


function loadSheetJS() {

    if (
        typeof XLSX !==
        "undefined"
    ) {

        UI.sheetJsLoaded =
            true;

        return Promise.resolve(
            true
        );
    }

    if (
        UI.sheetJsLoaded
    ) {

        return Promise.resolve(
            true
        );
    }

    return new Promise(
        resolve => {

            const existing =
                document.querySelector(
                    "script[data-sheetjs]"
                );

            if (existing) {

                existing.addEventListener(
                    "load",
                    () => {

                        UI.sheetJsLoaded =
                            true;

                        resolve(true);

                    },
                    {
                        once: true
                    }
                );

                existing.addEventListener(
                    "error",
                    () => resolve(false),
                    {
                        once: true
                    }
                );

                return;
            }

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

            script.dataset.sheetjs =
                "true";

            script.onload =
                () => {

                    UI.sheetJsLoaded =
                        true;

                    resolve(true);
                };

            script.onerror =
                () => resolve(false);

            document.head.appendChild(
                script
            );
        }
    );
}


function normalizeHeader(
    value
) {

    return normalizeKey(
        value
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


async function importStudentFile(
    file
) {

    if (UI.importing) {
        return;
    }

    UI.importing =
        true;

    setLoading(true);

    try {

        const loaded =
            await loadSheetJS();

        if (!loaded) {

            throw new Error(
                "Không tải được thư viện đọc Excel."
            );
        }

        const buffer =
            await file.arrayBuffer();

        const workbook =
            XLSX.read(
                buffer,
                {
                    type: "array",
                    cellDates: true
                }
            );

        const firstSheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];

        if (!firstSheet) {

            throw new Error(
                "File không có trang dữ liệu."
            );
        }

        const rows =
            XLSX.utils.sheet_to_json(
                firstSheet,
                {
                    header: 1,
                    defval: ""
                }
            );

        if (
            !rows.length
        ) {

            throw new Error(
                "File không có dữ liệu."
            );
        }

        const headers =
            rows[0].map(
                normalizeHeader
            );

        const nameIndex =
            headers.findIndex(
                header =>
                    [
                        "ho va ten",
                        "ho ten",
                        "hovaten",
                        "hoten",
                        "name",
                        "student name"
                    ].includes(
                        header
                    )
            );

        if (nameIndex < 0) {

            throw new Error(
                'Không tìm thấy cột "Họ và tên".'
            );
        }

        const genderIndex =
            headers.findIndex(
                header =>
                    [
                        "gioi tinh",
                        "gioitinh",
                        "gender"
                    ].includes(
                        header
                    )
            );

        const birthIndex =
            headers.findIndex(
                header =>
                    [
                        "ngay sinh",
                        "ngaysinh",
                        "birthdate",
                        "date of birth"
                    ].includes(
                        header
                    )
            );

        const phoneIndex =
            headers.findIndex(
                header =>
                    [
                        "dien thoai",
                        "so dien thoai",
                        "phone"
                    ].includes(
                        header
                    )
            );

        const addressIndex =
            headers.findIndex(
                header =>
                    [
                        "dia chi",
                        "diachi",
                        "address"
                    ].includes(
                        header
                    )
            );

        const students =
            rows
                .slice(1)
                .map(
                    row => {

                        const name =
                            normalizeText(
                                row[nameIndex]
                            );

                        if (!name) {
                            return null;
                        }

                        return {

                            name,

                            gender:
                                genderIndex >= 0
                                    ? normalizeText(
                                        row[
                                            genderIndex
                                        ]
                                    )
                                    : "",

                            birthDate:
                                birthIndex >= 0
                                    ? normalizeDate(
                                        row[
                                            birthIndex
                                        ]
                                    )
                                    : "",

                            phone:
                                phoneIndex >= 0
                                    ? normalizeText(
                                        row[
                                            phoneIndex
                                        ]
                                    )
                                    : "",

                            address:
                                addressIndex >= 0
                                    ? normalizeText(
                                        row[
                                            addressIndex
                                        ]
                                    )
                                    : ""
                        };
                    }
                )
                .filter(Boolean);

        if (!students.length) {

            throw new Error(
                "Không tìm thấy học sinh hợp lệ."
            );
        }

        const result =
            safeCall(
                "replaceStudents",
                students
            );

        if (
            result === false ||
            (
                result &&
                result.success === false
            ) ||
            result === null
        ) {

            throw new Error(
                result?.message ||
                    "Không thể lưu danh sách học sinh."
            );
        }

        initializeData();

        refreshAll();

        showToast(
            result?.message ||
                `Đã nhập ${students.length} học sinh.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Import students:",
            error
        );

        showToast(
            error.message ||
                "Không thể nhập file.",
            "error"
        );

    } finally {

        UI.importing =
            false;

        setLoading(false);
    }
}


/* ============================================================
   27. VIOLATION MODAL
   ============================================================ */

function prepareViolationModal() {

    setValue(
        "violationDate",
        getValue(
            "violationDate"
        ) ||
            todayISO()
    );

    updateStudentSelects();

    openModal(
        "violationModal"
    );
}


function handleViolationFormSubmit(
    event
) {

    event.preventDefault();

    const studentId =
        getValue(
            "violationStudent"
        );

    if (!studentId) {

        showToast(
            "Vui lòng chọn học sinh.",
            "warning"
        );

        return;
    }

    const result =
        safeCall(
            "addViolation",
            {
                studentId,

                date:
                    getValue(
                        "violationDate"
                    ) ||
                    todayISO(),

                type:
                    getValue(
                        "violationType"
                    ),

                level:
                    getValue(
                        "violationLevel"
                    ),

                note:
                    getValue(
                        "violationNote"
                    ) ||
                    getValue(
                        "violationDescription"
                    )
            }
        );

    if (
        result === false ||
        (
            result &&
            result.success === false
        ) ||
        result === null
    ) {

        showToast(
            result?.message ||
                "Không thể lưu vi phạm.",
            "error"
        );

        return;
    }

    closeModal(
        "violationModal"
    );

    refreshAll();

    showToast(
        "Đã ghi nhận vi phạm.",
        "success"
    );
}


/* ============================================================
   28. REWARD MODAL
   ============================================================ */

function prepareRewardModal() {

    setValue(
        "rewardDate",
        getValue(
            "rewardDate"
        ) ||
            todayISO()
    );

    updateStudentSelects();

    openModal(
        "rewardModal"
    );
}


function handleRewardFormSubmit(
    event
) {

    event.preventDefault();

    const studentId =
        getValue(
            "rewardStudent"
        );

    if (!studentId) {

        showToast(
            "Vui lòng chọn học sinh.",
            "warning"
        );

        return;
    }

    const result =
        safeCall(
            "addReward",
            {
                studentId,

                date:
                    getValue(
                        "rewardDate"
                    ) ||
                    todayISO(),

                type:
                    getValue(
                        "rewardType"
                    ),

                formType:
                    getValue(
                        "rewardFormType"
                    ),

                note:
                    getValue(
                        "rewardNote"
                    )
            }
        );

    if (
        result === false ||
        (
            result &&
            result.success === false
        ) ||
        result === null
    ) {

        showToast(
            result?.message ||
                "Không thể lưu khen thưởng.",
            "error"
        );

        return;
    }

    closeModal(
        "rewardModal"
    );

    refreshAll();

    showToast(
        "Đã ghi nhận khen thưởng.",
        "success"
    );
}


/* ============================================================
   29. LEARNING / COMMENTS
   ============================================================ */

function openLearningEditor() {

    navigateToPage(
        "learning"
    );

    showToast(
        "Đã mở module Học tập.",
        "info"
    );
}


function openProgressEditor() {

    navigateToPage(
        "learning"
    );
}


function openCommentEditor() {

    navigateToPage(
        "comments"
    );
}


function renderLearningSafe() {

    const external =
        window.renderLearning;

    if (
        typeof external ===
            "function" &&
        external !==
            renderLearningSafe
    ) {

        try {
            external();
        } catch (error) {

            console.error(
                "renderLearning:",
                error
            );
        }
    }
}


function renderCommentsSafe() {

    const external =
        window.renderComments;

    if (
        typeof external ===
            "function" &&
        external !==
            renderCommentsSafe
    ) {

        try {
            external();
        } catch (error) {

            console.error(
                "renderComments:",
                error
            );
        }
    }
}


/* ============================================================
   30. STATISTICS
   ============================================================ */

function renderStatistics() {

    const stats =
        safeCall(
            "getClassStatistics"
        ) || {};

    const students =
        getStudentsSafe();

    const mappings = {

        statisticsTotalStudents:
            stats.totalStudents ??
            students.length,

        statisticsPresent:
            stats.present ??
            0,

        statisticsViolations:
            stats.totalViolations ??
            0,

        statisticsRewards:
            stats.totalRewards ??
            0,

        statisticsLearning:
            stats.totalLearning ??
            0,

        statisticsProgress:
            stats.totalProgress ??
            0,

        statisticsComments:
            stats.totalComments ??
            0
    };

    Object.entries(
        mappings
    ).forEach(
        ([id, value]) => {

            setText(
                id,
                value ?? 0
            );
        }
    );
}


/* ============================================================
   31. STUDENT LINKS
   ============================================================ */

function renderStudentLinks() {

    const container =
        byId(
            "studentLinksList"
        ) ||
        byId(
            "studentLinkList"
        );

    if (!container) {
        return;
    }

    const students =
        getStudentsSafe()
            .slice()
            .sort(
                (a, b) =>
                    normalizeText(
                        a.name
                    ).localeCompare(
                        normalizeText(
                            b.name
                        ),
                        "vi"
                    )
            );

    if (!students.length) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>
                    Chưa có học sinh
                </strong>
            </div>
        `;

        return;
    }

    container.innerHTML =
        students.map(
            student => {

                const link =
                    safeCall(
                        "getStudentLink",
                        student.id
                    ) || "";

                return `
                    <div class="student-link-item">

                        <strong>
                            ${escapeHTML(
                                student.name
                            )}
                        </strong>

                        <input
                            type="text"
                            readonly
                            value="${escapeHTML(
                                link
                            )}"
                        >

                        <button
                            type="button"
                            class="button secondary"
                            data-copy-student-link="${escapeHTML(
                                link
                            )}"
                        >
                            <i class="fa-solid fa-copy"></i>
                            Sao chép
                        </button>

                    </div>
                `;
            }
        ).join("");
}


async function copyStudentLink(
    link
) {

    if (!link) {

        showToast(
            "Link học sinh chưa có.",
            "warning"
        );

        return;
    }

    try {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                link
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                link;

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.focus();

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }

        showToast(
            "Đã sao chép link học sinh.",
            "success"
        );

    } catch (error) {

        showToast(
            "Không thể sao chép tự động.",
            "warning"
        );
    }
}


/* ============================================================
   32. MATERIALS
   ============================================================ */

function handleMaterialAction(
    event
) {

    const element =
        event.target.closest(
            "[data-material]"
        );

    if (!element) {
        return;
    }

    const href =
        element.getAttribute(
            "href"
        );

    if (
        !href ||
        href === "#"
    ) {

        event.preventDefault();

        const labels = {

            "lesson-plans":
                "Giáo án",

            tests:
                "Đề kiểm tra",

            worksheets:
                "Phiếu học tập",

            slides:
                "Bài giảng",

            documents:
                "Tài liệu",

            images:
                "Thư viện ảnh"
        };

        const material =
            element.dataset.material;

        showToast(
            `Kho ${
                labels[material] ||
                material ||
                "học liệu"
            } chưa có URL được cấu hình.`,
            "warning"
        );
    }
}


/* ============================================================
   33. AI
   ============================================================ */

function buildClassAIAnalysis() {

    const stats =
        safeCall(
            "getClassStatistics"
        ) || {};

    const students =
        getStudentsSafe();

    return [
        "PHÂN TÍCH LỚP",
        "",
        `Tổng số học sinh: ${
            stats.totalStudents ??
            students.length
        }`,
        `Có mặt hôm nay: ${
            stats.present ??
            0
        }`,
        `Vi phạm: ${
            stats.totalViolations ??
            0
        }`,
        `Khen thưởng: ${
            stats.totalRewards ??
            0
        }`,
        `Học tập: ${
            stats.totalLearning ??
            0
        }`,
        `Tiến bộ: ${
            stats.totalProgress ??
            0
        }`,
        `Nhận xét: ${
            stats.totalComments ??
            0
        }`
    ].join("\n");
}


function buildStudentSupportAnalysis() {

    const students =
        getStudentsSafe();

    if (!students.length) {

        return (
            "HỖ TRỢ HỌC SINH\n\n" +
            "Chưa có dữ liệu học sinh."
        );
    }

    return [
        "HỖ TRỢ HỌC SINH",
        "",
        `Danh sách hiện có: ${students.length} học sinh.`,
        "",
        "Giáo viên có thể xem hồ sơ, điểm danh, học tập, tiến bộ, vi phạm và khen thưởng của từng học sinh."
    ].join("\n");
}


function buildCommentSuggestions() {

    if (!getStudentsSafe().length) {

        return (
            "GỢI Ý NHẬN XÉT\n\n" +
            "Chưa có học sinh."
        );
    }

    return [
        "GỢI Ý NHẬN XÉT",
        "",
        "1. Em có ý thức học tập tốt và tích cực tham gia các hoạt động.",
        "2. Em có tiến bộ trong học tập, cần tiếp tục duy trì.",
        "3. Em cần mạnh dạn hơn khi trình bày ý kiến.",
        "4. Em cần chú ý hoàn thành nhiệm vụ đúng thời gian.",
        "",
        "Giáo viên cần điều chỉnh nhận xét theo dữ liệu thực tế của từng học sinh."
    ].join("\n");
}


function buildProgressAnalysis() {

    const records =
        safeCall(
            "getProgressRecords"
        ) || [];

    if (!records.length) {

        return (
            "PHÂN TÍCH TIẾN BỘ\n\n" +
            "Chưa có dữ liệu tiến bộ."
        );
    }

    const grouped =
        new Map();

    records.forEach(
        record => {

            if (
                !grouped.has(
                    record.studentId
                )
            ) {

                grouped.set(
                    record.studentId,
                    []
                );
            }

            grouped
                .get(
                    record.studentId
                )
                .push(record);
        }
    );

    const result = [];

    grouped.forEach(
        (
            items,
            studentId
        ) => {

            const student =
                safeCall(
                    "getStudentById",
                    studentId
                );

            const latest =
                items
                    .slice()
                    .sort(
                        (a, b) =>
                            String(
                                b.date || ""
                            ).localeCompare(
                                String(
                                    a.date || ""
                                )
                            )
                    )[0];

            result.push(
                `${student?.name || "Học sinh"}: ${
                    latest?.result ||
                    "Có dữ liệu theo dõi"
                }.`
            );
        }
    );

    return (
        "PHÂN TÍCH TIẾN BỘ\n\n" +
        result.join("\n")
    );
}


function showDynamicDialog(
    title,
    content
) {

    const old =
        byId(
            "aiResultDialog"
        );

    if (old) {
        old.remove();
    }

    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "modal";

    overlay.id =
        "aiResultDialog";

    overlay.hidden =
        false;

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );

    overlay.innerHTML = `
        <div
            class="modal-backdrop"
            data-dynamic-close
        ></div>

        <div class="modal-dialog">

            <div class="modal-header">

                <div>

                    <span class="modal-eyebrow">
                        <i class="fa-solid fa-robot"></i>
                        AI giáo viên
                    </span>

                    <h2>
                        ${escapeHTML(
                            title
                        )}
                    </h2>

                </div>

                <button
                    type="button"
                    class="icon-button"
                    data-dynamic-close
                    aria-label="Đóng"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div
                style="
                    white-space:pre-wrap;
                    line-height:1.7;
                    padding:20px;
                "
            >
                ${escapeHTML(
                    content
                )}
            </div>

            <div class="modal-footer">

                <button
                    type="button"
                    class="button primary"
                    data-dynamic-close
                >
                    Đóng
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    document.body.classList.add(
        "modal-open"
    );
}


function handleAIAction(
    action
) {

    switch (action) {

        case "analyze-class":

            showDynamicDialog(
                "Phân tích lớp",
                buildClassAIAnalysis()
            );

            break;


        case "student-support":

            showDynamicDialog(
                "Hỗ trợ học sinh",
                buildStudentSupportAnalysis()
            );

            break;


        case "comments":

            showDynamicDialog(
                "Gợi ý nhận xét",
                buildCommentSuggestions()
            );

            break;


        case "progress":

            showDynamicDialog(
                "Phân tích tiến bộ",
                buildProgressAnalysis()
            );

            break;


        default:

            showToast(
                "Chức năng AI chưa được nhận diện.",
                "warning"
            );
    }
}


/* ============================================================
   34. SETTINGS
   ============================================================ */

function handleSetting(
    setting
) {

    switch (setting) {

        case "school-years":

            showDynamicDialog(
                "Quản lý năm học",
                "Năm học hiện tại: 2026–2027\nLớp hiện tại: 5C."
            );

            break;


        case "database":

            showDynamicDialog(
                "Cấu hình dữ liệu",
                "Data Engine hiện sử dụng cơ chế lưu trữ của hệ thống.\n\nKhông tự ý thay đổi khóa dữ liệu."
            );

            break;


        case "drive":

            showDynamicDialog(
                "Cấu hình Google Drive",
                "Không tự tạo hoặc thay đổi URL Google Drive hiện có trong HTML."
            );

            break;


        case "security":

            showDynamicDialog(
                "Cài đặt bảo mật",
                "Thông tin học sinh được xử lý thông qua Data Engine và cấu hình link học sinh."
            );

            break;


        default:

            showToast(
                "Cài đặt chưa được nhận diện.",
                "warning"
            );
    }
}


/* ============================================================
   35. DATA ACTION ROUTER
   ============================================================ */

function handleDataAction(
    event
) {

    const element =
        event.target.closest(
            "[data-action]"
        );

    if (!element) {
        return false;
    }

    const action =
        normalizeText(
            element.dataset.action
        );

    switch (action) {

        case "import-students":

            event.preventDefault();

            openImportStudents();

            return true;


        case "add-student":

            event.preventDefault();

            openAddStudentModal();

            return true;


        case "attendance":

            event.preventDefault();

            navigateToPage(
                "attendance"
            );

            return true;


        case "add-violation":

            event.preventDefault();

            prepareViolationModal();

            return true;


        case "add-reward":

            event.preventDefault();

            prepareRewardModal();

            return true;


        case "add-learning":

            event.preventDefault();

            openLearningEditor();

            return true;


        case "add-comment":

            event.preventDefault();

            openCommentEditor();

            return true;


        case "progress":

        case "add-progress":

            event.preventDefault();

            openProgressEditor();

            return true;


        case "statistics":

            event.preventDefault();

            navigateToPage(
                "statistics"
            );

            return true;


        case "student-links":

            event.preventDefault();

            navigateToPage(
                "student-links"
            );

            return true;


        case "materials":

        case "material":

            event.preventDefault();

            navigateToPage(
                "materials"
            );

            return true;


        case "ai":

        case "ai-teacher":

            event.preventDefault();

            navigateToPage(
                "ai"
            );

            return true;


        case "settings":

            event.preventDefault();

            navigateToPage(
                "settings"
            );

            return true;


        case "refresh":

        case "refresh-data":

            event.preventDefault();

            refreshAll();

            showToast(
                "Đã làm mới dữ liệu.",
                "success"
            );

            return true;


        case "export-report":

        case "export":

        case "backup":

            event.preventDefault();

            exportReportSafe();

            return true;


        default:

            return false;
    }
}


/* ============================================================
   36. STUDENT ACTION ROUTER
   ============================================================ */

function handleStudentAction(
    event
) {

    const button =
        event.target.closest(
            "[data-student-action]"
        );

    if (!button) {
        return false;
    }

    event.preventDefault();

    const action =
        normalizeText(
            button.dataset.studentAction
        );

    const studentId =
        button.dataset.studentId;

    if (!studentId) {

        showToast(
            "Không xác định được học sinh.",
            "error"
        );

        return true;
    }

    switch (action) {

        case "view":

        case "profile":

            showStudentProfile(
                studentId
            );

            break;


        case "edit":

            openEditStudentModal(
                studentId
            );

            break;


        case "delete":

            deleteStudentConfirm(
                studentId
            );

            break;


        default:

            showToast(
                `Thao tác học sinh "${action}" chưa được hỗ trợ.`,
                "warning"
            );
    }

    return true;
}


/* ============================================================
   37. RECORD DELETE ROUTER
   ============================================================ */

function handleRecordDelete(
    event
) {

    const violation =
        event.target.closest(
            "[data-violation-delete]"
        );

    if (violation) {

        event.preventDefault();

        const id =
            violation.dataset.violationDelete;

        if (
            !window.confirm(
                "Xóa bản ghi vi phạm này?"
            )
        ) {
            return true;
        }

        const result =
            safeCall(
                "deleteViolation",
                id
            );

        if (
            result === false ||
            (
                result &&
                result.success === false
            )
        ) {

            showToast(
                "Không thể xóa bản ghi vi phạm.",
                "error"
            );

            return true;
        }

        refreshAll();

        showToast(
            "Đã xóa bản ghi vi phạm.",
            "success"
        );

        return true;
    }


    const reward =
        event.target.closest(
            "[data-reward-delete]"
        );

    if (reward) {

        event.preventDefault();

        const id =
            reward.dataset.rewardDelete;

        if (
            !window.confirm(
                "Xóa bản ghi khen thưởng này?"
            )
        ) {
            return true;
        }

        const result =
            safeCall(
                "deleteReward",
                id
            );

        if (
            result === false ||
            (
                result &&
                result.success === false
            )
        ) {

            showToast(
                "Không thể xóa bản ghi khen thưởng.",
                "error"
            );

            return true;
        }

        refreshAll();

        showToast(
            "Đã xóa bản ghi khen thưởng.",
            "success"
        );

        return true;
    }

    return false;
}


/* ============================================================
   38. COPY LINK ROUTER
   ============================================================ */

function handleCopyLink(
    event
) {

    const button =
        event.target.closest(
            "[data-copy-student-link]"
        );

    if (!button) {
        return false;
    }

    event.preventDefault();

    copyStudentLink(
        button.dataset.copyStudentLink
    );

    return true;
}


/* ============================================================
   39. MODAL CLOSE ROUTER
   ============================================================ */

function handleModalCloseClick(
    event
) {

    const trigger =
        event.target.closest(
            "[data-modal-close]"
        );

    if (!trigger) {
        return false;
    }

    event.preventDefault();

    const modal =
        trigger.closest(
            ".modal"
        );

    if (modal) {

        closeModal(
            modal.id
        );
    }

    return true;
}


function handleDynamicClose(
    event
) {

    const trigger =
        event.target.closest(
            "[data-dynamic-close]"
        );

    if (!trigger) {
        return false;
    }

    event.preventDefault();

    const dialog =
        trigger.closest(
            "#aiResultDialog"
        );

    if (dialog) {

        dialog.remove();

        document.body.classList.remove(
            "modal-open"
        );
    }

    return true;
}


/* ============================================================
   40. PAGE LINK ROUTER
   ============================================================ */

function handlePageLink(
    event
) {

    const link =
        event.target.closest(
            "[data-page-link]"
        );

    if (!link) {
        return false;
    }

    event.preventDefault();

    navigateToPage(
        link.dataset.pageLink
    );

    return true;
}


/* ============================================================
   41. UNIVERSAL EVENT ROUTER
   ============================================================ */

function masterEventRouter(
    event
) {

    /*
     * Không chặn các thao tác
     * nhập liệu bình thường.
     */

    if (
        event.type ===
        "click"
    ) {

        /*
         * 1. MENU
         */

        const menu =
            event.target.closest(
                ".menu-item[data-page]"
            );

        if (menu) {

            event.preventDefault();

            navigateToPage(
                menu.dataset.page
            );

            return;
        }

        /*
         * 2. PAGE LINK
         */

        if (
            handlePageLink(
                event
            )
        ) {
            return;
        }

        /*
         * 3. SIDEBAR TOGGLE
         */

        const toggle =
            event.target.closest(
                "#menuToggle, #sidebarToggle"
            );

        if (toggle) {

            event.preventDefault();

            openMobileSidebar();

            return;
        }

        /*
         * 4. SIDEBAR CLOSE
         */

        const close =
            event.target.closest(
                "#sidebarClose"
            );

        if (close) {

            event.preventDefault();

            closeMobileSidebar();

            return;
        }

        /*
         * 5. OVERLAY
         */

        const overlay =
            event.target.closest(
                "#sidebarOverlay"
            );

        if (overlay) {

            event.preventDefault();

            closeMobileSidebar();

            return;
        }

        /*
         * 6. MODAL CLOSE
         */

        if (
            handleModalCloseClick(
                event
            )
        ) {
            return;
        }

        /*
         * 7. DYNAMIC DIALOG
         */

        if (
            handleDynamicClose(
                event
            )
        ) {
            return;
        }

        /*
         * 8. STUDENT ACTION
         */

        if (
            handleStudentAction(
                event
            )
        ) {
            return;
        }

        /*
         * 9. RECORD DELETE
         */

        if (
            handleRecordDelete(
                event
            )
        ) {
            return;
        }

        /*
         * 10. COPY LINK
         */

        if (
            handleCopyLink(
                event
            )
        ) {
            return;
        }

        /*
         * 11. DATA ACTION
         */

        if (
            handleDataAction(
                event
            )
        ) {
            return;
        }

        /*
         * 12. AI
         */

        const ai =
            event.target.closest(
                "[data-ai-action]"
            );

        if (ai) {

            event.preventDefault();

            handleAIAction(
                ai.dataset.aiAction
            );

            return;
        }

        /*
         * 13. SETTINGS
         */

        const setting =
            event.target.closest(
                "[data-setting]"
            );

        if (setting) {

            event.preventDefault();

            handleSetting(
                setting.dataset.setting
            );

            return;
        }

        /*
         * 14. MATERIAL
         */

        if (
            event.target.closest(
                "[data-material]"
            )
        ) {

            handleMaterialAction(
                event
            );

            return;
        }
    }
}


/* ============================================================
   42. SEARCH / CHANGE ROUTER
   ============================================================ */

function masterChangeRouter(
    event
) {

    const target =
        event.target;

    if (!target) {
        return;
    }

    if (
        target.matches(
            "#attendanceDate"
        )
    ) {

        safeRender(
            "attendance",
            renderAttendance
        );

        return;
    }

    if (
        target.matches(
            ".attendance-status"
        )
    ) {

        updateAttendanceSummary();

        return;
    }

    if (
        target.matches(
            "#schoolYearSelect"
        )
    ) {

        setText(
            "heroSchoolYear",
            target.options[
                target.selectedIndex
            ]?.text ||
            target.value
        );

        return;
    }

    if (
        target.matches(
            "#classSelect"
        )
    ) {

        setText(
            "heroClass",
            target.options[
                target.selectedIndex
            ]?.text ||
            target.value
        );

        return;
    }
}


/* ============================================================
   43. EVENT INITIALIZATION
   ============================================================ */

function initializeEvents() {

    if (UI.eventsBound) {
        return;
    }

    UI.eventsBound =
        true;

    /*
     * Một click router duy nhất.
     */

    document.addEventListener(
        "click",
        masterEventRouter
    );

    /*
     * Change router duy nhất.
     */

    document.addEventListener(
        "change",
        masterChangeRouter
    );

    /*
     * Search.
     */

    const studentSearch =
        byId(
            "studentSearch"
        );

    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            () => {

                safeRender(
                    "students",
                    renderStudents
                );
            }
        );
    }

    const studentStatusFilter =
        byId(
            "studentStatusFilter"
        );

    if (studentStatusFilter) {

        studentStatusFilter.addEventListener(
            "change",
            () => {

                safeRender(
                    "students",
                    renderStudents
                );
            }
        );
    }

    const violationSearch =
        byId(
            "violationSearch"
        );

    if (violationSearch) {

        violationSearch.addEventListener(
            "input",
            () => {

                safeRender(
                    "violations",
                    renderViolations
                );
            }
        );
    }

    const violationTypeFilter =
        byId(
            "violationTypeFilter"
        );

    if (violationTypeFilter) {

        violationTypeFilter.addEventListener(
            "change",
            () => {

                safeRender(
                    "violations",
                    renderViolations
                );
            }
        );
    }

    /*
     * Forms.
     */

    const studentForm =
        byId(
            "studentForm"
        );

    if (studentForm) {

        studentForm.addEventListener(
            "submit",
            handleStudentFormSubmit
        );
    }

    const violationForm =
        byId(
            "violationForm"
        );

    if (violationForm) {

        violationForm.addEventListener(
            "submit",
            handleViolationFormSubmit
        );
    }

    const rewardForm =
        byId(
            "rewardForm"
        );

    if (rewardForm) {

        rewardForm.addEventListener(
            "submit",
            handleRewardFormSubmit
        );
    }

    /*
     * Điểm danh.
     */

    const saveAttendanceButton =
        byId(
            "saveAttendance"
        );

    if (saveAttendanceButton) {

        saveAttendanceButton.addEventListener(
            "click",
            saveAttendance
        );
    }

    /*
     * ESC.
     */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeAllModals();

                const dialog =
                    byId(
                        "aiResultDialog"
                    );

                if (dialog) {
                    dialog.remove();
                }

                closeMobileSidebar();
            }
        }
    );
}


/* ============================================================
   44. DATE INITIALIZATION
   ============================================================ */

function initializeDates() {

    [
        "attendanceDate",
        "violationDate",
        "rewardDate"
    ].forEach(
        id => {

            const element =
                byId(id);

            if (
                element &&
                !element.value
            ) {

                element.value =
                    todayISO();
            }
        }
    );

    setText(
        "currentYear",
        new Date().getFullYear()
    );
}


/* ============================================================
   45. CLASS SELECTORS
   ============================================================ */

function initializeClassSelectors() {

    const yearSelect =
        byId(
            "schoolYearSelect"
        );

    const classSelect =
        byId(
            "classSelect"
        );

    if (yearSelect) {

        setText(
            "heroSchoolYear",
            yearSelect.options[
                yearSelect.selectedIndex
            ]?.text ||
            yearSelect.value
        );
    }

    if (classSelect) {

        setText(
            "heroClass",
            classSelect.options[
                classSelect.selectedIndex
            ]?.text ||
            classSelect.value
        );
    }
}


/* ============================================================
   46. EXPORT / BACKUP
   ============================================================ */

function exportReportSafe() {

    const download =
        dataFunction(
            "downloadClassBackup"
        );

    if (download) {

        try {

            const result =
                download();

            if (
                result !== false
            ) {

                showToast(
                    "Đã tạo file backup.",
                    "success"
                );

                return;
            }

        } catch (error) {

            console.error(
                "downloadClassBackup:",
                error
            );
        }
    }

    const exported =
        safeCall(
            "exportClassData"
        );

    if (
        !exported
    ) {

        showToast(
            "Data Engine chưa hỗ trợ xuất dữ liệu.",
            "error"
        );

        return;
    }

    const blob =
        new Blob(
            [
                typeof exported ===
                    "string"
                    ? exported
                    : JSON.stringify(
                        exported,
                        null,
                        2
                    )
            ],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        `QUAN_LY_LOP_HOC_LE_HOANG_${todayISO()}.json`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    setTimeout(
        () =>
            URL.revokeObjectURL(
                url
            ),
        1000
    );

    showToast(
        "Đã xuất dữ liệu.",
        "success"
    );
}


/* ============================================================
   47. REFRESH PIPELINE
   ============================================================ */

function refreshAll() {

    if (UI.renderLock) {
        return;
    }

    UI.renderLock =
        true;

    try {

        /*
         * DATA FIRST
         */

        initializeData();

        /*
         * SELECTS
         */

        updateStudentSelects();

        /*
         * CORE RENDER
         */

        safeRender(
            "dashboard",
            renderDashboard
        );

        safeRender(
            "students",
            renderStudents
        );

        safeRender(
            "attendance",
            renderAttendance
        );

        safeRender(
            "violations",
            renderViolations
        );

        safeRender(
            "rewards",
            renderRewards
        );

        safeRender(
            "learning",
            renderLearningSafe
        );

        safeRender(
            "comments",
            renderCommentsSafe
        );

        safeRender(
            "statistics",
            renderStatistics
        );

        safeRender(
            "student-links",
            renderStudentLinks
        );

        /*
         * CURRENT PAGE
         */

        const renderer =
            PAGE_RENDERERS[
                UI.currentPage
            ];

        if (
            renderer &&
            renderer !==
                PAGE_RENDERERS.dashboard
        ) {

            safeRender(
                UI.currentPage,
                renderer
            );
        }

        UI.lastRenderAt =
            Date.now();

    } finally {

        UI.renderLock =
            false;
    }
}


/* ============================================================
   48. PAGE RENDER REGISTRY
   ============================================================ */

PAGE_RENDERERS.dashboard =
    renderDashboard;

PAGE_RENDERERS.students =
    renderStudents;

PAGE_RENDERERS.attendance =
    renderAttendance;

PAGE_RENDERERS.violations =
    renderViolations;

PAGE_RENDERERS.rewards =
    renderRewards;

PAGE_RENDERERS.learning =
    renderLearningSafe;

PAGE_RENDERERS.comments =
    renderCommentsSafe;

PAGE_RENDERERS.statistics =
    renderStatistics;

PAGE_RENDERERS["student-links"] =
    renderStudentLinks;

PAGE_RENDERERS.materials =
    function () {};

PAGE_RENDERERS.ai =
    function () {};

PAGE_RENDERERS.settings =
    function () {};


/* ============================================================
   49. INITIALIZATION
   ============================================================ */

async function initializeApp() {

    if (UI.initialized) {
        return;
    }

    UI.initialized =
        true;

    console.info(
        "=============================================="
    );

    console.info(
        "QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG"
    );

    console.info(
        "SCRIPT.JS MASTER 4.1.1"
    );

    /*
     * DATA ENGINE TRƯỚC UI
     */

    const loaded =
        await loadDataEngine();

    if (!loaded) {

        UI.initialized =
            false;

        showToast(
            "Data Engine chưa sẵn sàng.",
            "error"
        );

        return;
    }

    UI.dataReady =
        true;

    /*
     * DATA INIT
     */

    initializeData();

    /*
     * CHECK
     */

    checkDataEngine();

    /*
     * UI EVENTS
     */

    initializeEvents();

    initializeDates();

    initializeClassSelectors();

    /*
     * SELECTS
     */

    updateStudentSelects();

    /*
     * INITIAL RENDER
     */

    safeRender(
        "dashboard",
        renderDashboard
    );

    safeRender(
        "students",
        renderStudents
    );

    safeRender(
        "attendance",
        renderAttendance
    );

    safeRender(
        "violations",
        renderViolations
    );

    safeRender(
        "rewards",
        renderRewards
    );

    safeRender(
        "learning",
        renderLearningSafe
    );

    safeRender(
        "comments",
        renderCommentsSafe
    );

    safeRender(
        "statistics",
        renderStatistics
    );

    safeRender(
        "student-links",
        renderStudentLinks
    );

    /*
     * DASHBOARD
     */

    navigateToPage(
        "dashboard"
    );

    console.info(
        "Data Engine:",
        checkDataEngine()
            ? "AVAILABLE"
            : "PARTIAL"
    );

    console.info(
        "Students:",
        getStudentsSafe().length
    );

    console.info(
        "=============================================="
    );
}


/* ============================================================
   50. DOM READY
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        {
            once: true
        }
    );

} else {

    initializeApp();
}


/* ============================================================
   51. PUBLIC API
   ============================================================ */

window.LopHocApp = {

    version:
        "4.1.1",

    navigateToPage,

    openModal,

    closeModal,

    closeAllModals,

    openMobileSidebar,

    closeMobileSidebar,

    openAddStudentModal,

    openImportStudents,

    importStudentFile,

    renderDashboard,

    renderStudents,

    renderAttendance,

    renderViolations,

    renderRewards,

    renderLearningSafe,

    renderCommentsSafe,

    renderStatistics,

    renderStudentLinks,

    updateStudentSelects,

    refreshAll,

    saveAttendance,

    prepareViolationModal,

    prepareRewardModal,

    showStudentProfile,

    openEditStudentModal,

    exportReportSafe,

    checkDataEngine
};


/* ============================================================
   52. GLOBAL COMPATIBILITY
   ============================================================ */

window.navigateToPage =
    navigateToPage;

window.openModal =
    openModal;

window.closeModal =
    closeModal;

window.closeAllModals =
    closeAllModals;

window.openAddStudentModal =
    openAddStudentModal;

window.openImportStudents =
    openImportStudents;

window.refreshAll =
    refreshAll;

window.renderStudents =
    renderStudents;

window.renderAttendance =
    renderAttendance;

window.renderViolations =
    renderViolations;

window.renderRewards =
    renderRewards;

window.updateStudentSelects =
    updateStudentSelects;


/* ============================================================
   END
   SCRIPT.JS 4.1.1
   MASTER UI CONTROLLER FULL SYNC
   ============================================================ */