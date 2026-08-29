/* LEARNING UI CLEANUP 2.0
 * Keep: Học tập page + SMAS import + excellent-student analysis.
 * Remove: obsolete manual "Ghi nhận kết quả" entry and "Nhận xét" block.
 * Remove: standalone "Nhận xét" menu only.
 */
(function(){
  'use strict';
  if(window.__LH_LEARNING_UI_CLEANUP_20__) return;
  window.__LH_LEARNING_UI_CLEANUP_20__=true;

  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const remove=el=>{ if(!el||el===document.body) return; el.hidden=true; el.setAttribute('aria-hidden','true'); el.remove(); };

  function removeCommentsMenu(){
    document.querySelectorAll('.main-menu .menu-item,[data-page],[data-page-link]').forEach(el=>{
      const page=norm(el.getAttribute?.('data-page')||el.getAttribute?.('data-page-link')||'');
      const text=norm(el.textContent);
      if(page==='comments' || text==='nhận xét') remove(el);
    });
    document.getElementById('page-comments') && remove(document.getElementById('page-comments'));
  }

  function closestBlock(el){
    return el.closest('article,section,.card,.panel,.dashboard-panel,.page-section,.page-actions,.quick-action') || el;
  }

  function removeManualLearningEntry(){
    // Remove visible buttons/links that launch the obsolete manual learning form.
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const text=norm(el.textContent);
      const action=norm(el.getAttribute?.('data-action')||'');
      if(action==='add-learning' || action==='add-learning-result' || text==='ghi nhận kết quả' || text==='➕ ghi nhận kết quả'){
        remove(el);
      }
    });

    // Remove the manual result-entry card/modal only; never remove the SMAS card.
    document.querySelectorAll('.modal,dialog,[role="dialog"]').forEach(el=>{
      const text=norm(el.innerText||el.textContent);
      if(text.includes('ghi nhận kết quả học tập') || text.includes('mức đạt') || text.includes('chọn môn học và mức đạt')) remove(el);
    });
  }

  function removeCommentsBlock(){
    // Remove the rendered "Nhận xét" block without touching SMAS or excellent-student sections.
    document.querySelectorAll('h1,h2,h3,h4,.section-heading,.panel-header').forEach(el=>{
      if(norm(el.textContent)==='nhận xét') remove(closestBlock(el));
    });
    document.querySelectorAll('[data-action="add-comment"],[data-action="add-comment-record"],[data-page-link="comments"]').forEach(remove);
  }

  function clean(){
    removeCommentsMenu();
    removeManualLearningEntry();
    removeCommentsBlock();
  }

  function boot(){
    clean();
    window.addEventListener('load',clean,{once:true});
    window.addEventListener('pageshow',clean);
    const observer=new MutationObserver(()=>clean());
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.setTimeout(clean,300);
    window.setTimeout(clean,1000);
    window.setTimeout(clean,2500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
