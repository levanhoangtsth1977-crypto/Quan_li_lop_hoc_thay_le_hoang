/* CLASS NAME FINAL FIX 6.0 — canonical display label: Lớp 5A3. */
(function(){
  'use strict';
  if(window.__LH_CLASS_NAME_FINAL_60__)return;
  window.__LH_CLASS_NAME_FINAL_60__=true;
  var NAME='Lớp 5A3';
  var CODE='5A3';
  window.LH_CLASS_NAME=CODE;
  document.documentElement.dataset.lhClass=CODE;

  function fixElement(el){
    if(!el)return;
    var attrNames=['data-class','data-class-name','data-lop'];
    attrNames.forEach(function(a){
      if(el.hasAttribute&&el.hasAttribute(a)){
        var v=String(el.getAttribute(a)||'').trim();
        if(/^5C3?$/i.test(v)||/^Lớp\s*5C3?$/i.test(v))el.setAttribute(a,CODE);
      }
    });
    var t=String(el.textContent||'').trim();
    if(/^(?:Lớp\s*)?5C3?$/i.test(t))el.textContent=NAME;
  }

  function fixHero(){
    var hc=document.getElementById('heroClass');
    if(hc && hc.textContent.trim()!==NAME) hc.textContent=NAME;
  }

  function fixSelectors(){
    document.querySelectorAll('#classSelect option').forEach(function(o){
      var t=String(o.textContent||'').trim();
      if(/^Lớp\s*5C3?$/i.test(t)||/^5C3?$/i.test(t)){o.textContent=NAME;o.value=CODE;}
    });
  }

  function fix(){
    try{
      fixHero();
      fixSelectors();
      document.querySelectorAll('[data-class],[data-class-name],[data-lop]').forEach(fixElement);
    }catch(e){console.warn('[CLASS NAME FINAL 6.0]',e)}
  }

  function schedule(){
    if(window.__LH_CLASS_FIX_PENDING__)return;
    window.__LH_CLASS_FIX_PENDING__=true;
    requestAnimationFrame(function(){
      window.__LH_CLASS_FIX_PENDING__=false;
      fix();
    });
  }

  ['google-sheets-data-ready','data-changed','students-updated','records-updated','class-data-updated','navigation-changed','page-changed'].forEach(function(ev){
    window.addEventListener(ev,schedule,false);
  });

  function observe(){
    try{
      var hc=document.getElementById('heroClass');
      if(hc){
        new MutationObserver(function(){
          if(hc.textContent.trim()!==NAME)hc.textContent=NAME;
        }).observe(hc,{childList:true,characterData:true,subtree:true});
      }
      var cs=document.getElementById('classSelect');
      if(cs){
        new MutationObserver(function(){fixSelectors();}).observe(cs,{childList:true,subtree:true});
      }
    }catch(e){console.warn('[CLASS NAME OBSERVER]',e)}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){fix();observe();},{once:true});
  }else{fix();observe();}
  setTimeout(fix,250);
  setTimeout(fix,1000);
})();
