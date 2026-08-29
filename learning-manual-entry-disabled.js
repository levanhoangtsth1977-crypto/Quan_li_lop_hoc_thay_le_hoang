/* LEARNING MANUAL ENTRY DISABLED 1.0
   Canonical workflow:
   - Learning results come from SMAS imports.
   - Attendance, violations and rewards remain managed by their own menus.
   - Manual "Ghi nhận kết quả" and "Thêm nhận xét" entry are hidden/disabled.
   - Existing data is not deleted.
*/
(function(){
  'use strict';
  if(window.__LH_LEARNING_MANUAL_ENTRY_DISABLED_10__) return;
  window.__LH_LEARNING_MANUAL_ENTRY_DISABLED_10__ = true;

  const norm = v => String(v ?? '').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const hide = el => {
    if(!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden','true');
    el.dataset.lhManualEntryDisabled='1';
    if(el.style) el.style.display='none';
  };

  function isTargetButton(el){
    const text = norm(el.textContent);
    const aria = norm(el.getAttribute?.('aria-label'));
    const title = norm(el.getAttribute?.('title'));
    return (
      text === 'ghi nhận kết quả' ||
      text.includes('ghi nhận kết quả') ||
      aria.includes('ghi nhận kết quả') ||
      title.includes('ghi nhận kết quả') ||
      text === 'thêm nhận xét' ||
      text.includes('thêm nhận xét') ||
      aria.includes('thêm nhận xét') ||
      title.includes('thêm nhận xét')
    );
  }

  function isManualModal(el){
    if(!(el instanceof HTMLElement)) return false;
    const text = norm(el.innerText || el.textContent);
    if(!text) return false;
    const hasLearning = text.includes('ghi nhận kết quả học tập');
    const hasComment = text.includes('thêm nhận xét');
    return hasLearning || hasComment;
  }

  function apply(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      if(isTargetButton(el)) hide(el);
    });

    document.querySelectorAll('.modal, dialog, [role="dialog"]').forEach(el=>{
      if(isManualModal(el)) hide(el);
    });

    /* Remove manual-entry quick-action remnants without touching SMAS. */
    document.querySelectorAll('[data-action]').forEach(el=>{
      const a = norm(el.getAttribute('data-action'));
      if(a === 'add-learning' || a === 'add-comment' || a === 'add-comment-record') hide(el);
    });
  }

  function start(){
    apply();
    window.addEventListener('load', apply, {once:true});
    window.addEventListener('pageshow', apply);
    document.addEventListener('click', function(e){
      const el=e.target?.closest?.('button,a,[role="button"]');
      if(el && isTargetButton(el)){
        e.preventDefault();
        e.stopImmediatePropagation();
        hide(el);
      }
    }, true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
