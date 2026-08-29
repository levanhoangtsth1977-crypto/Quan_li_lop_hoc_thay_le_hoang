/* DASHBOARD DISPLAY — CANONICAL CLASS 5A3 */
(function(){
  'use strict';
  const NAME='Lớp 5A3';
  function cleanText(node){
    if(!node || node.nodeType!==Node.TEXT_NODE) return;
    node.nodeValue=String(node.nodeValue||'').replace(/Lớp\s*5(?:A|C)(?:3)?\b/gi,NAME);
  }
  function apply(){
    try{
      const hero=document.getElementById('heroClass');
      if(hero) hero.textContent=NAME;
      const select=document.getElementById('classSelect');
      if(select){
        Array.from(select.options||[]).forEach(o=>{
          if(/5(?:A|C)(?:3)?/i.test(String(o.textContent||''))) o.textContent=NAME;
          if(o.value==='5C'||o.value==='5C3'||o.value==='5A'||o.value==='5A3') o.value='5A3';
        });
        select.value='5A3';
      }
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;while((n=walker.nextNode())) cleanText(n);
    }catch(_){ }
  }
  function boot(){
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
    else apply();
    window.addEventListener('google-sheets-data-ready',apply,{once:true});
  }
  boot();
})();
