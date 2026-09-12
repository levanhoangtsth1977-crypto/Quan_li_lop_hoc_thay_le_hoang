/* HOME CLASS LOGO 1.8 — persistent homepage 5A3 branding. */
(function(){
  'use strict';
  if(window.__LH_HOME_CLASS_LOGO_18__) return;
  window.__LH_HOME_CLASS_LOGO_18__=true;

  const LOGO_ALT='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
  const LOGO_SOURCES=[
    '/assets/logo-5a3.jpg?v=20260913.5',
    'https://quan-li-lop-hoc-thay-le-hoang.vercel.app/assets/logo-5a3.jpg?v=20260913.5',
    'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/assets/logo-5a3.jpg?v=20260913.5'
  ];
  const STYLE_ID='lhHomeClassLogoStyle18';
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
      @media (max-width:640px){#page-dashboard .dashboard-hero{overflow:visible!important;}#lhHomeClassLogo{width:100%!important;min-width:0!important;flex:0 0 100%!important;margin:16px 0 4px!important;padding:0!important;justify-content:center!important;position:relative!important;z-index:10000!important;order:99!important;}#lhHomeClassLogo img{width:112px!important;height:112px!important;min-width:112px!important;min-height:112px!important;max-width:112px!important;max-height:112px!important;}}
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
      else console.warn('[HOME CLASS LOGO 1.8] Không tải được logo.');
    },false);
    img.src=LOGO_SOURCES[0];
    wrap.appendChild(img);
    return wrap;
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
      const content=hero.querySelector('.hero-content');
      if(content){
        const meta=content.querySelector('.hero-meta');
        if(meta&&meta.parentNode===content)meta.insertAdjacentElement('afterend',wrap);
        else if(wrap.parentNode!==content)content.appendChild(wrap);
      }else if(wrap.parentNode!==hero)hero.appendChild(wrap);
    }else{
      const illustration=hero.querySelector('.hero-illustration');
      if(illustration&&illustration.parentNode===hero){illustration.replaceWith(wrap);}
      else if(wrap.parentNode!==hero)hero.appendChild(wrap);
    }

    const img=wrap.querySelector('img');
    if(img && !img.complete) img.src=img.src;
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
      if(mutations.some(m=>m.type==='childList')) queueApply();
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
