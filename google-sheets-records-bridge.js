/* GOOGLE SHEETS RECORDS BRIDGE 4.0 — AUTHORITATIVE EVENT SYNC */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_400__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_400__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const present=r=>/^(present|có mặt|co mat)$/i.test(clean(r&&r.status));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const now=()=>new Date().toISOString();
const makeId=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);

function arraysFor(name,key){
  const out=[];
  try{if(window.APP_DATA&&Array.isArray(window.APP_DATA[key]))out.push(window.APP_DATA[key]);}catch(_){}
  try{if(Array.isArray(window[name]))out.push(window[name]);}catch(_){}
  return out;
}

function mergeRecords(name,key,tab){
  const map=new Map();
  arraysFor(name,key).forEach(arr=>arr.forEach(r=>{
    if(!r||!clean(r.studentId))return;
    if(tab==='DIEM_DANH'&&present(r))return;
    const id=clean(r.id)||JSON.stringify([r.studentId,r.date,r.status,r.note,r.type,r.level,r.action,r.formType]);
    if(!map.has(id))map.set(id,r);
  }));
  return [...map.values()];
}

function eventSnapshot(){
  return {
    DIEM_DANH:mergeRecords('attendanceRecords','attendance','DIEM_DANH'),
    VI_PHAM:mergeRecords('violationRecords','violations','VI_PHAM'),
    KHEN_THUONG:mergeRecords('rewardRecords','rewards','KHEN_THUONG')
  };
}

function replaceArray(name,key,list){
  const x=Array.isArray(list)?list:[];
  try{
    if(window.APP_DATA&&Array.isArray(window.APP_DATA[key]))window.APP_DATA[key].splice(0,window.APP_DATA[key].length,...x);
  }catch(_){}
  try{
    if(Array.isArray(window[name]))window[name].splice(0,window[name].length,...x);
  }catch(_){}
  return x;
}

function jsonp(action){
 return new Promise((resolve,reject)=>{
  const cb='LH400_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const s=document.createElement('script');let done=false;
  const tm=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);
  function finish(e,d){if(done)return;done=true;clearTimeout(tm);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)}
  window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
  s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s);
 });
}

function post(payload){
 return new Promise((resolve,reject)=>{
  const n='LH400_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const f=document.createElement('iframe'),form=document.createElement('form');
  f.name=n;f.style.display='none';form.method='POST';form.target=n;form.action=API;form.style.display='none';
  const i=document.createElement('input');i.type='hidden';i.name='payload';i.value=JSON.stringify(payload);form.appendChild(i);document.body.append(f,form);
  let done=false;
  const finish=ok=>{if(done)return;done=true;setTimeout(()=>{f.remove();form.remove()},1000);ok?resolve({ok:true}):reject(Error('Không gửi được dữ liệu Google Sheets'))};
  f.onload=()=>finish(true);try{form.submit()}catch(e){finish(false)}setTimeout(()=>finish(true),15000);
 });
}

function applyEvents(d){
 if(!d||d.ok!==true)return false;
 const a=(d.DIEM_DANH||[]).filter(r=>clean(r.studentId)&&!present(r));
 const v=(d.VI_PHAM||[]).filter(r=>clean(r.studentId));
 const k=(d.KHEN_THUONG||[]).filter(r=>clean(r.studentId));
 replaceArray('attendanceRecords','attendance',a);replaceArray('violationRecords','violations',v);replaceArray('rewardRecords','rewards',k);
 try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
 try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
 try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
 try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
 try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
 window.GOOGLE_SHEET_EVENT_DATA={version:'4.0',mode:'REPLACE',loadedAt:now(),tabs:d,counts:{attendance:a.length,violations:v.length,rewards:k.length}};
 window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));
 lastLocalKey=snapshotKey(eventSnapshot());bootstrapped=true;return true;
}

function snapshotKey(s){try{return JSON.stringify(s)}catch(_){return ''}}
let lastLocalKey='';let syncing=false;let bootstrapped=false;

async function pull(){if(syncing)return null;try{syncing=true;const d=await jsonp('get_events');applyEvents(d);return d}catch(e){console.warn('[LH400 PULL]',e.message);return null}finally{syncing=false}}

