/* GOOGLE SHEETS RECORDS BRIDGE 7.0 — DIRECT DATA ENGINE + VERIFIED WRITE */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_700__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_700__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const clean=v=>String(v==null?'':v).trim().replace(/\s+/g,' ');
const now=()=>new Date().toISOString();
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const idOf=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
const present=r=>/^(present|có mặt|co mat)$/i.test(clean(r&&r.status));

/*
 * QUAN TRỌNG:
 * data.js khai báo attendanceRecords / violationRecords / rewardRecords
 * bằng global LET. Các biến này KHÔNG nằm trên window.
 * Bridge cũ chỉ đọc window.APP_DATA/window getter nên có thể nhận [] dù Web
 * đang có dữ liệu. Bridge 7 đọc trực tiếp global lexical arrays.
 */
function directArray(name,appKey,getter){
  try{
    if(typeof window[getter]==='function'){
      const a=window[getter]();
      if(Array.isArray(a))return a;
    }
  }catch(e){}
  try{
    if(name==='attendance' && typeof attendanceRecords!=='undefined' && Array.isArray(attendanceRecords))return attendanceRecords;
    if(name==='violations' && typeof violationRecords!=='undefined' && Array.isArray(violationRecords))return violationRecords;
    if(name==='rewards' && typeof rewardRecords!=='undefined' && Array.isArray(rewardRecords))return rewardRecords;
  }catch(e){}
  try{
    if(window.APP_DATA && Array.isArray(window.APP_DATA[appKey]))return window.APP_DATA[appKey];
  }catch(e){}
  return [];
}
function snapshot(){
  return {
    DIEM_DANH:directArray('attendance','attendance','getAttendanceRecords').filter(r=>clean(r.studentId)&&!present(r)),
    VI_PHAM:directArray('violations','violations','getViolationRecords').filter(r=>clean(r.studentId)),
    KHEN_THUONG:directArray('rewards','rewards','getRewardRecords').filter(r=>clean(r.studentId))
  };
}
function jsonp(action){return new Promise((resolve,reject)=>{
  const cb='LH700_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const sc=document.createElement('script');let done=false;
  const timer=setTimeout(()=>finish(Error('Google Apps Script timeout')),20000);
  function finish(e,d){if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)}
  window[cb]=d=>finish(null,d);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
  sc.src=API+'?action='+encodeURIComponent(action)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();
  document.head.appendChild(sc);
})}
function postForm(payload){return new Promise((resolve,reject)=>{
  const iframe=document.createElement('iframe'),form=document.createElement('form'),input=document.createElement('input');
  const target='LH700_POST_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  iframe.name=target;iframe.style.display='none';iframe.setAttribute('aria-hidden','true');
  form.method='POST';form.target=target;form.action=API;form.style.display='none';
  input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);form.appendChild(input);
  document.body.appendChild(iframe);document.body.appendChild(form);
  let settled=false;
  const finish=(ok,err)=>{if(settled)return;settled=true;setTimeout(()=>{try{iframe.remove()}catch(_){}try{form.remove()}catch(_){}},1500);ok?resolve(true):reject(err||Error('POST thất bại'))};
  try{form.submit();setTimeout(()=>finish(true),1200)}catch(e){finish(false,e)}
})}
function replaceLocal(data){
  const a=(data.DIEM_DANH||[]).filter(r=>clean(r.studentId)&&!present(r));
  const v=(data.VI_PHAM||[]).filter(r=>clean(r.studentId));
  const k=(data.KHEN_THUONG||[]).filter(r=>clean(r.studentId));
  try{if(typeof attendanceRecords!=='undefined'){attendanceRecords.splice(0,attendanceRecords.length,...a)}}catch(_){}
  try{if(typeof violationRecords!=='undefined'){violationRecords.splice(0,violationRecords.length,...v)}}catch(_){}
  try{if(typeof rewardRecords!=='undefined'){rewardRecords.splice(0,rewardRecords.length,...k)}}catch(_){}
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  try{if(typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  return{attendance:a,violations:v,rewards:k};
}
async function pull(){
  try{const r=await jsonp('get_events');if(!r||r.ok!==true)throw Error(r&&r.error||'Google Sheets không trả dữ liệu');const e=replaceLocal(r);window.GOOGLE_SHEET_EVENT_DATA={ok:true,version:'7.0',loadedAt:now(),tabs:r,counts:{attendance:e.attendance.length,violations:e.violations.length,rewards:e.rewards.length}};window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));return r}catch(e){console.error('[LH700 PULL]',e);return null}
}
function equalCounts(a,b){return a.DIEM_DANH.length===b.DIEM_DANH.length&&a.VI_PHAM.length===b.VI_PHAM.length&&a.KHEN_THUONG.length===b.KHEN_THUONG.length}
let busy=false;
async function push(force){
  if(busy)return{ok:false,busy:true};
  const records=snapshot();
  try{
    busy=true;
    await postForm({action:'sync_events',records:records});
    await new Promise(r=>setTimeout(r,1200));
    const verified=await jsonp('get_events');
    if(!verified||verified.ok!==true)throw Error('Không xác minh được dữ liệu trên Google Sheets');
    const server={DIEM_DANH:(verified.DIEM_DANH||[]).filter(r=>clean(r.studentId)&&!present(r)),VI_PHAM:(verified.VI_PHAM||[]).filter(r=>clean(r.studentId)),KHEN_THUONG:(verified.KHEN_THUONG||[]).filter(r=>clean(r.studentId))};
    if(!equalCounts(records,server)){
      throw Error('Google Sheets chưa khớp: Web '+records.DIEM_DANH.length+'/'+records.VI_PHAM.length+'/'+records.KHEN_THUONG.length+' | Sheets '+server.DIEM_DANH.length+'/'+server.VI_PHAM.length+'/'+server.KHEN_THUONG.length);
    }
    window.dispatchEvent(new CustomEvent('google-sheet-events-saved',{detail:{ok:true,verified:true,counts:{attendance:server.DIEM_DANH.length,violations:server.VI_PHAM.length,rewards:server.KHEN_THUONG.length}}}));
    return{ok:true,verified:true,counts:{attendance:server.DIEM_DANH.length,violations:server.VI_PHAM.length,rewards:server.KHEN_THUONG.length}};
  }catch(e){console.error('[LH700 PUSH]',e);return{ok:false,error:e.message}}
  finally{busy=false}
}
function formData(){const g=id=>document.getElementById(id);return{studentId:clean(g('violationStudent')?.value),date:clean(g('violationDate')?.value)||today(),type:clean(g('violationType')?.value),level:clean(g('violationLevel')?.value)||'light',status:clean(g('violationStatus')?.value)||'monitoring',action:clean(g('violationAction')?.value),note:clean(g('violationNote')?.value)}}
function clearForm(){['violationStudent','violationType','violationLevel','violationStatus','violationAction','violationNote'].forEach(id=>{const e=document.getElementById(id);if(!e)return;if(e.tagName==='SELECT')e.selectedIndex=0;else e.value=''});const d=document.getElementById('violationDate');if(d)d.value=today()}
async function saveViolation(event){
  if(event){event.preventDefault();event.stopImmediatePropagation()}
  const d=formData();if(!d.studentId){alert('Vui lòng chọn học sinh.');return false}if(!d.type){alert('Vui lòng chọn nội dung vi phạm.');return false}
  const record={id:idOf('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()};
  try{
    let done=false;
    if(typeof window.addViolation==='function'){const r=window.addViolation(record);if(r&&r.success===false)throw Error(r.message||'Data Engine từ chối lưu');done=true}
    if(!done){try{if(typeof violationRecords!=='undefined'){violationRecords.push(record);done=true}}catch(_){} }
    if(!done)throw Error('Không tìm thấy violationRecords/addViolation');
    try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
    try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
    const saved=await push(true);if(!saved.ok)throw Error(saved.error||'Google Sheets chưa nhận');
    clearForm();const modal=document.getElementById('violationModal');if(modal)modal.hidden=true;document.body.classList.remove('modal-open');
    if(typeof window.showToast==='function')window.showToast('Đã lưu vi phạm và xác minh Google Sheets.','success');
    return true;
  }catch(e){alert('LƯU THẤT BẠI: '+e.message);return false}
}
function install(){
  const f=document.getElementById('violationForm');if(f&&!f.__LH700__){f.__LH700__=true;f.addEventListener('submit',saveViolation,true)}
  const a=document.getElementById('saveAttendance');if(a&&!a.__LH700__){a.__LH700__=true;a.addEventListener('click',()=>setTimeout(()=>push(true),400),true)}
  const r=document.getElementById('rewardForm');if(r&&!r.__LH700__){r.__LH700__=true;r.addEventListener('submit',()=>setTimeout(()=>push(true),400),true)}
}
function watchFunctions(){['saveAttendanceRecord','addViolation','updateViolation','deleteViolation','addReward','updateReward','deleteReward'].forEach(name=>{try{const fn=window[name];if(typeof fn!=='function'||fn.__LH700__)return;const w=function(){const r=fn.apply(this,arguments);setTimeout(()=>push(true),350);return r};w.__LH700__=true;window[name]=w}catch(_){} })}
window.syncGoogleSheetEvents=()=>push(true);window.pushGoogleSheetEvents=()=>push(true);window.forceGoogleSheetEventSync=()=>push(true);window.pullGoogleSheetEvents=pull;window.getGoogleSheetEventSnapshot=snapshot;window.saveViolationToGoogleSheets=saveViolation;
async function boot(){await pull();install();watchFunctions();if(window.__LH700_TIMER__)clearInterval(window.__LH700_TIMER__);window.__LH700_TIMER__=setInterval(()=>{install();watchFunctions()},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});else setTimeout(boot,1200);
})();
