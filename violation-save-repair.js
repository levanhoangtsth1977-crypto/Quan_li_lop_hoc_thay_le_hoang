/* ============================================================
   VI PHẠM — SAVE REPAIR 2.0
   ------------------------------------------------------------
   Chỉ xử lý form #violationForm.
   Hỗ trợ chọn nhiều học sinh từ dropdown tích chọn.
   ============================================================ */
(function () {
    'use strict';

    if (window.__LH_VIOLATION_SAVE_REPAIR_20__) return;
    window.__LH_VIOLATION_SAVE_REPAIR_20__ = true;

    const API = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
    const S = value => String(value ?? '').trim();

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
            const callback = `__LH_VIO_SAVE20_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const script = document.createElement('script');
            let finished = false;

            const finish = (error, data) => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                try { delete window[callback]; } catch (_) {}
                script.remove();
                error ? reject(error) : resolve(data);
            };

            const timer = setTimeout(() => finish(new Error('Google Apps Script không phản hồi.')), 20000);
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

    function selectedStudentIds(form) {
        const select = form.querySelector('#violationStudent');
        if (!select) return [];
        const values = Array.from(select.options)
            .filter(option => option.selected && S(option.value))
            .map(option => S(option.value));
        return [...new Set(values)];
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
            if (Array.isArray(window.violationRecords)) {
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

    async function refreshAfterSave() {
        const result = await jsonp('get_events');
        if (!result?.ok) throw new Error(result?.error || 'Không đọc lại được dữ liệu sau khi lưu.');
        const rows = Array.isArray(result.VI_PHAM) ? result.VI_PHAM : [];
        replaceLocalViolations(rows);
        if (typeof window.__LH_VIOLATIONS_MENU_API__?.refresh === 'function') {
            try { window.__LH_VIOLATIONS_MENU_API__.refresh(); } catch (_) {}
        }
        return rows;
    }

    async function saveForm(form, submitButton) {
        const studentIds = selectedStudentIds(form);
        const date = S(form.querySelector('#violationDate')?.value) || today();
        const type = S(form.querySelector('#violationType')?.value);
        const level = S(form.querySelector('#violationLevel')?.value) || 'light';
        const status = S(form.querySelector('#violationStatus')?.value) || 'monitoring';
        const action = S(form.querySelector('#violationAction')?.value);
        const note = S(form.querySelector('#violationNote')?.value);

        if (!studentIds.length || !type) {
            showMessage('Vui lòng chọn ít nhất một học sinh và nội dung vi phạm.', 'warning');
            return;
        }

        submitButton.disabled = true;
        const oldHTML = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

        try {
            for (const studentId of studentIds) {
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
                const response = await jsonp('save_event', {
                    payload: JSON.stringify({ sheet: 'VI_PHAM', record })
                });
                if (!response?.ok) {
                    throw new Error(response?.error || `Google Apps Script từ chối lưu học sinh ${studentId}.`);
                }
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

            showMessage(`Đã lưu ${studentIds.length} học sinh thành công. Danh sách hiện có ${rows.length} bản ghi.`, 'success');
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

    console.info('[VI PHẠM SAVE REPAIR 2.0] READY');
})();
