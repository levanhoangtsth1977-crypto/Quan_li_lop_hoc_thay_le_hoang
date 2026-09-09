/* MENU RUNTIME FIX 8.17 — lean runtime
   Navigation remains owned by script.js.
   Attendance table remains owned only by script.js.
   Learning/SMAS and behavior summaries are loaded as isolated modules.
   Each module has one canonical loader only.
*/
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_817__) return;
  window.__MENU_RUNTIME_FIX_817__=true;
  const loadOnce=(src,attr)=>{
    if(document.querySelector('script['+attr+']')) return;
    const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');document.head.appendChild(s);
  };
  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('reward-delete-fix.js?v=20260826.1','data-lh-reward-delete-fix');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('learning-smas-import.js?v=2.0.0','data-lh-learning-smas-import-v20');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    /* Canonical class identity: 5A3 only. */
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    loadOnce('behavior-records-ai-summary.js?v=1.2.0','data-lh-behavior-ai-summary-v12');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
