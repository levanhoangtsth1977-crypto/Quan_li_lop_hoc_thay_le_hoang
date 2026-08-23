/* ============================================================
   EVENT DELETE-ALL UI — MASTER 6.1
   Thêm nút "Xóa tất cả" cho VI_PHAM và KHEN_THUONG.
   Không đụng dữ liệu HOC_SINH và không ảnh hưởng module khác.
   ============================================================ */
(function () {
  'use strict';

  const API = 'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
  const BUTTON_ID = 'lh-delete-all-event-buttons';

  function pageKey() {
    const text = (document.body && document.body.innerText || '').toLowerCase();
    if (text.includes('vi phạm')) return 'VI_PHAM';
    if (text.includes('khen thưởng')) return 'KHEN_THUONG';
    return '';
  }

  function toast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    alert(message);
  }

  function getButtonHost() {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    const heading = headings.find(h => /vi phạm|khen thưởng/i.test(h.textContent || ''));
    if (!heading) return null;
    return heading.parentElement || heading;
  }

  function makeButton(sheet) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = sheet === 'VI_PHAM' ? 'btnDeleteAllViolations' : 'btnDeleteAllRewards';
    btn.textContent = sheet === 'VI_PHAM' ? '🗑️ Xóa tất cả vi phạm' : '🗑️ Xóa tất cả khen thưởng';
    btn.setAttribute('data-event-action', 'delete-all');
    btn.style.cssText = 'margin:10px 0 14px;padding:9px 14px;border:1px solid #dc2626;border-radius:8px;background:#fff;color:#b91c1c;font-weight:700;cursor:pointer;';
    btn.addEventListener('click', function () {
      deleteAll(sheet);
    });
    return btn;
  }

  function ensureButton(sheet) {
    if (document.getElementById(sheet === 'VI_PHAM' ? 'btnDeleteAllViolations' : 'btnDeleteAllRewards')) return;
    const host = getButtonHost();
    if (!host) return;
    const button = makeButton(sheet);
    host.appendChild(button);
  }

  async function deleteAll(sheet) {
    const label = sheet === 'VI_PHAM' ? 'toàn bộ lượt vi phạm' : 'toàn bộ lượt khen thưởng';
    if (!confirm('XÓA ' + label.toUpperCase() + '?\n\nHành động này chỉ xóa dữ liệu trong ' + sheet + ', không xóa học sinh.')) return;

    const button = document.getElementById(sheet === 'VI_PHAM' ? 'btnDeleteAllViolations' : 'btnDeleteAllRewards');
    if (button) {
      button.disabled = true;
      button.textContent = '⏳ Đang xóa...';
    }

    try {
      const url = API + '?action=delete_all_events&sheet=' + encodeURIComponent(sheet) + '&_=' + Date.now();
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'API xóa thất bại.');
      toast('Đã xóa ' + (data.deletedCount || 0) + ' lượt trong ' + sheet + '.', 'success');
      if (typeof window.refreshAllData === 'function') await window.refreshAllData();
      else if (typeof window.loadClassData === 'function') window.loadClassData();
      setTimeout(function () { location.reload(); }, 350);
    } catch (error) {
      toast('Không thể xóa tất cả: ' + (error.message || error), 'error');
      if (button) {
        button.disabled = false;
        button.textContent = sheet === 'VI_PHAM' ? '🗑️ Xóa tất cả vi phạm' : '🗑️ Xóa tất cả khen thưởng';
      }
    }
  }

  function install() {
    const sheet = pageKey();
    if (!sheet) return;
    ensureButton(sheet);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }

  const observer = new MutationObserver(function () {
    install();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.LE_HOANG_DELETE_ALL_EVENTS = deleteAll;
})();
