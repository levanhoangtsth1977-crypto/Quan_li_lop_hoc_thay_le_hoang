/* HOME CLASS LOGO 1.9 — persistent homepage 5A3 branding; mobile text-left/logo-right. */
(function(){
  'use strict';
  if(window.__LH_HOME_CLASS_LOGO_19__) return;
  window.__LH_HOME_CLASS_LOGO_19__=true;

  const LOGO_ALT='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
  const LOGO_SOURCES=[
    '/assets/logo-5a3.jpg?v=20260913.6',
    'https://quan-li-lop-hoc-thay-le-hoang.vercel.app/assets/logo-5a3.jpg?v=20260913.6',
    'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/assets/logo-5a3.jpg?v=20260913.6'
  ];
  const STYLE_ID='lhHomeClassLogoStyle19';
  let applyQueued=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      /* ===== THANH MENU: XANH LAM ĐỒNG BỘ TỪ TRÊN XUỐNG DƯỚI ===== */
      .sidebar{
        background:#1559c7!important;
        color:#fff!important;
        border-right:1px solid rgba(255,255,255,.18)!important;
      }
      .sidebar .brand{
        border-bottom-color:rgba(255,255,255,.24)!important;
      }
      .sidebar .brand b,
      .sidebar .brand small{
        color:#fff!important;
      }
      .sidebar .logo{
        background:#0b3f91!important;
        color:#fff!important;
        box-shadow:0 6px 14px rgba(7,35,88,.24)!important;
      }
      .sidebar .context{
        background:rgba(255,255,255,.10)!important;
        border-color:rgba(255,255,255,.26)!important;
      }
      .sidebar .context label{
        color:#eef5ff!important;
        font-size:13px!important;
        font-weight:700!important;
      }
      .sidebar .context select{
        color:#172033!important;
        background:#fff!important;
        border-color:rgba(255,255,255,.56)!important;
      }
      .sidebar .menu{
        gap:7px!important;
      }
      .sidebar .menu a{
        min-height:46px!important;
        padding:11px 12px!important;
        border-radius:12px!important;
        background:#1559c7!important;
        color:#fff!important;
        font-size:17px!important;
        font-weight:700!important;
        line-height:1.25!important;
        box-shadow:0 3px 8px rgba(8,39,96,.14)!important;
      }
      .sidebar .menu a span{
        font-size:17px!important;
      }
      .sidebar .menu a:hover{
        background:#0f4da6!important;
        color:#fff!important;
        transform:translateX(2px);
      }
      .sidebar .menu a.active{
        background:#0b3f91!important;
        color:#fff!important;
        font-weight:800!important;
        box-shadow:0 5px 12px rgba(8,43,111,.30)!important;
      }
      .sidebar .menu .count{
        margin-left:auto!important;
        color:#fff!important;
        background:rgba(255,255,255,.18)!important;
        font-size:13px!important;
        font-weight:800!important;
        padding:2px 7px!important;
        border-radius:999px!important;
      }
      .sidebar .teacher{
        background:rgba(255,255,255,.10)!important;
        border-color:rgba(255,255,255,.25)!important;
      }
      .sidebar .teacher b,
      .sidebar .teacher small{
        color:#fff!important;
      }

      /* ===== TRANG CHỦ: CHỮ TRÁI — LOGO 5A3 BÊN PHẢI ===== */
      #page-dashboard .dashboard-hero,
      #mainContent.lh-home-modern .hero{
        position:relative!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 190px!important;
        align-items:center!important;
        gap:18px!important;
        overflow:hidden!important;
      }
      #page-dashboard .dashboard-hero .hero-content{
        min-width:0!important;
        grid-column:1!important;
        grid-row:1!important;
      }
      #page-dashboard .dashboard-hero #lhHomeClassLogo,
      #mainContent.lh-home-modern .hero #lhHomeClassLogo{
        grid-column:2!important;
        grid-row:1!important;
        justify-self:center!important;
        align-self:center!important;
        width:180px!important;
        min-width:180px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        margin:0!important;
        position:relative!important;
        z-index:3!important;
      }
      #lhHomeClassLogo img{
        display:block!important;
        width:170px!important;
        height:170px!important;
        min-width:170px!important;
        min-height:170px!important;
        max-width:170px!important;
        max-height:170px!important;
        object-fit:contain!important;
        border:0!important;
        border-radius:50%!important;
        background:#fff!important;
        box-shadow:0 12px 30px rgba(15,23,42,.20)!important;
      }
      #page-dashboard .dashboard-hero .hero-illustration,
      #mainContent.lh-home-modern .hero .hero-illustration{
        display:none!important;
      }

      /* Mobile: logo vẫn nằm BÊN PHẢI, không rơi xuống dưới chữ */
      @media (max-width:720px){
        #page-dashboard .dashboard-hero,
        #mainContent.lh-home-modern .hero{
          grid-template-columns:minmax(0,1fr) 112px!important;
          gap:10px!important;
          overflow:hidden!important;
        }
        #page-dashboard .dashboard-hero .hero-content{
          grid-column:1!important;
          grid-row:1!important;
          min-width:0!important;
        }
        #page-dashboard .dashboard-hero #lhHomeClassLogo,
        #mainContent.lh-home-modern .hero #lhHomeClassLogo{
          grid-column:2!important;
          grid-row:1!important;
          width:112px!important;
          min-width:112px!important;
          margin:0!important;
          justify-self:center!important;
          align-self:center!important;
        }
        #lhHomeClassLogo img{
          width:104px!important;
          height:104px!important;
          min-width:104px!important;
          min-height:104px!important;
          max-width:104px!important;
          max-height:104px!important;
        }
      }
      @media (max-width:380px){
        #page-dashboard .dashboard-hero,
        #mainContent.lh-home-modern .hero{
          grid-template-columns:minmax(0,1fr) 96px!important;
          gap:6px!important;
        }
        #page-dashboard .dashboard-hero #lhHomeClassLogo,
        #mainContent.lh-home-modern .hero #lhHomeClassLogo{
          width:96px!important;
          min-width:96px!important;
        }
        #lhHomeClassLogo img{
          width:88px!important;
          height:88px!important;
          min-width:88px!important;
          min-height:88px!important;
          max-width:88px!important;
          max-height:88px!important;
        }
      }

      @media (max-width:720px){
        .sidebar .menu a,
        .sidebar .menu a span{
          font-size:16px!important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  function ensureNode(){
    let wrap=document.getElementById('lhHomeClassLogo');
    if(wrap){
      const img=wrap.querySelector('img');
      if(img){img.alt=LOGO_ALT;return wrap;}
    }
    wrap=document.createElement('div');
    wrap.id='lhHomeClassLogo';
    wrap.setAttribute('aria-label',LOGO_ALT);
    const img=document.createElement('img');
    img.alt=LOGO_ALT;
    img.loading='eager';
    img.decoding='async';
    img.referrerPolicy='no-referrer';
    img.width=170;
    img.height=170;
    let sourceIndex=0;
    img.addEventListener('error',function(){
      sourceIndex++;
      if(sourceIndex<LOGO_SOURCES.length){
        img.src=LOGO_SOURCES[sourceIndex];
      }
    },false);
    img.src=LOGO_SOURCES[0];
    wrap.appendChild(img);
    return wrap;
  }

  function currentHomeHero(){
    return document.querySelector('#page-dashboard .dashboard-hero') ||
           document.querySelector('#mainContent .dashboard-hero') ||
           document.querySelector('#mainContent .hero');
  }

  function apply(){
    applyQueued=false;
    const root=document.getElementById('mainContent');
    if(!root)return;
    const currentRoute=(location.hash||'#home').slice(1).split('?')[0]||'home';
    if(currentRoute!=='home' && currentRoute!=='dashboard')return;

    ensureStyle();
    const hero=currentHomeHero();
    if(!hero)return;

    /* Chỉ xoá hình minh hoạ nhà/ảnh cũ trong chính Hero của Trang chủ. */
    hero.querySelectorAll('.hero-illustration').forEach(el=>{
      if(el.id!=='lhHomeClassLogo')el.remove();
    });

    let wrap=document.getElementById('lhHomeClassLogo');
    if(wrap && wrap.parentNode!==hero){
      wrap.remove();
      wrap=null;
    }
    if(!wrap)wrap=ensureNode();

    const directVisual=hero.querySelector(':scope > img, :scope > svg');
    if(directVisual && directVisual!==wrap){
      directVisual.replaceWith(wrap);
    }else if(wrap.parentNode!==hero){
      const content=hero.querySelector('.hero-content');
      if(content && content.parentNode===hero)content.insertAdjacentElement('afterend',wrap);
      else hero.appendChild(wrap);
    }

    const img=wrap.querySelector('img');
    if(img && !img.getAttribute('src'))img.src=LOGO_SOURCES[0];
  }

  function queue(){
    if(applyQueued)return;
    applyQueued=true;
    requestAnimationFrame(apply);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});
  else queue();
  window.addEventListener('hashchange',queue,false);
  window.addEventListener('resize',queue,false);
  window.addEventListener('navigation-changed',queue,false);
  window.addEventListener('page-changed',queue,false);
  new MutationObserver(queue).observe(document.getElementById('mainContent')||document.body,{childList:true,subtree:true});
})();
