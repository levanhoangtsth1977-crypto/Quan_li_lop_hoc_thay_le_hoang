/* BEHAVIOR PAGE CLEANUP 1.0
 * Only normalizes duplicate action controls in Vi phạm/Khen thưởng pages.
 * Does not touch records, router, or other menus.
 */
(function(){
  'use strict';
  if(window.__LH_BEHAVIOR_PAGE_CLEANUP_10__) return;
  window.__LH_BEHAVIOR_PAGE_CLEANUP_10__=true;

  function cleanSection(id, labels){
    const page=document.getElementById(id);
    if(!page) return;
    const seen=new Set();
    page.querySelectorAll('button,a').forEach(el=>{
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!text) return;
      const key=text.toLocaleLowerCase('vi');
      if(!labels.some(label=>key===label || key.includes(label))) return;
      if(seen.has(key)) el.remove(); else seen.add(key);
    });
  }

  function clean(){
    cleanSection('page-violations',['xóa sạch vi phạm','xóa tất cả vi phạm','xóa tất cả']);
    cleanSection('page-rewards',['xóa sạch khen thưởng','xóa tất cả khen thưởng','xóa tất cả']);
  }

  function boot(){
    clean();
    [250,800,1800].forEach(ms=>setTimeout(clean,ms));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
