/* UI STARTUP COMPAT 1.3
 * Canonical permanent router: script.js.
 * This compatibility layer guarantees that the main menu and homepage quick
 * actions remain clickable even when Data Engine startup is late/failed.
 * It handles ONLY menu/page/quick-action targets and never handles save/submit.
 */
(function(){
  'use strict';
  if(window.__LH_UI_EARLY_ACTIVATION_13__) return;
  window.__LH_UI_EARLY_ACTIVATION_13__=true;

  function canonicalReady(){
    try{return typeof UI!=='undefined' && UI && UI.eventsBound===true;}catch(e){return false;}
  }

  function setPage(page){
    const value=String(page||'').trim();
    if(!value) return false;
    if(typeof window.navigateToPage==='function'){
      try{return window.navigateToPage(value)!==false;}catch(e){}
    }
    const section=document.querySelector('[data-page-section="'+CSS.escape(value)+'"]');
    if(!section) return false;
    document.querySelectorAll('[data-page-section]').forEach(function(el){
      const active=el===section;
      el.classList.toggle('active',active);
      el.hidden=!active;
    });
    document.querySelectorAll('.menu-item[data-page]').forEach(function(el){
      el.classList.toggle('active',el.dataset.page===value);
    });
    const title=document.getElementById('pageTitle');
    if(title){
      const labels={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên',settings:'Cài đặt'};
      title.textContent=labels[value]||value;
    }
    return true;
  }

  function showModal(id){
    const modal=document.getElementById(id);
    if(!modal) return false;
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    return true;
  }

  function quickAction(name){
    const value=String(name||'').trim();
    try{
      if(value==='add-student'){
        if(typeof window.openAddStudentModal==='function') return window.openAddStudentModal()!==false;
        return showModal('studentModal');
      }
      if(value==='import-students'){
        if(typeof window.openImportStudents==='function') return window.openImportStudents()!==false;
        return false;
      }
      if(value==='attendance') return setPage('attendance');
      if(value==='add-violation'){
        if(typeof window.prepareViolationModal==='function') return window.prepareViolationModal()!==false;
        return showModal('violationModal');
      }
      if(value==='add-reward'){
        if(typeof window.prepareRewardModal==='function') return window.prepareRewardModal()!==false;
        return showModal('rewardModal');
      }
      if(value==='statistics') return setPage('statistics');
      if(value==='student-links') return setPage('student-links');
      if(value==='learning' || value==='add-learning' || value==='progress' || value==='add-progress') return setPage('learning');
      if(value==='ai' || value==='ai-teacher') return setPage('ai');
      if(value==='settings') return setPage('settings');
      if(value==='refresh' || value==='refresh-data'){
        if(typeof window.refreshAll==='function'){window.refreshAll();return true;}
        window.location.reload();
        return true;
      }
    }catch(e){console.warn('[UI STARTUP COMPAT 1.3]',e);}
    return false;
  }

  function handler(event){
    const target=event.target && event.target.closest ? event.target : null;
    if(!target) return;

    const menu=target.closest('.menu-item[data-page]');
    if(menu){
      event.preventDefault();
      event.stopImmediatePropagation();
      setPage(menu.dataset.page);
      return;
    }

    const pageLink=target.closest('[data-page-link]');
    if(pageLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      setPage(pageLink.dataset.pageLink);
      return;
    }

    const action=target.closest('.quick-action[data-action], [data-action]');
    if(action){
      const name=action.dataset.action;
      if(['add-student','attendance','add-violation','add-reward','statistics','student-links','learning','add-learning','progress','add-progress','ai','ai-teacher','settings','refresh','refresh-data'].includes(name)){
        event.preventDefault();
        event.stopImmediatePropagation();
        quickAction(name);
        return;
      }
    }

    const toggle=target.closest('#sidebarToggle,#menuToggle');
    if(toggle){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.openMobileSidebar==='function') window.openMobileSidebar();
      else{
        const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
        if(s)s.classList.add('open');
        if(o){o.style.display='block';o.setAttribute('aria-hidden','false');}
      }
      return;
    }

    const close=target.closest('#sidebarClose,#sidebarOverlay');
    if(close){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.closeMobileSidebar==='function') window.closeMobileSidebar();
      else{
        const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
        if(s)s.classList.remove('open');
        if(o){o.style.display='';o.setAttribute('aria-hidden','true');}
      }
    }
  }

  /* Capture phase ensures legacy document-level click handlers cannot swallow
     homepage/menu actions. This layer never handles forms or data writes. */
  document.addEventListener('click',handler,true);
  window.__LH_UI_EARLY_ACTIVATION_13_READY__=function(){return canonicalReady();};
})();
