/* ============================================================
   VI PHẠM — SAVE REPAIR 1.0
   ------------------------------------------------------------
   Chỉ xử lý form #violationForm.
   - Không đụng HOC_SINH / DIEM_DANH / KHEN_THUONG / HOC_TAP.
   - Lưu trực tiếp vào Google Apps Script bằng JSONP.
   - Xác minh lại get_events sau khi lưu.
   - Đồng bộ lại bảng VI PHAM ngay sau khi lưu.
   ============================================================ */
(function () {
    'use strict';

    if (window.__LH_VIOLATION_SAVE_REPAIR_10__) return;
    window.__LH_VIOLATION_SAVE_REPAIR_10__ = true;

    const API = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

    const S = value => String(value ?? '').trim();

    const E = value => S(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    function today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function fmtDate(value) {
        const text = S(value);
        const m = text.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);
        return m ? `${m[3].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[1]}` : text;
    }

    function jsonp(action, params = {}) {
        return new Promise((resolve, reject) => {
            const callback = `__LH_VIO_SAVE_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const script = document.createElement('script');
            let finished = false;

            const finish = (error, data) => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                try { delete window[callback]; } catch (_) {}
                script.remove();
                if (error) reject(error);
                else resolve(data);
            };

            const timer = setTimeout(() => {
                finish(new Error('Google Apps Script không phản hồi.'));
            }, 20000);

            window[callback] = data => finish(null, data);
            script.onerror = () => finish(new Error('Không thể kết nối Google Apps Script.'));

            const query = new URLSearchParams({
                action,
                callback,
                _: String(Date.now()),
                ...params
            });

            script.src = `${API}?${query.toString()}`;
            document.head.appendChild(script);
        });
    }

    function students() {
        try {
            if (typeof window.GOOGLE_SHEETS_STUDENTS !== 'undefined' && Array.isArray(window.GOOGLE_SHEETS_STUDENTS)) {
                return window.GOOGLE_SHEETS_STUDENTS;
            }
        } catch (_) {}

        try {
            if (typeof window.students !== 'undefined' && Array.isArray(window.students)) {
                return window.students;
            }
        } catch (_) {}

        return [];
    }

    function studentName(record) {
        const direct = S(record?.studentName);
        if (direct) return direct;
        const id = S(record?.studentId);
        const match = students().find(item => S(item?.id) === id);
        return S(match?.name) || id || 'Học sinh';
    }

    function replaceLocalViolations(rows) {
        const list = Array.isArray(rows) ? rows : [];

        try {
            if (typeof violationRecords !== 'undefined' && Array.isArray(violationRecords)) {
                violationRecords.splice(0, violationRecords.length, ...list);
            }
        } catch (_) {}

        try {
            if (typeof APP_DATA !== 'undefined' && Array.isArray(APP_DATA.violations)) {
                APP_DATA.violations.splice(0, APP_DATA.violations.length, ...list);
            }
        } catch (_) {}

        try {
            if (typeof window.violationRecords !== 'undefined' && Array.isArray(window.violationRecords)) {
                window.violationRecords.splice(0, window.violationRecords.length, ...list);
            }
        } catch (_) {}
    }

    function showMessage(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        alert(message);
    }

    function renderViolationTable(rows) {
        const body = document.querySelector('#page-violations #violationTableBody') || document.getElementById('violationTableBody');
        if (!body) return;

        const list = Array.isArray(rows) ? rows : [];

        if (!list.length) {
            body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Các ghi nhận mới sẽ xuất hiện tại đây.</p></div></td></tr>';
        } else {
            const ordered = [...list].sort((a, b) => S(b.date).localeCompare(S(a.date)) || S(b.createdAt).localeCompare(S(a.createdAt)));
            body.innerHTML = ordered.map((record, index) => {
                const id = E(record.id || '');
                const content = E(record.type || record.content || record.noiDung || 'Khác');
                const action = E(record.action || record.resolution || 'Chưa ghi');
                return `<tr>
                    <td>${index + 1}</td>
                    <td><strong>${E(studentName(record))}</strong></td>
                    <td>${E(fmtDate(record.date))}</td>
                    <td>${content}</td>
                    <td>${action}</td>
                    <td>${id ? `<button type="button" class="icon-button danger" data-violation-delete="${id}" title="Xóa lượt vi phạm"><i class="fa-solid fa-trash"></i></button>` : ''}</td>
                </tr>`;
            }).join('');
        }

        const badge = document.getElementById('violationBadge');
        if (badge) badge.textContent = String(list.length);

        if (typeof window.__LH_VIOLATIONS_MENU_API__?.refresh === 'function') {
            try { window.__LH_VIOLATIONS_MENU_API__.refresh(); } catch (_) {}
        }
    }

    async function refreshAfterSave() {
        const result = await jsonp('get_events');
        if (!result?.ok) throw new Error(result?.error || 'Không đọc lại được dữ liệu sau khi lưu.');

        const rows = Array.isArray(result.VI_PHAM) ? result.VI_PHAM : [];
        replaceLocalViolations(rows);
        renderViolationTable(rows);
        return rows;
    }

    async function saveForm(form, submitButton) {
        const studentId = S(form.querySelector('#violationStudent')?.value);
        const date = S(form.querySelector('#violationDate')?.value) || today();
        const type = S(form.querySelector('#violationType')?.value);
        const level = S(form.querySelector('#violationLevel')?.value) || 'light';
        const status = S(form.querySelector('#violationStatus')?.value) || 'monitoring';
        const action = S(form.querySelector('#violationAction')?.value);
        const note = S(form.querySelector('#violationNote')?.value);

        if (!studentId || !type) {
            showMessage('Vui lòng chọn học sinh và nội dung vi phạm.', 'warning');
            return;
        }

        submitButton.disabled = true;
        const oldHTML = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

        const record = {
            id: '',
            studentId,
            date,
            type,
            level,
            status,
            action,
            note
        };

        try {
            const response = await jsonp('save_event', {
                payload: JSON.stringify({
                    sheet: 'VI_PHAM',
                    record
                })
            });

            if (!response?.ok) {
                throw new Error(response?.error || 'Google Apps Script từ chối lưu.');
            }

            const rows = await refreshAfterSave();

            form.reset();
            const dateInput = form.querySelector('#violationDate');
            if (dateInput) dateInput.value = today();

            try {
                if (typeof window.closeModal === 'function') window.closeModal('violationModal');
                else {
                    const modal = document.getElementById('violationModal');
                    if (modal) modal.hidden = true;
                }
            } catch (_) {}

            showMessage(`Đã lưu vi phạm thành công. Danh sách hiện có ${rows.length} bản ghi.`, 'success');
        } catch (error) {
            submitButton.disabled = false;
            submitButton.innerHTML = oldHTML;
            showMessage(`Lưu vi phạm thất bại: ${S(error?.message || error)}`, 'error');
        }
    }

    document.addEventListener('submit', event => {
        const form = event.target?.closest?.('#violationForm');
        if (!form) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const submitButton = form.querySelector('button[type="submit"]');
        if (!submitButton) return;

        saveForm(form, submitButton);
    }, true);

    console.info('[VI PHẠM SAVE REPAIR 1.0] READY');
})();
