/* HOME + AI LIVE SYNC 2.0 — GOOGLE SHEETS AUTHORITATIVE */
(function(){
'use strict';
if(window.__LH_HOME_AI_LIVE_SYNC_20__) return;
window.__LH_HOME_AI_LIVE_SYNC_20__=true;

const API=(window.GOOGLE_RECORDS_API&&window.GOOGLE_RECORDS_API.url)||'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

function jsonp(action){
  return new Promise((resolve,reject)=>{
    const cb='LH_HOME_AI_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    let done=false;
    const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}s.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Google Sheets không phản hồi')),20000);
    window[cb]=data=>finish(null,data);
    s.onerror=()=>finish(Error('Không truy cập được Google Sheets'));
    s.src=API+'?'+new URLSearchParams({action,callback:cb,_:Date.now()}).toString();
    document.head.appendChild(s);
  });
}

function replaceArray(name,data){
  if(!Array.isArray(data))return;
  if(Array.isArray(window[name]))window[name].splice(0,window[name].length,...data);
}

function applyRemoteEvents(payload){
  if(!payload||payload.ok!==true)return false;
  replaceArray('attendanceRecords',Array.isArray(payload.DIEM_DANH)?payload.DIEM_DANH:[]);
  replaceArray('violationRecords',Array.isArray(payload.VI_PHAM)?payload.VI_PHAM:[]);
  replaceArray('rewardRecords',Array.isArray(payload.KHEN_THUONG)?payload.KHEN_THUONG:[]);
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  const summary={
    violations:Array.isArray(window.violationRecords)?window.violationRecords.length:0,
    rewards:Array.isArray(window.rewardRecords)?window.rewardRecords.length:0
  };
  window.__LH_LIVE_EVENT_COUNTS__=summary;
  return summary;
}

function syncDOM(){
  const c=window.__LH_LIVE_EVENT_COUNTS__||{
    violations:Array.isArray(window.violationRecords)?window.violationRecords.length:0,
    rewards:Array.isArray(window.rewardRecords)?window.rewardRecords.length:0
  };
  ['statViolations','violationBadge'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(c.violations)});
  ['statRewards','rewardBadge'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(c.rewards)});
}

function renderLive(){
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
  try{if(typeof window.renderDashboard==='function'&&!window.__LH_DASH_RENDERING__)window.renderDashboard()}catch(_){}
  syncDOM();
}

async function forceSync(){
  try{
    const payload=await jsonp('get_events');
    const result=applyRemoteEvents(payload);
    if(result!==false){renderLive();try{window.dispatchEvent(new CustomEvent('lh-live-data-ready',{detail:result}))}catch(_){} }
    return result;
  }catch(error){
    console.warn('[LH HOME AI LIVE SYNC]',error);
    syncDOM();
    return null;
  }
}

function patchStatistics(){
  if(typeof window.getClassStatistics!=='function')return;
  if(window.getClassStatistics.__LH_LIVE_STATS_20__)return;
  const original=window.getClassStatistics;
  const wrapped=function(){
    const base=original()?original():{};
    const c=window.__LH_LIVE_EVENT_COUNTS__||{};
    if(Number.isFinite(c.violations))base.totalViolations=c.violations;
    if(Number.isFinite(c.rewards))base.totalRewards=c.rewards;
    return base;
  };
  wrapped.__LH_LIVE_STATS_20__=true;
  window.getClassStatistics=wrapped;
}

window.LH_FORCE_HOME_AI_SYNC=forceSync;
window.addEventListener('violation-updated',()=>setTimeout(forceSync,100));
window.addEventListener('reward-updated',()=>setTimeout(forceSync,100));
window.addEventListener('google-sheets-refresh',()=>setTimeout(forceSync,100));
window.addEventListener('google-sheets-data-ready',()=>setTimeout(forceSync,100));
window.addEventListener('lh-live-data-ready',()=>setTimeout(patchStatistics,0));

document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-page],[data-nav],[data-menu],[data-ai-action]');
  if(!target)return;
  setTimeout(()=>{patchStatistics();forceSync()},250);
});

document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(forceSync,150)});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(forceSync,300);
    setTimeout(patchStatistics,700);
  },{once:true});
}else{
  setTimeout(forceSync,300);
  setTimeout(patchStatistics,700);
}

setInterval(()=>{
  const active=document.querySelector('#page-dashboard.active,#page-ai.active');
  if(active)forceSync();
},10000);
})();
