/* HOME CLASS LOGO 1.1 — isolated homepage branding. */
(function(){
  'use strict';
  if(window.__LH_HOME_CLASS_LOGO_11__) return;
  window.__LH_HOME_CLASS_LOGO_11__=true;
  const LOGO_SRC='assets/logo-5a3.jpg';
  function apply(){
    const hero=document.querySelector('#page-dashboard .dashboard-hero');
    if(!hero || document.getElementById('lhHomeClassLogo')) return;
    const target=hero.querySelector('.hero-illustration');
    const wrap=document.createElement('div');
    wrap.id='lhHomeClassLogo';
    wrap.setAttribute('aria-label','Logo lớp 5A3 Trường Tiểu học Nghĩa Hành');
    wrap.style.cssText='display:flex;align-items:center;justify-content:center;width:min(25vw,220px);min-width:150px;margin-left:auto;flex:0 0 auto;';
    const img=document.createElement('img');
    img.src=LOGO_SRC;
    img.alt='Logo lớp 5A3 Trường Tiểu học Nghĩa Hành';
    img.width=180;
    img.height=180;
    img.loading='eager';
    img.decoding='async';
    img.style.cssText='display:block;width:180px;height:180px;max-width:100%;border-radius:50%;object-fit:cover;filter:drop-shadow(0 10px 24px rgba(15,23,42,.14));';
    if(target) target.replaceWith(wrap); else hero.appendChild(wrap);
    wrap.appendChild(img);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
