/* VI PHAM STALE-UI CLEANER 1.0
 * Retired the previous automatic deletion job.
 * This module NEVER deletes Google Sheets data and NEVER touches other menus.
 * It only removes stale/phantom rows from the Vi phạm table when the synced
 * canonical data source is empty. This prevents legacy renderers from leaving
 * old local rows visible after the data was cleared.
 */
(function(){
  'use strict';
  if(window.__LH_VIOLATION_STALE_UI_CLEANER_10__) return;
  window.__LH_VIOLATION_STALE_UI_CLEANER_10__=true;

  function localViolations(){
    return Array.isArray(window.violationRecords)?window.violationRecords:[];
  }
  function hasRealRows(){
    const body=document.getElementById('violationTableBody');
    if(!body) return false;
    return [...body.querySelectorAll('tr')].some(tr=>!tr.querySelector('.empty-state') && tr.querySelectorAll('td').length>0);
  }
  function clearStaleRows(){
    if(localViolations().length!==0) return;
    const body=document.getElementById('violationTableBody');
    if(!body || !hasRealRows()) return;
    body.innerHTML='<tr><td colspan="6"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong><p>Chỉ các bản ghi thực tế mới xuất hiện tại đây.</p></div></td></tr>';
    const badge=document.getElementById('violationBadge');
    if(badge) badge.textContent='0';
    const cards=['statViolations'];
    cards.forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0'});
  }
  function schedule(){setTimeout(clearStaleRows,800)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  window.addEventListener('google-sheets-data-ready',schedule);
  window.addEventListener('google-sheets-refresh',schedule);
  new MutationObserver(()=>{if(localViolations().length===0) clearStaleRows()})
    .observe(document.documentElement,{childList:true,subtree:true});
})();
