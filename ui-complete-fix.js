/* ============================================================
   UI COMPLETE FIX 1.1.0
   PURPOSE:
   - Always render ALL students from the Data Engine on Student Links.
   - Show an explicit X/X counter so missing records are visible.
   - Keep the list scrollable without a hard 16-item visual limit.
   - Provide real local UI for Materials / AI / Settings pages.
   - Do not invent external URLs, students, credentials or secrets.
   - Do not delete LocalStorage or alter data.js.
   ============================================================ */
(function () {
    "use strict";

    const has = (name) => typeof window[name] === "function";
    const get = (id) => document.getElementById(id);
    const text = (value) => String(value ?? "");
    const esc = (value) => text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function getStudents() {
        try {
            if (has("getStudentsSafe")) {
                const value = window.getStudentsSafe();
                if (Array.isArray(value)) return value.slice();
            }
        } catch (error) {
            console.error("UI FIX getStudentsSafe:", error);
        }

        if (Array.isArray(window.students)) return window.students.slice();
        if (Array.isArray(window.classData?.students)) return window.classData.students.slice();
        if (Array.isArray(window.appData?.students)) return window.appData.students.slice();
        return [];
    }

    function getStudentLink(student) {
        try {
            if (has("getStudentLink")) {
                const result = window.getStudentLink(student.id);
                if (result) return text(result);
            }
        } catch (error) {
            console.error("UI FIX getStudentLink:", error);
        }

        return window.location.origin + window.location.pathname +
            "?student=" + encodeURIComponent(student.id);
    }

    function toast(message, type) {
        if (has("showToast")) {
            window.showToast(message, type || "info");
        } else {
            console.info(message);
        }
    }

    function copyText(value) {
        if (!value) return Promise.reject(new Error("empty"));

        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(value);
        }

        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.focus();
        area.select();

        let copied = false;
        try {
            copied = document.execCommand("copy");
        } catch (error) {
            copied = false;
        }

        area.remove();
        return copied ? Promise.resolve() : Promise.reject(new Error("copy-failed"));
    }

    function findPage(page) {
        return document.querySelector(`[data-page-section="${page}"]`) ||
            get(`page-${page}`);
    }

    function ensurePageContent(page, title, description, cards) {
        const section = findPage(page);
        if (!section) return null;

        const existing = section.querySelector("[data-ui-complete-page]");
        if (existing) return existing;

        const wrapper = document.createElement("div");
        wrapper.dataset.uiCompletePage = page;
        wrapper.className = "ui-complete-page";

        wrapper.innerHTML = `
            <div class="section-heading">
                <div>
                    <h2>${esc(title)}</h2>
                    <p>${esc(description)}</p>
                </div>
            </div>
            <div class="stats-grid ui-complete-grid">
                ${cards.map(card => `
                    <article class="stat-card ui-complete-card">
                        <div class="stat-card-top">
                            <span class="stat-icon ${esc(card.kind || "student")}">
                                <i class="fa-solid ${esc(card.icon || "fa-circle-check")}"></i>
                            </span>
                        </div>
                        <strong class="stat-label">${esc(card.title)}</strong>
                        <p>${esc(card.description)}</p>
                        <button type="button" class="button ${esc(card.buttonClass || "secondary")}" ${card.actionAttr || ""}>
                            <i class="fa-solid ${esc(card.buttonIcon || "fa-arrow-right")}"></i>
                            ${esc(card.buttonText || "Mở")}
                        </button>
                    </article>
                `).join("")}
            </div>
        `;

        section.appendChild(wrapper);
        return wrapper;
    }

    function renderStudentLinksFull() {
        const container = get("studentLinksList") || get("studentLinkList");
        if (!container) return;

        const allStudents = getStudents()
            .filter(student => student && student.id && text(student.name).trim());

        const list = allStudents.slice().sort((a, b) =>
            text(a.name).localeCompare(text(b.name), "vi")
        );

        container.style.maxHeight = "70vh";
        container.style.height = "auto";
        container.style.overflowY = "auto";
        container.style.overflowX = "hidden";
        container.dataset.studentCount = String(list.length);

        const header = container.parentElement?.querySelector("[data-student-link-counter]");
        if (header) header.textContent = `Đang hiển thị ${list.length}/${allStudents.length} học sinh`;

        if (!list.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <strong>Chưa có học sinh</strong>
                    <p>Data Engine hiện không trả về danh sách học sinh.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map((student, index) => {
            const link = getStudentLink(student);
            return `
                <div class="student-link-item" data-student-id="${esc(student.id)}">
                    <div class="student-link-main">
                        <strong>${index + 1}. ${esc(student.name)}</strong>
                        <input type="text" readonly value="${esc(link)}" aria-label="Link ${esc(student.name)}">
                    </div>
                    <div class="student-link-actions">
                        <button type="button" class="button secondary" data-open-student-link="${esc(link)}">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Mở
                        </button>
                        <button type="button" class="button secondary" data-copy-student-link="${esc(link)}">
                            <i class="fa-solid fa-copy"></i> Sao chép
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderMaterialsPage() {
        ensurePageContent("materials", "Kho học liệu", "Mở đúng nhóm học liệu đã cấu hình trong hệ thống.", [
            { title: "Giáo án", description: "Quản lý và truy cập kho giáo án.", icon: "fa-file-lines", kind: "student", actionAttr: 'data-material="lesson-plans"', buttonText: "Mở giáo án" },
            { title: "Đề kiểm tra", description: "Kho đề kiểm tra và đánh giá.", icon: "fa-file-circle-check", kind: "attendance", actionAttr: 'data-material="tests"', buttonText: "Mở đề kiểm tra" },
            { title: "Phiếu học tập", description: "Kho phiếu học tập cho học sinh.", icon: "fa-sheet-plastic", kind: "reward", actionAttr: 'data-material="worksheets"', buttonText: "Mở phiếu" },
            { title: "Bài giảng", description: "Kho slide và bài giảng điện tử.", icon: "fa-display", kind: "student", actionAttr: 'data-material="slides"', buttonText: "Mở bài giảng" },
            { title: "Tài liệu", description: "Tài liệu tham khảo và chuyên môn.", icon: "fa-folder-open", kind: "attendance", actionAttr: 'data-material="documents"', buttonText: "Mở tài liệu" },
            { title: "Thư viện ảnh", description: "Kho hình ảnh phục vụ dạy học.", icon: "fa-images", kind: "reward", actionAttr: 'data-material="images"', buttonText: "Mở thư viện" }
        ]);
    }

    function renderAIPage() {
        ensurePageContent("ai", "AI giáo viên", "Các công cụ AI nội bộ dựa trên dữ liệu hiện có của lớp.", [
            { title: "Phân tích lớp học", description: "Tổng hợp sĩ số, chuyên cần, vi phạm, khen thưởng và tiến bộ.", icon: "fa-chart-line", kind: "student", actionAttr: 'data-ai-action="analyze-class"', buttonText: "Phân tích" },
            { title: "Hỗ trợ học sinh", description: "Xem nhanh dữ liệu để giáo viên xác định học sinh cần quan tâm.", icon: "fa-user-graduate", kind: "attendance", actionAttr: 'data-ai-action="student-support"', buttonText: "Xem hỗ trợ" },
            { title: "AI nhận xét", description: "Gợi ý nhận xét tham khảo; giáo viên kiểm tra trước khi sử dụng.", icon: "fa-pen-to-square", kind: "reward", actionAttr: 'data-ai-action="comments"', buttonText: "Gợi ý nhận xét" },
            { title: "Phân tích tiến bộ", description: "Tổng hợp dữ liệu tiến bộ đã được giáo viên ghi nhận.", icon: "fa-arrow-trend-up", kind: "student", actionAttr: 'data-ai-action="progress"', buttonText: "Phân tích tiến bộ" }
        ]);
    }

    function renderSettingsPage() {
        ensurePageContent("settings", "Cài đặt", "Quản lý năm học, dữ liệu, kết nối và sao lưu.", [
            { title: "Năm học", description: "Kiểm tra bộ chọn năm học hiện có.", icon: "fa-calendar-days", kind: "student", actionAttr: 'data-setting="school-years"', buttonText: "Quản lý năm học" },
            { title: "Dữ liệu lớp", description: "Kiểm tra số học sinh mà Data Engine đang cung cấp.", icon: "fa-database", kind: "attendance", actionAttr: 'data-setting="database"', buttonText: "Kiểm tra dữ liệu" },
            { title: "Google Drive", description: "Xem trạng thái cấu hình Drive; không tự tạo URL giả.", icon: "fa-hard-drive", kind: "reward", actionAttr: 'data-setting="drive"', buttonText: "Kiểm tra Drive" },
            { title: "Bảo mật", description: "Kiểm tra các nguyên tắc bảo vệ dữ liệu trên giao diện.", icon: "fa-shield-halved", kind: "student", actionAttr: 'data-setting="security"', buttonText: "Kiểm tra bảo mật" },
            { title: "Sao lưu", description: "Xuất dữ liệu lớp học bằng chức năng Data Engine nếu được hỗ trợ.", icon: "fa-download", kind: "attendance", actionAttr: 'data-setting="backup"', buttonText: "Sao lưu dữ liệu" }
        ]);
    }

    function bind() {
        if (window.__UI_COMPLETE_FIX_BOUND__) return;
        window.__UI_COMPLETE_FIX_BOUND__ = true;

        document.addEventListener("click", event => {
            const copy = event.target.closest("[data-copy-student-link]");
            if (copy) {
                event.preventDefault();
                copyText(copy.dataset.copyStudentLink)
                    .then(() => toast("Đã sao chép link học sinh.", "success"))
                    .catch(() => toast("Không thể sao chép tự động.", "error"));
                return;
            }

            const open = event.target.closest("[data-open-student-link]");
            if (open) {
                event.preventDefault();
                window.open(open.dataset.openStudentLink, "_blank", "noopener,noreferrer");
                return;
            }
        }, true);

        document.addEventListener("keydown", event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                get("globalSearch")?.focus();
            }
        }, true);
    }

    function install() {
        bind();
        renderStudentLinksFull();
        renderMaterialsPage();
        renderAIPage();
        renderSettingsPage();

        if (window.PAGE_RENDERERS) {
            window.PAGE_RENDERERS["student-links"] = renderStudentLinksFull;
            window.PAGE_RENDERERS.materials = renderMaterialsPage;
            window.PAGE_RENDERERS.ai = renderAIPage;
            window.PAGE_RENDERERS.settings = renderSettingsPage;
        }

        setTimeout(renderStudentLinksFull, 150);
        setTimeout(renderStudentLinksFull, 600);
        setTimeout(renderStudentLinksFull, 1500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
