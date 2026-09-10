/* BEHAVIOR RECORDS AI SUMMARY — COMPATIBILITY SHIM 2.0
 * The canonical UI owner is behavior-ui-canonical-v11.js.
 * This file intentionally renders nothing, avoiding duplicate tables.
 * It preserves the legacy API name for modules that still call it.
 */
(function(){
'use strict';
if(window.__LH_BEHAVIOR_RECORDS_AI_SHIM_20__)return;
window.__LH_BEHAVIOR_RECORDS_AI_SHIM_20__=true;
function canonical(){return window.LH_BEHAVIOR_UI_CANONICAL||null}
function refresh(){try{const api=canonical();if(api&&typeof api.render==='function')api.render();}catch(e){console.warn('[BEHAVIOR AI SHIM]',e)}}
function expose(){window.__LH_BEHAVIOR_AI_API__={refresh,violations:function(){try{return typeof window.getViolationRecords==='function'?window.getViolationRecords():[]}catch{return[]}},rewards:function(){try{return typeof window.getRewardRecords==='function'?window.getRewardRecords():[]}catch{return[]}},summary:function(){const api=canonical();if(api&&Array.isArray(api.VIOLATIONS)){}return []}};}
function boot(){expose();if(canonical())refresh();else{let n=0;const t=setInterval(()=>{n++;if(canonical()||n>=20){clearInterval(t);refresh()}},100)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();