/* GOOGLE SHEETS RECORDS BRIDGE 6.0 — AUTHORITATIVE EVENT WRITE */
(function () {
    'use strict';

    if (window.__LH_GOOGLE_RECORDS_BRIDGE_600__) return;
    window.__LH_GOOGLE_RECORDS_BRIDGE_600__ = true;

    const API = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

    const clean = v => String(v ?? '').trim().replace(/\s+/g, ' ');
    const now = () => new Date().toISOString();
    const today = () => {
        const d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    };
    const makeId = p => p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    const isPresent = r => /^(present|có mặt|co mat)$/i.test(clean(r && r.status));

    function getArray(getter, appKey) {
        try {
            if (typeof window[getter] === 'function') {
                const a = window[getter]();
                if (Array.isArray(a)) return a;
            }
        } catch (e) {
            console.warn('[LH600 getter]', getter, e);
        }
        try {
            if (window.APP_DATA && Array.isArray(window.APP_DATA[appKey])) return window.APP_DATA[appKey];
        } catch (_) {}
        return [];
    }

    function snapshot() {
        return {
            DIEM_DANH: getArray('getAttendanceRecords', 'attendance').filter(r => clean(r.studentId) && !isPresent(r)),
            VI_PHAM: getArray('getViolationRecords', 'violations').filter(r => clean(r.studentId)),
            KHEN_THUONG: getArray('getRewardRecords', 'rewards').filter(r => clean(r.studentId))
        };
    }

    function jsonp(action) {
        return new Promise((resolve, reject) => {
            const cb = 'LH600_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            const script = document.createElement('script');
            let done = false;
            const timer = setTimeout(() => finish(new Error('Google Sheets timeout')), 15000);

            function finish(error, data) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (_) {}
                script.remove();
                error ? reject(error) : resolve(data);
            }

            window[cb] = data => finish(null, data);
            script.onerror = () => finish(new Error('Không truy cập được Google Apps Script'));
            script.src = API + '?action=' + encodeURIComponent(action) +
                '&callback=' + encodeURIComponent(cb) + '&_=' + Date.now();
            document.head.appendChild(script);
        });
    }

    /*
     * QUAN TRỌNG:
     * Không dùng fetch(no-cors) làm đường ghi chính.
     * fetch(no-cors) có thể resolve dù Web App không xử lý payload.
     * Dùng HTML FORM -> iframe để Apps Script nhận chắc chắn e.parameter.payload.
     */
    function postAuthoritative(payload) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const name = 'LH600_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            const iframe = document.createElement('iframe');
            const form = document.createElement('form');
            const input = document.createElement('input');

            iframe.name = name;
            iframe.style.display = 'none';
            iframe.setAttribute('aria-hidden', 'true');

            form.method = 'POST';
            form.target = name;
            form.action = API;
            form.style.display = 'none';

            input.type = 'hidden';
            input.name = 'payload';
            input.value = data;
            form.appendChild(input);

            document.body.appendChild(iframe);
            document.body.appendChild(form);

            let settled = false;
            const finish = ok => {
                if (settled) return;
                settled = true;
                setTimeout(() => {
                    try { iframe.remove(); } catch (_) {}
                    try { form.remove(); } catch (_) {}
                }, 2000);
                if (ok) resolve({ ok: true, transport: 'form-iframe' });
                else reject(new Error('Không gửi được dữ liệu tới Google Sheets'));
            };

            try {
                form.submit();
                setTimeout(() => finish(true), 900);
            } catch (error) {
                finish(false);
            }
        });
    }

    function renderAll() {
        try { if (typeof window.syncAppDataReferences === 'function') window.syncAppDataReferences(); } catch (_) {}
        try { if (typeof window.renderAttendance === 'function') window.renderAttendance(); } catch (_) {}
        try { if (typeof window.renderViolations === 'function') window.renderViolations(); } catch (_) {}
        try { if (typeof window.renderRewards === 'function') window.renderRewards(); } catch (_) {}
        try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (_) {}
        try { if (typeof window.updateBadges === 'function') window.updateBadges(); } catch (_) {}
    }

    function replaceArray(getter, appKey, records) {
        const target = getArray(getter, appKey);
        const list = Array.isArray(records) ? records : [];
        try {
            target.splice(0, target.length, ...list);
        } catch (_) {}
        try {
            if (window.APP_DATA && Array.isArray(window.APP_DATA[appKey])) {
                window.APP_DATA[appKey].splice(0, window.APP_DATA[appKey].length, ...list);
            }
        } catch (_) {}
    }

    function applyFromGoogle(data) {
        if (!data || data.ok !== true) return false;

        const attendance = (data.DIEM_DANH || []).filter(r => clean(r.studentId) && !isPresent(r));
        const violations = (data.VI_PHAM || []).filter(r => clean(r.studentId));
        const rewards = (data.KHEN_THUONG || []).filter(r => clean(r.studentId));

        replaceArray('getAttendanceRecords', 'attendance', attendance);
        replaceArray('getViolationRecords', 'violations', violations);
        replaceArray('getRewardRecords', 'rewards', rewards);
        renderAll();

        window.GOOGLE_SHEET_EVENT_DATA = {
            version: '6.0',
            mode: 'AUTHORITATIVE_REPLACE',
            loadedAt: now(),
            tabs: data,
            counts: {
                attendance: attendance.length,
                violations: violations.length,
                rewards: rewards.length
            }
        };

        window.dispatchEvent(new CustomEvent('google-sheet-events-ready', {
            detail: window.GOOGLE_SHEET_EVENT_DATA
        }));
        return true;
    }

    let lastSnapshot = '';
    let busy = false;
    let bootstrapped = false;

    function snapshotKey() {
        try { return JSON.stringify(snapshot()); } catch (_) { return ''; }
    }

    async function pull() {
        if (busy) return null;
        try {
            busy = true;
            const data = await jsonp('get_events');
            applyFromGoogle(data);
            lastSnapshot = snapshotKey();
            bootstrapped = true;
            return data;
        } catch (error) {
            console.warn('[LH600 PULL]', error);
            return null;
        } finally {
            busy = false;
        }
    }

    async function push(force) {
        if (busy) return { ok: false, busy: true };

        const records = snapshot();
        const key = JSON.stringify(records);

        if (!force && bootstrapped && key === lastSnapshot) {
            return { ok: true, changed: false };
        }

        try {
            busy = true;
            const result = await postAuthoritative({
                action: 'sync_events',
                records: records
            });

            lastSnapshot = key;
            bootstrapped = true;

            const detail = {
                ok: true,
                transport: result.transport,
                counts: {
                    attendance: records.DIEM_DANH.length,
                    violations: records.VI_PHAM.length,
                    rewards: records.KHEN_THUONG.length
                }
            };

            window.dispatchEvent(new CustomEvent('google-sheet-events-saved', { detail }));
            return detail;
        } catch (error) {
            console.error('[LH600 PUSH]', error);
            return { ok: false, error: error.message };
        } finally {
            busy = false;
        }
    }

    function getViolationFormData() {
        const g = id => document.getElementById(id);
        return {
            studentId: clean(g('violationStudent')?.value),
            date: clean(g('violationDate')?.value) || today(),
            type: clean(g('violationType')?.value),
            level: clean(g('violationLevel')?.value) || 'light',
            status: clean(g('violationStatus')?.value) || 'monitoring',
            action: clean(g('violationAction')?.value),
            note: clean(g('violationNote')?.value)
        };
    }

    function clearViolationForm() {
        ['violationStudent','violationType','violationLevel','violationStatus','violationAction','violationNote'].forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            if (e.tagName === 'SELECT') e.selectedIndex = 0;
            else e.value = '';
        });
        const d = document.getElementById('violationDate');
        if (d) d.value = today();
    }

    async function saveViolationFromForm(event) {
        if (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        const data = getViolationFormData();
        if (!data.studentId) {
            alert('Vui lòng chọn học sinh.');
            return false;
        }
        if (!data.type) {
            alert('Vui lòng chọn nội dung vi phạm.');
            return false;
        }

        let result;
        try {
            if (typeof window.addViolation === 'function') {
                result = window.addViolation({
                    id: makeId('VIO'),
                    studentId: data.studentId,
                    date: data.date,
                    type: data.type,
                    level: data.level,
                    status: data.status,
                    action: data.action,
                    note: data.note,
                    createdAt: now(),
                    updatedAt: now()
                });
            } else {
                getArray('getViolationRecords', 'violations').push({
                    id: makeId('VIO'),
                    studentId: data.studentId,
                    date: data.date,
                    type: data.type,
                    level: data.level,
                    status: data.status,
                    action: data.action,
                    note: data.note,
                    createdAt: now(),
                    updatedAt: now()
                });
            }
        } catch (error) {
            alert('Không thể lưu vi phạm: ' + error.message);
            return false;
        }

        if (result && result.success === false) {
            alert(result.message || 'Không thể lưu vi phạm.');
            return false;
        }

        renderAll();
        const saved = await push(true);

        if (!saved.ok) {
            alert('Web đã ghi dữ liệu nhưng Google Sheets chưa nhận được.');
            return false;
        }

        clearViolationForm();
        const modal = document.getElementById('violationModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('modal-open');

        try {
            if (typeof window.showToast === 'function') {
                window.showToast('Đã lưu vi phạm và đồng bộ Google Sheets.', 'success');
            }
        } catch (_) {}

        return true;
    }

    function installForms() {
        const vf = document.getElementById('violationForm');
        if (vf && !vf.__LH600__) {
            vf.__LH600__ = true;
            vf.addEventListener('submit', saveViolationFromForm, true);
        }

        const rf = document.getElementById('rewardForm');
        if (rf && !rf.__LH600__) {
            rf.__LH600__ = true;
            rf.addEventListener('submit', () => setTimeout(() => push(true), 500), true);
        }

        const ab = document.getElementById('saveAttendance');
        if (ab && !ab.__LH600__) {
            ab.__LH600__ = true;
            ab.addEventListener('click', () => setTimeout(() => push(true), 500), true);
        }
    }

    function installFunctionWatches() {
        ['saveAttendanceRecord','addViolation','updateViolation','deleteViolation','addReward','updateReward','deleteReward'].forEach(name => {
            try {
                const fn = window[name];
                if (typeof fn !== 'function' || fn.__LH600__) return;

                const wrapped = function () {
                    const result = fn.apply(this, arguments);
                    setTimeout(() => push(true), 250);
                    return result;
                };

                wrapped.__LH600__ = true;
                wrapped.__LHOriginal = fn;
                window[name] = wrapped;
            } catch (_) {}
        });
    }

    function watchData() {
        if (!bootstrapped || busy) return;
        const key = snapshotKey();
        if (key && key !== lastSnapshot) push(false);
    }

    async function boot() {
        await pull();
        installForms();
        installFunctionWatches();

        if (window.__LH600_INSTALL__) clearInterval(window.__LH600_INSTALL__);
        if (window.__LH600_WATCH__) clearInterval(window.__LH600_WATCH__);

        window.__LH600_INSTALL__ = setInterval(() => {
            installForms();
            installFunctionWatches();
        }, 500);

        window.__LH600_WATCH__ = setInterval(watchData, 1200);
    }

    window.syncGoogleSheetEvents = () => push(true);
    window.pushGoogleSheetEvents = () => push(true);
    window.forceGoogleSheetEventSync = () => push(true);
    window.pullGoogleSheetEvents = pull;
    window.getGoogleSheetEventSnapshot = snapshot;
    window.saveViolationToGoogleSheets = saveViolationFromForm;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1000), { once: true });
    } else {
        setTimeout(boot, 1000);
    }
})();
