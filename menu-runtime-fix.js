/* MENU RUNTIME FIX 8.22 — lean + idempotent runtime
   Navigation remains owned by script.js.
   Attendance remains owned only by script.js.
   Core feature modules load once by canonical filename.
   Student links: one student = one personal deep link.
*/
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_822__) return;
  window.__MENU_RUNTIME_FIX_822__=true;

  function canonicalFile(src){
    try{return new URL(src,document.baseURI).pathname.split('/').pop().toLowerCase();}
    catch(_){return String(src||'').split('?')[0].split('#')[0].split('/').pop().toLowerCase();}
  }
  function loadOnce(src,attr){
    if(document.querySelector('script['+attr+']')) return false;
    const target=canonicalFile(src);
    let exists=false;
    document.querySelectorAll('script[src]').forEach(s=>{if(canonicalFile(s.getAttribute('src'))===target) exists=true;});
    if(exists) return false;
    const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');document.head.appendChild(s);return true;
  }
  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('reward-delete-fix.js?v=20260826.1','data-lh-reward-delete-fix');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('learning-smas-import.js?v=2.0.0','data-lh-learning-smas-import-v20');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    loadOnce('behavior-records-ai-summary.js?v=1.2.0','data-lh-behavior-ai-summary-v12');
    loadOnce('behavior-quick-options.js?v=2.0.0','data-lh-behavior-quick-options-v20');
    /* IMPORTANT: personal links only. Never load student-links-shared-override.js. */
    loadOnce('student-links-fix.js?v=5.0.0','data-lh-student-links-personal-v50');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();