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
  let observerStarted=false;
  let applyQueued=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #lhHomeClassLogo{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:min(28vw,260px)!important;min-width:180px!important;height:auto!important;margin-left:auto!important;position:relative!important;z-index:10000!important;visibility:visible!important;opacity:1!important;}
      #lhHomeClassLogo img{display:block!important;visibility:visible!important;opacity:1!important;width:190px!important;height:190px!important;min-width:190px!important;min-height:190px!important;max-width:190px!important;max-height:190px!important;object-fit:contain!important;border:0!important;border-radius:50%!important;}
      @media (max-width:1100px){#lhHomeClassLogo{width:190px!important;min-width:190px!important;}#lhHomeClassLogo img{width:155px!important;height:155px!important;min-width:155px!important;min-height:155px!important;max-width:155px!important;max-height:155px!important;}}
      @media (max-width:900px){#lhHomeClassLogo{width:150px!important;min-width:150px!important;}#lhHomeClassLogo img{width:130px!important;height:130px!important;min-width:130px!important;min-height:130px!important;max-width:130px!important;max-height:130px!important;}}
      @media (max-width:640px){
        #page-dashboard .dashboard-hero{display:grid!important;grid-template-columns:minmax(0,1fr) 120px!important;column-gap:10px!important;align-items:center!important;overflow:visible!important;}
        #page-dashboard .dashboard-hero .hero-content{min-width:0!important;grid-column:1!important;grid-row:1!important;}
        #lhHomeClassLogo{grid-column:2!important;grid-row:1!important;width:120px!important;min-width:120px!important;max-width:120px!important;flex:none!important;margin:0!important;padding:0!important;align-self:center!important;justify-self:center!important;position:relative!important;z-index:10000!important;order:initial!important;}
        #lhHomeClassLogo img{width:108px!important;height:108px!important;min-width:108px!important;min-height:108px!important;max-width:108px!important;max-height:108px!important;object-fit:contain!important;}
        #page-dashboard .dashboard-hero .hero-illustration{display:none!important;}
      }
      @media (max-width:380px){
        #page-dashboard .dashboard-hero{grid-template-columns:minmax(0,1fr) 98px!important;column-gap:6px!important;}
        #lhHomeClassLogo{width:98px!important;min-width:98px!important;max-width:98px!important;}
        #lhHomeClassLogo img{width:88px!important;height:88px!important;min-width:88px!important;min-height:88px!important;max-width:88px!important;max-height:88px!important;}
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
    img.width=190;
    img.height=190;
    img.dataset.lhLogoSourceIndex='0';
    img.addEventListener('error',function(){
      const i=Number(img.dataset.lhLogoSourceIndex||0)+1;
      if(i<LOGO_SOURCES.length){img.dataset.lhLogoSourceIndex=String(i);img.src=LOGO_SOURCES[i];}
      else console.warn('[HOME CLASS LOGO 1.9] Không tải được logo.');
    },false);
    img.src=LOGO_SOURCES[0];
    wrap.appendChild(img);
    return wrap;
  }

  function placeMobile(hero,wrap){
    const content=hero.querySelector('.hero-content');
    if(content && wrap.parentNode!==hero)hero.appendChild(wrap);
    else if(!content && wrap.parentNode!==hero)hero.appendChild(wrap);
    if(wrap.parentNode!==hero)hero.appendChild(wrap);
  }

  function apply(){
    applyQueued=false;
    const hero=document.querySelector('#page-dashboard .dashboard-hero');
    if(!hero)return;
    ensureStyle();
    const wrap=ensureNode();
    const mobile=window.matchMedia?.('(max-width:640px)').matches;
    wrap.classList.toggle('lh-logo-mobile',!!mobile);

    if(mobile){
      // Important: the logo must be a direct child of the hero so CSS can place it on the right.
      placeMobile(hero,wrap);
    }else{
      const illustration=hero.querySelector('.hero-illustration');
      if(illustration&&illustration.parentNode===hero){illustration.replaceWith(wrap);}
      else if(wrap.parentNode!==hero)hero.appendChild(wrap);
    }

    const img=wrap.querySelector('img');
    if(img && img.src==='')img.src=LOGO_SOURCES[0];
  }

  function queueApply(){
    if(applyQueued)return;
    applyQueued=true;
    requestAnimationFrame(()=>apply());
  }

  function startObserver(){
    if(observerStarted||!window.MutationObserver)return;
    const target=document.getElementById('page-dashboard')||document.getElementById('mainContent');
    if(!target)return;
    observerStarted=true;
    new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==='childList'))queueApply();
    }).observe(target,{childList:true,subtree:true});
  }

  function boot(){
    apply();
    startObserver();
    [100,400,900,1600,3000,6000].forEach(ms=>setTimeout(()=>{apply();startObserver();},ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('resize',apply,false);
  window.addEventListener('google-sheets-data-ready',apply,false);
  window.addEventListener('class-data-updated',apply,false);
  window.addEventListener('navigation-changed',apply,false);
  window.addEventListener('page-changed',apply,false);
})();
