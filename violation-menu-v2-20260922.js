/* ============================================================
   VIOLATION MENU V2 — 2026-09-22
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG · 5A3
   ------------------------------------------------------------
   MỤC TIÊU:
   - Thay thế riêng danh mục Nội dung vi phạm trong form ghi nhận.
   - Không sửa/xóa Data Engine, Router, LocalStorage hoặc menu khác.
   - Mỗi mã V01–V31 có mức độ cố định.
   - V32 = Khác – GV tự ghi; mở hộp nhập riêng và cho chọn mức độ.
   - Khi lưu, bản ghi vẫn dùng trường type hiện có để tương thích dữ liệu cũ.
   ============================================================ */

(function () {
  'use strict';

  if (window.__LH_VIOLATION_MENU_V2_20260922__) return;
  window.__LH_VIOLATION_MENU_V2_20260922__ = true;

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

  const LEVELS = ['Nhẹ', 'Trung bình', 'Nghiêm trọng'];

  function byId(id) {
    return document.getElementById(id);
  }

  function findItemByText(text) {
    return ITEMS.find(item => item.text === text) || null;
  }

  function selectedOption(select) {
    return select?.options?.[select.selectedIndex] || null;
  }

  function ensureMetaNode(typeSelect) {
    let meta = byId('lhV2ViolationMeta');
    if (!meta || !typeSelect?.parentElement) return null;
    if (!meta.parentElement || !meta.parentElement.isSameNode(typeSelect.parentElement)) {
      typeSelect.parentElement.appendChild(meta);
    }
    return meta;
  }

  function setMeta(item, customLevel) {
    const meta = byId('lhV2ViolationMeta');
    if (!meta) return;

    const code = item?.code || 'V32';
    const level = item?.level || customLevel || 'Chưa chọn';
    meta.textContent = 'Mã: ' + code + ' · Mức độ: ' + level;
    meta.className = 'lh-v2-violation-meta';
  }

  function addOption(select, item) {
    const option = new Option(item.code + ' · ' + item.text, item.text);
    option.dataset.lhViolationCode = item.code;
    if (item.level) option.dataset.lhViolationLevel = item.level;
    option.dataset.lhViolationFixed = item.level ? '1' : '0';
    select.add(option);
    return option;
  }

  function buildTypeOptions(select) {
    if (!select || select.dataset.lhViolationMenuV2 === '1') return;

    const oldValue = select.value;
    const oldSelected = findItemByText(oldValue);

    select.replaceChildren();

    for (const level of LEVELS) {
      const group = document.createElement('optgroup');
      group.label = level + ' · mức độ cố định';
      ITEMS.filter(item => item.level === level).forEach(item => addOption(group, item));
      select.appendChild(group);
    }

    const otherGroup = document.createElement('optgroup');
    otherGroup.label = 'Khác';
    addOption(otherGroup, ITEMS.find(item => item.code === 'V32'));
    select.appendChild(otherGroup);

    select.dataset.lhViolationMenuV2 = '1';
    select.dataset.lhPreviousValue = oldSelected?.text || select.options[0]?.value || '';

    if (oldSelected) {
      const option = [...select.options].find(o => o.value === oldSelected.text);
      if (option) select.value = option.value;
    } else {
      select.selectedIndex = 0;
    }

    bindTypeChange(select);
    syncLevelFromSelection(select);
  }

  function ensureLevelStyles() {
    if (byId('lhViolationMenuV2Style')) return;

    const style = document.createElement('style');
    style.id = 'lhViolationMenuV2Style';
    style.textContent = `
      .lh-v2-violation-meta{
        margin-top:6px;
        padding:7px 9px;
        border:1px solid #dbe4f0;
        border-radius:8px;
        background:#f8fafc;
        color:#334155;
        font-size:12px;
        font-weight:700;
      }
      #mLevel:disabled{
        opacity:1;
        background:#f8fafc;
        color:#334155;
        cursor:not-allowed;
      }
      .lh-v2-other-bg{
        position:fixed;
        inset:0;
        background:rgba(15,23,42,.58);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        z-index:1000;
      }
      .lh-v2-other-dialog{
        width:min(560px,100%);
        background:#fff;
        border-radius:14px;
        padding:18px;
        box-shadow:0 18px 50px rgba(15,23,42,.25);
      }
      .lh-v2-other-dialog h2{
        margin:0 0 8px;
        font-size:20px;
      }
      .lh-v2-other-dialog p{
        margin:0 0 12px;
        color:#475569;
        font-size:13px;
      }
      .lh-v2-other-dialog textarea{
        width:100%;
        min-height:110px;
        resize:vertical;
        padding:10px 11px;
        border:1px solid #cbd5e1;
        border-radius:9px;
        box-sizing:border-box;
        font:inherit;
        outline:none;
      }
      .lh-v2-other-dialog textarea:focus{
        border-color:#2563eb;
        box-shadow:0 0 0 3px rgba(37,99,235,.10);
      }
      .lh-v2-levels{
        display:flex;
        flex-wrap:wrap;
        gap:10px 18px;
        margin:12px 0 16px;
      }
      .lh-v2-levels label{
        display:flex;
        align-items:center;
        gap:6px;
        font-weight:600;
      }
      .lh-v2-other-actions{
        display:flex;
        justify-content:flex-end;
        gap:8px;
      }
      .lh-v2-other-actions button{
        border:1px solid #d7dee8;
        background:#fff;
        color:#334155;
        border-radius:9px;
        padding:8px 12px;
        font:inherit;
        cursor:pointer;
      }
      .lh-v2-other-actions .primary{
        border-color:#1d4ed8;
        background:#1d4ed8;
        color:#fff;
      }
    `;
    document.head.appendChild(style);
  }

  function setLevelFixed(levelSelect, level) {
    if (!levelSelect || !LEVELS.includes(level)) return;
    levelSelect.value = level;
    levelSelect.disabled = true;
    levelSelect.title = 'Mức độ được cố định theo mã vi phạm.';
  }

  function syncLevelFromSelection(select) {
    const levelSelect = byId('mLevel');
    if (!select || !levelSelect) return;

    const option = selectedOption(select);
    const item = ITEMS.find(x => x.text === select.value);

    if (item?.level) {
      setLevelFixed(levelSelect, item.level);
      setMeta(item);
      return;
    }

    if (item?.code === 'V32') {
      const customLevel = select.dataset.lhCustomLevel || '';
      if (customLevel) {
        setLevelFixed(levelSelect, customLevel);
        setMeta(item, customLevel);
      } else {
        levelSelect.disabled = true;
        levelSelect.title = 'V32 yêu cầu nhập nội dung và chọn mức độ trong hộp Khác.';
        setMeta(item, 'Chưa chọn');
      }
      return;
    }

    if (option?.dataset?.lhViolationLevel) {
      setLevelFixed(levelSelect, option.dataset.lhViolationLevel);
    }
  }

  function bindTypeChange(select) {
    if (select.dataset.lhViolationChangeBound === '1') return;

    select.addEventListener('change', () => {
      const item = ITEMS.find(x => x.text === select.value);
      if (!item) return;

      if (item.code === 'V32') {
        const previous = select.dataset.lhLastFixedValue || select.dataset.lhPreviousValue || ITEMS[0].text;
        select.dataset.lhLastFixedValue = previous;
        openOtherDialog(select);
        return;
      }

      select.dataset.lhLastFixedValue = item.text;
      delete select.dataset.lhCustomValue;
      delete select.dataset.lhCustomLevel;
      syncLevelFromSelection(select);
    });

    select.addEventListener('focus', () => {
      const current = ITEMS.find(x => x.text === select.value);
      if (current?.level) select.dataset.lhLastFixedValue = current.text;
    });

    select.dataset.lhViolationChangeBound = '1';
  }

  function openOtherDialog(select) {
    closeOtherDialog();

    const existingCustom = select.dataset.lhCustomValue || '';
    const existingLevel = select.dataset.lhCustomLevel || 'Trung bình';

    const bg = document.createElement('div');
    bg.className = 'lh-v2-other-bg';
    bg.id = 'lhV2OtherBg';

    const dialog = document.createElement('div');
    dialog.className = 'lh-v2-other-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const h2 = document.createElement('h2');
    h2.textContent = 'NỘI DUNG VI PHẠM KHÁC';

    const p = document.createElement('p');
    p.textContent = 'Nhập nội dung vi phạm của học sinh:';

    const textarea = document.createElement('textarea');
    textarea.id = 'lhV2OtherText';
    textarea.placeholder = 'Nhập nội dung vi phạm...';
    textarea.value = existingCustom;

    const levels = document.createElement('div');
    levels.className = 'lh-v2-levels';

    for (const level of LEVELS) {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'lhV2OtherLevel';
      radio.value = level;
      radio.checked = level === existingLevel;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(level));
      levels.appendChild(label);
    }

    const actions = document.createElement('div');
    actions.className = 'lh-v2-other-actions';

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Hủy';

    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Lưu';
    save.className = 'primary';

    cancel.addEventListener('click', () => {
      const back = select.dataset.lhLastFixedValue || ITEMS[0].text;
      select.value = back;
      delete select.dataset.lhCustomValue;
      delete select.dataset.lhCustomLevel;
      syncLevelFromSelection(select);
      closeOtherDialog();
    });

    save.addEventListener('click', () => {
      const value = textarea.value.trim();
      const level = [...levels.querySelectorAll('input[name="lhV2OtherLevel"]:checked')][0]?.value || '';

      if (!value) {
        textarea.focus();
        return;
      }

      if (!LEVELS.includes(level)) {
        return;
      }

      const customOption = [...select.options].find(o => o.dataset?.lhV2Custom === '1');
      if (customOption) customOption.remove();

      const option = new Option('V32 · ' + value, value);
      option.dataset.lhV2Custom = '1';
      option.dataset.lhViolationCode = 'V32';
      option.dataset.lhViolationLevel = level;
      select.add(option);
      select.value = value;
      select.dataset.lhCustomValue = value;
      select.dataset.lhCustomLevel = level;
      select.dataset.lhLastFixedValue = value;

      setLevelFixed(byId('mLevel'), level);
      setMeta({ code: 'V32', text: value }, level);
      closeOtherDialog();
    });

    actions.appendChild(cancel);
    actions.appendChild(save);

    dialog.appendChild(h2);
    dialog.appendChild(p);
    dialog.appendChild(textarea);
    dialog.appendChild(levels);
    dialog.appendChild(actions);
    bg.appendChild(dialog);
    document.body.appendChild(bg);

    bg.addEventListener('click', event => {
      if (event.target === bg) cancel.click();
    });

    setTimeout(() => textarea.focus(), 0);
  }

  function closeOtherDialog() {
    byId('lhV2OtherBg')?.remove();
  }

  function ensureMetaAndEnhance() {
    const typeSelect = byId('mType');
    const levelSelect = byId('mLevel');

    if (!typeSelect || !levelSelect) return false;

    ensureLevelStyles();

    if (!byId('lhV2ViolationMeta')) {
      const meta = document.createElement('div');
      meta.id = 'lhV2ViolationMeta';
      meta.className = 'lh-v2-violation-meta';
      meta.textContent = 'Mã: — · Mức độ: —';
      typeSelect.parentElement?.appendChild(meta);
    }

    buildTypeOptions(typeSelect);
    ensureMetaNode(typeSelect);

    return true;
  }

  document.addEventListener('click', event => {
    const saveButton = event.target.closest?.('[data-action="save-event"][data-kind="violation"]');
    if (!saveButton) return;

    const select = byId('mType');
    if (!select) return;

    const item = ITEMS.find(x => x.text === select.value);
    if (item?.code === 'V32' && !select.dataset.lhCustomValue) {
      event.preventDefault();
      event.stopPropagation();
      openOtherDialog(select);
    }
  }, true);

  const observer = new MutationObserver(() => {
    ensureMetaAndEnhance();
  });

  function start() {
    ensureLevelStyles();
    ensureMetaAndEnhance();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.LH_VIOLATION_MENU_V2 = {
    version: '2026-09-22',
    items: ITEMS,
    enhance: ensureMetaAndEnhance,
    openOtherDialog
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();