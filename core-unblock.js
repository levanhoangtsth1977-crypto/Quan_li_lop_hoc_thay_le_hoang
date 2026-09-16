/* CORE UI UNBLOCK 1.0
 * Purpose: prevent a hidden overlay/loading layer from covering the entire UI.
 * No data writes. No router replacement. Safe to leave enabled permanently.
 */
(function(){
  'use strict';
  function forceHidden(id){
    var el=document.getElementById(id);
    if(!el) return;
    if(el.getAttribute('hidden')!==null || id==='loadingOverlay'){
      el.hidden=true;
      el.setAttribute('aria-hidden','true');
      el.style.setProperty('display','none','important');
      el.style.setProperty('pointer-events','none','important');
    }
  }
  function fix(){
    forceHidden('loadingOverlay');
    var overlay=document.getElementById('sidebarOverlay');
    if(overlay && !document.getElementById('sidebar')?.classList.contains('open')){
      overlay.setAttribute('aria-hidden','true');
      overlay.style.setProperty('display','none','important');
      overlay.style.setProperty('pointer-events','none','important');
    }
  }
  function boot(){
    fix();
    [100,500,1000,2000,4000].forEach(function(ms){setTimeout(fix,ms);});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
