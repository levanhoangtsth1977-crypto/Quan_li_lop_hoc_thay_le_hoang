/* DATA SYNC VIETNAMESE FIX 1.0 — ACTIVITY BRIDGE LOADER
   This file is intentionally isolated. It does not alter menus, HOC_SINH,
   or the existing UI controller. It only activates the compact activity
   synchronisation bridge already referenced by index.html.
*/
(function(){
  'use strict';
  if(window.__LH_ACTIVITY_BRIDGE_LOADER_100__) return;
  window.__LH_ACTIVITY_BRIDGE_LOADER_100__=true;

  function load(){
    if(window.__LH_ACTIVITY_SYNC_COMPACT_100__) return;
    if(document.querySelector('script[data-lh-activity-compact="1"]')) return;
    const script=document.createElement('script');
    script.src='activity-sync-compact.js?version=1.0.0';
    script.async=false;
    script.dataset.lhActivityCompact='1';
    script.onload=()=>console.info('[LE HOANG] Compact activity sync: READY');
    script.onerror=e=>console.warn('[LE HOANG] Compact activity sync: LOAD FAILED',e);
    (document.head||document.documentElement).appendChild(script);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(load,50),{once:true});
  }else{
    setTimeout(load,50);
  }
})();
