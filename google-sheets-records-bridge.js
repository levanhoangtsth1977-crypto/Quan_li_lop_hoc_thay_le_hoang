/* GOOGLE SHEETS RECORDS BRIDGE 3.1 — AUTHORITATIVE EVENT SYNC / VIOLATION SAVE */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_310__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_310__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
const present=r=>/^(present|có mặt|co mat)$/i.test(clean(r&&r.status));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const now=()=>new Date().toISOString();
const makeId=p=>(p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9));

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
    if(Array.isArray(window[name])&&window[name]!==window.APP_DATA?.[appKey]){
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

function snapshotKey(s){try{return JSON.stringify(s)}catch(_){return ''}}
let lastLocalKey='';
let syncing=false;
let bootstrapped=false;

function jsonp(action){
  return new Promise((resolve,reject)=>{
    const cb='LH310_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    let done=false;
    const tm=setTimeout(()=>finish(Error('Google Sheets timeout')),15000);
    function finish(e,d){
      if(done)return;
      done=true;clearTimeout(tm);
      try{delete window[cb]}catch(_){}
      s.remove();e?reject(e):resolve(d);
    }
    window[cb]=d=>finish(null,d);
    s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    s.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
    document.head.appendChild(s);
  });
}

function post(payload){
  return new Promise((resolve,reject)=>{
    const n='LH310_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const f=document.createElement('iframe');
    const form=document.createElement('form');
    f.name=n;f.style.display='none';form.method='POST';form.target=n;form.action=API;form.style.display='none';
    const i=document.createElement('input');i.type='hidden';i.name='payload';i.value=JSON.stringify(payload);form.appendChild(i);
    document.body.append(f,form);
    let done=false;
    const finish=ok=>{if(done)return;done=true;setTimeout(()=>{f.remove();form.remove()},1000);ok?resolve({ok:true}):reject(Error('Không gửi được dữ liệu Google Sheets'))};
    f.onload=()=>finish(true);try{form.submit()}catch(e){finish(false)}setTimeout(()=>finish(true),15000);
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
  const cleanSnapshot=eventSnapshot();lastLocalKey=snapshotKey(cleanSnapshot);bootstrapped=true;
  window.GOOGLE_SHEET_EVENT_DATA={version:'3.1',mode:'REPLACE',loadedAt:new Date().toISOString(),tabs:d,counts:{attendance:attendance.length,violations:violations.length,rewards:rewards.length}};
  window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));
  return true;
}

async function pull(){
  if(syncing)return null;
  try{syncing=true;const d=await jsonp('get_events');applyEvents(d);return d}
  catch(e){console.warn('[GOOGLE EVENTS PULL]',e.message);return null}
  finally{syncing=false}
}

async function push(force){
  if(syncing)return{ok:false,busy:true};
  try{
    const snapshot=eventSnapshot();const k=snapshotKey(snapshot);
    if(!force&&bootstrapped&&k===lastLocalKey)return{ok:true,changed:false};
    syncing=true;
    const result=await post({action:'sync_events',records:snapshot});
    lastLocalKey=k;bootstrapped=true;
    window.dispatchEvent(new CustomEvent('google-sheet-events-saved',{detail:{ok:true,counts:{attendance:snapshot.DIEM_DANH.length,violations:snapshot.VI_PHAM.length,rewards:snapshot.KHEN_THUONG.length}}}));
    return{ok:true,changed:true,result};
  }catch(e){console.warn('[GOOGLE EVENTS PUSH]',e.message);return{ok:false,error:e.message}}
  finally{syncing=false}
}

function getViolationFormData(){
  const get=id=>document.getElementById(id);
  return {
    studentId:clean(get('violationStudent')?.value),
    date:clean(get('violationDate')?.value)||today(),
    type:clean(get('violationType')?.value),
    level:clean(get('violationLevel')?.value)||'light',
    status:clean(get('violationStatus')?.value)||'monitoring',
    action:clean(get('violationAction')?.value),
    note:clean(get('violationNote')?.value)
  };
}

function clearViolationForm(){
  ['violationStudent','violationType','violationLevel','violationStatus','violationAction','violationNote'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    if(el.tagName==='SELECT')el.selectedIndex=0;else el.value='';
  });
  const d=document.getElementById('violationDate');if(d)d.value=today();
}

