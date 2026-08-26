/* ============================================================
   HOME + AI LIVE SYNC 1.0
   - Đồng bộ Trang chủ và AI giáo viên với dữ liệu hiện hành.
   - Không thay đổi dữ liệu gốc / Google Sheets.
   - Không thay thế renderer đang hoạt động; chỉ bổ sung lớp đồng bộ.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_HOME_AI_LIVE_SYNC_10__) return;
window.__LH_HOME_AI_LIVE_SYNC_10__=true;

const text=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];

function liveRecords(kind){
  const getter=kind==='violation'?'getViolationRecords':kind==='reward'?'getRewardRecords':null;
  if(getter && typeof window[getter]==='function'){
    try{
      const x=window[getter]();
      if(Array.isArray(x)) return x.slice();
    }catch(e){}
  }
  const local=kind==='violation'?window.violationRecords:window.rewardRecords;
  if(Array.isArray(local)) return local.slice();
  const tab=kind==='violation'?'VI_PHAM':'KHEN_THUONG';
  const sheet=window.GOOGLE_SHEET_DATA?.tabs?.[tab];
  return Array.isArray(sheet)?sheet.slice():[];
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
  if(window.__LH_ORIGINAL_GET_CLASS_STATISTICS__===undefined){
    window.__LH_ORIGINAL_GET_CLASS_STATISTICS__=window.getClassStatistics;
  }
  const original=window.__LH_ORIGINAL_GET_CLASS_STATISTICS__;
  window.getClassStatistics=function(){
    let base={};
    try{base=original()?original()||{}:{};}catch(e){}
    const c=liveCounts();
    return Object.assign({},base,{totalViolations:c.violations,totalRewards:c.rewards});
  };
}

function patchDashboardRenderer(){
  const fn=window.renderDashboard;
  if(typeof fn!=='function') return;
  if(!window.__LH_ORIGINAL_RENDER_DASHBOARD__){
    window.__LH_ORIGINAL_RENDER_DASHBOARD__=fn;
  }
  const original=window.__LH_ORIGINAL_RENDER_DASHBOARD__;
  if(window.renderDashboard.__lhWrapped) return;
  const wrapped=function(){
    try{original();}catch(e){console.warn('[LIVE SYNC] renderDashboard',e);}
    syncDashboardCounts();
  };
  wrapped.__lhWrapped=true;
  window.renderDashboard=wrapped;
}

function patchAIAnalysis(){
  const fn=window.buildClassAIAnalysis;
  if(typeof fn!=='function') return;
  if(!window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__){
    window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__=fn;
  }
  const original=window.__LH_ORIGINAL_BUILD_CLASS_AI_ANALYSIS__;
  if(window.buildClassAIAnalysis.__lhWrapped) return;
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
      out=[
        'PHÂN TÍCH LỚP',
        '',
        `Vi phạm: ${c.violations}`,
        `Khen thưởng: ${c.rewards}`
      ].join('\n');
    }
    return out;
  };
  wrapped.__lhWrapped=true;
  window.buildClassAIAnalysis=wrapped;
}

function refreshAll(){
  ensureStatisticsFresh();
  patchDashboardRenderer();
  patchAIAnalysis();
  syncDashboardCounts();
}

let last='';
function fingerprint(){
  const c=liveCounts();
  return `${c.violations}|${c.rewards}`;
}

function watch(){
  refreshAll();
  const now=fingerprint();
  if(now!==last){
    last=now;
    try{
      if(typeof window.renderDashboard==='function') window.renderDashboard();
    }catch(e){}
    syncDashboardCounts();
  }
}

['google-sheets-data-ready','storage','data-changed','records-updated','violation-updated','reward-updated'].forEach(ev=>{
  window.addEventListener(ev,()=>setTimeout(watch,50));
});

document.addEventListener('visibilitychange',()=>{
  if(!document.hidden) setTimeout(watch,50);
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(watch,100);
    setTimeout(watch,900);
    setTimeout(watch,1800);
  },{once:true});
}else{
  setTimeout(watch,100);
  setTimeout(watch,900);
  setTimeout(watch,1800);
}

setInterval(watch,1000);
})();
