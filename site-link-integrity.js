/* SITE LINK INTEGRITY 2.0
 * Chuẩn hóa toàn bộ liên kết/menu chính của trang quản lý lớp học.
 * - Mỗi menu chính chỉ có đúng 1 mục.
 * - Mỗi data-page phải trỏ tới đúng 1 section.
 * - Tự bổ sung menu bị thiếu theo danh mục chuẩn.
 * - Loại bỏ menu data-page dư/không hợp lệ.
 * - Không đụng Data Engine, dữ liệu học sinh hoặc các form.
 */
(function(){
  'use strict';
  if(window.__LH_SITE_LINK_INTEGRITY_20__) return;
  window.__LH_SITE_LINK_INTEGRITY_20__=true;

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

    /* Xóa các mục data-page không thuộc menu chuẩn. */
    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(!REQUIRED.has(page)) el.remove();
    });

    /* Chỉ giữ một menu item cho mỗi page. */
    const seen=new Set();
    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(seen.has(page)) el.remove();
      else seen.add(page);
    });

    /* Bổ sung menu bị thiếu nếu section tồn tại. */
    const divider=qs('.menu-divider',nav);
    MENU.forEach(([page,label,icon])=>{
      if(!pageExists(page)) return;
      if(!qs('[data-page="'+CSS.escape(page)+'"]',nav)){
        nav.insertBefore(buildMenuItem(page,label,icon),divider||null);
      }
    });

    /* Chuẩn hóa thứ tự 11 mục trước divider. */
    const firstItems=MENU.map(([page])=>qs('[data-page="'+CSS.escape(page)+'"]',nav)).filter(Boolean);
    const anchor=divider||nav.lastElementChild;
    firstItems.forEach(el=>nav.insertBefore(el,anchor));

    /* Tiện ích là liên kết trang riêng, không phải data-page. */
    const utility=qs('#lhUtilitiesStandalone',nav);
    if(utility){
      utility.setAttribute('href','tien-ich.html');
      utility.setAttribute('data-link-kind','standalone');
    }

    /* Không để mục data-page không có section tồn tại như liên kết chết. */
    qsa('[data-page]',nav).forEach(el=>{
      const page=(el.getAttribute('data-page')||'').trim();
      if(!pageExists(page)){
        el.remove();
      }
    });
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

  function repair(){
    try{
      removeDuplicateSections();
      normalizeMenu();
      normalizeInternalLinks();
      window.__LH_SITE_LINK_INTEGRITY_RESULT__={
        required:MENU.map(x=>x[0]),
        menu:qsa('.main-menu [data-page]').map(x=>x.dataset.page),
        missing:MENU.filter(x=>!pageExists(x[0])).map(x=>x[0])
      };
    }catch(error){
      console.warn('[SITE LINK INTEGRITY 2.0]',error);
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
