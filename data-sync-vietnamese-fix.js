/* DATA SYNC VIETNAMESE FIX 1.1 — ACTIVITY BRIDGE LOADER
   Isolated compatibility loader. No menu/UI/HOC_SINH changes.
*/
(function(){
  'use strict';
  if(window.__LH_ACTIVITY_BRIDGE_LOADER_110__) return;
  window.__LH_ACTIVITY_BRIDGE_LOADER_110__=true;
  function load(){
    if(window.__LH_ACTIVITY_SYNC_COMPACT_110__) return;
    if(document.querySelector('script[data-lh-activity-compact="1"]')) return;
    const script=document.createElement('script');
    script.src='activity-sync-compact-v11.js?version=1.1.0';
    script.async=false;
    script.dataset.lhActivityCompact='1';
    script.onload=()=>console.info('[LE HOANG] Compact activity sync 1.1: READY');
    script.onerror=e=>console.warn('[LE HOANG] Compact activity sync 1.1: LOAD FAILED',e);
    (document.head||document.documentElement).appendChild(script);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,50),{once:true});
  else setTimeout(load,50);
})();
