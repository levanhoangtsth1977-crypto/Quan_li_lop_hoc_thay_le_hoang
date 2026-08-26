/* HOME DATA SYNC FIX 1.0 — refresh remote state after record changes */
(function(){
'use strict';
if(window.__LH_HOME_DATA_SYNC_FIX_10__)return;
window.__LH_HOME_DATA_SYNC_FIX_10__=true;
const clean=v=>String(v??'').trim();
const arrays={VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords',DIEM_DANH:'attendanceRecords'};
function count(tab){const key=arrays[tab];const a=Array.isArray(window[key])?window[key]:[];return a.length}
function badge(id,n){const el=document.getElementById(id);if(!el)return;el.textContent=String(n);el.hidden=n===0}
function refreshBadges(){badge('violationBadge',count('VI_PHAM'));badge('rewardBadge',count('KHEN_THUONG'));}
function refreshViews(){try{
 if(typeof window.renderViolations==='function')window.renderViolations();
 if(typeof window.renderRewards==='function')window.renderRewards();
 if(typeof window.renderDashboard==='function')window.renderDashboard();
 if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();
}catch(_){} refreshBadges();}
async function pullRemote(){
 try{
  if(typeof window.pullGoogleSheetEvents==='function'){
   const r=await window.pullGoogleSheetEvents();
   if(r!==null)refreshViews();
   return r;
  }
  if(typeof window.syncGoogleSheetEvents==='function'){
   const r=await window.syncGoogleSheetEvents();
   if(r!==null)refreshViews();
   return r;
  }
 }catch(e){console.warn('[LH HOME SYNC]',e)}
 return null;
}
function schedule(){setTimeout(()=>pullRemote(),100);setTimeout(()=>pullRemote(),700);setTimeout(()=>pullRemote(),1800)}
window.addEventListener('google-sheets-data-ready',schedule);
window.addEventListener('google-sheet-record-saved',schedule);
window.addEventListener('google-sheet-record-deleted',schedule);
window.addEventListener('class-data-updated',schedule);
window.addEventListener('storage',schedule);
const timer=setInterval(()=>{if(document.hidden)return;refreshBadges()},3000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{refreshBadges();schedule()},{once:true});else{refreshBadges();schedule()}
window.__LH_HOME_DATA_SYNC_API__={refresh:pullRemote,refreshViews,refreshBadges};
})();