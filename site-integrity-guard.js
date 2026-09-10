/* SITE INTEGRITY GUARD 1.0
 * Kiểm tra và tự sửa nhẹ các liên kết menu/section tại runtime.
 * Không thay đổi Data Engine; không quét DOM liên tục.
 */
(function(){
  'use strict';
  if(window.__LH_SITE_INTEGRITY_GUARD_10__) return;
  window.__LH_SITE_INTEGRITY_GUARD_10__=true;

  const REQUIRED=['dashboard','students','attendance','violations','rewards','learning','statistics','student-links','ai','lucky-wheel','settings'];

  function section(page){
    return document.querySelector('#page-'+page)||document.querySelector('[data-page-section="'+page+'"]');
  }
  function menuItems(){return [...document.querySelectorAll('.main-menu [data-page]')];}

  function repair(){
    try{
      /* A menu must always point to an existing page section. Hide orphan items instead of breaking navigation. */
      menuItems().forEach(el=>{
        const page=String(el.getAttribute('data-page')||'').trim();
        if(page && !section(page)){
          el.hidden=true;
          el.dataset.integrity='orphan-menu';
        }else if(el.dataset.integrity==='orphan-menu'){
          el.hidden=false;
          delete el.dataset.integrity;
        }
      });

      /* A section must have exactly one canonical identity. */
      REQUIRED.forEach(page=>{
        const matches=[...document.querySelectorAll('#page-'+page+', [data-page-section="'+page+'"]')];
        if(matches.length>1){
          matches.slice(1).forEach(el=>el.remove());
        }
      });

      /* Keep the canonical class identity visible. */
      const hero=document.getElementById('heroClass');
      if(hero && /^(Lớp\s*)?5C3?$/i.test((hero.textContent||'').trim())) hero.textContent='Lớp 5A3';
    }catch(error){console.warn('[SITE INTEGRITY]',error)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repair,{once:true});
  else repair();
  window.addEventListener('google-sheets-data-ready',repair,{once:false});
  window.__LH_SITE_INTEGRITY_API__={repair,required:REQUIRED.slice()};
})();
