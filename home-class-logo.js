/* HOME CLASS LOGO 1.4 — homepage-only 5A3 branding. */
(function(){
  'use strict';
  if(window.__LH_HOME_CLASS_LOGO_14__) return;
  window.__LH_HOME_CLASS_LOGO_14__=true;
  const LOGO_SRC='assets/logo-5a3.jpg?v=20260913.1';

  function ensureStyle(){
    if(document.getElementById('lhHomeClassLogoStyle')) return;
    const s=document.createElement('style');
    s.id='lhHomeClassLogoStyle';
    s.textContent=`
      #lhHomeClassLogo{display:flex!important;align-items:center!important;justify-content:center!important;width:min(28vw,260px)!important;min-width:180px!important;height:100%!important;margin-left:auto!important;flex:0 0 auto!important;position:relative!important;z-index:2!important;visibility:visible!important;opacity:1!important;}
      #lhHomeClassLogo img{display:block!important;visibility:visible!important;opacity:1!important;width:190px!important;height:190px!important;max-width:190px!important;max-height:190px!important;min-width:190px!important;min-height:190px!important;object-fit:cover!important;border-radius:50%!important;}
      @media (max-width:900px){#lhHomeClassLogo{width:150px!important;min-width:150px!important;}#lhHomeClassLogo img{width:130px!important;height:130px!important;max-width:130px!important;max-height:130px!important;min-width:130px!important;min-height:130px!important;}}
      @media (max-width:640px){#lhHomeClassLogo{width:112px!important;min-width:112px!important;}#lhHomeClassLogo img{width:98px!important;height:98px!important;max-width:98px!important;max-height:98px!important;min-width:98px!important;min-height:98px!important;}}
    `;
    document.head.appendChild(s);
  }

  function apply(){
    const hero=document.querySelector('#page-dashboard .dashboard-hero');
    if(!hero) return;
    ensureStyle();
    let wrap=document.getElementById('lhHomeClassLogo');
    if(!wrap){
      const target=hero.querySelector('.hero-illustration');
      wrap=document.createElement('div');
      wrap.id='lhHomeClassLogo';
      wrap.setAttribute('aria-label','Logo lớp 5A3 Trường Tiểu học Nghĩa Hành');
      if(target) target.replaceWith(wrap); else hero.appendChild(wrap);
    }
    let img=wrap.querySelector('img');
    if(!img){
      img=document.createElement('img');
      img.alt='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
      img.loading='eager';
      img.decoding='async';
      wrap.appendChild(img);
    }
    const expected=new URL(LOGO_SRC,document.baseURI).href;
    if(img.src!==expected) img.src=LOGO_SRC;
  }

  function boot(){apply();[300,800,1500].forEach(ms=>setTimeout(apply,ms));}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.addEventListener('google-sheets-data-ready',apply,false);
  window.addEventListener('class-data-updated',apply,false);
})();