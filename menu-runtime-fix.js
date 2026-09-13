/* MENU RUNTIME FIX 8.33 — menu rescue + runtime dependencies */
(function(){
  'use strict';
  if(window.__MENU_RUNTIME_FIX_833__) return;
  window.__MENU_RUNTIME_FIX_833__=true;

  /*
   * MENU RESCUE:
   * Bắt click ở WINDOW capture để đứng trước các document-level
   * router cũ. Chỉ can thiệp vào menu có data-page; không đụng
   * các nút/form nội dung khác.
   */
  const TITLES={
    dashboard:'Trang chủ',
    students:'Học sinh',
    attendance:'Điểm danh',
    violations:'Vi phạm',
    rewards:'Khen thưởng',
    learning:'Học tập',
    statistics:'Thống kê',
    'student-links':'Link học sinh',
    ai:'AI giáo viên',
    game:'Triệu Phú Học Đường',
    'lucky-wheel':'Vòng quay may mắn',
    settings:'Cài đặt'
  };

  function closeMobile(){
    const s=document.getElementById('sidebar');
    const o=document.getElementById('sidebarOverlay');
    if(window.innerWidth<=900 || s?.classList.contains('open')){
      s?.classList.remove('open');
      o?.classList.remove('active');
      if(o){o.hidden=true;o.setAttribute('aria-hidden','true');}
      document.body.classList.remove('sidebar-open');
    }
  }

  function showPage(page){
    const target=document.querySelector('[data-page-section="'+CSS.escape(String(page))+'"]') || document.getElementById('page-'+String(page));
    if(!target) return false;

    const sections=document.querySelectorAll('[data-page-section]');
    sections.forEach(section=>{
      const active=section===target;
      section.hidden=!active;
      section.classList.toggle('active',active);
    });

    document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(item=>{
      item.classList.toggle('active',item.getAttribute('data-page')===String(page));
    });

    const title=document.getElementById('pageTitle');
    if(title) title.textContent=TITLES[page]||String(page);

    closeMobile();

    try{
      if(window.LopHocApp && typeof window.LopHocApp.currentPage!=='undefined'){
        window.LopHocApp.currentPage=page;
      }
    }catch(_){ }

    if(page==='lucky-wheel'){
      try{window.dispatchEvent(new Event('pagechange'));}catch(_){ }
    }

    return true;
  }

  function menuRescue(event){
    const t=event.target instanceof Element?event.target:null;
    if(!t) return;

    const menu=t.closest('.main-menu .menu-item[data-page]');
    if(menu){
      const page=menu.getAttribute('data-page');
      if(page && showPage(page)){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
  }

  /* WINDOW capture luôn chạy trước document capture của các patch cũ. */
  window.addEventListener('click',menuRescue,true);

  const loadOnce=(src,attr)=>{
    if(document.querySelector('script['+attr+']')) return;
    const s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.setAttribute(attr,'1');
    document.head.appendChild(s);
  };

  function boot(){
    loadOnce('student-profile-repair.js?v=20260826.2','data-lh-profile-repair');
    loadOnce('reward-delete-fix.js?v=20260826.1','data-lh-reward-delete-fix');
    loadOnce('menu-badge-sync-fix.js?v=20260826.1','data-lh-menu-badge-sync');
    loadOnce('home-data-sync-fix.js?v=20260826.1','data-lh-home-data-sync');
    loadOnce('excellent-student-engine.js?v=20260826.1','data-lh-excellent-student-engine');
    loadOnce('home-ai-live-sync.js?v=20260826.5','data-lh-home-ai-live-sync');
    loadOnce('class-name-final-fix.js?v=6.0.0','data-lh-class-name-final-v60');
    loadOnce('events-student-roster-sync.js?v=1.0.0','data-lh-events-student-roster-sync');
    loadOnce('behavior-quick-options.js?v=2.5.0','data-lh-behavior-quick-options-v25');
    loadOnce('home-class-logo.js?v=1.9.0','data-lh-home-class-logo-v190');
    loadOnce('clear-targeted-violations-20260908.js?v=1.1.0','data-lh-violation-stale-ui-cleaner-v10');
    loadOnce('site-link-integrity.js?v=2.0.0','data-lh-site-link-integrity-v20');
    loadOnce('trieu-phu-menu-fix.js?v=20260913.1','data-lh-trieu-phu-menu-fix');

    /* ĐÃ SỬA: dùng version query mới để không lấy bản 1.0 cũ từ cache. */
    loadOnce('reward-ui-cleanup-20260913.js?v=1.1.0','data-lh-reward-ui-cleanup-v11');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
