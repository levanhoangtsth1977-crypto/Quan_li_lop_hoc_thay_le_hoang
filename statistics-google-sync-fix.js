/* STATISTICS GOOGLE SYNC FIX 1.0 */
(function(){
'use strict';
if(window.__LH_STATISTICS_GOOGLE_SYNC_FIX_10__)return;
window.__LH_STATISTICS_GOOGLE_SYNC_FIX_10__=true;
function refresh(){
  try{
    if(window.__LH_EVENT_SUMMARY_API__&&typeof window.__LH_EVENT_SUMMARY_API__.refreshAll==='function'){
      window.__LH_EVENT_SUMMARY_API__.refreshAll();
    }
  }catch(e){console.warn('[LH STAT SYNC]',e)}
  try{if(typeof window.renderStatistics==='function')window.renderStatistics()}catch(e){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(e){}
}
function delayed(){[0,150,500,1200].forEach(ms=>setTimeout(refresh,ms))}
window.addEventListener('google-sheets-data-ready',delayed);
window.addEventListener('google-sheets-refresh',delayed);
window.addEventListener('google-sheet-record-saved',delayed);
window.addEventListener('google-sheet-events-deleted',delayed);
window.addEventListener('google-sheet-events-cleared',delayed);
setTimeout(delayed,2500);
})();
