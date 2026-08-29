/* LEARNING UI CLEANUP 3.1
 * Học tập is a real runtime page section backed by SMAS.
 * Remove only obsolete standalone Nhận xét and manual learning entry controls.
 * Also boots the isolated student gender summary module when Học sinh page exists.
 */
(function(){
  'use strict';
  if(window.__LH_LEARNING_UI_CLEANUP_31__) return;
  window.__LH_LEARNING_UI_CLEANUP_31__=true;

  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
  const remove=el=>{if(!el||el===document.body)return;el.hidden=true;el.setAttribute('aria-hidden','true');el.remove();};

  function ensureLearningMenu(){
    const menu=document.querySelector('.main-menu');
    if(!menu)return;
    if(!menu.querySelector('[data-page="learning"]')){
      const ref=menu.querySelector('[data-page="statistics"],[data-page="student-links"]');
      const b=document.createElement('button');
      b.type='button'; b.className='menu-item'; b.dataset.page='learning';
      b.innerHTML='<i class="fa-solid fa-book-open"></i><span>Học tập</span>';
      if(ref)menu.insertBefore(b,ref); else menu.appendChild(b);
    }
  }

  function ensureLearningSection(){
    let section=document.getElementById('page-learning');
    if(!section){
      section=document.createElement('section');
      section.className='page-section';
      section.id='page-learning';
      section.dataset.pageSection='learning';
      section.innerHTML=`
        <div class="page-header">
          <div>
            <span class="page-eyebrow"><i class="fa-solid fa-book-open"></i> Dữ liệu học tập</span>
            <h1>Học tập</h1>
            <p>Quản lý kết quả học tập định kỳ từ bảng tổng hợp SMAS và làm nguồn đối chiếu xét học sinh xuất sắc.</p>
          </div>
        </div>
        <div id="lhLearningPageBody"></div>`;
      const main=document.getElementById('mainContent') || document.querySelector('main');
      const ref=main?.querySelector('[data-page-section="statistics"]');
      if(main){ if(ref)main.insertBefore(section,ref); else main.appendChild(section); }
    }
    return section;
  }

  function loadSmas(){
    if(window.__LEARNING_SMAS_IMPORT_10__) return;
    if(document.querySelector('script[data-lh-learning-smas]')) return;
    const s=document.createElement('script');
    s.src='learning-smas-import.js?v=3.1.0';
    s.dataset.lhLearningSmas='1';
    s.async=false;
    document.body.appendChild(s);
  }

  function loadStudentGenderSummary(){
    if(document.querySelector('script[data-lh-student-gender-summary]')) return;
    if(!document.getElementById('page-students')) return;
    const s=document.createElement('script');
    s.src='student-gender-summary.js?v=1.0.0';
    s.dataset.lhStudentGenderSummary='1';
    s.async=false;
    document.body.appendChild(s);
  }

  function removeCommentsMenu(){
    document.querySelectorAll('.main-menu .menu-item,[data-page],[data-page-link]').forEach(el=>{
      const page=norm(el.getAttribute?.('data-page')||el.getAttribute?.('data-page-link')||'');
      if(page==='comments' || (page!== 'learning' && norm(el.textContent)==='nhận xét')) remove(el);
    });
    remove(document.getElementById('page-comments'));
  }

  function removeManualLearningEntry(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      const text=norm(el.textContent), action=norm(el.getAttribute?.('data-action')||'');
      if(action==='add-learning'||action==='add-learning-result'||text==='ghi nhận kết quả'||text==='➕ ghi nhận kết quả') remove(el);
    });
    document.querySelectorAll('.modal,dialog,[role="dialog"]').forEach(el=>{
      const text=norm(el.innerText||el.textContent);
      if(text.includes('ghi nhận kết quả học tập')||text.includes('chọn môn học và mức đạt')) remove(el);
    });
  }

  function clean(){
    ensureLearningMenu();
    const section=ensureLearningSection();
    removeCommentsMenu();
    removeManualLearningEntry();
    loadSmas();
    loadStudentGenderSummary();
    section?.classList.remove('hidden');
  }

  function boot(){
    clean();
    window.addEventListener('load',clean,{once:true});
    window.addEventListener('pageshow',clean);
    setTimeout(clean,100);
    setTimeout(clean,500);
    setTimeout(clean,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
