/* CLASS NAME FINAL FIX 3.0 — canonical display label: Lớp 5A3. */
(function(){
  'use strict';
  if(window.__LH_CLASS_NAME_FINAL_30__)return;
  window.__LH_CLASS_NAME_FINAL_30__=true;
  var NAME='Lớp 5A3';
  window.LH_CLASS_NAME='5A3';
  document.documentElement.dataset.lhClass='5A3';
  function normalizeNode(n){
    if(!n||n.nodeType!==Node.TEXT_NODE||!n.nodeValue)return;
    n.nodeValue=n.nodeValue.replace(/Lớp\s*5(?:A|C)(?!3)\b/gi,NAME);
  }
  function fix(){
    try{
      document.querySelectorAll('#classSelect option').forEach(function(o){
        var t=String(o.textContent||'').trim();
        if(/^Lớp\s*5(?:A|C)(?!3)$/i.test(t))o.textContent=NAME;
      });
      var hc=document.getElementById('heroClass');
      if(hc)hc.textContent=NAME;
      var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      var n;while(n=walker.nextNode())normalizeNode(n);
    }catch(e){console.warn('[CLASS NAME FINAL]',e)}
  }
  function boot(){
    [0,100,300,800,1500,3000,6000].forEach(function(ms){setTimeout(fix,ms)});
    if(window.MutationObserver){
      new MutationObserver(function(){requestAnimationFrame(fix)}).observe(document.body,{childList:true,subtree:true,characterData:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
