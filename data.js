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

    systemName:
        "QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG",

    teacherName:
        "Lê Hoàng",

    schoolYear:
        "2026–2027",

    className:
        "5C",

    grade:
        "5",

    /*
       Đây là GIỚI HẠN TỐI ĐA.
       Không phải số học sinh mặc định.
    */
    maxStudents:
        50,

    dataVersion:
        "3.1.1",

    storageKey:
        "QL_LOP_HOC_LE_HOANG_2026_2027"
};


/* ============================================================
   2. CẤU HÌNH LINK HỌC SINH
   ============================================================ */

const STUDENT_LINK_CONFIG = {

    enabled:
        true,

    parameterName:
        "student",

    showLearning:
        true,

    showAttendance:
        true,

    showViolations:
        true,

    showRewards:
        true,

    showProgress:
        true,

    showComments:
        true,

    showPrivateInformation:
        false
};


/* ============================================================
   3. NGUỒN DỮ LIỆU CHÍNH
   ------------------------------------------------------------
   QUAN TRỌNG:
   Dùng let để script.js có thể đọc trực tiếp trong
   classic script.
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

    config:
        CLASS_CONFIG,

    students:
        students,

    attendance:
        attendanceRecords,

    violations:
        violationRecords,

    rewards:
        rewardRecords,

    learning:
        learningRecords,

    progress:
        progressRecords,

    comments:
        commentRecords
};


/* ============================================================
   5. TIỆN ÍCH CHUẨN HÓA TEXT
   ============================================================ */

function safeString(
    value,
    fallback = ""
) {

    if (
        value === null ||
        value === undefined
    ) {

        return fallback;
    }

    return String(
        value
    ).trim();
}


