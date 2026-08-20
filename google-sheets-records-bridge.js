/* GOOGLE SHEETS RECORDS BRIDGE 5.4 — AUTHORITATIVE EVENT SYNC */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_540__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_540__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const present=r=>/^(present|có mặt|co mat)$/i.test(clean(r&&r.status));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const now=()=>new Date().toISOString();
const makeId=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);

/* DATA.JS dùng let/const top-level nên KHÔNG nằm trên window.
   Phải đọc qua API getter của Data Engine. */
function dataArray(getter,windowName,appKey){
  try{if(typeof window[getter]==='function'){const a=window[getter]();if(Array.isArray(a))return a;}}catch(e){console.warn('[LH540 getter]',getter,e)}
  try{if(window.APP_DATA&&Array.isArray(window.APP_DATA[appKey]))return window.APP_DATA[appKey]}catch(_){}
  try{if(Array.isArray(window[windowName]))return window[windowName]}catch(_){}
  return [];
}
function eventSnapshot(){
  const a=dataArray('getAttendanceRecords','attendanceRecords','attendance').filter(r=>clean(r.studentId)&&!present(r));
  const v=dataArray('getViolationRecords','violationRecords','violations').filter(r=>clean(r.studentId));
  const k=dataArray('getRewardRecords','rewardRecords','rewards').filter(r=>clean(r.studentId));
  return {DIEM_DANH:a,VI_PHAM:v,KHEN_THUONG:k};
}
function replaceArray(getter,windowName,appKey,list){
  const target=dataArray(getter,windowName,appKey),x=Array.isArray(list)?list:[];
  try{target.splice(0,target.length,...x)}catch(e){console.warn('[LH540 replace]',getter,e)}
  try{if(window.APP_DATA&&Array.isArray(window.APP_DATA[appKey]))window.APP_DATA[appKey].splice(0,window.APP_DATA[appKey].length,...x)}catch(_){}
  return target;
}
function applyEvents(d){
  if(!d||d.ok!==true)return false;
  const a=(d.DIEM_DANH||[]).filter(r=>clean(r.studentId)&&!present(r));
  const v=(d.VI_PHAM||[]).filter(r=>clean(r.studentId));
  const k=(d.KHEN_THUONG||[]).filter(r=>clean(r.studentId));
  replaceArray('getAttendanceRecords','attendanceRecords','attendance',a);
  replaceArray('getViolationRecords','violationRecords','violations',v);
  replaceArray('getRewardRecords','rewardRecords','rewards',k);
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.saveClassData==='function')window.saveClassData()}catch(_){}
  try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  window.GOOGLE_SHEET_EVENT_DATA={version:'5.4',mode:'REPLACE',loadedAt:now(),tabs:d,counts:{attendance:a.length,violations:v.length,rewards:k.length}};
  window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));
  lastLocalKey=snapshotKey(eventSnapshot());bootstrapped=true;return true;
}
function jsonp(action){return new Promise((resolve,reject)=>{const cb='LH540_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const tm=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);function finish(e,d){if(done)return;done=true;clearTimeout(tm);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)}window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s)})}
function post(payload){
  return new Promise((resolve,reject)=>{
    const data=JSON.stringify(payload);
    let sent=false;
    try{
      fetch(API,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:data,keepalive:true}).then(()=>{sent=true;resolve({ok:true,transport:'fetch'})}).catch(()=>{});
    }catch(_){}
    setTimeout(()=>{
      if(sent)return;
      try{
        const n='LH540_'+Date.now()+'_'+Math.random().toString(36).slice(2),f=document.createElement('iframe'),form=document.createElement('form');
        f.name=n;f.style.display='none';form.method='POST';form.target=n;form.action=API;form.style.display='none';
        const i=document.createElement('input');i.type='hidden';i.name='payload';i.value=data;form.appendChild(i);document.body.append(f,form);form.submit();setTimeout(()=>{f.remove();form.remove()},3000);resolve({ok:true,transport:'iframe'});
      }catch(e){reject(e)}
    },1200);
  });
}
function snapshotKey(s){try{return JSON.stringify(s)}catch(_){return ''}}
let lastLocalKey='';let syncing=false;let bootstrapped=false;
async function pull(){if(syncing)return null;try{syncing=true;const d=await jsonp('get_events');applyEvents(d);return d}catch(e){console.warn('[LH540 PULL]',e.message);return null}finally{syncing=false}}
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
  }catch(e){console.error('[LH540 PUSH]',e);return{ok:false,error:e.message}}finally{syncing=false}
}
function getViolationFormData(){const g=id=>document.getElementById(id);return{studentId:clean(g('violationStudent')?.value),date:clean(g('violationDate')?.value)||today(),type:clean(g('violationType')?.value),level:clean(g('violationLevel')?.value)||'light',status:clean(g('violationStatus')?.value)||'monitoring',action:clean(g('violationAction')?.value),note:clean(g('violationNote')?.value)}}
function clearViolationForm(){['violationStudent','violationType','violationLevel','violationStatus','violationAction','violationNote'].forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value=''});const d=document.getElementById('violationDate');if(d)d.value=today()}
async function saveViolationFromForm(e){
  if(e){e.preventDefault();e.stopImmediatePropagation()}
  if(syncing)return false;
  const d=getViolationFormData();if(!d.studentId){alert('Vui lòng chọn học sinh.');return false}if(!d.type){alert('Vui lòng chọn nội dung vi phạm.');return false}
  let result=null;
  try{if(typeof window.addViolation==='function'){result=window.addViolation({id:makeId('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()})}else{const list=dataArray('getViolationRecords','violationRecords','violations');list.push({id:makeId('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()})}}
  catch(err){console.error('[LH540 SAVE VIOLATION]',err);alert('Không thể lưu vi phạm: '+err.message);return false}
  if(result&&result.success===false){alert(result.message||'Không thể lưu vi phạm.');return false}
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();if(typeof window.saveClassData==='function')window.saveClassData();if(typeof window.renderViolations==='function')window.renderViolations();if(typeof window.renderDashboard==='function')window.renderDashboard();if(typeof window.updateBadges==='function')window.updateBadges()}catch(_){}
  const saved=await push(true);if(!saved.ok){alert('Đã lưu trên Web nhưng chưa gửi được Google Sheets.');return false}
  clearViolationForm();const modal=document.getElementById('violationModal');if(modal)modal.hidden=true;document.body.classList.remove('modal-open');try{if(typeof window.showToast==='function')window.showToast('Đã lưu vi phạm và đồng bộ Google Sheets.','success')}catch(_){}return true;
}
function installForms(){
  const vf=document.getElementById('violationForm');if(vf&&!vf.__LH540__){vf.__LH540__=true;vf.addEventListener('submit',saveViolationFromForm,true);const b=vf.querySelector('button[type="submit"]);if(b)b.addEventListener('click',saveViolationFromForm,true)}
  const rf=document.getElementById('rewardForm');if(rf&&!rf.__LH540__){rf.__LH540__=true;rf.addEventListener('submit',()=>setTimeout(()=>push(true),500),true)}
  const ab=document.getElementById('saveAttendance');if(ab&&!ab.__LH540__){ab.__LH540__=true;ab.addEventListener('click',()=>setTimeout(()=>push(true),700),true)}
}
function installFunctionWatches(){
  ['saveAttendanceRecord','addViolation','updateViolation','deleteViolation','addReward','updateReward','deleteReward'].forEach(name=>{try{const fn=window[name];if(typeof fn!=='function'||fn.__LH540__)return;const w=function(){const r=fn.apply(this,arguments);setTimeout(()=>push(true),300);return r};w.__LH540__=true;w.__LHOriginal=fn;window[name]=w}catch(_) {}})
}
async function detectChanges(){if(!bootstrapped||syncing)return;try{const key=snapshotKey(eventSnapshot());if(key!==lastLocalKey)await push(false)}catch(e){console.warn('[LH540 WATCH]',e.message)}}
async function boot(){await pull();installForms();installFunctionWatches();if(window.__LH540_INSTALL__)clearInterval(window.__LH540_INSTALL__);if(window.__LH540_WATCH__)clearInterval(window.__LH540_WATCH__);window.__LH540_INSTALL__=setInterval(()=>{installForms();installFunctionWatches()},400);window.__LH540_WATCH__=setInterval(detectChanges,1000)}
window.syncGoogleSheetEvents=()=>push(true);window.pushGoogleSheetEvents=()=>push(true);window.pullGoogleSheetEvents=pull;window.forceGoogleSheetEventSync=()=>push(true);window.getGoogleSheetEventSnapshot=eventSnapshot;window.saveViolationToGoogleSheets=saveViolationFromForm;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1000),{once:true});else setTimeout(boot,1000);
})();
