/* ============================================================
   HOME + AI LIVE SYNC 1.1
   - Đồng bộ Trang chủ và AI giáo viên với nguồn dữ liệu hiện hành.
   - Ưu tiên Google Sheets state hiện tại, sau đó mới dùng API/cache.
   - Không thay đổi dữ liệu gốc / cấu trúc Google Sheets.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_HOME_AI_LIVE_SYNC_11__) return;
window.__LH_HOME_AI_LIVE_SYNC_11__=true;

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
    try{
      const x=window[getter]();
      if(Array.isArray(x)) return x.slice();
    }catch(e){}
  }

  const local=kind==='violation'?window.violationRecords:window.rewardRecords;
  return Array.isArray(local)?local.slice():[];
}

function liveCounts(){
  return {
    violations:liveRecords('violation').length,
    rewards:liveRecords('reward').length
  };
}

function syncDashboardCounts(){
  const c=liveCounts();
  const ids={
    statViolations:c.violations,
    statRewards:c.rewards,
    violationBadge:c.violations,
    rewardBadge:c.rewards
  };
  Object.entries(ids).forEach(([id,value])=>{
    const el=document.getElementById(id);
    if(el) el.textContent=String(value);
  });
}

function ensureStatisticsFresh(){
  if(typeof window.getClassStatistics!=='function') return;
  if(!window.__LH_ORIGINAL_GET_CLASS_STATISTICS__)
    window.__LH_ORIGINAL_GET_CLASS_STATISTICS__=window.getClassStatistics;
  const original=window.__LH_ORIGINAL_GET_CLASS_STATISTICS__;
  if(window.getClassStatistics.__lhLiveWrapped) return;
  const wrapped=function(){
    let base={};
    try{base=original()?original()||{}:{};}catch(e){}
    const c=liveCounts();
    return Object.assign({},base,{totalViolations:c.violations,totalRewards:c.rewards});
  };
  wrapped.__lhLiveWrapped=true;
  window.getClassStatistics=wrapped;
}

function patchDashboardRenderer(){
  const fn=window.renderDashboard;
  if(typeof fn!=='function') return;
  if(!window.__LH_ORIGINAL_RENDER_DASHBOARD__)
    window.__LH_ORIGINAL_RENDER_DASHBOARD__=fn;
  if(window.renderDashboard.__lhLiveWrapped) return;
  const original=window.__LH_ORIGINAL_RENDER_DASHBOARD__;
  const wrapped=function(){
    try{original();}catch(e){console.warn('[LIVE SYNC] renderDashboard',e);}
    syncDashboardCounts();
  };
  wrapped.__lhLiveWrapped=true;
  window.renderDashboard=wrapped;
}

function patchAIAnalysis(){
  const fn=window.buildClassAIAnalysis;
  if(typeof fn!=='function') return;
  if(!window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__)
    window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__=fn;
  if(window.buildClassAIAnalysis.__lhLiveWrapped) return;
  const original=window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__;
  const wrapped=function(){
    let out='';
    try{out=String(original()??'');}catch(e){out='';}
    const c=liveCounts();
    if(out){
      out=out.replace(/Vi phạm:\s*[^\n]*/i,`Vi phạm: ${c.violations}`)
             .replace(/Khen thưởng:\s*[^\n]*/i,`Khen thưởng: ${c.rewards}`);
      if(!/Vi phạm:\s*\d+/i.test(out)) out+=`\nVi phạm: ${c.violations}`;
      if(!/Khen thưởng:\s*\d+/i.test(out)) out+=`\nKhen thưởng: ${c.rewards}`;
    }else{
      out=['PHÂN TÍCH LỚP','',`Vi phạm: ${c.violations}`,`Khen thưởng: ${c.rewards}`].join('\n');
    }
    return out;
  };
  wrapped.__lhLiveWrapped=true;
  window.buildClassAIAnalysis=wrapped;
}

function refresh(){
  ensureStatisticsFresh();
  patchDashboardRenderer();
  patchAIAnalysis();
  syncDashboardCounts();
}

let last='';
function fingerprint(){const c=liveCounts();return `${c.violations}|${c.rewards}`;}
function watch(){
  refresh();
  const now=fingerprint();
  if(now!==last){
    last=now;
    try{if(typeof window.renderDashboard==='function')window.renderDashboard();}catch(e){}
    syncDashboardCounts();
  }
}

['google-sheets-data-ready','storage','data-changed','records-updated','violation-updated','reward-updated'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(watch,50)));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(watch,50)});

if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(watch,100);setTimeout(watch,900);setTimeout(watch,1800)},{once:true});
else{setTimeout(watch,100);setTimeout(watch,900);setTimeout(watch,1800);}

setInterval(watch,1000);
})();
