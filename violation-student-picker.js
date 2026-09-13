/* ============================================================
   VI PHẠM — STUDENT PICKER 1.0
   ------------------------------------------------------------
   Đổi ô chọn học sinh thành nút xổ xuống/thu gọn.
   Chỉ áp dụng #violationForm -> #violationStudent.
   Giữ nguyên select gốc để không ảnh hưởng luồng lưu dữ liệu.
   ============================================================ */
(function () {
    'use strict';
    if (window.__LH_VIOLATION_STUDENT_PICKER_10__) return;
    window.__LH_VIOLATION_STUDENT_PICKER_10__ = true;

    const S = value => String(value ?? '').trim();
    const E = value => S(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');

    function install(form) {
        const select = form?.querySelector('#violationStudent');
        if (!select || select.dataset.lhPickerReady === '1') return;

        const host = select.parentElement;
        if (!host) return;

        select.dataset.lhPickerReady = '1';
        select.setAttribute('aria-hidden', 'true');
        select.tabIndex = -1;
        select.style.position = 'absolute';
        select.style.opacity = '0';
        select.style.pointerEvents = 'none';
        select.style.width = '1px';
        select.style.height = '1px';

        const picker = document.createElement('div');
        picker.className = 'lh-student-picker';
        picker.innerHTML = `
            <button type="button" class="lh-student-picker-button" aria-expanded="false">
                <span class="lh-student-picker-label">Chọn học sinh</span>
                <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
            <div class="lh-student-picker-menu" hidden>
                <div class="lh-student-picker-head">
                    <span>Chọn học sinh</span>
                    <button type="button" class="lh-student-picker-close" aria-label="Thu gọn">
                        <i class="fa-solid fa-chevron-up" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="lh-student-picker-list"></div>
            </div>`;

        host.insertBefore(picker, select);

        const button = picker.querySelector('.lh-student-picker-button');
        const menu = picker.querySelector('.lh-student-picker-menu');
        const label = picker.querySelector('.lh-student-picker-label');
        const list = picker.querySelector('.lh-student-picker-list');
        const closeButton = picker.querySelector('.lh-student-picker-close');

        function refreshLabel() {
            const option = select.options[select.selectedIndex];
            label.textContent = option?.value ? S(option.textContent) : 'Chọn học sinh';
        }

        function rebuild() {
            list.innerHTML = '';
            Array.from(select.options)
                .filter(option => S(option.value))
                .forEach(option => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'lh-student-picker-item';
                    item.dataset.value = option.value;
                    item.innerHTML = `<span>${E(option.textContent)}</span><i class="fa-solid fa-check" aria-hidden="true"></i>`;
                    item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
                    item.addEventListener('click', event => {
                        event.preventDefault();
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        refreshLabel();
                        updateSelected();
                        collapse();
                    });
                    list.appendChild(item);
                });
            refreshLabel();
            updateSelected();
        }

        function updateSelected() {
            list.querySelectorAll('.lh-student-picker-item').forEach(item => {
                const selected = item.dataset.value === select.value;
                item.classList.toggle('selected', selected);
                item.setAttribute('aria-selected', selected ? 'true' : 'false');
            });
        }

        function expand() {
            menu.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            button.classList.add('open');
        }

        function collapse() {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.classList.remove('open');
        }

        button.addEventListener('click', event => {
            event.preventDefault();
            if (menu.hidden) expand();
            else collapse();
        });

        closeButton.addEventListener('click', event => {
            event.preventDefault();
            collapse();
        });

        document.addEventListener('click', event => {
            if (!picker.contains(event.target)) collapse();
        });

        select.addEventListener('change', () => {
            refreshLabel();
            updateSelected();
        });

        const observer = new MutationObserver(() => {
            rebuild();
        });
        observer.observe(select, { childList: true });

        rebuild();
    }

    function scan() {
        document.querySelectorAll('#violationForm').forEach(install);
    }

    function css() {
        if (document.getElementById('lhViolationStudentPickerCss')) return;
        const style = document.createElement('style');
        style.id = 'lhViolationStudentPickerCss';
        style.textContent = `
            #violationForm .lh-student-picker{position:relative;width:100%}
            #violationForm .lh-student-picker-button{width:100%;min-height:42px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;color:#0f172a;cursor:pointer;text-align:left}
            #violationForm .lh-student-picker-button:hover{border-color:#94a3b8}
            #violationForm .lh-student-picker-button.open{border-color:#64748b;box-shadow:0 0 0 3px rgba(100,116,139,.12)}
            #violationForm .lh-student-picker-button i{transition:transform .15s ease}
            #violationForm .lh-student-picker-button.open i{transform:rotate(180deg)}
            #violationForm .lh-student-picker-menu{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:100002;background:#fff;border:1px solid #dbe3ef;border-radius:12px;box-shadow:0 18px 42px rgba(15,23,42,.16);overflow:hidden}
            #violationForm .lh-student-picker-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:700}
            #violationForm .lh-student-picker-close{border:0;background:transparent;cursor:pointer;padding:5px 8px;color:#475569}
            #violationForm .lh-student-picker-list{max-height:280px;overflow:auto;padding:6px}
            #violationForm .lh-student-picker-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:#fff;padding:10px 11px;border-radius:8px;cursor:pointer;font:inherit;text-align:left;color:#0f172a}
            #violationForm .lh-student-picker-item:hover{background:#f1f5f9}
            #violationForm .lh-student-picker-item.selected{background:#eff6ff;font-weight:700}
            #violationForm .lh-student-picker-item i{opacity:0}
            #violationForm .lh-student-picker-item.selected i{opacity:1}
        `;
        document.head.appendChild(style);
    }

    function start() {
        css();
        scan();
        const observer = new MutationObserver(scan);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