function normalizeText(
    value
) {

    return safeString(
        value
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function normalizeName(
    value
) {

    return normalizeText(
        value
    );
}


function normalizeKey(
    value
) {

    return normalizeText(
        value
    )
        .toLocaleLowerCase(
            "vi"
        );
}


function normalizeBoolean(
    value,
    defaultValue = false
) {

    if (
        typeof value ===
        "boolean"
    ) {

        return value;
    }

    if (
        value === "true" ||
        value === "1" ||
        value === 1 ||
        value === "yes" ||
        value === "y"
    ) {

        return true;
    }

    if (
        value === "false" ||
        value === "0" ||
        value === 0 ||
        value === "no" ||
        value === "n"
    ) {

        return false;
    }

    return defaultValue;
}


function normalizeArray(
    value
) {

    return Array.isArray(
        value
    )
        ? value
        : [];
}


/* ============================================================
   6. TẠO ID
   ============================================================ */

function createId(
    prefix = "ID"
) {

    const time =
        Date.now().toString(
            36
        );

    const random =
        Math.random()
            .toString(36)
            .substring(
                2,
                10
            );

    return (
        String(prefix) +
        "_" +
        time +
        "_" +
        random
    );
}


/* ============================================================
   7. NGÀY
   ============================================================ */

function getTodayISO() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );

    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function getNowISO() {

    return new Date()
        .toISOString();
}


/* ============================================================
   8. LOCAL STORAGE
   ============================================================ */

function isLocalStorageAvailable() {

    try {

        const testKey =
            "__QL_LOP_HOC_TEST__";

        localStorage.setItem(
            testKey,
            "1"
        );

        localStorage.removeItem(
            testKey
        );

        return true;

    } catch (
        error
    ) {

        return false;
    }
}


/* ============================================================
   9. ĐỒNG BỘ APP_DATA
   ============================================================ */

function syncAppDataReferences() {

    APP_DATA.config =
        CLASS_CONFIG;

    APP_DATA.students =
        students;

    APP_DATA.attendance =
        attendanceRecords;

    APP_DATA.violations =
        violationRecords;

    APP_DATA.rewards =
        rewardRecords;

    APP_DATA.learning =
        learningRecords;

    APP_DATA.progress =
        progressRecords;

    APP_DATA.comments =
        commentRecords;
}


/* ============================================================
   10. CHUẨN HÓA HỌC SINH
   ============================================================ */

function normalizeStudent(
    source,
    index = 0
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    const now =
        getNowISO();

    const id =
        normalizeText(
            data.id
        ) ||
        createId(
            "STU"
        );

    const name =
        normalizeName(
            data.name
        );

    const studentCode =
        normalizeText(
            data.studentCode
        ) ||
        normalizeText(
            data.code
        ) ||
        (
            "HS" +
            String(
                index + 1
            )
                .padStart(
                    2,
                    "0"
                )
        );

    return {

        id:
            id,

        name:
            name,

        gender:
            normalizeText(
                data.gender
            ),

        birthDate:
            normalizeText(
                data.birthDate
            ),

        status:
            normalizeText(
                data.status
            ) ||
            "active",

        parentName:
            normalizeText(
                data.parentName
            ),

        phone:
            normalizeText(
                data.phone
            ),

        address:
            normalizeText(
                data.address
            ),

        note:
            normalizeText(
                data.note
            ),

        studentCode:
            studentCode,

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            now,

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            now,

        shareEnabled:
            normalizeBoolean(
                data.shareEnabled,
                true
            )
    };
}


/* ============================================================
   11. CHUẨN HÓA ĐIỂM DANH
   ============================================================ */

function normalizeAttendanceRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    const validStatuses = [

        "present",

        "excused",

        "absent"

    ];

    const status =
        validStatuses.includes(
            data.status
        )
            ? data.status
            : "present";

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "ATT"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        status:
            status,

        note:
            normalizeText(
                data.note
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   12. CHUẨN HÓA VI PHẠM
   ============================================================ */

function normalizeViolationRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    const validLevels = [

        "light",

        "attention",

        "serious"

    ];

    const validStatuses = [

        "monitoring",

        "resolved"

    ];

    const level =
        validLevels.includes(
            data.level
        )
            ? data.level
            : "light";

    const status =
        validStatuses.includes(
            data.status
        )
            ? data.status
            : "monitoring";

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "VIO"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        type:
            normalizeText(
                data.type
            ) ||
            "other",

        level:
            level,

        status:
            status,

        action:
            normalizeText(
                data.action
            ),

        note:
            normalizeText(
                data.note
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   13. CHUẨN HÓA KHEN THƯỞNG
   ============================================================ */

function normalizeRewardRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "REW"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        type:
            normalizeText(
                data.type
            ) ||
            "other",

        formType:
            normalizeText(
                data.formType
            ) ||
            "praise",

        note:
            normalizeText(
                data.note
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   14. CHUẨN HÓA HỌC TẬP
   ============================================================ */

function normalizeLearningRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "LRN"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        subject:
            normalizeText(
                data.subject
            ),

        result:
            normalizeText(
                data.result
            ),

        level:
            normalizeText(
                data.level
            ),

        note:
            normalizeText(
                data.note
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   15. CHUẨN HÓA TIẾN BỘ
   ============================================================ */

function normalizeProgressRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "PRO"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        category:
            normalizeText(
                data.category
            ) ||
            "general",

        before:
            normalizeText(
                data.before
            ),

        after:
            normalizeText(
                data.after
            ),

        result:
            normalizeText(
                data.result
            ),

        note:
            normalizeText(
                data.note
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   16. CHUẨN HÓA NHẬN XÉT
   ============================================================ */

function normalizeCommentRecord(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    return {

        id:
            normalizeText(
                data.id
            ) ||
            createId(
                "COM"
            ),

        studentId:
            normalizeText(
                data.studentId
            ),

        date:
            normalizeText(
                data.date
            ) ||
            getTodayISO(),

        content:
            normalizeText(
                data.content
            ),

        type:
            normalizeText(
                data.type
            ) ||
            "general",

        visibleToStudent:
            normalizeBoolean(
                data.visibleToStudent,
                true
            ),

        createdAt:
            normalizeText(
                data.createdAt
            ) ||
            getNowISO(),

        updatedAt:
            normalizeText(
                data.updatedAt
            ) ||
            getNowISO()
    };
}


/* ============================================================
   17. CHUẨN HÓA TOÀN BỘ DỮ LIỆU
   ------------------------------------------------------------
   KHÔNG loại học sinh trùng tên.
   Hai học sinh cùng tên vẫn được giữ nếu có hai bản ghi.
   ============================================================ */

function normalizeAllData(
    source
) {

    const data =
        source &&
        typeof source ===
            "object"
            ? source
            : {};

    const rawStudents =
        normalizeArray(
            data.students
        );

    /*
       Không dùng slice để cắt dữ liệu trước khi kiểm tra.
       Chỉ giới hạn sau khi xác định số bản ghi thực tế.
    */

    if (
        rawStudents.length >
        CLASS_CONFIG.maxStudents
    ) {

        throw new Error(
            `Số học sinh vượt quá giới hạn ${CLASS_CONFIG.maxStudents}.`
        );
    }

    const normalizedStudents =
        rawStudents
            .map(
                (
                    item,
                    index
                ) =>
                    normalizeStudent(
                        item,
                        index
                    )
            )
            .filter(
                student =>
                    Boolean(
                        student.name
                    )
            );

    /*
       GIỮ NGUYÊN học sinh cùng tên.
       Không dedupe theo name.
    */

    students =
        normalizedStudents;


    attendanceRecords =
        normalizeArray(
            data.attendance
        )
            .map(
                normalizeAttendanceRecord
            );


    violationRecords =
        normalizeArray(
            data.violations
        )
            .map(
                normalizeViolationRecord
            );


    rewardRecords =
        normalizeArray(
            data.rewards
        )
            .map(
                normalizeRewardRecord
            );


    learningRecords =
        normalizeArray(
            data.learning
        )
            .map(
                normalizeLearningRecord
            );


    progressRecords =
        normalizeArray(
            data.progress
        )
            .map(
                normalizeProgressRecord
            );


    commentRecords =
        normalizeArray(
            data.comments
        )
            .map(
                normalizeCommentRecord
            );


    /*
       Chỉ giữ bản ghi có studentId
       thuộc danh sách hiện tại.
    */

    attendanceRecords =
        filterValidStudentRecords(
            attendanceRecords
        );

    violationRecords =
        filterValidStudentRecords(
            violationRecords
        );

    rewardRecords =
        filterValidStudentRecords(
            rewardRecords
        );

    learningRecords =
        filterValidStudentRecords(
            learningRecords
        );

    progressRecords =
        filterValidStudentRecords(
            progressRecords
        );

    commentRecords =
        filterValidStudentRecords(
            commentRecords
        );


    syncAppDataReferences();


    return true;
}


/* ============================================================
   18. LỌC BẢN GHI THEO STUDENT ID
   ============================================================ */

function filterValidStudentRecords(
    records
) {

    const validStudentIds =
        new Set(
            students.map(
                student =>
                    student.id
            )
        );

    return normalizeArray(
        records
    ).filter(
        record =>
            record &&
            validStudentIds.has(
                record.studentId
            )
    );
}


/* ============================================================
   19. LƯU DỮ LIỆU
   ============================================================ */

function saveClassData() {

    if (
        !isLocalStorageAvailable()
    ) {

        console.error(
            "LocalStorage không khả dụng."
        );

        return false;
    }


    syncAppDataReferences();


    const payload = {

        version:
            CLASS_CONFIG.dataVersion,

        savedAt:
            getNowISO(),

        config:
            CLASS_CONFIG,

        students:
            students,

        attendance:
            attendanceRecords,

        violations:
            violationRecords,

        rewards:
            rewardRecords,

        learning:
            learningRecords,

        progress:
            progressRecords,

        comments:
            commentRecords
    };


    try {

        localStorage.setItem(

            CLASS_CONFIG.storageKey,

            JSON.stringify(
                payload
            )

        );

        return true;

    } catch (
        error
    ) {

        console.error(
            "Không thể lưu dữ liệu:",
            error
        );

        return false;
    }
}


/* ============================================================
   20. ĐỌC DỮ LIỆU
   ============================================================ */

function loadClassData() {

    if (
        !isLocalStorageAvailable()
    ) {

        return false;
    }


    try {

        const raw =
            localStorage.getItem(
                CLASS_CONFIG.storageKey
            );


        if (!raw) {

            return false;
        }


        const data =
            JSON.parse(
                raw
            );


        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ) {

            console.error(
                "LocalStorage chứa dữ liệu không hợp lệ."
            );

            return false;
        }


        /*
           Không phá dữ liệu hiện tại nếu
           dữ liệu lưu trữ không hợp lệ.
        */

        const validation =
            validateImportObject(
                data
            );


        if (
            !validation.valid
        ) {

            console.warn(
                "LocalStorage không hợp lệ:",
                validation.errors
            );

            return false;
        }


        normalizeAllData(
            data
        );


        const check =
            validateClassData();


        if (
            !check.valid
        ) {

            console.warn(
                "Dữ liệu LocalStorage sau chuẩn hóa không hợp lệ:",
                check.errors
            );

            return false;
        }


        /*
           Lưu lại phiên bản đã chuẩn hóa.
        */

        saveClassData();


        return true;

    } catch (
        error
    ) {

        console.error(
            "Không thể đọc dữ liệu LocalStorage:",
            error
        );

        return false;
    }
}


/* ============================================================
   21. XÓA TOÀN BỘ DỮ LIỆU
   ============================================================ */

function clearClassData() {

    try {

        if (
            isLocalStorageAvailable()
        ) {

            localStorage.removeItem(
                CLASS_CONFIG.storageKey
            );
        }

    } catch (
        error
    ) {

        console.error(
            "Không thể xóa LocalStorage:",
            error
        );
    }


    /*
       Giữ reference hiện tại.
       Không gán lại [].
    */

    students.splice(
        0,
        students.length
    );

    attendanceRecords.splice(
        0,
        attendanceRecords.length
    );

    violationRecords.splice(
        0,
        violationRecords.length
    );

    rewardRecords.splice(
        0,
        rewardRecords.length
    );

    learningRecords.splice(
        0,
        learningRecords.length
    );

    progressRecords.splice(
        0,
        progressRecords.length
    );

    commentRecords.splice(
        0,
        commentRecords.length
    );


    syncAppDataReferences();


    return true;
}


/* ============================================================
   22. TÌM HỌC SINH THEO ID
   ============================================================ */

function getStudentById(
    studentId
) {

    const id =
        normalizeText(
            studentId
        );

    if (!id) {

        return null;
    }

    return (
        students.find(
            student =>
                student.id === id
        ) ||
        null
    );
}


/* ============================================================
   23. HỖ TRỢ SCRIPT.JS
   ============================================================ */

function getStudentByIdSafe(
    studentId
) {

    return getStudentById(
        studentId
    );
}


function getStudentsSafe() {

    return Array.isArray(
        students
    )
        ? students
        : [];
}


/* ============================================================
   24. TÌM HỌC SINH THEO TÊN
   ============================================================ */

function findStudentsByName(
    keyword
) {

    const text =
        normalizeKey(
            keyword
        );


    if (!text) {

        return [
            ...students
        ];
    }


    return students.filter(
        student =>
            normalizeKey(
                student.name
            )
                .includes(
                    text
                )
    );
}


/* ============================================================
   25. KIỂM TRA TÊN TRÙNG
   ------------------------------------------------------------
   CHỈ dùng để CẢNH BÁO.
   KHÔNG được dùng để tự động xóa.
   ============================================================ */

function isDuplicateStudentName(
    name,
    excludeId = null
) {

    const normalized =
        normalizeKey(
            name
        );


    if (!normalized) {

        return false;
    }


    return students.some(
        student => {

            if (
                excludeId &&
                student.id ===
                    excludeId
            ) {

                return false;
            }


            return (
                normalizeKey(
                    student.name
                ) ===
                normalized
            );
        }
    );
}


/* ============================================================
   26. THÊM HỌC SINH
   ============================================================ */

function addStudent(
    studentData = {}
) {

    if (
        students.length >=
        CLASS_CONFIG.maxStudents
    ) {

        return {

            success:
                false,

            message:
                `Lớp đã đạt giới hạn ${CLASS_CONFIG.maxStudents} học sinh.`
        };
    }


    const name =
        normalizeName(
            studentData.name
        );


    if (!name) {

        return {

            success:
                false,

            message:
                "Họ và tên không được để trống."
        };
    }


    /*
       Không chặn tên trùng.
       Hai học sinh cùng tên vẫn có thể tồn tại.
    */

    const now =
        getNowISO();


    const student =
        normalizeStudent(

            {

                ...studentData,

                id:
                    normalizeText(
                        studentData.id
                    ) ||
                    createId(
                        "STU"
                    ),

                name:
                    name,

                createdAt:
                    normalizeText(
                        studentData.createdAt
                    ) ||
                    now,

                updatedAt:
                    now
            },

            students.length
        );


    /*
       Không thay reference.
    */

    students.push(
        student
    );


    syncAppDataReferences();


    if (
        !saveClassData()
    ) {

        students.pop();

        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu học sinh vào LocalStorage."
        };
    }


    return {

        success:
            true,

        student:
            student,

        warning:
            isDuplicateStudentName(
                name,
                student.id
            )
                ? "Tên học sinh trùng với một học sinh khác trong danh sách."
                : ""
    };
}


/* ============================================================
   27. CẬP NHẬT HỌC SINH
   ============================================================ */

function updateStudent(
    studentId,
    changes = {}
) {

    const student =
        getStudentById(
            studentId
        );


    if (!student) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const backup =
        {
            ...student
        };


    const cleanedChanges =
        {
            ...changes
        };


    if (
        Object.prototype
            .hasOwnProperty.call(
                cleanedChanges,
                "name"
            )
    ) {

        cleanedChanges.name =
            normalizeName(
                cleanedChanges.name
            );


        if (
            !cleanedChanges.name
        ) {

            return {

                success:
                    false,

                message:
                    "Họ và tên không được để trống."
            };
        }
    }


    Object.keys(
        cleanedChanges
    ).forEach(
        key => {

            if (
                key ===
                "shareEnabled"
            ) {

                student[key] =
                    normalizeBoolean(
                        cleanedChanges[
                            key
                        ],
                        student[
                            key
                        ]
                    );

            } else {

                student[key] =
                    normalizeText(
                        cleanedChanges[
                            key
                        ]
                    );
            }
        }
    );


    student.updatedAt =
        getNowISO();


    if (
        !saveClassData()
    ) {

        Object.keys(
            backup
        ).forEach(
            key => {

                student[key] =
                    backup[key];
            }
        );


        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu thay đổi học sinh."
        };
    }


    return {

        success:
            true,

        student:
            student,

        warning:
            isDuplicateStudentName(
                student.name,
                student.id
            )
                ? "Tên học sinh trùng với một học sinh khác trong danh sách."
                : ""
    };
}


/* ============================================================
   28. XÓA HỌC SINH
   ============================================================ */

function deleteStudent(
    studentId
) {

    const index =
        students.findIndex(
            student =>
                student.id ===
                studentId
        );


    if (
        index === -1
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const backupStudent =
        students[index];


    const backupAttendance =
        attendanceRecords.filter(
            record =>
                record.studentId ===
                studentId
        );

    const backupViolations =
        violationRecords.filter(
            record =>
                record.studentId ===
                studentId
        );

    const backupRewards =
        rewardRecords.filter(
            record =>
                record.studentId ===
                studentId
        );

    const backupLearning =
        learningRecords.filter(
            record =>
                record.studentId ===
                studentId
        );

    const backupProgress =
        progressRecords.filter(
            record =>
                record.studentId ===
                studentId
        );

    const backupComments =
        commentRecords.filter(
            record =>
                record.studentId ===
                studentId
        );


    /*
       Giữ reference các Array.
    */

    students.splice(
        index,
        1
    );


    removeRecordsByStudentId(
        attendanceRecords,
        studentId
    );

    removeRecordsByStudentId(
        violationRecords,
        studentId
    );

    removeRecordsByStudentId(
        rewardRecords,
        studentId
    );

    removeRecordsByStudentId(
        learningRecords,
        studentId
    );

    removeRecordsByStudentId(
        progressRecords,
        studentId
    );

    removeRecordsByStudentId(
        commentRecords,
        studentId
    );


    syncAppDataReferences();


    if (
        !saveClassData()
    ) {

        /*
           Rollback.
        */

        students.splice(
            index,
            0,
            backupStudent
        );


        attendanceRecords.push(
            ...backupAttendance
        );

        violationRecords.push(
            ...backupViolations
        );

        rewardRecords.push(
            ...backupRewards
        );

        learningRecords.push(
            ...backupLearning
        );

        progressRecords.push(
            ...backupProgress
        );

        commentRecords.push(
            ...backupComments
        );


        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu thao tác xóa."
        };
    }


    return {

        success:
            true
    };
}


function removeRecordsByStudentId(
    records,
    studentId
) {

    for (
        let i =
            records.length - 1;

        i >= 0;

        i--
    ) {

        if (
            records[i].studentId ===
            studentId
        ) {

            records.splice(
                i,
                1
            );
        }
    }
}


/* ============================================================
   29. API THAY TOÀN BỘ DANH SÁCH HỌC SINH
   ------------------------------------------------------------
   Dùng cho IMPORT Excel.
   Đây là API quan trọng nhất của bản 3.1.1.
   ============================================================ */

function replaceStudents(
    importedStudents,
    options = {}
) {

    const source =
        normalizeArray(
            importedStudents
        );


    if (
        source.length >
        CLASS_CONFIG.maxStudents
    ) {

        return {

            success:
                false,

            message:
                `Danh sách có ${source.length} học sinh, vượt giới hạn ${CLASS_CONFIG.maxStudents}.`,

            statistics: {

                input:
                    source.length,

                accepted:
                    0,

                max:
                    CLASS_CONFIG.maxStudents
            }
        };
    }


    const prepared = [];

    const errors = [];


    source.forEach(
        (
            item,
            index
        ) => {

            const student =
                normalizeStudent(
                    item,
                    index
                );


            if (
                !student.name
            ) {

                return;
            }


            /*
               Không loại tên trùng.
            */

            prepared.push(
                student
            );
        }
    );


    /*
       Dùng ID để phát hiện trùng ID.
       Nếu ID trùng thì tạo ID mới cho bản ghi sau.
    */

    const usedIds =
        new Set();


    prepared.forEach(
        (
            student,
            index
        ) => {

            if (
                usedIds.has(
                    student.id
                )
            ) {

                const oldId =
                    student.id;

                student.id =
                    createId(
                        "STU"
                    );

                errors.push(
                    `Dòng ${index + 1}: ID '${oldId}' bị trùng, hệ thống đã tạo ID mới.`
                );
            }


            usedIds.add(
                student.id
            );
        }
    );


    if (
        !prepared.length
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh hợp lệ để nhập. Hãy kiểm tra cột 'Họ và tên'.",

            statistics: {

                input:
                    source.length,

                accepted:
                    0,

                rejected:
                    source.length,

                max:
                    CLASS_CONFIG.maxStudents
            },

            errors:
                errors
        };
    }


    /*
       Backup toàn bộ dữ liệu hiện tại.
    */

    const backupStudents =
        students.slice();

    const backupAttendance =
        attendanceRecords.slice();

    const backupViolations =
        violationRecords.slice();

    const backupRewards =
        rewardRecords.slice();

    const backupLearning =
        learningRecords.slice();

    const backupProgress =
        progressRecords.slice();

    const backupComments =
        commentRecords.slice();


    /*
       Thay nội dung Array.
       KHÔNG thay reference.
    */

    students.splice(
        0,
        students.length,
        ...prepared
    );


    /*
       Khi thay toàn bộ danh sách học sinh,
       các bản ghi cũ trỏ tới học sinh không còn
       trong danh sách phải được loại bỏ.
    */

    attendanceRecords.splice(
        0,
        attendanceRecords.length,
        ...filterValidStudentRecords(
            backupAttendance
        )
    );

    violationRecords.splice(
        0,
        violationRecords.length,
        ...filterValidStudentRecords(
            backupViolations
        )
    );

    rewardRecords.splice(
        0,
        rewardRecords.length,
        ...filterValidStudentRecords(
            backupRewards
        )
    );

    learningRecords.splice(
        0,
        learningRecords.length,
        ...filterValidStudentRecords(
            backupLearning
        )
    );

    progressRecords.splice(
        0,
        progressRecords.length,
        ...filterValidStudentRecords(
            backupProgress
        )
    );

    commentRecords.splice(
        0,
        commentRecords.length,
        ...filterValidStudentRecords(
            backupComments
        )
    );


    syncAppDataReferences();


    const validation =
        validateClassData();


    if (
        !validation.valid
    ) {

        students.splice(
            0,
            students.length,
            ...backupStudents
        );

        attendanceRecords.splice(
            0,
            attendanceRecords.length,
            ...backupAttendance
        );

        violationRecords.splice(
            0,
            violationRecords.length,
            ...backupViolations
        );

        rewardRecords.splice(
            0,
            rewardRecords.length,
            ...backupRewards
        );

        learningRecords.splice(
            0,
            learningRecords.length,
            ...backupLearning
        );

        progressRecords.splice(
            0,
            progressRecords.length,
            ...backupProgress
        );

        commentRecords.splice(
            0,
            commentRecords.length,
            ...backupComments
        );


        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Danh sách nhập không vượt qua kiểm tra dữ liệu.",

            errors:
                validation.errors,

            statistics: {

                input:
                    source.length,

                accepted:
                    0,

                rejected:
                    source.length
            }
        };
    }


    if (
        !saveClassData()
    ) {

        /*
           Rollback nếu LocalStorage lỗi.
        */

        students.splice(
            0,
            students.length,
            ...backupStudents
        );

        attendanceRecords.splice(
            0,
            attendanceRecords.length,
            ...backupAttendance
        );

        violationRecords.splice(
            0,
            violationRecords.length,
            ...backupViolations
        );

        rewardRecords.splice(
            0,
            rewardRecords.length,
            ...backupRewards
        );

        learningRecords.splice(
            0,
            learningRecords.length,
            ...backupLearning
        );

        progressRecords.splice(
            0,
            progressRecords.length,
            ...backupProgress
        );

        commentRecords.splice(
            0,
            commentRecords.length,
            ...backupComments
        );


        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu danh sách nhập vào LocalStorage."
        };
    }


    /*
       Kiểm tra cuối cùng.
    */

    const insertedCount =
        students.length;


    if (
        insertedCount !==
        prepared.length
    ) {

        return {

            success:
                false,

            message:
                "Dữ liệu sau khi nhập không khớp số lượng học sinh dự kiến.",

            statistics: {

                expected:
                    prepared.length,

                actual:
                    insertedCount
            }
        };
    }


    return {

        success:
            true,

        message:
            `Đã nhập ${insertedCount} học sinh.`,

        students:
            students,

        statistics: {

            input:
                source.length,

            accepted:
                insertedCount,

            rejected:
                source.length -
                prepared.length,

            max:
                CLASS_CONFIG.maxStudents
        },

        errors:
            errors
    };
}


