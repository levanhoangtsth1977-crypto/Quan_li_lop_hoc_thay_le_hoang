/* ============================================================
   VIOLATION MENU V3 — 2026-09-22
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG · 5A3
   ------------------------------------------------------------
   PHIÊN BẢN ĐỘC LẬP:
   - Không thay Data Engine.
   - Không thay Router.
   - Không sửa LocalStorage.
   - Không tác động các menu khác.
   - V01–V31: mức độ được khóa theo mã.
   - V32: mở hộp "NỘI DUNG VI PHẠM KHÁC".
   ============================================================ */

(function () {
  'use strict';

  if (window.__LH_VIOLATION_MENU_V3_20260922__) return;
  window.__LH_VIOLATION_MENU_V3_20260922__ = true;

  const LEVELS = Object.freeze(['Nhẹ', 'Trung bình', 'Nghiêm trọng']);

  const ITEMS = Object.freeze([
    { code: 'V01', level: 'Nhẹ', text: 'Không mặc đúng đồng phục theo quy định của nhà trường.' },
    { code: 'V02', level: 'Nhẹ', text: 'Đi học muộn.' },
    { code: 'V03', level: 'Nhẹ', text: 'Không mang đầy đủ sách giáo khoa theo thời khóa biểu.' },
    { code: 'V04', level: 'Nhẹ', text: 'Không mang đầy đủ vở học tập theo yêu cầu của môn học.' },
    { code: 'V05', level: 'Nhẹ', text: 'Không mang đầy đủ đồ dùng học tập theo yêu cầu của môn học.' },
    { code: 'V06', level: 'Nhẹ', text: 'Mang điện thoại đến trường khi chưa được phép.' },
    { code: 'V07', level: 'Nhẹ', text: 'Mang đồ chơi đến trường khi chưa được phép.' },
    { code: 'V08', level: 'Nhẹ', text: 'Nói chuyện riêng trong giờ học.' },
    { code: 'V09', level: 'Nhẹ', text: 'Làm việc riêng trong giờ học.' },
    { code: 'V10', level: 'Nhẹ', text: 'Không theo dõi hướng dẫn của giáo viên trong giờ học.' },
    { code: 'V11', level: 'Nhẹ', text: 'Không ghi chép bài theo yêu cầu.' },
    { code: 'V12', level: 'Nhẹ', text: 'Không làm bài tập về nhà được giao.' },
    { code: 'V13', level: 'Nhẹ', text: 'Không thực hiện nhiệm vụ học tập được giao trên lớp.' },
    { code: 'V14', level: 'Nhẹ', text: 'Không tham gia hoạt động học tập theo yêu cầu.' },
    { code: 'V15', level: 'Nhẹ', text: 'Không hoàn thành phần việc được phân công trong hoạt động nhóm.' },
    { code: 'V16', level: 'Nhẹ', text: 'Phát biểu khi chưa đến lượt.' },
    { code: 'V17', level: 'Nhẹ', text: 'Tự ý rời khỏi chỗ ngồi khi chưa được phép.' },
    { code: 'V18', level: 'Nhẹ', text: 'Tự ý sử dụng đồ dùng của bạn.' },

    { code: 'V19', level: 'Trung bình', text: 'Nhìn bài của bạn trong khi làm bài kiểm tra.' },
    { code: 'V20', level: 'Trung bình', text: 'Nhắc bài cho bạn trong khi làm bài kiểm tra.' },
    { code: 'V21', level: 'Trung bình', text: 'Sử dụng từ ngữ thiếu văn hóa khi giao tiếp.' },
    { code: 'V22', level: 'Trung bình', text: 'Trêu chọc bạn trong giờ học.' },
    { code: 'V23', level: 'Trung bình', text: 'Đe dọa bạn.' },
    { code: 'V24', level: 'Trung bình', text: 'Xô đẩy bạn.' },
    { code: 'V25', level: 'Trung bình', text: 'Lấy đồ dùng của bạn khi chưa được phép.' },
    { code: 'V26', level: 'Trung bình', text: 'Làm hư hỏng đồ dùng của lớp.' },
    { code: 'V27', level: 'Trung bình', text: 'Xả rác không đúng nơi quy định.' },
    { code: 'V28', level: 'Trung bình', text: 'Chạy nhảy tại khu vực không bảo đảm an toàn.' },

    { code: 'V29', level: 'Nghiêm trọng', text: 'Đánh bạn.' },
    { code: 'V30', level: 'Nghiêm trọng', text: 'Đánh nhau với bạn.' },
    { code: 'V31', level: 'Nghiêm trọng', text: 'Chơi trò chơi nguy hiểm.' },

    { code: 'V32', level: null, text: 'Khác – GV tự ghi' }
  ]);

  const ITEM_BY_TEXT = new Map(ITEMS.map(item => [item.text, item]));

  const $ = (id) => document.getElementById(id);

  function currentItem(select) {
    if (!select) return null;
    const custom = [...select.options].find(
      option => option.dataset.lhV3Custom === '1' && option.value === select.value
    );
    if (custom) {
      return {
        code: 'V32',
        level: custom.dataset.lhViolationLevel || '',
        text: custom.value,
        custom: true
      };
    }
    return ITEM_BY_TEXT.get(select.value) || null;
  }

  function removeCustomOption(select) {
    [...select.options]
      .filter(option => option.dataset.lhV3Custom === '1')
      .forEach(option => option.remove());
  }

  function ensureStyle() {
    if ($('lhViolationMenuV3Style')) return;

    const style = document.createElement('style');
    style.id = 'lhViolationMenuV3Style';
    style.textContent = `
      .lh-v3-meta{
        margin-top:6px;
        padding:7px 9px;
        border:1px solid #dbe4f0;
        border-radius:8px;
        background:#f8fafc;
        color:#334155;
        font-size:12px;
        font-weight:700;
        line-height:1.45;
      }
      #mLevel.lh-v3-fixed{
        opacity:1;
        background:#f8fafc;
        color:#334155;
        cursor:not-allowed;
      }
      .lh-v3-other-bg{
        position:fixed;
        inset:0;
        z-index:1100;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        background:rgba(15,23,42,.58);
      }
      .lh-v3-other-dialog{
        width:min(560px,100%);
        background:#fff;
        border-radius:14px;
        padding:18px;
        box-shadow:0 18px 50px rgba(15,23,42,.28);
      }
      .lh-v3-other-dialog h2{
        margin:0 0 7px;
        font-size:20px;
      }
      .lh-v3-other-dialog .sub{
        margin:0 0 12px;
        color:#475569;
        font-size:13px;
      }
      .lh-v3-other-dialog textarea{
        width:100%;
        min-height:110px;
        box-sizing:border-box;
        resize:vertical;
        padding:10px 11px;
        border:1px solid #cbd5e1;
        border-radius:9px;
        font:inherit;
        outline:none;
      }
      .lh-v3-other-dialog textarea:focus{
        border-color:#2563eb;
        box-shadow:0 0 0 3px rgba(37,99,235,.10);
      }
      .lh-v3-levels{
        display:flex;
        flex-wrap:wrap;
        gap:9px 18px;
        margin:12px 0 16px;
      }
      .lh-v3-levels label{
        display:flex;
        align-items:center;
        gap:6px;
        font-weight:600;
      }
      .lh-v3-actions{
        display:flex;
        justify-content:flex-end;
        gap:8px;
      }
      .lh-v3-actions button{
        border:1px solid #d7dee8;
        background:#fff;
        color:#334155;
        border-radius:9px;
        padding:8px 12px;
        font:inherit;
        cursor:pointer;
      }
      .lh-v3-actions .primary{
        border-color:#1d4ed8;
        background:#1d4ed8;
        color:#fff;
      }
      .lh-v3-error{
        margin-top:8px;
        color:#b91c1c;
        font-size:12px;
        display:none;
      }
      .lh-v3-error.show{display:block}
    `;
    document.head.appendChild(style);
  }

  function showMeta(item, extraLevel) {
    const meta = $('lhViolationMenuV3Meta');
    if (!meta) return;

    if (!item) {
      meta.textContent = 'Mã: — · Mức độ: —';
      return;
    }

    const level = item.level || extraLevel || 'Chưa chọn';
    meta.textContent =
      'Mã: ' + item.code +
      ' · Mức độ: ' + level +
      (item.code === 'V32' ? ' · GV tự ghi' : '');
  }

  function setFixedLevel(level, allowEdit) {
    const select = $('mLevel');
    if (!select) return;

    if (LEVELS.includes(level)) {
      select.value = level;
      select.title = 'Mức độ tự động theo mã vi phạm.';
      select.classList.add('lh-v3-fixed');
      select.disabled = !allowEdit;
      return;
    }

    select.classList.remove('lh-v3-fixed');
    select.disabled = false;
    select.title = '';
  }

  function buildMenu(typeSelect) {
    if (!typeSelect || typeSelect.dataset.lhViolationMenuV3 === '1') return;

    const oldValue = typeSelect.value;
    const oldItem = ITEM_BY_TEXT.get(oldValue);

    typeSelect.replaceChildren();

    for (const level of LEVELS) {
      const group = document.createElement('optgroup');
      group.label = level + ' · mức độ cố định';

      ITEMS
        .filter(item => item.level === level)
        .forEach(item => {
          const option = new Option(item.code + ' · ' + item.text, item.text);
          option.dataset.lhViolationCode = item.code;
          option.dataset.lhViolationLevel = item.level;
          option.dataset.lhViolationFixed = '1';
          group.appendChild(option);
        });

      typeSelect.appendChild(group);
    }

    const otherGroup = document.createElement('optgroup');
    otherGroup.label = 'Khác';

    const other = ITEMS.find(item => item.code === 'V32');
    const otherOption = new Option('V32 · ' + other.text, other.text);
    otherOption.dataset.lhViolationCode = 'V32';
    otherOption.dataset.lhViolationFixed = '0';
    otherGroup.appendChild(otherOption);
    typeSelect.appendChild(otherGroup);

    typeSelect.dataset.lhViolationMenuV3 = '1';

    if (oldItem) {
      typeSelect.value = oldItem.text;
    } else {
      const first = ITEMS[0];
      typeSelect.value = first.text;
    }

    attachListeners(typeSelect);
    syncFromType(typeSelect);
  }

  function syncFromType(typeSelect) {
    const item = currentItem(typeSelect);
    const levelSelect = $('mLevel');

    if (!item || !levelSelect) return;

    if (item.code === 'V32') {
      const customLevel = typeSelect.dataset.lhV3CustomLevel || '';
      if (customLevel) {
        setFixedLevel(customLevel, false);
        showMeta(item, customLevel);
      } else {
        levelSelect.classList.remove('lh-v3-fixed');
        levelSelect.disabled = true;
        levelSelect.title = 'V32 yêu cầu nhập nội dung và chọn mức độ trong hộp Khác.';
        showMeta(item, 'Chưa chọn');
      }
      return;
    }

    delete typeSelect.dataset.lhV3CustomValue;
    delete typeSelect.dataset.lhV3CustomLevel;

    removeCustomOption(typeSelect);
    typeSelect.dataset.lhV3LastFixedValue = item.text;
    setFixedLevel(item.level, false);
    showMeta(item);
  }

  function rememberLastFixed(select) {
    const item = currentItem(select);
    if (item?.code !== 'V32') {
      select.dataset.lhV3LastFixedValue = item?.text || ITEMS[0].text;
    }
  }

  function attachListeners(typeSelect) {
    if (typeSelect.dataset.lhViolationListenersV3 === '1') return;

    typeSelect.addEventListener('focus', () => rememberLastFixed(typeSelect));

    typeSelect.addEventListener('change', () => {
      const item = currentItem(typeSelect);
      if (!item) return;

      if (item.code === 'V32' && !item.custom) {
        rememberLastFixed(typeSelect);
        openOtherDialog(typeSelect);
        return;
      }

      if (item.code !== 'V32') {
        typeSelect.dataset.lhV3LastFixedValue = item.text;
        delete typeSelect.dataset.lhV3CustomValue;
        delete typeSelect.dataset.lhV3CustomLevel;
        syncFromType(typeSelect);
      }
    });

    const levelSelect = $('mLevel');
    if (levelSelect && levelSelect.dataset.lhViolationLevelV3 !== '1') {
      levelSelect.addEventListener('change', () => {
        const item = currentItem(typeSelect);
        if (item?.code && item.code !== 'V32' && item.level) {
          levelSelect.value = item.level;
        } else if (item?.code === 'V32' && typeSelect.dataset.lhV3CustomLevel) {
          levelSelect.value = typeSelect.dataset.lhV3CustomLevel;
        }
      });
      levelSelect.dataset.lhViolationLevelV3 = '1';
    }

    typeSelect.dataset.lhViolationListenersV3 = '1';
  }

  function closeOtherDialog() {
    $('lhViolationMenuV3Other')?.remove();
  }

  function openOtherDialog(typeSelect) {
    closeOtherDialog();

    const existingText = typeSelect.dataset.lhV3CustomValue || '';
    const existingLevel = typeSelect.dataset.lhV3CustomLevel || '';

    const bg = document.createElement('div');
    bg.id = 'lhViolationMenuV3Other';
    bg.className = 'lh-v3-other-bg';

    const dialog = document.createElement('div');
    dialog.className = 'lh-v3-other-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const h2 = document.createElement('h2');
    h2.textContent = 'NỘI DUNG VI PHẠM KHÁC';

    const p = document.createElement('p');
    p.className = 'sub';
    p.textContent = 'Nhập nội dung vi phạm của học sinh:';

    const textarea = document.createElement('textarea');
    textarea.id = 'lhViolationMenuV3Text';
    textarea.placeholder = 'Nhập nội dung vi phạm...';
    textarea.value = existingText;

    const levels = document.createElement('div');
    levels.className = 'lh-v3-levels';

    LEVELS.forEach(level => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'lhViolationMenuV3Level';
      radio.value = level;
      radio.checked = level === existingLevel;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(level));
      levels.appendChild(label);
    });

    const error = document.createElement('div');
    error.className = 'lh-v3-error';
    error.textContent = 'Vui lòng nhập nội dung vi phạm và chọn mức độ.';

    const actions = document.createElement('div');
    actions.className = 'lh-v3-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Hủy';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'primary';
    save.textContent = 'Lưu';

    cancel.addEventListener('click', () => {
      const back = typeSelect.dataset.lhV3LastFixedValue || ITEMS[0].text;
      typeSelect.value = back;
      delete typeSelect.dataset.lhV3CustomValue;
      delete typeSelect.dataset.lhV3CustomLevel;
      syncFromType(typeSelect);
      closeOtherDialog();
    });

    save.addEventListener('click', () => {
      const text = textarea.value.trim();
      const level =
        [...levels.querySelectorAll('input[name="lhViolationMenuV3Level"]:checked')][0]?.value || '';

      if (!text || !LEVELS.includes(level)) {
        error.classList.add('show');
        return;
      }

      removeCustomOption(typeSelect);

      // value = nội dung thật để cơ chế save-event hiện tại vẫn lưu đúng "type".
      const option = new Option(
        'V32 · Khác – GV tự ghi: ' + text,
        text
      );
      option.dataset.lhV3Custom = '1';
      option.dataset.lhViolationCode = 'V32';
      option.dataset.lhViolationLevel = level;

      typeSelect.appendChild(option);
      typeSelect.value = text;
      typeSelect.dataset.lhV3CustomValue = text;
      typeSelect.dataset.lhV3CustomLevel = level;

      setFixedLevel(level, false);
      showMeta({ code: 'V32', text }, level);
      closeOtherDialog();
    });

    actions.appendChild(cancel);
    actions.appendChild(save);

    dialog.appendChild(h2);
    dialog.appendChild(p);
    dialog.appendChild(textarea);
    dialog.appendChild(levels);
    dialog.appendChild(error);
    dialog.appendChild(actions);
    bg.appendChild(dialog);
    document.body.appendChild(bg);

    bg.addEventListener('click', event => {
      if (event.target === bg) cancel.click();
    });

    setTimeout(() => textarea.focus(), 0);
  }

  // Chặn lưu V32 khi giáo viên chưa hoàn tất hộp nhập.
  document.addEventListener('click', event => {
    const saveButton = event.target.closest?.(
      '[data-action="save-event"][data-kind="violation"]'
    );
    if (!saveButton) return;

    const typeSelect = $('mType');
    if (!typeSelect) return;

    const item = currentItem(typeSelect);

    if (item?.code === 'V32' && !typeSelect.dataset.lhV3CustomValue) {
      event.preventDefault();
      event.stopPropagation();
      openOtherDialog(typeSelect);
    }
  }, true);

  function enhance() {
    const typeSelect = $('mType');
    const levelSelect = $('mLevel');

    if (!typeSelect || !levelSelect) return false;

    ensureStyle();

    if (!$('lhViolationMenuV3Meta')) {
      const meta = document.createElement('div');
      meta.id = 'lhViolationMenuV3Meta';
      meta.className = 'lh-v3-meta';
      typeSelect.parentElement?.appendChild(meta);
    }

    buildMenu(typeSelect);
    syncFromType(typeSelect);
    return true;
  }

  const observer = new MutationObserver(() => enhance());

  function start() {
    ensureStyle();
    enhance();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.LH_VIOLATION_MENU_V3 = Object.freeze({
    version: '2026-09-22-V3',
    items: ITEMS,
    enhance,
    openOtherDialog
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();