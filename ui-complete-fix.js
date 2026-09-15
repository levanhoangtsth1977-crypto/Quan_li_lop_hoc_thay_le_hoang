/* UI EARLY ACTIVATION 1.2 — STARTUP ONLY
 * script.js remains the sole permanent router.
 * This guard is the only startup click bridge. It is active until
 * script.js reports UI.eventsBound === true, then removes itself.
 */
(function(){
  'use strict';
  if (window.__LH_UI_EARLY_ACTIVATION_12__) return;
  window.__LH_UI_EARLY_ACTIVATION_12__ = true;

  function ready(){
    try { return typeof UI !== 'undefined' && UI && UI.eventsBound === true; }
    catch(e){ return false; }
  }

  function hide(id){
    const el=document.getElementById(id);
    if(!el) return false;
    el.hidden=false;
    el.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    return true;
  }

  function closeSidebar(){
    const s=document.getElementById('sidebar');
    const o=document.getElementById('sidebarOverlay');
    if(s) s.classList.remove('open');
    if(o){ o.style.display=''; o.setAttribute('aria-hidden','true'); }
  }

  function navigate(page){
    if (typeof window.navigateToPage === 'function') return window.navigateToPage(page);
    const section=document.querySelector('[data-page-section="'+CSS.escape(String(page||''))+'"]');
    if(!section) return false;
    document.querySelectorAll('[data-page-section]').forEach(x=>{
      const active=x===section;
      x.classList.toggle('active',active);
      x.hidden=!active;
    });
    document.querySelectorAll('.menu-item[data-page]').forEach(x=>{
      x.classList.toggle('active',x.dataset.page===String(page||''));
    });
    closeSidebar();
    return true;
  }

  function action(name){
    const value=String(name||'').trim();
    if(typeof window.openAddStudentModal==='function' && value==='add-student') return window.openAddStudentModal();
    if(typeof window.openImportStudents==='function' && value==='import-students') return window.openImportStudents();
    if(value==='attendance') return navigate('attendance');
    if(value==='add-violation'){
      if(typeof window.prepareViolationModal==='function') return window.prepareViolationModal();
      return hide('violationModal');
    }
    if(value==='add-reward'){
      if(typeof window.prepareRewardModal==='function') return window.prepareRewardModal();
      return hide('rewardModal');
    }
    if(value==='statistics') return navigate('statistics');
    if(value==='student-links') return navigate('student-links');
    if(value==='learning' || value==='add-learning' || value==='progress' || value==='add-progress') return navigate('learning');
    if(value==='ai' || value==='ai-teacher') return navigate('ai');
    if(value==='settings') return navigate('settings');
    if(value==='refresh' || value==='refresh-data') return typeof window.refreshAll==='function' ? window.refreshAll() : false;
    if(value==='export-report' || value==='export' || value==='backup') return false;
    return false;
  }

  function handler(event){
    if(ready()){
      document.removeEventListener('click',handler,true);
      window.__LH_UI_EARLY_ACTIVATION_12_READY__=true;
      return;
    }
    const target=event.target && event.target.closest ? event.target : null;
    if(!target) return;

    const menu=target.closest('.menu-item[data-page]');
    if(menu){
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(menu.dataset.page);
      return;
    }

    const link=target.closest('[data-page-link]');
    if(link){
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(link.dataset.pageLink);
      return;
    }

    const toggle=target.closest('#menuToggle,#sidebarToggle');
    if(toggle){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.openMobileSidebar==='function') window.openMobileSidebar();
      else {
        const s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay');
        if(s) s.classList.add('open');
        if(o){o.style.display='block';o.setAttribute('aria-hidden','false');}
      }
      return;
    }

    const close=target.closest('#sidebarClose,#sidebarOverlay');
    if(close){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.closeMobileSidebar==='function') window.closeMobileSidebar();
      else closeSidebar();
      return;
    }

    const trigger=target.closest('[data-action]');
    if(trigger){
      const handled=action(trigger.dataset.action);
      if(handled!==false){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
  }

  document.addEventListener('click',handler,true);
})();
