/* CORE UI UNBLOCK 2.0
 * Prevent hidden fullscreen layers from intercepting touch/click input.
 * Keeps real modal/sidebar interactions intact.
 */
(function(){
  'use strict';
  if(window.__LH_CORE_UI_UNBLOCK_20__) return;
  window.__LH_CORE_UI_UNBLOCK_20__=true;

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

  function installTouchOverlayCSS(){
    if(document.getElementById('lhCoreTouchOverlayCSS')) return;
    var style=document.createElement('style');
    style.id='lhCoreTouchOverlayCSS';
    style.textContent=[
      '/* Hidden/inactive sidebar overlay must never own the touch surface. */',
      '.sidebar-overlay{pointer-events:none!important;touch-action:none!important;}',
      '.sidebar-overlay.active{pointer-events:auto!important;touch-action:auto!important;}',
      '.sidebar-overlay[aria-hidden="true"]{pointer-events:none!important;touch-action:none!important;}',
      '#sidebarOverlay:not(.active){pointer-events:none!important;touch-action:none!important;}',
      '.modal[hidden],.loading-overlay[hidden]{pointer-events:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function fix(){
    try{
      installTouchOverlayCSS();
      forceHidden('loadingOverlay');
      var sidebar=document.getElementById('sidebar');
      var overlay=document.getElementById('sidebarOverlay');
      if(overlay && (!sidebar || !sidebar.classList.contains('open'))){
        overlay.classList.remove('active');
        overlay.hidden=true;
        overlay.setAttribute('aria-hidden','true');
        overlay.style.setProperty('display','none','important');
        overlay.style.setProperty('pointer-events','none','important');
      }else if(overlay){
        overlay.hidden=false;
        overlay.setAttribute('aria-hidden','false');
        overlay.classList.add('active');
        overlay.style.removeProperty('display');
      }
    }catch(e){ console.warn('[CORE UI UNBLOCK 2.0]',e); }
  }

  function boot(){
    fix();
    [100,500,1000,2000,4000].forEach(function(ms){setTimeout(fix,ms);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.__LH_CORE_UI_UNBLOCK_API__={repair:fix};
})();
