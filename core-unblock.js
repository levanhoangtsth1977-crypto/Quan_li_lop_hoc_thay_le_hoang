/* CORE UI UNBLOCK 3.0
 * Single-purpose mobile safety gate.
 * The main controller is script.js; optional runtime chains are disabled
 * during regression isolation so a tap cannot trigger competing observers.
 */
(function(){
  'use strict';
  if(window.__LH_CORE_UI_UNBLOCK_30__) return;
  window.__LH_CORE_UI_UNBLOCK_30__=true;

  /* Prevent legacy/optional scripts that are still referenced by index.html
     from booting before the touch regression is fully removed. */
  window.__LH_GOOGLE_BRIDGE_970__=true;
  window.__LEARNING_SMAS_IMPORT_21__=true;
  window.__LH_BEHAVIOR_RECORDS_AI_SHIM_21__=true;

  function hideOverlay(){
    var overlay=document.getElementById('sidebarOverlay');
    if(!overlay) return;
    var sidebar=document.getElementById('sidebar');
    var open=!!(sidebar && sidebar.classList.contains('open'));
    if(!open){
      overlay.classList.remove('active');
      overlay.hidden=true;
      overlay.setAttribute('aria-hidden','true');
      overlay.style.setProperty('display','none','important');
      overlay.style.setProperty('pointer-events','none','important');
    }
  }

  function hideLoading(){
    var el=document.getElementById('loadingOverlay');
    if(!el) return;
    if(el.hasAttribute('hidden')){
      el.hidden=true;
      el.setAttribute('aria-hidden','true');
      el.style.setProperty('display','none','important');
      el.style.setProperty('pointer-events','none','important');
    }
  }

  function injectSafetyCSS(){
    if(document.getElementById('lhCoreTouchSafetyCSS')) return;
    var style=document.createElement('style');
    style.id='lhCoreTouchSafetyCSS';
    style.textContent=[
      '.sidebar-overlay[aria-hidden="true"],.sidebar-overlay:not(.active){display:none!important;pointer-events:none!important;}',
      '.modal[hidden],.loading-overlay[hidden]{display:none!important;pointer-events:none!important;}',
      'html,body{overscroll-behavior-x:none;}'
    ].join('');
    document.head.appendChild(style);
  }

  function boot(){
    injectSafetyCSS();
    hideOverlay();
    hideLoading();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }

  window.__LH_CORE_UI_UNBLOCK_API__={repair:boot};
})();
