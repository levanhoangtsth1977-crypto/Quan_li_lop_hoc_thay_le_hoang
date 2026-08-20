/* DATA SYNC VIETNAMESE FIX — SAFE COMPATIBILITY LAYER
 * Deliberately does not mutate student data or schema.
 * The current Google bridge is authoritative for Google synchronization.
 */
(function(){
'use strict';
if(window.__LH_DATA_SYNC_VIETNAMESE_FIX__)return;
window.__LH_DATA_SYNC_VIETNAMESE_FIX__=true;
window.addEventListener('google-sheets-data-ready',function(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
});
})();
