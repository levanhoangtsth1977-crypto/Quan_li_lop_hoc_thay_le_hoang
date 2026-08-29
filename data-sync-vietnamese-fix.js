/* DATA SYNC VIETNAMESE FIX — SAFE COMPATIBILITY LAYER
 * Deliberately does not mutate student data or schema.
 * The current Google bridge is authoritative for Google synchronization.
 */
(function(){
'use strict';
if(window.__LH_DATA_SYNC_VIETNAMESE_FIX__)return;
window.__LH_DATA_SYNC_VIETNAMESE_FIX__=true;

function removeDuplicateAICards(){
  try{
    const page=document.getElementById('page-ai');
    if(!page)return;
    // index.html already owns the canonical 4 AI cards.
    // ui-complete-fix.js creates a second .ui-complete-page block; remove only that duplicate.
    page.querySelectorAll('.ui-complete-page').forEach(el=>el.remove());
  }catch(e){console.warn('[AI DEDUPE]',e)}
}

window.addEventListener('DOMContentLoaded',function(){
  // Runs after ui-complete-fix.js DOMContentLoaded handler because this script is loaded later.
  removeDuplicateAICards();
},{once:true});

window.addEventListener('google-sheets-data-ready',function(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderStudents==='function')window.renderStudents()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  // A data sync can trigger UI rerender; keep the canonical AI block only.
  removeDuplicateAICards();
});

window.LH_AIDedupe={removeDuplicateAICards};
})();
