/* GOOGLE SHEETS RECORDS BRIDGE 2.5 — AUTHORITATIVE EVENT SYNC / APP_DATA SAFE */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_250__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_250__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';

const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const present=r=>/^(present|có mặt|co mat)$/i.test(clean(r&&r.status));

function sourceArray(name,appKey){
  try{
    if(window.APP_DATA&&Array.isArray(window.APP_DATA[appKey]))return window.APP_DATA[appKey];
    if(Array.isArray(window[name]))return window[name];
  }catch(_){}
  return [];
}

function replaceArray(name,appKey,list){
  const x=Array.isArray(list)?list:[];
  try{
    if(window.APP_DATA&&Array.isArray(window.APP_DATA[appKey])){
      window.APP_DATA[appKey].splice(0,window.APP_DATA[appKey].length,...x);
    }
    if(Array.isArray(window[name])){
      window[name].splice(0,window[name].length,...x);
    }
  }catch(_){}
  return x;
}

function eventSnapshot(){
  return {
    DIEM_DANH:sourceArray('attendanceRecords','attendance').filter(r=>clean(r&&r.studentId)&&!present(r)),
    VI_PHAM:sourceArray('violationRecords','violations').filter(r=>clean(r&&r.studentId)),
    KHEN_THUONG:sourceArray('rewardRecords','rewards').filter(r=>clean(r&&r.studentId))
  };
}

function jsonp(action){
  return new Promise((resolve,reject)=>{
    const cb='LH250_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    let done=false;
    const tm=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);
    function finish(e,d){
      if(done)return;
      done=true;
      clearTimeout(tm);
      try{delete window[cb]}catch(_){}
      s.remove();
      e?reject(e):resolve(d);
    }
    window[cb]=d=>finish(null,d);
    s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
    document.head.appendChild(s);
  });
}

function post(payload){
  return new Promise((resolve,reject)=>{
    const n='LH250_'+Date.now();
    const f=document.createElement('iframe');
    const form=document.createElement('form');
    f.name=n;f.style.display='none';
    form.method='POST';form.target=n;form.action=API;form.style.display='none';
    const i=document.createElement('input');
    i.type='hidden';i.name='payload';i.value=JSON.stringify(payload);
    form.appendChild(i);document.body.append(f,form);
    let done=false;
    const finish=ok=>{
      if(done)return;
      done=true;
      setTimeout(()=>{f.remove();form.remove()},700);
      ok?resolve({ok:true}):reject(Error('Không gửi được dữ liệu Google Sheets'));
    };
    f.onload=()=>finish(true);
    try{form.submit()}catch(e){finish(false)}
    setTimeout(()=>finish(true),15000);
  });
}

function applyEvents(d){
  if(!d||d.ok!==true)return false;
  const attendance=(d.DIEM_DANH||[]).filter(r=>clean(r&&r.studentId)&&!present(r));
  const violations=(d.VI_PHAM||[]).filter(r=>clean(r&&r.studentId));
  const rewards=(d.KHEN_THUONG||[]).filter(r=>clean(r&&r.studentId));

  replaceArray('attendanceRecords','attendance',attendance);
  replaceArray('violationRecords','violations',violations);
  replaceArray('rewardRecords','rewards',rewards);

  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}

  window.GOOGLE_SHEET_EVENT_DATA={
    version:'2.5',
    mode:'REPLACE',
    loadedAt:new Date().toISOString(),
    tabs:d,
    counts:{attendance:attendance.length,violations:violations.length,rewards:rewards.length}
  };
  window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));
  return true;
}

async function pull(){
  try{
    const d=await jsonp('get_events');
    applyEvents(d);
    return d;
  }catch(e){
    console.warn('[GOOGLE EVENTS]',e.message);
    return null;
  }
}

async function push(){
  try{
    const snapshot=eventSnapshot();
    return await post({action:'sync_events',records:snapshot});
  }catch(e){
    console.warn('[GOOGLE EVENTS PUSH]',e.message);
    return{ok:false,error:e.message};
  }
}

function install(){
  ['saveAttendanceRecord','addViolation','deleteViolation','addReward','deleteReward'].forEach(n=>{
    try{
      if(typeof window[n]!=='function'||window[n].__lh250)return;
      const o=window[n];
      const w=function(){
        const r=o.apply(this,arguments);
        setTimeout(async()=>{
          await push();
          await pull();
        },250);
        return r;
      };
      w.__lh250=true;
      w.__lhOriginal=o;
      window[n]=w;
    }catch(_){}
  });
}

async function boot(){
  install();
  await pull();
  install();
  if(window.__LH250_TIMER__)clearInterval(window.__LH250_TIMER__);
  window.__LH250_TIMER__=setInterval(install,1000);
}

window.syncGoogleSheetEvents=push;
window.pushGoogleSheetEvents=push;
window.pullGoogleSheetEvents=pull;
window.getGoogleSheetEventData=()=>window.GOOGLE_SHEET_EVENT_DATA||null;
window.getGoogleSheetEventSnapshot=eventSnapshot;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});
else setTimeout(boot,1200);
})();
