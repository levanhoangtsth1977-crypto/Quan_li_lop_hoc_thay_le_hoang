/* TOUCH INTERACTION GUARD 2.0
 * Fixes invisible/stale overlays swallowing touch input on touch screens.
 * No global MutationObserver. No application navigation. No data writes.
 */
(function(){
  'use strict';
  if(window.__LH_TOUCH_INTERACTION_GUARD_20__) return;
  window.__LH_TOUCH_INTERACTION_GUARD_20__=true;

  var OVERLAY_SELECTOR='#sidebarOverlay,.sidebar-overlay,.modal-backdrop,[data-overlay],.overlay,.loading-overlay';

  function isHidden(el){
    if(!el) return true;
    var cs=getComputedStyle(el);
    return !!(el.hidden || el.getAttribute('aria-hidden')==='true' || cs.display==='none' || cs.visibility==='hidden' || cs.opacity==='0');
  }

  function disable(el){
    if(!el) return;
    el.style.setProperty('pointer-events','none','important');
    el.style.setProperty('touch-action','none','important');
  }

  function normalize(){
    try{
      document.querySelectorAll(OVERLAY_SELECTOR).forEach(function(el){ if(isHidden(el)) disable(el); });
      var sidebar=document.getElementById('sidebar');
      var sideOverlay=document.getElementById('sidebarOverlay');
      if(sideOverlay && (!sidebar || !sidebar.classList.contains('open'))){
        sideOverlay.hidden=true;
        sideOverlay.setAttribute('aria-hidden','true');
        disable(sideOverlay);
      }
      var loading=document.getElementById('loadingOverlay');
      if(loading && isHidden(loading)) disable(loading);
    }catch(e){ console.warn('[TOUCH GUARD 2.0]',e); }
  }

  function boot(){
    normalize();
    [0,120,400,900].forEach(function(ms){ setTimeout(normalize,ms); });
  }

  function isPassiveHiddenOverlay(el){
    if(!el || !isHidden(el)) return false;
    var id=el.id||'';
    var cls=typeof el.className==='string' ? el.className : '';
    return id==='sidebarOverlay' || cls.indexOf('sidebar-overlay')!==-1 || cls.indexOf('modal-backdrop')!==-1 || cls.indexOf('loading-overlay')!==-1 || (cls.indexOf('overlay')!==-1);
  }

  function passThroughPointer(ev){
    try{
      var hit=ev.target;
      if(!isPassiveHiddenOverlay(hit)) return;
      if(typeof ev.clientX!=='number' || typeof ev.clientY!=='number') return;

      var changed=[];
      document.querySelectorAll(OVERLAY_SELECTOR).forEach(function(el){
        if(isHidden(el)){
          changed.push([el,el.style.getPropertyValue('pointer-events'),el.style.getPropertyPriority('pointer-events')]);
          el.style.setProperty('pointer-events','none','important');
        }
      });

      var underlying=document.elementFromPoint(ev.clientX,ev.clientY);

      changed.forEach(function(pair){
        if(pair[1]) pair[0].style.setProperty('pointer-events',pair[1],pair[2]||'');
        else pair[0].style.removeProperty('pointer-events');
      });

      if(underlying && underlying!==hit && underlying.closest){
        var actionable=underlying.closest('button,a,[role="button"],[data-page],[data-action],[data-page-link]');
        if(actionable){
          ev.preventDefault();
          ev.stopPropagation();
          actionable.click();
        }
      }
    }catch(e){ console.warn('[TOUCH PASS THROUGH]',e); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  document.addEventListener('pointerdown',passThroughPointer,true);
  window.__LH_TOUCH_GUARD_API__={repair:normalize};
})();
