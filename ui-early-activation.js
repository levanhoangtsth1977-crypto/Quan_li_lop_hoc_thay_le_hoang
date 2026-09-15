/* UI EARLY ACTIVATION 1.0 — TEMPORARY STARTUP GUARD
 * ------------------------------------------------------------
 * Purpose:
 * - Keep the existing canonical router in script.js as the only permanent UI router.
 * - During startup only, script.js may be waiting for Data Engine initialization.
 * - This guard temporarily handles the same canonical actions and removes itself
 *   as soon as script.js reports UI.eventsBound === true.
 * - It never renders pages, never saves data, never intercepts submit/change,
 *   and never competes after the canonical router is ready.
 * ------------------------------------------------------------
 */
(function(){
  'use strict';

  if(window.__LH_UI_EARLY_ACTIVATION_10__) return;
  window.__LH_UI_EARLY_ACTIVATION_10__ = true;

  const EVENT = 'click';

  function routerReady(){
    try{
      return typeof UI !== 'undefined' && UI && UI.eventsBound === true;
    }catch(e){
      return false;
    }
  }

  function app(){
    return window.LopHocApp || null;
  }

  function navigate(page){
    const a=app();
    if(a && typeof a.navigateToPage==='function') return a.navigateToPage(page);
    if(typeof window.navigateToPage==='function') return window.navigateToPage(page);
    return false;
  }

  function handleAction(action){
    const a=app();
    switch(String(action||'').trim()){
      case 'add-student':
        return typeof window.openAddStudentModal==='function'
          ? window.openAddStudentModal() : false;
      case 'import-students':
        return typeof window.openImportStudents==='function'
          ? window.openImportStudents() : false;
      case 'attendance':
        return navigate('attendance');
      case 'add-violation':
        return typeof a?.prepareViolationModal==='function'
          ? a.prepareViolationModal() : false;
      case 'add-reward':
        return typeof a?.prepareRewardModal==='function'
          ? a.prepareRewardModal() : false;
      case 'add-learning':
        return navigate('learning');
      case 'add-comment':
        return navigate('comments');
      case 'progress':
      case 'add-progress':
        return navigate('learning');
      case 'statistics':
        return navigate('statistics');
      case 'student-links':
        return navigate('student-links');
      case 'materials':
      case 'material':
        return navigate('materials');
      case 'ai':
      case 'ai-teacher':
        return navigate('ai');
      case 'settings':
        return navigate('settings');
      case 'refresh':
      case 'refresh-data':
        return typeof window.refreshAll==='function' ? window.refreshAll() : false;
      case 'export-report':
      case 'export':
      case 'backup':
        return typeof a?.exportReportSafe==='function' ? a.exportReportSafe() : false;
      default:
        return false;
    }
  }

  function handler(event){
    if(routerReady()){
      document.removeEventListener(EVENT,handler,true);
      window.__LH_UI_EARLY_ACTIVATION_10_READY__=true;
      return;
    }

    const target=event.target instanceof Element ? event.target : null;
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
      if(typeof app()?.openMobileSidebar==='function') app().openMobileSidebar();
      else if(typeof window.openMobileSidebar==='function') window.openMobileSidebar();
      return;
    }

    const close=target.closest('#sidebarClose, #sidebarOverlay');
    if(close){
      event.preventDefault();
      event.stopImmediatePropagation();
      if(typeof app()?.closeMobileSidebar==='function') app().closeMobileSidebar();
      else if(typeof window.closeMobileSidebar==='function') window.closeMobileSidebar();
      return;
    }

    const action=target.closest('[data-action]');
    if(action && handleAction(action.dataset.action)!==false){
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }

  document.addEventListener(EVENT,handler,true);
  window.__LH_UI_EARLY_ACTIVATION_REMOVE__=function(){
    document.removeEventListener(EVENT,handler,true);
  };
})();
