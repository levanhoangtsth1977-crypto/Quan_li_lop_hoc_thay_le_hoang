/* SITE LINK INTEGRITY 2.3
 * Chỉ quản lý menu/liên kết của hệ thống QUẢN LÝ LỚP HỌC.
 * TRIỆU PHÚ HỌC ĐƯỜNG là ứng dụng độc lập tại /game/index.html và không thuộc menu chính.
 * Sidebar fallback chỉ xử lý nút mở/đóng menu trên màn hình nhỏ; không đụng router dữ liệu.
 */
(function(){
  'use strict';
  if(window.__LH_SITE_LINK_INTEGRITY_23__) return;
  window.__LH_SITE_LINK_INTEGRITY_23__=true;

  const MENU=[
    ['dashboard','Trang chủ','fa-house'],
    ['students','Học sinh','fa-users'],
    ['attendance','Điểm danh','fa-calendar-check'],
    ['violations','Vi phạm','fa-triangle-exclamation'],
    ['rewards','Khen thưởng','fa-trophy'],
    ['learning','Học tập','fa-book-open'],
    ['statistics','Thống kê','fa-chart-column'],
    ['student-links','Link học sinh','fa-link'],
    ['ai','AI giáo viên','fa-robot'],
    ['lucky-wheel','Vòng quay may mắn','fa-dharmachakra'],
    ['settings','Cài đặt','fa-gear']
  ];
  const REQUIRED=new Set(MENU.map(x=>x[0]));
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const pageExists=page=>!!qs('#page-'+CSS.escape(page)+', [data-page-section="'+CSS.escape(page)+'"]');

  function canonicalSection(page){
    const a=qs('#page-'+CSS.escape(page));
    const b=qsa('[data-page-section="'+CSS.escape(page)+'"]');
    return a||b[0]||null;
  }

  function removeDuplicateSections(){
    MENU.forEach(([page])=>{
      const canonical=canonicalSection(page);
      if(!canonical) return;
      qsa('#page-'+CSS.escape(page)+', [data-page-section="'+CSS.escape(page)+'"]').forEach(el=>{
        if(el!==canonical) el.remove();
      });
    });
  }

  function buildMenuItem(page,label,icon){
    const el=document.createElement('button');
    el.type='button';
    el.className='menu-item';
    el.dataset.page=page;
    el.innerHTML='<i class="fa-solid '+icon+'"></i><span>'+label+'</span>';
    return el;
  }

  function normalizeMenu(){
    const nav=qs('.main-menu');
    if(!nav) return;

    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(!REQUIRED.has(page)) el.remove();
    });

    const seen=new Set();
    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(seen.has(page)) el.remove();
      else seen.add(page);
    });

    const divider=qs('.menu-divider',nav);
    MENU.forEach(([page,label,icon])=>{
      if(!pageExists(page)) return;
      if(!qs('[data-page="'+CSS.escape(page)+'"]',nav)){
        nav.insertBefore(buildMenuItem(page,label,icon),divider||null);
      }
    });

    const firstItems=MENU.map(([page])=>qs('[data-page="'+CSS.escape(page)+'"]',nav)).filter(Boolean);
    const anchor=divider||nav.lastElementChild;
    firstItems.forEach(el=>nav.insertBefore(el,anchor));

    const utility=qs('#lhUtilitiesStandalone',nav);
    if(utility){
      utility.setAttribute('href','tien-ich.html');
      utility.setAttribute('data-link-kind','standalone');
    }

    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(!pageExists(page)) el.remove();
    });

    qsa('#lhTrieuPhuMenu,[data-page="game"]',nav).forEach(el=>el.remove());
  }

  function normalizeInternalLinks(){
    qsa('[data-page-link]').forEach(el=>{
      const page=(el.getAttribute('data-page-link')||'').trim();
      if(!REQUIRED.has(page) || !pageExists(page)){
        el.removeAttribute('data-page-link');
        el.dataset.linkInvalid='true';
      }
    });
  }

  /* Fallback độc lập: chỉ dùng khi nút 3 gạch chưa được router chính bind. */
  function bindSidebarFallback(){
    const toggle=qs('#sidebarToggle');
    const close=qs('#sidebarClose');
    const overlay=qs('#sidebarOverlay');
    const sidebar=qs('#sidebar');

    if(toggle && toggle.dataset.sidebarFallback23!=='1'){
      toggle.dataset.sidebarFallback23='1';
      toggle.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        const isOpen=sidebar?.classList.contains('open');
        if(isOpen){
          sidebar?.classList.remove('open');
          document.body.classList.remove('sidebar-open');
          if(overlay){overlay.classList.remove('active');overlay.hidden=true;overlay.style.display='';overlay.setAttribute('aria-hidden','true');}
        }else{
          sidebar?.classList.add('open');
          document.body.classList.add('sidebar-open');
          if(overlay){overlay.classList.add('active');overlay.hidden=false;overlay.style.display='block';overlay.setAttribute('aria-hidden','false');}
        }
      },true);
    }

    if(close && close.dataset.sidebarFallback23!=='1'){
      close.dataset.sidebarFallback23='1';
      close.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        sidebar?.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if(overlay){overlay.classList.remove('active');overlay.hidden=true;overlay.style.display='';overlay.setAttribute('aria-hidden','true');}
      },true);
    }

    if(overlay && overlay.dataset.sidebarFallback23!=='1'){
      overlay.dataset.sidebarFallback23='1';
      overlay.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        sidebar?.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        overlay.hidden=true;
        overlay.style.display='';
        overlay.setAttribute('aria-hidden','true');
      },true);
    }
  }

  function repair(){
    try{
      removeDuplicateSections();
      normalizeMenu();
      normalizeInternalLinks();
      bindSidebarFallback();
      window.__LH_SITE_LINK_INTEGRITY_RESULT__={
        required:MENU.map(x=>x[0]),
        menu:qsa('.main-menu [data-page]').map(x=>x.dataset.page),
        missing:MENU.filter(x=>!pageExists(x[0])).map(x=>x[0])
      };
    }catch(error){
      console.warn('[SITE LINK INTEGRITY 2.3]',error);
    }
  }

  function start(){
    repair();
    setTimeout(repair,300);
    setTimeout(repair,1000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  window.addEventListener('google-sheets-data-ready',repair);
  window.addEventListener('lh-menu-ready',repair);
  window.__LH_SITE_LINK_INTEGRITY_API__={repair,menu:MENU.map(x=>x[0])};
})();
