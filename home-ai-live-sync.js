/* ============================================================
   HOME + AI LIVE SYNC 1.2
   - Luon dong bo Trang chu + AI voi Google Sheets hien hanh.
   - Sau xoa/sua Vi pham/Khen thuong: goi syncGoogleSheetsNow().
   - Cache chi la du phong; khong sua du lieu goc.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_HOME_AI_LIVE_SYNC_12__) return;
window.__LH_HOME_AI_LIVE_SYNC_12__=true;

const text=v=>String(v??'').trim();

function sheetRecords(tab){
  const x=window.GOOGLE_SHEET_DATA?.tabs?.[tab];
  return Array.isArray(x)?x.slice():null;
}

function liveRecords(kind){
  const tab=kind==='violation'?'VI_PHAM':'KHEN_THUONG';
  const sheet=sheetRecords(tab);
  if(sheet) return sheet;
  const getter=kind==='violation'?'getViolationRecords':'getRewardRecords';
  if(typeof window[getter]==='function'){
    try{const x=window[getter]();if(Array.isArray(x)) return x.slice();}catch(e){}
  }
  const local=kind==='violation'?window.violationRecords:window.rewardRecords;
  return Array.isArray(local)?local.slice():[];
}

function liveCounts(){
  return {violations:liveRecords('violation').length,rewards:liveRecords('reward').length};
}

function syncDashboardCounts(){
  const c=liveCounts();
  const ids={statViolations:c.violations,statRewards:c.rewards,violationBadge:c.violations,rewardBadge:c.rewards};
  Object.entries(ids).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=String(value)});
}

function ensureStatisticsFresh(){
  if(typeof window.getClassStatistics!=='function') return;
  if(!window.__LH_ORIGINAL_GET_CLASS_STATISTICS__)window.__LH_ORIGINAL_GET_CLASS_STATISTICS__=window.getClassStatistics;
  const original=window.__LH_ORIGINAL_GET_CLASS_STATISTICS__;
  if(window.getClassStatistics.__lhLiveWrapped)return;
  const wrapped=function(){let base={};try{base=original()?original()||{}:{}}catch(e){}const c=liveCounts();return Object.assign({},base,{totalViolations:c.violations,totalRewards:c.rewards})};
  wrapped.__lhLiveWrapped=true;window.getClassStatistics=wrapped;
}

function patchDashboardRenderer(){
  const fn=window.renderDashboard;if(typeof fn!=='function')return;
  if(!window.__LH_ORIGINAL_RENDER_DASHBOARD__)window.__LH_ORIGINAL_RENDER_DASHBOARD__=fn;
  if(window.renderDashboard.__lhLiveWrapped)return;
  const original=window.__LH_ORIGINAL_RENDER_DASHBOARD__;
  const wrapped=function(){try{original()}catch(e){console.warn('[LIVE SYNC] renderDashboard',e)}syncDashboardCounts()};
  wrapped.__lhLiveWrapped=true;window.renderDashboard=wrapped;
}

function patchAIAnalysis(){
  const fn=window.buildClassAIAnalysis;if(typeof fn!=='function')return;
  if(!window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__)window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__=fn;
  if(window.buildClassAIAnalysis.__lhLiveWrapped)return;
  const original=window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__;
  const wrapped=function(){let out='';try{out=String(original()??'')}catch(e){}const c=liveCounts();if(out){out=out.replace(/Vi pham:\s*[^\n]*/i,`Vi pham: ${c.violations}`).replace(/Khen thuong:\s*[^\n]*/i,`Khen thuong: ${c.rewards}`);if(!/Vi pham:\s*\d+/i.test(out))out+=`\nVi pham: ${c.violations}`;if(!/Khen thuong:\s*\d+/i.test(out))out+=`\nKhen thuong: ${c.rewards}`}else out=['PHAN TICH LOP','',`Vi pham: ${c.violations}`,`Khen thuong: ${c.rewards}`].join('\n');return out};
  wrapped.__lhLiveWrapped=true;window.buildClassAIAnalysis=wrapped;
}

function refresh(){ensureStatisticsFresh();patchDashboardRenderer();patchAIAnalysis();syncDashboardCounts()}

async function forceGoogleReload(){
  if(typeof window.syncGoogleSheetsNow!=='function')return;
  try{await window.syncGoogleSheetsNow();}catch(e){console.warn('[LIVE SYNC] Google reload',e)}
}

let last='';
function fingerprint(){const c=liveCounts();return `${c.violations}|${c.rewards}`}
function watch(){
  refresh();
  const now=fingerprint();
  if(now!==last){last=now;try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(e){}syncDashboardCounts()}
}

['violation-updated','reward-updated'].forEach(ev=>window.addEventListener(ev,()=>{setTimeout(async()=>{await forceGoogleReload();watch()},80)}));
['google-sheets-data-ready','storage','data-changed','records-updated'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(watch,50)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(async()=>{await forceGoogleReload();watch()},80)});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',async()=>{setTimeout(async()=>{await forceGoogleReload();watch()},150);setTimeout(watch,1200);setTimeout(watch,2200)},{once:true});
else{setTimeout(async()=>{await forceGoogleReload();watch()},150);setTimeout(watch,1200);setTimeout(watch,2200)}
setInterval(watch,1000);
})();
