/* LEARNING UI CLEANUP 2.2
 * KEEP: Học tập menu/page + SMAS import + excellent-student analysis.
 * REMOVE: standalone Nhận xét menu/page and obsolete manual learning entry.
 * Also bootstraps the SMAS HTML builder so Học tập is never blank.
 */
(function(){
  'use strict';
  if(window.__LH_LEARNING_UI_CLEANUP_22__) return;
  window.__LH_LEARNING_UI_CLEANUP_22__=true;

  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const remove=el=>{if(!el||el===document.body)return;el.hidden=true;el.setAttribute('aria-hidden','true');el.remove();};

  function ensureLearningMenu(){
    const menu=document.querySelector('.main-menu');
    if(!menu)return;
    if(!menu.querySelector('[data-page="learning"]')){
      const ref=menu.querySelector('[data-page="statistics"],[data-page="student-links"]');
      const b=document.createElement('button');
      b.type='button';
      b.className='menu-item';
      b.setAttribute('data-page','learning');
      b.innerHTML='<i class="fa-solid fa-book-open"></i><span>Học tập</span>';
      if(ref)menu.insertBefore(b,ref);else menu.appendChild(b);
    }
  }

  function removeCommentsMenu(){
    document.querySelectorAll('.main-menu .menu-item,[data-page],[data-page-link]').forEach(el=>{
      const page=norm(el.getAttribute?.('data-page')||el.getAttribute?.('data-page-link')||'');
      const text=norm(el.textContent);
      if(page==='comments'||text==='nhận xét')remove(el);
    });
    remove(document.getElementById('page-comments'));
  }

  function removeManualLearningEntry(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const text=norm(el.textContent);
      const action=norm(el.getAttribute?.('data-action')||'');
      if(action==='add-learning'||action==='add-learning-result'||text==='ghi nhận kết quả'||text==='➕ ghi nhận kết quả')remove(el);
    });
    document.querySelectorAll('.modal,dialog,[role="dialog"]').forEach(el=>{
      const text=norm(el.innerText||el.textContent);
      if(text.includes('ghi nhận kết quả học tập')||text.includes('chọn môn học và mức đạt'))remove(el);
    });
  }

  function removeCommentsBlock(){
    document.querySelectorAll('h1,h2,h3,h4').forEach(el=>{
      if(norm(el.textContent)==='nhận xét'){
        const block=el.closest('.page-section,[data-page-section],.card,.panel,.dashboard-panel,.section-heading')||el.parentElement;
        remove(block);
      }
    });
    document.querySelectorAll('[data-action="add-comment"],[data-action="add-comment-record"],[data-page-link="comments"]').forEach(remove);
  }

  function ensureSmasModule(){
    if(window.__LEARNING_SMAS_IMPORT_10__)return;
    if(document.querySelector('script[data-lh-smas-module="1"]'))return;
    const learning=document.querySelector('[data-page-section="learning"],#page-learning');
    if(!learning)return;
    const script=document.createElement('script');
    script.dataset.lhSmasModule='1';
    script.src='learning-smas-import.js?v=1.1.0';
    script.async=false;
    script.onload=()=>{
      try{
        // learning-smas-import.js initializes automatically; this hook is optional.
        if(typeof window.ensureLearningSMAS==='function')window.ensureLearningSMAS();
      }catch(e){console.warn('[SMAS] bootstrap',e);}
    };
    script.onerror=()=>console.error('[SMAS] Không tải được learning-smas-import.js');
    document.body.appendChild(script);
  }

  function clean(){
    ensureLearningMenu();
    removeCommentsMenu();
    removeManualLearningEntry();
    removeCommentsBlock();
    ensureSmasModule();
  }

  function boot(){
    clean();
    window.addEventListener('load',clean,{once:true});
    window.addEventListener('pageshow',clean);
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('[data-page="learning"]'))setTimeout(clean,0);
    },true);
    setTimeout(clean,300);
    setTimeout(clean,1000);
    setTimeout(clean,2500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
