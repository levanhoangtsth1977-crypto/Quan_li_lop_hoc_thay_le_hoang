/* MENU RUNTIME FIX 8.23 — lean runtime */
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_823__) return;
  window.__MENU_RUNTIME_FIX_823__=true;
  const loadOnce=(src,attr)=>{
    if(document.querySelector('script['+attr+']')) return;
    const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');document.head.appendChild(s);
  };
  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('reward-delete-fix.js?v=20260826.1','data-lh-reward-delete-fix');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    /* learning-smas-import.js is already a canonical static index include. */
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    /* behavior-records-ai-summary.js is already a canonical static index include. */
    loadOnce('behavior-quick-options.js?v=2.5.0','data-lh-behavior-quick-options-v25');
    loadOnce('home-class-logo.js?v=1.2.0','data-lh-home-class-logo-v120');
    /* Canonical navigation/link integrity: one menu item per page, no orphan links. */
    loadOnce('site-link-integrity.js?v=2.0.0','data-lh-site-link-integrity-v20');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();