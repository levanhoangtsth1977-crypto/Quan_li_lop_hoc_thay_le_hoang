/* TOUCH INTERACTION GUARD 1.0
 * Prevent stale/invisible mobile overlays from swallowing all taps/clicks.
 * This guard never handles application actions; it only enforces that hidden
 * overlays cannot intercept pointer/touch input.
 */
(function(){
  'use strict';
  if(window.__LH_TOUCH_INTERACTION_GUARD_10__) return;
  window.__LH_TOUCH_INTERACTION_GUARD_10__=true;

  function isHidden(el){
    if(!el) return true;
    const cs=getComputedStyle(el);
    return el.hidden || el.getAttribute('aria-hidden')==='true' ||
      cs.display==='none' || cs.visibility==='hidden' || cs.opacity==='0';
  }

  function normalizeOverlay(el){
    if(!el) return;
    if(isHidden(el)){
      el.style.pointerEvents='none';
      el.style.touchAction='none';
      if(el.classList.contains('active')) el.classList.remove('active');
    }else{
      el.style.pointerEvents='';
      el.style.touchAction='';
    }
  }

  function repair(){
    try{
      document.querySelectorAll('#sidebarOverlay,.sidebar-overlay,[data-sidebar-overlay],.modal-backdrop,.overlay').forEach(normalizeOverlay);
      const sidebar=document.getElementById('sidebar');
      const overlay=document.getElementById('sidebarOverlay');
      if(overlay && sidebar && !sidebar.classList.contains('open')){
        overlay.hidden=true;
        overlay.setAttribute('aria-hidden','true');
        overlay.classList.remove('active');
        overlay.style.display='none';
        overlay.style.pointerEvents='none';
      }
    }catch(e){ console.warn('[TOUCH GUARD]',e); }
  }

  function start(){
    repair();
    setTimeout(repair,0);
    setTimeout(repair,150);
    setTimeout(repair,500);
    setTimeout(repair,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  const observer=new MutationObserver(function(){ repair(); });
  try{ observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']}); }catch(e){}

  window.__LH_TOUCH_GUARD_API__={repair};
})();
