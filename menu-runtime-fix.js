/* MENU RUNTIME 8.71 — stable loader + isolated menu fallback */
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_871__) return;
  window.__MENU_RUNTIME_FIX_871__ = true;

  const TITLES={dashboard:'Trang chủ',students:'Học sinh',attendance:'Điểm danh',violations:'Vi phạm',rewards:'Khen thưởng',learning:'Học tập',statistics:'Thống kê','student-links':'Link học sinh',ai:'AI giáo viên','lucky-wheel':'Vòng quay may mắn',settings:'Cài đặt'};
  const loadOnce=(src,attr)=>{
    try{
      if(document.querySelector('script['+attr+']')) return;
      const s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.setAttribute(attr,'1');
      document.head.appendChild(s);
    }catch(e){ console.warn('[MENU RUNTIME 8.71]',e); }
  };
  const showPage=(page)=>{
    const target=document.querySelector('[data-page-section="'+String(page).replace(/"/g,'&quot;')+'"]')||document.getElementById('page-'+String(page));
    if(!target) return false;
    document.querySelectorAll('[data-page-section]').forEach(x=>{x.hidden=x!==target;x.classList.toggle('active',x===target)});
    document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(x=>x.classList.toggle('active',x.getAttribute('data-page')===String(page)));
    const title=document.getElementById('pageTitle'); if(title) title.textContent=TITLES[page]||String(page);
    const sidebar=document.getElementById('sidebar'),overlay=document.getElementById('sidebarOverlay');
    if(window.innerWidth<=900||sidebar?.classList.contains('open')){sidebar?.classList.remove('open');overlay?.classList.remove('active');if(overlay){overlay.hidden=true;overlay.setAttribute('aria-hidden','true')}document.body.classList.remove('sidebar-open');}
    try{window.dispatchEvent(new CustomEvent('lh-page-change',{detail:{page}}));}catch(_){ }
    if(page==='lucky-wheel') try{window.dispatchEvent(new Event('pagechange'));}catch(_){ }
    try{window.renderDashboard?.();window.updateBadges?.();}catch(_){ }
    try{
      if(page==='students') window.renderStudents?.();
      if(page==='attendance') window.renderAttendance?.();
      if(page==='violations') window.renderViolations?.();
      if(page==='rewards') window.renderRewards?.();
      if(page==='learning') window.renderLearning?.();
      if(page==='statistics') window.renderStatistics?.();
    }catch(_){ }
    return true;
  };
  /* Only sidebar menu items are handled here. No global form interception. */
  document.addEventListener('click',e=>{
    try{
      const t=e.target instanceof Element?e.target:null;
      const item=t?.closest('.main-menu .menu-item[data-page]');
      if(!item) return;
      const page=item.getAttribute('data-page');
      if(showPage(page)) e.preventDefault();
    }catch(err){console.warn('[MENU RUNTIME 8.71]',err)}
  },true);

  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    loadOnce('behavior-quick-options.js?v=2.6.0','data-lh-behavior-quick-options-v26');
    loadOnce('home-class-logo.js?v=1.9.0','data-lh-home-class-logo-v190');
    loadOnce('clear-targeted-violations-20260908.js?v=1.1.0','data-lh-violation-stale-ui-cleaner-v11');
    loadOnce('site-link-integrity.js?v=2.1.0','data-lh-site-link-integrity-v21');
    loadOnce('trieu-phu-menu-fix.js?v=20260913.1','data-lh-trieu-phu-menu-fix');
    loadOnce('behavior-form-select-repair.js?v=20260913.1','data-lh-behavior-form-select-repair-v10');
    loadOnce('behavior-multi-student-ui.js?v=20260914.2','data-lh-behavior-multi-student-ui-v22');
    loadOnce('master-crud-ui.js?v=20260915.13','data-lh-master-crud-ui-v13');
    loadOnce('student-links-fast-fix.js?v=2.0.0','data-lh-student-links-fast-fix-v20');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
