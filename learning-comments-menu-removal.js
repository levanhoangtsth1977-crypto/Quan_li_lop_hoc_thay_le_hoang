/* LEARNING/COMMENTS MENU REMOVAL 1.0
   Canonical workflow:
   - Keep SMAS import/data used for learning analysis.
   - Remove obsolete top-level Learning and Comments menu entries/pages.
   - Do not remove SMAS data/import engine.
*/
(function(){
  'use strict';
  if(window.__LH_LEARNING_COMMENTS_MENU_REMOVAL_10__) return;
  window.__LH_LEARNING_COMMENTS_MENU_REMOVAL_10__=true;

  const REMOVE_PAGES=new Set(['learning','comments']);
  const REMOVE_IDS=new Set(['page-learning','page-comments']);
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');

  function removeNode(el){
    if(!el) return;
    el.hidden=true;
    el.setAttribute('aria-hidden','true');
    el.remove();
  }

  function isObsoleteMenu(el){
    const page=String(el.getAttribute?.('data-page')||'').trim().toLowerCase();
    if(REMOVE_PAGES.has(page)) return true;
    const text=norm(el.textContent);
    return text==='học tập' || text==='nhận xét';
  }

  function clean(){
    document.querySelectorAll('.main-menu .menu-item,[data-page]').forEach(el=>{
      if(isObsoleteMenu(el)) removeNode(el);
    });
    REMOVE_IDS.forEach(id=>removeNode(document.getElementById(id)));
    document.querySelectorAll('[data-page-link="learning"],[data-page-link="comments"],[data-action="add-learning"],[data-action="add-comment"],[data-action="add-comment-record"]').forEach(removeNode);
    /* Remove obsolete manual-entry modal forms, but preserve SMAS import area. */
    document.querySelectorAll('.modal,dialog,[role="dialog"]').forEach(el=>{
      const text=norm(el.innerText||el.textContent);
      if(text.includes('ghi nhận kết quả học tập') || text.includes('thêm nhận xét')) removeNode(el);
    });
  }

  function boot(){
    clean();
    window.addEventListener('load',clean,{once:true});
    window.addEventListener('pageshow',clean);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
