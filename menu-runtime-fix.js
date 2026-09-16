/* MENU RUNTIME 9.6 — LOADER + STARTUP ACTIVATION
 * script.js remains the permanent classroom UI/event router.
 * ui-complete-fix.js is restored as a temporary startup activation fallback
 * because the current runtime is showing static homepage HTML while menu events
 * are not activating. It is loaded once and only handles menu/page/quick actions.
 * master-crud-ui.js remains statically loaded from index.html for data writes.
 */
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_960__) return;
  window.__MENU_RUNTIME_FIX_960__ = true;

  const loadOnce=(src,attr)=>{
    try{
      if(document.querySelector('script['+attr+']')) return;
      const s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.setAttribute(attr,'1');
      document.head.appendChild(s);
    }catch(e){ console.warn('[MENU RUNTIME 9.6]',e); }
  };

  function boot(){
    /* Emergency activation fallback: restores menu/page/quick-action clicks. */
    loadOnce('ui-complete-fix.js?v=1.3','data-lh-ui-startup-compat');
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    loadOnce('behavior-quick-options.js?v=2.6.0','data-lh-behavior-quick-options-v26');
    loadOnce('home-class-logo.js?v=1.9.0','data-lh-home-class-logo-v190');
    loadOnce('site-link-integrity.js?v=2.2.0','data-lh-site-link-integrity-v22');
    loadOnce('behavior-form-select-repair.js?v=20260913.1','data-lh-behavior-form-select-repair-v10');
    loadOnce('behavior-multi-student-ui.js?v=20260914.2','data-lh-behavior-multi-student-ui-v22');
    loadOnce('student-links-fast-fix.js?v=2.0.0','data-lh-student-links-fast-fix-v20');
    loadOnce('lucky-wheel-final.js?v=20260915.1','data-lh-lucky-wheel-final-v21');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
