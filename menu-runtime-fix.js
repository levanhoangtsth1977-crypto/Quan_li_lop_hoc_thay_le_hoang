/* MENU RUNTIME FIX 8.34 — lean + idempotent runtime
   Navigation remains owned by script.js.
   Attendance remains owned by script.js.
   Core feature modules load once by canonical filename.
   Behavior UI has one canonical owner for tables and quick-pick catalogs.
*/
(function(){
'use strict';
if(window.__MENU_RUNTIME_FIX_834__)return;
window.__MENU_RUNTIME_FIX_834__=true;
function canonicalFile(src){try{return new URL(src,document.baseURI).pathname.split('/').pop().toLowerCase()}catch(_){return String(src||'').split('?')[0].split('#')[0].split('/').pop().toLowerCase()}}
function loadOnce(src,attr){const target=canonicalFile(src);if(document.querySelector('script['+attr+']'))return false;for(const s of document.querySelectorAll('script[src]'))if(canonicalFile(s.getAttribute('src'))===target)return false;const s=document.createElement('script');s.src=src;s.async=false;s.setAttribute(attr,'1');document.head.appendChild(s);return true}
function loadViolationDesktop(){if(window.innerWidth<1024)return;if(document.querySelector('link[data-lh-violation-desktop-ui]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='violation-desktop-ui.css?v=1.0.0';l.setAttribute('data-lh-violation-desktop-ui','1');document.head.appendChild(l)}
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
loadOnce('student-links-fix.js?v=7.0.0','data-lh-student-links-shared-v70');
loadOnce('student-public-lock.js?v=1.0.0','data-lh-student-public-lock-v10');
loadOnce('violation-desktop-runtime.js?v=1.0.0','data-lh-violation-desktop-runtime-v10');
loadOnce('behavior-ui-canonical-v11.js?v=1.1.0','data-lh-behavior-ui-canonical-v11');
loadOnce('behavior-page-cleanup.js?v=1.1.0','data-lh-behavior-page-cleanup-v11');
loadOnce('violation-reset-sync.js?v=1.0.0','data-lh-violation-reset-sync-v10');
loadOnce('site-integrity-guard.js?v=1.0.0','data-lh-site-integrity-guard-v10');
loadOnce('learning-smas-ui-clean.js?v=1.0.0','data-lh-learning-smas-ui-clean-v10');
loadOnce('clear-current-violations-once.js?v=20260910.1','data-lh-clear-current-violations-once');
loadViolationDesktop();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();