/* ============================================================
   DELETE-ALL UI — MASTER FINAL
   - Chỉ còn 1 nút Xóa tất cả ở mỗi trang VI_PHAM/KHEN_THUONG.
   - Chặn toàn bộ handler cũ gây lỗi URL Google Apps Script.
   - Gọi trực tiếp Apps Script bằng JSONP.
   - Không đụng HOC_SINH/DIEM_DANH.
   ============================================================ */
(function () {
  'use strict';
  if (window.__LH_DELETE_ALL_MASTER_FINAL__) return;
  window.__LH_DELETE_ALL_MASTER_FINAL__ = true;

  const API = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const norm = v => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

  function sheetForButton(button) {
    const page = button?.closest?.('#page-violations,#page-rewards,[data-page-section="violations"],[data-page-section="rewards"]');
    if (page) {
      if (page.id === 'page-rewards' || page.dataset.pageSection === 'rewards') return 'KHEN_THUONG';
      if (page.id === 'page-violations' || page.dataset.pageSection === 'violations') return 'VI_PHAM';
    }
    const text = norm(button?.textContent);
    if (text.includes('khen thưởng')) return 'KHEN_THUONG';
    if (text.includes('vi phạm')) return 'VI_PHAM';
    return '';
  }

  function isDeleteAllButton(el) {
    if (!el || !el.matches?.('button,[role="button"],a')) return false;
    const text = norm(el.textContent);
    return text.includes('xóa tất cả') || text.includes('xoá tất cả') || el.dataset?.deleteAll === 'true';
  }

  function jsonp(sheet) {
    return new Promise((resolve, reject) => {
      const callback = '__LH_DELETE_ALL_' + Date.now() + '_' + Math.random().toString(36).slice(2);
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
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('Không truy cập được Google Apps Script.'));
      const timer = setTimeout(() => finish(new Error('Google Apps Script không phản hồi sau 20 giây.')), 20000);
      const query = new URLSearchParams({action:'delete_all_events',sheet,callback,_:String(Date.now())});
      script.src = API + '?' + query.toString();
      document.head.appendChild(script);
    });
  }

  function toast(message, type) {
    if (typeof window.showToast === 'function') window.showToast(message, type || 'info');
    else alert(message);
  }

  async function deleteAll(sheet, button) {
    const label = sheet === 'VI_PHAM' ? 'toàn bộ lượt vi phạm' : 'toàn bộ lượt khen thưởng';
    if (!confirm('XÓA ' + label.toUpperCase() + '?\n\nChỉ xóa dữ liệu trong ' + sheet + '.\nKhông xóa học sinh và điểm danh.')) return;
    if (button) { button.disabled = true; button.dataset.lhDeleteAllBusy = '1'; button.textContent = '⏳ Đang xóa...'; }
    try {
      const result = await jsonp(sheet);
      if (!result || result.ok !== true || result.deleted !== true) throw new Error(result?.error || 'API không xác nhận xóa.');
      toast('Đã xóa ' + Number(result.deletedCount || 0) + ' lượt ' + (sheet === 'VI_PHAM' ? 'vi phạm.' : 'khen thưởng.'), 'success');
      try {
        if (typeof window.refreshAllData === 'function') await window.refreshAllData();
        else if (typeof window.refreshAll === 'function') await window.refreshAll();
        else if (typeof window.loadClassData === 'function') await window.loadClassData();
      } catch (_) {}
      setTimeout(() => location.reload(), 400);
    } catch (error) {
      toast('Không thể xóa tất cả — ' + (error?.message || error), 'error');
      if (button) { button.disabled = false; button.dataset.lhDeleteAllBusy = '0'; }
    }
  }

  function normalizeButtons() {
    const groups = {VI_PHAM:[], KHEN_THUONG:[]};
    document.querySelectorAll('button,[role="button"],a').forEach(el => {
      if (!isDeleteAllButton(el)) return;
      const sheet = sheetForButton(el);
      if (sheet) groups[sheet].push(el);
    });
    Object.keys(groups).forEach(sheet => {
      const buttons = groups[sheet];
      if (!buttons.length) return;
      const keep = buttons[0];
      buttons.slice(1).forEach(el => el.remove());
      keep.dataset.lhDeleteAllFinal = '1';
      keep.dataset.lhDeleteAllSheet = sheet;
      keep.removeAttribute('onclick');
      keep.title = sheet === 'VI_PHAM' ? 'Xóa toàn bộ vi phạm' : 'Xóa toàn bộ khen thưởng';
    });
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('button,[role="button"],a');
    if (!isDeleteAllButton(button)) return;
    const sheet = button.dataset.lhDeleteAllSheet || sheetForButton(button);
    if (!sheet) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.dataset.lhDeleteAllBusy === '1') return;
    deleteAll(sheet, button);
  }, true);

  function install() { normalizeButtons(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
  new MutationObserver(install).observe(document.documentElement, {childList:true, subtree:true});
  [100,300,700,1500,3000].forEach(ms => setTimeout(install, ms));
  window.LE_HOANG_DELETE_ALL_EVENTS = deleteAll;
})();
