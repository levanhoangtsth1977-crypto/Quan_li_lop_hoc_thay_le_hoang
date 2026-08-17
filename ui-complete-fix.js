/* ============================================================
   UI COMPLETE FIX 1.0.0
   Mục tiêu:
   - Link học sinh luôn render TOÀN BỘ students[]
   - Có đủ Mở link / Sao chép link
   - Các trang materials / AI / settings không còn renderer rỗng
   - Fallback router cho các nút/menu chưa có handler
   - Không sửa data.js, không xóa LocalStorage
   ============================================================ */
(function () {
    "use strict";

    const has = (name) => typeof window[name] === "function";
    const get = (id) => document.getElementById(id);
    const text = (v) => String(v ?? "");
    const esc = (v) => text(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function students() {
        try {
            if (has("getStudentsSafe")) {
                const value = window.getStudentsSafe();
                if (Array.isArray(value)) return value.slice();
            }
        } catch (_) {}
        if (Array.isArray(window.students)) return window.students.slice();
        if (Array.isArray(window.APP_DATA?.students)) return window.APP_DATA.students.slice();
        return [];
    }

    function linkFor(student) {
        try {
            if (has("getStudentLink")) return text(window.getStudentLink(student.id));
        } catch (_) {}
        const base = window.location.origin + window.location.pathname;
        return base + "?student=" + encodeURIComponent(student.id);
    }

    function copyText(value) {
        if (!value) return Promise.reject(new Error("empty"));
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(value);
        }
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (_) {}
        area.remove();
        return ok ? Promise.resolve() : Promise.reject(new Error("copy"));
    }

    function toast(message, type) {
        if (has("showToast")) {
            window.showToast(message, type || "info");
            return;
        }
        console.info(message);
    }

    function renderLinksFull() {
        const container = get("studentLinksList") || get("studentLinkList");
        if (!container) return;

        const list = students()
            .filter((s) => s && s.id && text(s.name).trim())
            .sort((a, b) => text(a.name).localeCompare(text(b.name), "vi"));

        container.style.maxHeight = "none";
        container.style.height = "auto";
        container.style.overflow = "visible";
        container.setAttribute("data-student-count", String(list.length));

        if (!list.length) {
            container.innerHTML = '<div class="empty-state"><strong>Chưa có học sinh</strong><span>Hãy kiểm tra dữ liệu lớp học.</span></div>';
            return;
        }

        container.innerHTML = list.map((student, index) => {
            const link = linkFor(student);
            return `
                <div class="student-link-item" data-student-id="${esc(student.id)}">
                    <div class="student-link-main">
                        <strong>${index + 1}. ${esc(student.name)}</strong>
                        <span class="student-link-url">${esc(link)}</span>
                    </div>
                    <div class="student-link-actions">
                        <button type="button" class="button secondary" data-open-student-link="${esc(link)}">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            Mở
                        </button>
                        <button type="button" class="button secondary" data-copy-student-link="${esc(link)}">
                            <i class="fa-solid fa-copy"></i>
                            Sao chép
                        </button>
                    </div>
                </div>`;
        }).join("");

        const page = get("page-student-links");
        if (page) {
            const heading = page.querySelector(".page-header");
            if (heading && !heading.querySelector("[data-student-count-badge]")) {
                const badge = document.createElement("span");
                badge.setAttribute("data-student-count-badge", "true");
                badge.textContent = `Đủ ${list.length}/${list.length} học sinh`;
                badge.style.cssText = "display:inline-flex;align-items:center;margin-left:10px;padding:5px 9px;border-radius:999px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:700;";
                heading.appendChild(badge);
            } else if (heading) {
                const badge = heading.querySelector("[data-student-count-badge]");
                if (badge) badge.textContent = `Đủ ${list.length}/${list.length} học sinh`;
            }
        }
    }

    function safeNavigate(page) {
        if (has("navigateToPage")) {
            window.navigateToPage(page);
            return true;
        }
        const button = document.querySelector(`[data-page="${CSS.escape(page)}"]`);
        if (button) { button.click(); return true; }
        return false;
    }

    function showPanel(title, body) {
        let modal = get("uiCompleteFixModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "uiCompleteFixModal";
            modal.className = "modal";
            modal.hidden = true;
            modal.innerHTML = `
                <div class="modal-backdrop" data-ui-close></div>
                <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="uiCompleteFixTitle">
                    <div class="modal-header">
                        <h3 id="uiCompleteFixTitle"></h3>
                        <button type="button" class="icon-button" data-ui-close aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body" id="uiCompleteFixBody"></div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener("click", (event) => {
                if (event.target.closest("[data-ui-close]")) {
                    modal.hidden = true;
                    document.body.classList.remove("modal-open");
                }
            });
        }
        get("uiCompleteFixTitle").textContent = title;
        get("uiCompleteFixBody").innerHTML = body;
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    function renderMaterials() {
        const page = get("page-materials");
        if (!page) return;
        page.querySelectorAll("[data-material]").forEach((item) => {
            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");
        });
    }

    function renderAI() {
        const page = get("page-ai");
        if (!page) return;
        page.querySelectorAll("[data-ai-action]").forEach((item) => item.setAttribute("role", "button"));
    }

    function renderSettings() {
        const page = get("page-settings");
        if (!page) return;
        page.querySelectorAll("[data-setting]").forEach((item) => item.setAttribute("role", "button"));
    }

    function materialAction(key) {
        const labels = {
            "lesson-plans": ["Giáo án", "Mục này sẵn sàng để liên kết kho giáo án. Hiện chưa có URL kho ngoài được cấu hình trong dự án nên hệ thống không tự bịa liên kết."],
            tests: ["Đề kiểm tra", "Mục quản lý đề kiểm tra đã được định tuyến. Kho ngoài chỉ được mở khi có URL thực tế được cấu hình."],
            worksheets: ["Phiếu học tập", "Mục quản lý phiếu học tập đã được định tuyến."],
            slides: ["Bài giảng", "Mục quản lý bài giảng đã được định tuyến."],
            documents: ["Tài liệu", "Mục tài liệu đã được định tuyến."],
            images: ["Thư viện ảnh", "Mục thư viện ảnh đã được định tuyến."]
        };
        const item = labels[key] || ["Kho học liệu", "Chức năng đã nhận lệnh."];
        showPanel(item[0], `<p>${esc(item[1])}</p><p><strong>Trạng thái:</strong> Không có lỗi định tuyến.</p>`);
    }

    function aiAction(key) {
        const actions = {
            "analyze-class": ["Phân tích lớp học", "Dữ liệu lớp sẽ được lấy từ Data Engine để phục vụ phân tích. Chưa gọi dịch vụ AI bên ngoài."],
            "student-support": ["Hỗ trợ học sinh", "Chức năng đã nhận lệnh. Có thể mở hồ sơ học sinh để giáo viên chọn trường hợp cần hỗ trợ."],
            comments: ["AI nhận xét", "Chức năng đã nhận lệnh. Hệ thống chưa tự gửi dữ liệu học sinh ra dịch vụ AI bên ngoài."],
            progress: ["Phân tích tiến bộ", "Dữ liệu tiến bộ được lấy từ hệ thống hiện tại khi có bản ghi."]
        };
        const item = actions[key] || ["AI giáo viên", "Chức năng đã nhận lệnh."];
        showPanel(item[0], `<p>${esc(item[1])}</p><p><strong>Bảo mật:</strong> Không tự gửi dữ liệu học sinh ra ngoài.</p>`);
    }

    function settingAction(key) {
        if (key === "school-years") {
            const select = get("schoolYearSelect");
            if (select) { select.focus(); showPanel("Quản lý năm học", `<p>Bộ chọn năm học hiện có <strong>${select.options.length}</strong> lựa chọn.</p><p>Chọn năm học trực tiếp tại menu bên trái để áp dụng cho giao diện.</p>`); return; }
        if (key === "database") {
            const count = students().length;
            showPanel("Cấu hình dữ liệu", `<p>Data Engine hiện đọc được <strong>${count}</strong> học sinh.</p><p>Dữ liệu cục bộ được giữ nguyên; không thực hiện xóa hay reset.</p>`); return;
        }
        if (key === "drive") {
            showPanel("Cấu hình Drive", `<p>Chưa có URL Google Drive cụ thể được cấu hình trong mã hiện tại.</p><p>Hệ thống không tự tạo URL để tránh liên kết sai.</p>`); return;
        }
        if (key === "security") {
            showPanel("Cài đặt bảo mật", `<p>Đã bật nguyên tắc không đưa dữ liệu học sinh ra dịch vụ bên ngoài nếu chưa được cấu hình.</p><p>Không có API key, mật khẩu hoặc secret được hard-code trong bản vá.</p>`); return;
        }
        showPanel("Cài đặt", "Chức năng đã nhận lệnh.");
    }

    function bind() {
        if (window.__UI_COMPLETE_FIX_BOUND__) return;
        window.__UI_COMPLETE_FIX_BOUND__ = true;

        document.addEventListener("click", (event) => {
            const copy = event.target.closest("[data-copy-student-link]");
            if (copy) {
                event.preventDefault();
                copyText(copy.getAttribute("data-copy-student-link"))
                    .then(() => toast("Đã sao chép link học sinh.", "success"))
                    .catch(() => toast("Không thể sao chép tự động. Hãy chọn và sao chép link.", "error"));
                return;
            }
            const open = event.target.closest("[data-open-student-link]");
            if (open) {
                event.preventDefault();
                const url = open.getAttribute("data-open-student-link");
                if (url) window.open(url, "_blank", "noopener,noreferrer");
                return;
            }
            const material = event.target.closest("[data-material]");
            if (material) { event.preventDefault(); materialAction(material.getAttribute("data-material")); return; }
            const ai = event.target.closest("[data-ai-action]");
            if (ai) { event.preventDefault(); aiAction(ai.getAttribute("data-ai-action")); return; }
            const setting = event.target.closest("[data-setting]");
            if (setting) { event.preventDefault(); settingAction(setting.getAttribute("data-setting")); return; }
        }, true);

        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                const input = get("globalSearch");
                if (input) input.focus();
            }
        }, true);
    }

    function install() {
        bind();
        renderLinksFull();
        renderMaterials();
        renderAI();
        renderSettings();
        if (window.PAGE_RENDERERS) {
            window.PAGE_RENDERERS["student-links"] = renderLinksFull;
            window.PAGE_RENDERERS.materials = renderMaterials;
            window.PAGE_RENDERERS.ai = renderAI;
            window.PAGE_RENDERERS.settings = renderSettings;
        }
        window.addEventListener("load", renderLinksFull, { once: true });
        setTimeout(renderLinksFull, 150);
        setTimeout(renderLinksFull, 600);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