async function saveViolationFromForm(event){
  if(event){event.preventDefault();event.stopImmediatePropagation();}
  if(syncing){console.warn('[VIOLATION SAVE] đang đồng bộ');return false;}
  const d=getViolationFormData();
  if(!d.studentId){alert('Vui lòng chọn học sinh.');return false;}
  if(!d.type){alert('Vui lòng chọn nội dung vi phạm.');return false;}
  if(!d.date){alert('Vui lòng chọn ngày.');return false;}

  const record={id:makeId('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()};
  const list=sourceArray('violationRecords','violations');
  list.push(record);
  try{if(window.APP_DATA&&Array.isArray(window.APP_DATA.violations)&&window.APP_DATA.violations!==list)window.APP_DATA.violations.push(record)}catch(_){}
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.saveClassData==='function')window.saveClassData()}catch(_){}
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  try{if(typeof window.updateBadges==='function')window.updateBadges()}catch(_){}

  const snapshot=eventSnapshot();
  try{
    syncing=true;
    await post({action:'sync_events',records:snapshot});
    lastLocalKey=snapshotKey(snapshot);bootstrapped=true;
    window.dispatchEvent(new CustomEvent('google-sheet-events-saved',{detail:{ok:true,record:record,counts:{attendance:snapshot.DIEM_DANH.length,violations:snapshot.VI_PHAM.length,rewards:snapshot.KHEN_THUONG.length}}}));
    clearViolationForm();
    const modal=document.getElementById('violationModal');if(modal)modal.hidden=true;
    document.body.classList.remove('modal-open');
    try{if(typeof window.showToast==='function')window.showToast('Đã lưu vi phạm và đồng bộ Google Sheets.','success')}catch(_){}
    return true;
  }catch(e){
    list.splice(list.indexOf(record),1);
    try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
    try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
    try{if(typeof window.showToast==='function')window.showToast('Lưu vi phạm thất bại: '+e.message,'error')}catch(_){}
    console.error('[VIOLATION SAVE]',e);return false;
  }finally{syncing=false}
}

function installViolationSave(){
  const form=document.getElementById('violationForm');
  if(!form||form.__LH310_SAVE__)return;
  form.__LH310_SAVE__=true;
  form.addEventListener('submit',saveViolationFromForm,true);
  const button=form.querySelector('button[type="submit"]');
  if(button){button.type='button';button.addEventListener('click',saveViolationFromForm,true)}
}

function install(){
  ['saveAttendanceRecord','addViolation','deleteViolation','addReward','deleteReward'].forEach(n=>{
    try{
      if(typeof window[n]!=='function'||window[n].__lh310)return;
      const o=window[n];
      const w=function(){const r=o.apply(this,arguments);setTimeout(()=>push(false),300);return r};
      w.__lh310=true;w.__lhOriginal=o;window[n]=w;
    }catch(_){}
  });
  installViolationSave();
}

async function detectChanges(){
  if(!bootstrapped||syncing)return;
  try{const k=snapshotKey(eventSnapshot());if(k!==lastLocalKey)await push(false)}catch(e){console.warn('[GOOGLE EVENTS WATCH]',e.message)}
}

async function boot(){
  await pull();install();
  if(window.__LH310_INSTALL_TIMER__)clearInterval(window.__LH310_INSTALL_TIMER__);
  if(window.__LH310_WATCH_TIMER__)clearInterval(window.__LH310_WATCH_TIMER__);
  window.__LH310_INSTALL_TIMER__=setInterval(install,500);
  window.__LH310_WATCH_TIMER__=setInterval(detectChanges,1200);
}

window.syncGoogleSheetEvents=()=>push(true);
window.pushGoogleSheetEvents=()=>push(true);
window.pullGoogleSheetEvents=pull;
window.getGoogleSheetEventData=()=>window.GOOGLE_SHEET_EVENT_DATA||null;
window.getGoogleSheetEventSnapshot=eventSnapshot;
window.forceGoogleSheetEventSync=()=>push(true);
window.saveViolationToGoogleSheets=saveViolationFromForm;

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});
else setTimeout(boot,1200);
})();
