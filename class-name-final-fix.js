/* CLASS NAME FINAL FIX 5.0 — canonical display label: Lớp 5A3. */
(function(){
  'use strict';
  if(window.__LH_CLASS_NAME_FINAL_50__)return;
  window.__LH_CLASS_NAME_FINAL_50__=true;
  var NAME='Lớp 5A3';
  window.LH_CLASS_NAME='5A3';
  document.documentElement.dataset.lhClass='5A3';

  function normalizeNode(n){
    if(!n||n.nodeType!==Node.TEXT_NODE||!n.nodeValue)return;
    n.nodeValue=n.nodeValue
      .replace(/Lớp\s*5(?:A|C)3\b/gi,NAME)
      .replace(/Lớp\s*5C\b/gi,NAME)
      .replace(/\b5C3\b/gi,'5A3')
      .replace(/\b5C\b/gi,'5A3');
  }

  function fix(){
    try{
      document.querySelectorAll('#classSelect option').forEach(function(o){
        var t=String(o.textContent||'').trim();
        if(/^Lớp\s*5(?:A|C)3?$/i.test(t)||/^5C3?$/i.test(t))o.textContent=NAME;
      });
      var hc=document.getElementById('heroClass');
      if(hc)hc.textContent=NAME;
      var nodes=document.querySelectorAll('[data-class],[data-class-name],[data-lop]');
      nodes.forEach(function(el){
        var t=String(el.textContent||'').trim();
        if(/^(?:Lớp\s*)?5C3?$/i.test(t))el.textContent=NAME;
      });
      var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      var n;while((n=walker.nextNode()))normalizeNode(n);
    }catch(e){console.warn('[CLASS NAME FINAL 5.0]',e)}
  }

  function schedule(){requestAnimationFrame(fix)}
  ['google-sheets-data-ready','data-changed','students-updated','records-updated','class-data-updated'].forEach(function(ev){
    window.addEventListener(ev,schedule,false);
  });

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix,{once:true});else fix();
})();
