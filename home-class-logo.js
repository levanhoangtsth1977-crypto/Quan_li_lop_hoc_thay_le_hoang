/* HOME CLASS LOGO 1.6 — homepage-only 5A3 branding with dual-source image fallback. */
(function(){
  'use strict';
  if(window.__LH_HOME_CLASS_LOGO_16__) return;
  window.__LH_HOME_CLASS_LOGO_16__=true;

  const LOGO_ALT='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
  const LOGO_SOURCES=[
    '/assets/logo-5a3.jpg?v=20260913.3',
    'https://raw.githubusercontent.com/levanhoangtsth1977-crypto/Quan_li_lop_hoc_thay_le_hoang/master/assets/logo-5a3.jpg?v=20260913.3'
  ];

  function ensureStyle(){
    if(document.getElementById('lhHomeClassLogoStyle')) return;
    const s=document.createElement('style');
    s.id='lhHomeClassLogoStyle';
    s.textContent=`
      #lhHomeClassLogo{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        flex:0 0 auto!important;
        width:min(28vw,260px)!important;
        min-width:180px!important;
        height:auto!important;
        margin-left:auto!important;
        position:relative!important;
        z-index:50!important;
        visibility:visible!important;
        opacity:1!important;
      }
      #lhHomeClassLogo img{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        width:190px!important;
        height:190px!important;
        min-width:190px!important;
        min-height:190px!important;
        max-width:190px!important;
        max-height:190px!important;
        object-fit:contain!important;
        border-radius:50%!important;
      }
      @media (max-width:900px){
        #lhHomeClassLogo{width:150px!important;min-width:150px!important;margin-left:auto!important;}
        #lhHomeClassLogo img{width:130px!important;height:130px!important;min-width:130px!important;min-height:130px!important;max-width:130px!important;max-height:130px!important;}
      }
      @media (max-width:640px){
        #page-dashboard .dashboard-hero{overflow:visible!important;}
        #lhHomeClassLogo{
          width:100%!important;
          min-width:0!important;
          flex:0 0 100%!important;
          margin:16px 0 4px!important;
          padding:0!important;
          justify-content:center!important;
          position:relative!important;
          z-index:999!important;
        }
        #lhHomeClassLogo img{
          display:block!important;
          width:112px!important;
          height:112px!important;
          min-width:112px!important;
          min-height:112px!important;
          max-width:112px!important;
          max-height:112px!important;
        }
      }
      @media (min-width:641px){
        #lhHomeClassLogo.lh-logo-mobile{width:min(28vw,260px)!important;min-width:180px!important;flex:0 0 auto!important;margin-left:auto!important;margin-top:0!important;}
      }
    `;
    document.head.appendChild(s);
  }

  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width:640px)').matches;
  }

  function ensureNode(){
    let wrap=document.getElementById('lhHomeClassLogo');
    if(wrap) return wrap;
    wrap=document.createElement('div');
    wrap.id='lhHomeClassLogo';
    wrap.setAttribute('aria-label',LOGO_ALT);

    const img=document.createElement('img');
    img.alt=LOGO_ALT;
    img.loading='eager';
    img.decoding='async';
    img.width=190;
    img.height=190;
    img.dataset.lhLogoSourceIndex='0';

    img.addEventListener('error',function(){
      const i=Number(img.dataset.lhLogoSourceIndex||0)+1;
      if(i<LOGO_SOURCES.length){
        img.dataset.lhLogoSourceIndex=String(i);
        img.src=LOGO_SOURCES[i];
      }else{
        img.dataset.lhLogoFailed='1';
        console.warn('[HOME CLASS LOGO 1.6] Không tải được các nguồn logo.');
      }
    },false);

    img.src=LOGO_SOURCES[0];
    wrap.appendChild(img);
    return wrap;
  }

  function apply(){
    const hero=document.querySelector('#page-dashboard .dashboard-hero');
    if(!hero) return;
    ensureStyle();

    const wrap=ensureNode();
    const img=wrap.querySelector('img');
    if(img && img.dataset.lhLogoFailed==='1'){
      img.dataset.lhLogoFailed='0';
      img.dataset.lhLogoSourceIndex='0';
      img.src=LOGO_SOURCES[0];
    }

    const mobile=isMobile();
    wrap.classList.toggle('lh-logo-mobile',mobile);

    if(mobile){
      const content=hero.querySelector('.hero-content');
      if(content){
        const meta=content.querySelector('.hero-meta');
        if(meta && meta.parentNode===content) meta.insertAdjacentElement('afterend',wrap);
        else if(wrap.parentNode!==content) content.appendChild(wrap);
      }else if(wrap.parentNode!==hero){
        hero.appendChild(wrap);
      }
    }else{
      const target=hero.querySelector('.hero-illustration');
      if(target && target.parentNode===hero) target.replaceWith(wrap);
      else if(wrap.parentNode!==hero) hero.appendChild(wrap);
    }
  }

  function boot(){
    apply();
    [100,400,900,1600,3000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.addEventListener('resize',apply,false);
  window.addEventListener('google-sheets-data-ready',apply,false);
  window.addEventListener('class-data-updated',apply,false);
  window.addEventListener('navigation-changed',apply,false);
  window.addEventListener('page-changed',apply,false);
})();