async function push(force){
 if(syncing)return{ok:false,busy:true};
 try{
  const snapshot=eventSnapshot(),key=snapshotKey(snapshot);
  if(!force&&bootstrapped&&key===lastLocalKey)return{ok:true,changed:false,counts:{attendance:snapshot.DIEM_DANH.length,violations:snapshot.VI_PHAM.length,rewards:snapshot.KHEN_THUONG.length}};
  syncing=true;
  await post({action:'sync_events',records:snapshot});
  lastLocalKey=key;bootstrapped=true;
  window.dispatchEvent(new CustomEvent('google-sheet-events-saved',{detail:{ok:true,counts:{attendance:snapshot.DIEM_DANH.length,violations:snapshot.VI_PHAM.length,rewards:snapshot.KHEN_THUONG.length}}}));
  return{ok:true,changed:true,counts:{attendance:snapshot.DIEM_DANH.length,violations:snapshot.VI_PHAM.length,rewards:snapshot.KHEN_THUONG.length}};
 }catch(e){console.error('[LH400 PUSH]',e);return{ok:false,error:e.message}}finally{syncing=false}
}

function getViolationFormData(){
 const g=id=>document.getElementById(id);return{studentId:clean(g('violationStudent')?.value),date:clean(g('violationDate')?.value)||today(),type:clean(g('violationType')?.value),level:clean(g('violationLevel')?.value)||'light',status:clean(g('violationStatus')?.value)||'monitoring',action:clean(g('violationAction')?.value),note:clean(g('violationNote')?.value)};
}
function clearViolationForm(){['violationStudent','violationType','violationLevel','violationStatus','violationAction','violationNote'].forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value=''});const d=document.getElementById('violationDate');if(d)d.value=today()}

async function saveViolationFromForm(e){
 if(e){e.preventDefault();e.stopImmediatePropagation()}
 if(syncing)return false;
 const d=getViolationFormData();if(!d.studentId){alert('Vui lòng chọn học sinh.');return false}if(!d.type){alert('Vui lòng chọn nội dung vi phạm.');return false}if(!d.date){alert('Vui lòng chọn ngày.');return false}
 const r={id:makeId('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()};
 let list=window.APP_DATA&&Array.isArray(window.APP_DATA.violations)?window.APP_DATA.violations:(Array.isArray(window.violationRecords)?window.violationRecords:[]);list.push(r);try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
 try{if(typeof window.saveClassData==='function')window.saveClassData();if(typeof window.renderViolations==='function')window.renderViolations();if(typeof window.renderDashboard==='function')window.renderDashboard();if(typeof window.updateBadges==='function')window.updateBadges()}catch(_){}
 const result=await push(true);
 if(!result.ok){const i=list.indexOf(r);if(i>=0)list.splice(i,1);return false}
 clearViolationForm();const modal=document.getElementById('violationModal');if(modal)modal.hidden=true;document.body.classList.remove('modal-open');try{if(typeof window.showToast==='function')window.showToast('Đã lưu vi phạm và đồng bộ Google Sheets.','success')}catch(_){}return true;
}

function installForms(){
 const vf=document.getElementById('violationForm');if(vf&&!vf.__LH400__){vf.__LH400__=true;vf.addEventListener('submit',saveViolationFromForm,true);const b=vf.querySelector('button[type="submit"]');if(b){b.type='button';b.addEventListener('click',saveViolationFromForm,true)}}
 const rf=document.getElementById('rewardForm');if(rf&&!rf.__LH400__){rf.__LH400__=true;rf.addEventListener('submit',()=>setTimeout(()=>push(true),500),true)}
 const ab=document.getElementById('saveAttendance');if(ab&&!ab.__LH400__){ab.__LH400__=true;ab.addEventListener('click',()=>setTimeout(()=>push(true),700),true)}
}

function installFunctionWatches(){
 ['saveAttendanceRecord','addViolation','deleteViolation','addReward','deleteReward'].forEach(name=>{
  try{const fn=window[name];if(typeof fn!=='function'||fn.__LH400__)return;const w=function(){const r=fn.apply(this,arguments);setTimeout(()=>push(true),500);return r};w.__LH400__=true;w.__LHOriginal=fn;window[name]=w}catch(_){}
 });
}

async function detectChanges(){if(!bootstrapped||syncing)return;try{const key=snapshotKey(eventSnapshot());if(key!==lastLocalKey)await push(false)}catch(e){console.warn('[LH400 WATCH]',e.message)}}

async function boot(){
 await pull();installForms();installFunctionWatches();
 if(window.__LH400_INSTALL__)clearInterval(window.__LH400_INSTALL__);if(window.__LH400_WATCH__)clearInterval(window.__LH400_WATCH__);
 window.__LH400_INSTALL__=setInterval(()=>{installForms();installFunctionWatches()},400);
 window.__LH400_WATCH__=setInterval(detectChanges,1000);
}

window.syncGoogleSheetEvents=()=>push(true);window.pushGoogleSheetEvents=()=>push(true);window.pullGoogleSheetEvents=pull;window.forceGoogleSheetEventSync=()=>push(true);window.getGoogleSheetEventSnapshot=eventSnapshot;window.saveViolationToGoogleSheets=saveViolationFromForm;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1000),{once:true});else setTimeout(boot,1000);
})();
