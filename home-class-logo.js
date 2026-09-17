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
      #lhHomeClassLogo{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:190px!important;min-width:190px!important;margin-left:auto!important;position:relative!important;z-index:2!important;}
      #lhHomeClassLogo img{display:block!important;width:170px!important;height:170px!important;min-width:170px!important;min-height:170px!important;max-width:170px!important;max-height:170px!important;object-fit:contain!important;border:0!important;border-radius:50%!important;box-shadow:0 16px 34px rgba(15,23,42,.18)!important;}
      @media (max-width:900px){#lhHomeClassLogo{width:150px!important;min-width:150px!important}#lhHomeClassLogo img{width:132px!important;height:132px!important;min-width:132px!important;min-height:132px!important;max-width:132px!important;max-height:132px!important}}
      @media (max-width:720px){#mainContent.lh-home-modern .hero{grid-template-columns:1fr!important}#lhHomeClassLogo{width:100%!important;min-width:0!important;margin:0!important;justify-self:center!important}#lhHomeClassLogo img{width:120px!important;height:120px!important;min-width:120px!important;min-height:120px!important;max-width:120px!important;max-height:120px!important}}
      @media (max-width:420px){#lhHomeClassLogo img{width:104px!important;height:104px!important;min-width:104px!important;min-height:104px!important;max-width:104px!important;max-height:104px!important}}
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
      if(sourceIndex<LOGO_SOURCES.length)img.src=LOGO_SOURCES[sourceIndex];
    },false);
    img.src=LOGO_SOURCES[0];
    wrap.appendChild(img);
    return wrap;
  }

  function apply(){
    applyQueued=false;
    const root=document.getElementById('mainContent');
    if(!root)return;
    if(!(location.hash||'#home').slice(1).split('?')[0].startsWith('home'))return;
    const hero=root.querySelector('.hero');
    if(!hero)return;
    ensureStyle();

    const existing=document.getElementById('lhHomeClassLogo');
    if(existing && existing.parentNode!==hero)existing.remove();
    if(existing)return;

    const house=[...hero.children].find(el=>el.textContent.trim()==='🏫');
    const wrap=ensureNode();
    if(house && house.parentNode===hero){
      house.replaceWith(wrap);
    }else if(!wrap.parentNode){
      hero.appendChild(wrap);
    }
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