/* ============================================================
   30. XÁC NHẬN HỌC SINH ĐÃ ĐƯỢC CHÈN
   ============================================================ */

function verifyStudentInserted(
    studentId
) {

    return Boolean(
        getStudentById(
            studentId
        )
    );
}


/* ============================================================
   31. DỮ LIỆU HỒ SƠ HỌC SINH
   ============================================================ */

function getStudentAttendance(
    studentId
) {

    return attendanceRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


function getStudentViolations(
    studentId
) {

    return violationRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


function getStudentRewards(
    studentId
) {

    return rewardRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


function getStudentLearning(
    studentId
) {

    return learningRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


function getStudentProgress(
    studentId
) {

    return progressRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


function getStudentComments(
    studentId
) {

    return commentRecords.filter(
        record =>
            record.studentId ===
            studentId
    );
}


/* ============================================================
   32. HỒ SƠ TỔNG HỢP
   ============================================================ */

function getStudentProfile(
    studentId
) {

    const student =
        getStudentById(
            studentId
        );


    if (!student) {

        return null;
    }


    return {

        student:
            student,

        attendance:
            getStudentAttendance(
                studentId
            ),

        violations:
            getStudentViolations(
                studentId
            ),

        rewards:
            getStudentRewards(
                studentId
            ),

        learning:
            getStudentLearning(
                studentId
            ),

        progress:
            getStudentProgress(
                studentId
            ),

        comments:
            getStudentComments(
                studentId
            )
    };
}


/* ============================================================
   33. ĐIỂM DANH
   ============================================================ */

function saveAttendanceRecord(
    studentId,
    date,
    status,
    note = ""
) {

    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const validStatuses = [

        "present",

        "excused",

        "absent"

    ];


    if (
        !validStatuses.includes(
            status
        )
    ) {

        return {

            success:
                false,

            message:
                "Trạng thái điểm danh không hợp lệ."
        };
    }


    const normalizedDate =
        normalizeText(
            date
        ) ||
        getTodayISO();


    const existing =
        attendanceRecords.find(
            record =>
                record.studentId ===
                    studentId &&
                record.date ===
                    normalizedDate
        );


    if (existing) {

        existing.status =
            status;

        existing.note =
            normalizeText(
                note
            );

        existing.updatedAt =
            getNowISO();

    } else {

        attendanceRecords.push({

            id:
                createId(
                    "ATT"
                ),

            studentId:
                studentId,

            date:
                normalizedDate,

            status:
                status,

            note:
                normalizeText(
                    note
                ),

            createdAt:
                getNowISO(),

            updatedAt:
                getNowISO()
        });
    }


    if (
        !saveClassData()
    ) {

        return {

            success:
                false,

            message:
                "Không thể lưu điểm danh."
        };
    }


    return {

        success:
            true
    };
}


function getAttendanceRecords() {

    return attendanceRecords;
}


/* ============================================================
   34. VI PHẠM
   ============================================================ */

function addViolation(
    data = {}
) {

    const studentId =
        normalizeText(
            data.studentId
        );


    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const record =
        normalizeViolationRecord({

            ...data,

            studentId:
                studentId
        });


    violationRecords.push(
        record
    );


    if (
        !saveClassData()
    ) {

        violationRecords.pop();

        return {

            success:
                false,

            message:
                "Không thể lưu bản ghi vi phạm."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function getViolationRecords() {

    return violationRecords;
}


function updateViolation(
    id,
    changes = {}
) {

    const record =
        violationRecords.find(
            item =>
                item.id ===
                id
        );


    if (!record) {

        return {

            success:
                false,

            message:
                "Không tìm thấy bản ghi vi phạm."
        };
    }


    const backup =
        {
            ...record
        };


    Object.assign(
        record,
        changes
    );


    record.updatedAt =
        getNowISO();


    if (
        !saveClassData()
    ) {

        Object.assign(
            record,
            backup
        );

        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu bản ghi vi phạm."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function deleteViolation(
    id
) {

    const index =
        violationRecords.findIndex(
            record =>
                record.id ===
                id
        );


    if (
        index === -1
    ) {

        return false;
    }


    const backup =
        violationRecords[index];


    violationRecords.splice(
        index,
        1
    );


    if (
        !saveClassData()
    ) {

        violationRecords.splice(
            index,
            0,
            backup
        );

        syncAppDataReferences();

        return false;
    }


    return true;
}


/* ============================================================
   35. KHEN THƯỞNG
   ============================================================ */

function addReward(
    data = {}
) {

    const studentId =
        normalizeText(
            data.studentId
        );


    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const record =
        normalizeRewardRecord({

            ...data,

            studentId:
                studentId
        });


    rewardRecords.push(
        record
    );


    if (
        !saveClassData()
    ) {

        rewardRecords.pop();

        return {

            success:
                false,

            message:
                "Không thể lưu khen thưởng."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function getRewardRecords() {

    return rewardRecords;
}


function updateReward(
    id,
    changes = {}
) {

    const record =
        rewardRecords.find(
            item =>
                item.id ===
                id
        );


    if (!record) {

        return {

            success:
                false,

            message:
                "Không tìm thấy bản ghi khen thưởng."
        };
    }


    const backup =
        {
            ...record
        };


    Object.assign(
        record,
        changes
    );


    record.updatedAt =
        getNowISO();


    if (
        !saveClassData()
    ) {

        Object.assign(
            record,
            backup
        );

        syncAppDataReferences();


        return {

            success:
                false,

            message:
                "Không thể lưu khen thưởng."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function deleteReward(
    id
) {

    const index =
        rewardRecords.findIndex(
            record =>
                record.id ===
                id
        );


    if (
        index === -1
    ) {

        return false;
    }


    const backup =
        rewardRecords[index];


    rewardRecords.splice(
        index,
        1
    );


    if (
        !saveClassData()
    ) {

        rewardRecords.splice(
            index,
            0,
            backup
        );

        syncAppDataReferences();

        return false;
    }


    return true;
}


/* ============================================================
   36. HỌC TẬP
   ============================================================ */

function addLearningRecord(
    data = {}
) {

    const studentId =
        normalizeText(
            data.studentId
        );


    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const record =
        normalizeLearningRecord({

            ...data,

            studentId:
                studentId
        });


    learningRecords.push(
        record
    );


    if (
        !saveClassData()
    ) {

        learningRecords.pop();

        return {

            success:
                false,

            message:
                "Không thể lưu dữ liệu học tập."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function getLearningRecords() {

    return learningRecords;
}


/* ============================================================
   37. TIẾN BỘ
   ============================================================ */

function addProgressRecord(
    data = {}
) {

    const studentId =
        normalizeText(
            data.studentId
        );


    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const record =
        normalizeProgressRecord({

            ...data,

            studentId:
                studentId
        });


    progressRecords.push(
        record
    );


    if (
        !saveClassData()
    ) {

        progressRecords.pop();

        return {

            success:
                false,

            message:
                "Không thể lưu dữ liệu tiến bộ."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function getProgressRecords() {

    return progressRecords;
}


/* ============================================================
   38. NHẬN XÉT
   ============================================================ */

function addComment(
    data = {}
) {

    const studentId =
        normalizeText(
            data.studentId
        );


    if (
        !getStudentById(
            studentId
        )
    ) {

        return {

            success:
                false,

            message:
                "Không tìm thấy học sinh."
        };
    }


    const record =
        normalizeCommentRecord({

            ...data,

            studentId:
                studentId
        });


    if (
        !record.content
    ) {

        return {

            success:
                false,

            message:
                "Nội dung nhận xét không được để trống."
        };
    }


    commentRecords.push(
        record
    );


    if (
        !saveClassData()
    ) {

        commentRecords.pop();

        return {

            success:
                false,

            message:
                "Không thể lưu nhận xét."
        };
    }


    return {

        success:
            true,

        record:
            record
    };
}


function getCommentRecords() {

    return commentRecords;
}


/* ============================================================
   39. THỐNG KÊ LỚP
   ============================================================ */

function getClassStatistics() {

    const activeStudents =
        students.filter(
            student =>
                student.status ===
                "active"
        ).length;


    const inactiveStudents =
        students.filter(
            student =>
                student.status !==
                "active"
        ).length;


    const today =
        getTodayISO();


    const todayAttendance =
        attendanceRecords.filter(
            record =>
                record.date ===
                today
        );


    const present =
        todayAttendance.filter(
            record =>
                record.status ===
                "present"
        ).length;


    const excused =
        todayAttendance.filter(
            record =>
                record.status ===
                "excused"
        ).length;


    const absent =
        todayAttendance.filter(
            record =>
                record.status ===
                "absent"
        ).length;


    return {

        totalStudents:
            students.length,

        activeStudents:
            activeStudents,

        inactiveStudents:
            inactiveStudents,

        todayAttendance:
            todayAttendance.length,

        present:
            present,

        excused:
            excused,

        absent:
            absent,

        totalViolations:
            violationRecords.length,

        monitoringViolations:
            violationRecords.filter(
                record =>
                    record.status ===
                    "monitoring"
            ).length,

        resolvedViolations:
            violationRecords.filter(
                record =>
                    record.status ===
                    "resolved"
            ).length,

        totalRewards:
            rewardRecords.length,

        totalLearning:
            learningRecords.length,

        totalProgress:
            progressRecords.length,

        totalComments:
            commentRecords.length
    };
}


/* ============================================================
   40. VI PHẠM ĐANG THEO DÕI
   ============================================================ */

function getMonitoringViolations() {

    return violationRecords.filter(
        record =>
            record.status ===
            "monitoring"
    );
}


/* ============================================================
   41. KHEN THƯỞNG GẦN NHẤT
   ============================================================ */

function getRecentRewards(
    limit = 10
) {

    const safeLimit =
        Math.max(
            0,
            Number(
                limit
            ) || 10
        );


    return [
        ...rewardRecords
    ]
        .sort(
            (
                a,
                b
            ) =>
                String(
                    b.date
                ).localeCompare(
                    String(
                        a.date
                    )
                )
        )
        .slice(
            0,
            safeLimit
        );
}


/* ============================================================
   42. TẠO LINK CÁ NHÂN
   ============================================================ */

function getStudentLink(
    studentId
) {

    if (
        !STUDENT_LINK_CONFIG.enabled
    ) {

        return "";
    }


    const student =
        getStudentById(
            studentId
        );


    if (!student) {

        return "";
    }


    if (
        typeof window ===
        "undefined"
    ) {

        return "";
    }


    const baseUrl =
        window.location.origin +
        window.location.pathname;


    return (

        baseUrl +
        "?" +
        STUDENT_LINK_CONFIG.parameterName +
        "=" +
        encodeURIComponent(
            student.id
        )
    );
}


/* ============================================================
   43. ĐỌC STUDENT ID TỪ URL
   ============================================================ */

function getStudentIdFromURL() {

    if (
        typeof window ===
        "undefined"
    ) {

        return null;
    }


    try {

        const params =
            new URLSearchParams(
                window.location.search
            );


        return params.get(
            STUDENT_LINK_CONFIG.parameterName
        );

    } catch (
        error
    ) {

        return null;
    }
}


/* ============================================================
   44. HỒ SƠ CÔNG KHAI
   ============================================================ */

function getStudentPublicProfile(
    studentId
) {

    const profile =
        getStudentProfile(
            studentId
        );


    if (!profile) {

        return null;
    }


    const student =
        profile.student;


    return {

        student: {

            id:
                student.id,

            name:
                student.name,

            gender:
                student.gender,

            birthDate:
                student.birthDate
        },

        learning:
            STUDENT_LINK_CONFIG.showLearning
                ? profile.learning
                : [],

        attendance:
            STUDENT_LINK_CONFIG.showAttendance
                ? profile.attendance
                : [],

        violations:
            STUDENT_LINK_CONFIG.showViolations
                ? profile.violations
                : [],

        rewards:
            STUDENT_LINK_CONFIG.showRewards
                ? profile.rewards
                : [],

        progress:
            STUDENT_LINK_CONFIG.showProgress
                ? profile.progress
                : [],

        comments:
            STUDENT_LINK_CONFIG.showComments
                ? profile.comments.filter(
                    item =>
                        item.visibleToStudent ===
                        true
                )
                : []
    };
}


/* ============================================================
   45. XUẤT TOÀN BỘ DỮ LIỆU
   ============================================================ */

function exportClassData() {

    syncAppDataReferences();


    return JSON.stringify(

        {

            exportedAt:
                getNowISO(),

            version:
                CLASS_CONFIG.dataVersion,

            config:
                CLASS_CONFIG,

            students:
                students,

            attendance:
                attendanceRecords,

            violations:
                violationRecords,

            rewards:
                rewardRecords,

            learning:
                learningRecords,

            progress:
                progressRecords,

            comments:
                commentRecords

        },

        null,

        2
    );
}


/* ============================================================
   46. TẢI BACKUP JSON
   ============================================================ */

function downloadClassBackup() {

    if (
        typeof document ===
        "undefined"
    ) {

        return false;
    }


    const json =
        exportClassData();


    const blob =
        new Blob(

            [json],

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
        (
            "QUAN_LY_LOP_HOC_" +
            "LE_HOANG_" +
            getTodayISO() +
            ".json"
        );


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


    return true;
}


/* ============================================================
   47. KIỂM TRA FILE IMPORT
   ============================================================ */

function validateImportObject(
    data
) {

    const errors = [];


    if (
        !data ||
        typeof data !==
            "object" ||
        Array.isArray(
            data
        )
    ) {

        errors.push(
            "Dữ liệu không phải đối tượng JSON hợp lệ."
        );


        return {

            valid:
                false,

            errors:
                errors
        };
    }


    if (
        !Array.isArray(
            data.students
        )
    ) {

        errors.push(
            "File không có trường 'students' dạng danh sách."
        );
    }


    if (
        Array.isArray(
            data.students
        ) &&
        data.students.length >
            CLASS_CONFIG.maxStudents
    ) {

        errors.push(
            `Số học sinh vượt quá ${CLASS_CONFIG.maxStudents}.`
        );
    }


    return {

        valid:
            errors.length ===
            0,

        errors:
            errors
    };
}


/* ============================================================
   48. NHẬP BACKUP JSON
   ============================================================ */

function importClassData(
    jsonText
) {

    if (
        typeof jsonText !==
        "string"
    ) {

        return {

            success:
                false,

            message:
                "Dữ liệu nhập vào không phải chuỗi JSON."
        };
    }


    const text =
        jsonText.trim();


    if (!text) {

        return {

            success:
                false,

            message:
                "File JSON đang trống."
        };
    }


    let data;


    try {

        data =
            JSON.parse(
                text
            );

    } catch (
        error
    ) {

        return {

            success:
                false,

            message:
                "File JSON bị lỗi cú pháp hoặc không hợp lệ."
        };
    }


    /*
       Hỗ trợ:
       {
          students: [...]
       }

       và:
       {
          data: {
             students: [...]
          }
       }
    */

    if (
        data.data &&
        typeof data.data ===
            "object" &&
        !Array.isArray(
            data.data
        ) &&
        Array.isArray(
            data.data.students
        )
    ) {

        data =
            data.data;
    }


    const validation =
        validateImportObject(
            data
        );


    if (
        !validation.valid
    ) {

        return {

            success:
                false,

            message:
                validation.errors.join(
                    "\n"
                ),

            errors:
                validation.errors
        };
    }


    const backup = {

        students:
            students.slice(),

        attendance:
            attendanceRecords.slice(),

        violations:
            violationRecords.slice(),

        rewards:
            rewardRecords.slice(),

        learning:
            learningRecords.slice(),

        progress:
            progressRecords.slice(),

        comments:
            commentRecords.slice()
    };


    try {

        normalizeAllData(
            data
        );


        const check =
            validateClassData();


        if (
            !check.valid
        ) {

            throw new Error(
                check.errors.join(
                    "\n"
                )
            );
        }


        if (
            !saveClassData()
        ) {

            throw new Error(
                "Không thể lưu dữ liệu nhập vào LocalStorage."
            );
        }


        return {

            success:
                true,

            message:
                "Đã nhập và chuẩn hóa dữ liệu thành công.",

            statistics:
                getClassStatistics()
        };

    } catch (
        error
    ) {

        /*
           Rollback.
        */

        students.splice(
            0,
            students.length,
            ...backup.students
        );

        attendanceRecords.splice(
            0,
            attendanceRecords.length,
            ...backup.attendance
        );

        violationRecords.splice(
            0,
            violationRecords.length,
            ...backup.violations
        );

        rewardRecords.splice(
            0,
            rewardRecords.length,
            ...backup.rewards
        );

        learningRecords.splice(
            0,
            learningRecords.length,
            ...backup.learning
        );

        progressRecords.splice(
            0,
            progressRecords.length,
            ...backup.progress
        );

        commentRecords.splice(
            0,
            commentRecords.length,
            ...backup.comments
        );


        syncAppDataReferences();


        return {

            success:
                false,

            message:
                error.message ||
                "Không thể nhập dữ liệu."
        };
    }
}


/* ============================================================
   49. KIỂM TRA DỮ LIỆU HIỆN TẠI
   ============================================================ */

function validateClassData() {

    const errors = [];


    if (
        !Array.isArray(
            students
        )
    ) {

        errors.push(
            "Danh sách học sinh không phải Array."
        );

    } else if (
        students.length >
        CLASS_CONFIG.maxStudents
    ) {

        errors.push(
            `Số học sinh vượt quá ${CLASS_CONFIG.maxStudents}.`
        );
    }


    const studentIds =
        new Set();


    students.forEach(
        (
            student,
            index
        ) => {

            if (
                !student ||
                typeof student !==
                    "object"
            ) {

                errors.push(
                    `Học sinh thứ ${index + 1} không phải đối tượng dữ liệu.`
                );

                return;
            }


            if (
                !student.id
            ) {

                errors.push(
                    `Học sinh thứ ${index + 1} thiếu ID.`
                );

            } else if (
                studentIds.has(
                    student.id
                )
            ) {

                errors.push(
                    `ID học sinh bị trùng: ${student.id}.`
                );

            } else {

                studentIds.add(
                    student.id
                );
            }


            if (
                !student.name
            ) {

                errors.push(
                    `Học sinh thứ ${index + 1} thiếu họ tên.`
                );
            }
        }
    );


    const recordGroups = [

        {

            name:
                "Điểm danh",

            records:
                attendanceRecords

        },

        {

            name:
                "Vi phạm",

            records:
                violationRecords

        },

        {

            name:
                "Khen thưởng",

            records:
                rewardRecords

        },

        {

            name:
                "Học tập",

            records:
                learningRecords

        },

        {

            name:
                "Tiến bộ",

            records:
                progressRecords

        },

        {

            name:
                "Nhận xét",

            records:
                commentRecords

        }

    ];


    recordGroups.forEach(
        group => {

            if (
                !Array.isArray(
                    group.records
                )
            ) {

                errors.push(
                    `${group.name} không phải danh sách hợp lệ.`
                );

                return;
            }


            group.records.forEach(
                (
                    record,
                    index
                ) => {

                    if (
                        !record ||
                        typeof record !==
                            "object"
                    ) {

                        errors.push(
                            `${group.name}: bản ghi thứ ${index + 1} không hợp lệ.`
                        );

                        return;
                    }


                    if (
                        !record.studentId
                    ) {

                        errors.push(
                            `${group.name}: bản ghi thứ ${index + 1} thiếu studentId.`
                        );

                        return;
                    }


                    if (
                        !studentIds.has(
                            record.studentId
                        )
                    ) {

                        errors.push(
                            `${group.name}: studentId '${record.studentId}' không tồn tại.`
                        );
                    }
                }
            );
        }
    );


    return {

        valid:
            errors.length ===
            0,

        errors:
            errors
    };
}


/* ============================================================
   50. SỬA DỮ LIỆU
   ============================================================ */

function repairClassData() {

    const before =
        validateClassData();


    const snapshot = {

        students:
            students.slice(),

        attendance:
            attendanceRecords.slice(),

        violations:
            violationRecords.slice(),

        rewards:
            rewardRecords.slice(),

        learning:
            learningRecords.slice(),

        progress:
            progressRecords.slice(),

        comments:
            commentRecords.slice()
    };


    try {

        normalizeAllData(
            snapshot
        );


        const after =
            validateClassData();


        if (
            after.valid
        ) {

            saveClassData();
        }


        return {

            before:
                before,

            after:
                after,

            repaired:
                true
        };

    } catch (
        error
    ) {

        students.splice(
            0,
            students.length,
            ...snapshot.students
        );

        attendanceRecords.splice(
            0,
            attendanceRecords.length,
            ...snapshot.attendance
        );

        violationRecords.splice(
            0,
            violationRecords.length,
            ...snapshot.violations
        );

        rewardRecords.splice(
            0,
            rewardRecords.length,
            ...snapshot.rewards
        );

        learningRecords.splice(
            0,
            learningRecords.length,
            ...snapshot.learning
        );

        progressRecords.splice(
            0,
            progressRecords.length,
            ...snapshot.progress
        );

        commentRecords.splice(
            0,
            commentRecords.length,
            ...snapshot.comments
        );


        syncAppDataReferences();


        return {

            before:
                before,

            after: {

                valid:
                    false,

                errors: [

                    error.message ||
                    "Không thể sửa dữ liệu."

                ]

            },

            repaired:
                false
        };
    }
}


/* ============================================================
   51. TRẠNG THÁI DATA ENGINE
   ============================================================ */

function getDataEngineStatus() {

    const validation =
        validateClassData();


    return {

        system:
            CLASS_CONFIG.systemName,

        version:
            CLASS_CONFIG.dataVersion,

        schoolYear:
            CLASS_CONFIG.schoolYear,

        className:
            CLASS_CONFIG.className,

        storageAvailable:
            isLocalStorageAvailable(),

        valid:
            validation.valid,

        errors:
            validation.errors,

        students:
            students.length,

        maxStudents:
            CLASS_CONFIG.maxStudents,

        attendance:
            attendanceRecords.length,

        violations:
            violationRecords.length,

        rewards:
            rewardRecords.length,

        learning:
            learningRecords.length,

        progress:
            progressRecords.length,

        comments:
            commentRecords.length
    };
}


/* ============================================================
   52. API LẤY TOÀN BỘ RECORD
   ------------------------------------------------------------
   Giúp script.js 4.0.0 đọc dữ liệu thống nhất.
   ============================================================ */

function getAttendanceRecords() {

    return attendanceRecords;
}


function getViolationRecords() {

    return violationRecords;
}


function getRewardRecords() {

    return rewardRecords;
}


function getLearningRecords() {

    return learningRecords;
}


function getProgressRecords() {

    return progressRecords;
}


function getCommentRecords() {

    return commentRecords;
}


/* ============================================================
   53. KHÔNG INITIALIZE Ở DATA.JS
   ------------------------------------------------------------
   script.js 4.0.0 chịu trách nhiệm:

       initializeData()
           ↓
       loadClassData()
           ↓
       syncAppDataReferences()
           ↓
       render...

   Không được load lần thứ hai tại đây.
   ============================================================ */


/* ============================================================
   54. THÔNG TIN KHỞI ĐỘNG
   ============================================================ */

syncAppDataReferences();


console.info(
    "DATA ENGINE:",
    CLASS_CONFIG.systemName
);

console.info(
    "DATA VERSION:",
    CLASS_CONFIG.dataVersion
);

console.info(
    "Năm học:",
    CLASS_CONFIG.schoolYear
);

console.info(
    "Lớp:",
    CLASS_CONFIG.className
);

console.info(
    "Giới hạn tối đa:",
    CLASS_CONFIG.maxStudents
);

console.info(
    "DATA ENGINE sẵn sàng — chờ script.js initializeData()."
);


/* ============================================================
   KẾT THÚC DATA.JS MASTER 3.1.1
   ============================================================ */