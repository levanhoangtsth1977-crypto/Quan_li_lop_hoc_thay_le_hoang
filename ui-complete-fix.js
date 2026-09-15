/* UI EARLY ACTIVATION 1.1 — STARTUP ONLY
 * script.js remains the sole canonical permanent event router.
 * This file is loaded immediately after script.js by index.html.
 * It handles only clicks that occur before script.js has bound its router,
 * then removes itself as soon as the canonical router is ready.
 */
(function(){
  'use strict';
  if(window.__LH_UI_EARLY_ACTIVATION_11__) return;
  window.__LH_UI_EARLY_ACTIVATION_11__ = true;

  function routerReady(){
    try { return typeof UI !== 'undefined' && UI && UI.eventsBound === true; }
    catch(e){ return false; }
  }

  function app(){ return window.LopHocApp || null; }

  function navigate(page){
    if(typeof window.navigateToPage === 'function') return window.navigateToPage(page);
    const a=app();
    return a && typeof a.navigateToPage==='function' ? a.navigateToPage(page) : false;
  }

  function action(name){
    switch(String(name||'').trim()){
      case 'add-student':
        return typeof window.openAddStudentModal==='function' ? window.openAddStudentModal() : false;
      case 'import-students':
        return typeof window.openImportStudents==='function' ? window.openImportStudents() : false;
      case 'attendance':
        return navigate('attendance');
      case 'add-violation':
        if(typeof window.prepareViolationModal==='function') return window.prepareViolationModal();
        return app() && typeof app().prepareViolationModal==='function' ? app().prepareViolationModal() : false;
      case 'add-reward':
        if(typeof window.prepareRewardModal==='function') return window.prepareRewardModal();
        return app() && typeof app().prepareRewardModal==='function' ? app().prepareRewardModal() : false;
      case 'statistics': return navigate('statistics');
      case 'student-links': return navigate('student-links');
      case 'learning':
      case 'add-learning':
      case 'progress':
      case 'add-progress': return navigate('learning');
      case 'ai':
      case 'ai-teacher': return navigate('ai');
      case 'settings': return navigate('settings');
      case 'refresh':
      case 'refresh-data': return typeof window.refreshAll==='function' ? window.refreshAll() : false;
      default: return false;
    }
  }

  function handler(event){
    if(routerReady()){
      document.removeEventListener('click',handler,true);
      window.__LH_UI_EARLY_ACTIVATION_11_READY__=true;
      return;
    }

    const target = event.target && event.target.closest ? event.target : null;
    if(!target) return;

    const menu=target.closest('.menu-item[data-page]');
    if(menu){
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(menu.dataset.page);
      return;
    }

    const pageLink=target.closest('[data-page-link]');
    if(pageLink){
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(pageLink.dataset.pageLink);
      return;
    }

    const toggle=target.closest('#menuToggle, #sidebarToggle');
    if(toggle){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.openMobileSidebar==='function') window.openMobileSidebar();
      else if(app() && typeof app().openMobileSidebar==='function') app().openMobileSidebar();
      return;
    }

    const close=target.closest('#sidebarClose, #sidebarOverlay');
    if(close){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof window.closeMobileSidebar==='function') window.closeMobileSidebar();
      else if(app() && typeof app().closeMobileSidebar==='function') app().closeMobileSidebar();
      return;
    }

    const trigger=target.closest('[data-action]');
    if(trigger){
      const handled=action(trigger.dataset.action);
      if(handled !== false){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
  }

  document.addEventListener('click',handler,true);
})();
