/* GOOGLE SHEETS RECORDS BRIDGE 9.0 — DIRECT EVENT WRITE + FORM-SAFE SAVE */
(function(){
'use strict';
if(window.__LH_GOOGLE_RECORDS_BRIDGE_900__)return;
window.__LH_GOOGLE_RECORDS_BRIDGE_900__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const clean=v=>String(v==null?'':v).trim().replace(/\s+/g,' ');
const now=()=>new Date().toISOString();
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const present=v=>/^(present|có mặt|co mat)$/i.test(clean(v));
const idOf=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);

function jsonp(action,params){
 return new Promise((resolve,reject)=>{
  const cb='LH900_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const sc=document.createElement('script');
  const q=Object.assign({action,callback:cb,_:Date.now()},params||{});
  let done=false;
  const finish=(e,d)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)};
  const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),20000);
  window[cb]=d=>finish(null,d);
  sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
  sc.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');
  document.head.appendChild(sc);
 });
}

function arr(name,getter,key){
 try{if(typeof window[getter]==='function'){const a=window[getter]();if(Array.isArray(a))return a}}catch(_){}
 try{if(Array.isArray(window[name]))return window[name]}catch(_){}
 try{if(window.APP_DATA&&Array.isArray(window.APP_DATA[key]))return window.APP_DATA[key]}catch(_){}
 return [];
}
function snapshot(){
 return {
  DIEM_DANH:arr('attendanceRecords','getAttendanceRecords','attendanceRecords').filter(r=>clean(r.studentId)&&!present(r.status)),
  VI_PHAM:arr('violationRecords','getViolationRecords','violations').filter(r=>clean(r.studentId)),
  KHEN_THUONG:arr('rewardRecords','getRewardRecords','rewards').filter(r=>clean(r.studentId))
 };
}

function setLocal(tab,record){
 const map={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'};
 const key=map[tab];
 try{
  if(Array.isArray(window[key])){
   const i=window[key].findIndex(x=>clean(x.id)===clean(record.id));
   if(i>=0)window[key][i]=record;else window[key].push(record);
  }
 }catch(_){}
 try{
  if(window.APP_DATA&&Array.isArray(window.APP_DATA[key])){
   const a=window.APP_DATA[key],i=a.findIndex(x=>clean(x.id)===clean(record.id));
   if(i>=0)a[i]=record;else a.push(record);
  }
 }catch(_){}
 try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
}

function getStudentId(value){
 const v=clean(value);
 if(!v)return '';
 const students=(Array.isArray(window.students)?window.students:[]);
 const exact=students.find(s=>clean(s.id)===v);
 if(exact)return exact.id;
 const byName=students.find(s=>clean(s.name)===v);
 return byName?clean(byName.id):v;
}

function findControl(form,candidates){
 for(const id of candidates){const e=document.getElementById(id);if(e)return e}
 for(const name of candidates){const e=form&&form.querySelector('[name="'+name+'"]');if(e)return e}
 return null;
}
function val(form,candidates){const e=findControl(form,candidates);return clean(e&&e.value)}
function findViolationForm(){
 const direct=document.getElementById('violationForm');
 if(direct)return direct;
 return Array.from(document.querySelectorAll('form')).find(f=>/ghi nhận vi phạm|biện pháp giáo dục|ghi chú sự việc/i.test(f.textContent||''))||null;
}
function formData(form){
 const student=getStudentId(val(form,['violationStudent','studentId','student','hocSinh']));
 return {
  studentId:student,
  date:val(form,['violationDate','date','ngay'])||today(),
  type:val(form,['violationType','type','content','noiDung']),
  level:val(form,['violationLevel','level','mucDo'])||'light',
  status:val(form,['violationStatus','status','trangThai'])||'monitoring',
  action:val(form,['violationAction','action','bienPhap']),
  note:val(form,['violationNote','note','ghiChu'])
 };
}

async function saveDirect(tab,record){
 const r=await jsonp('save_event',{sheet:tab,record:JSON.stringify(record)});
 if(!r||r.ok!==true||r.stored===false)throw Error((r&&r.error)||('Google Sheets từ chối '+tab));
 const verify=await jsonp('get_events');
 if(!verify||verify.ok!==true)throw Error('Không xác minh được Google Sheets');
 const list=verify[tab]||[];
 if(!list.some(x=>clean(x.id)===clean(record.id)))throw Error('Google Sheets chưa ghi bản ghi '+record.id);
 return r;
}

async function saveViolation(event){
 if(event){event.preventDefault();event.stopImmediatePropagation();event.stopPropagation()}
 const form=findViolationForm();
 if(!form){alert('Không tìm thấy biểu mẫu Ghi nhận vi phạm.');return false}
 const d=formData(form);
 if(!d.studentId){alert('Vui lòng chọn học sinh.');return false}
 if(!d.type){alert('Vui lòng chọn nội dung vi phạm.');return false}
 const record={id:idOf('VIO'),studentId:d.studentId,date:d.date,type:d.type,level:d.level,status:d.status,action:d.action,note:d.note,createdAt:now(),updatedAt:now()};
 const button=Array.from(form.querySelectorAll('button')).find(b=>/lưu ghi nhận/i.test(b.textContent||''));
 if(button){button.disabled=true;button.dataset.saving='1'}
 try{
  await saveDirect('VI_PHAM',record);
  setLocal('VI_PHAM',record);
  try{if(typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(typeof window.renderDashboard==='function')window.renderDashboard()}catch(_){}
  try{if(typeof window.showToast==='function')window.showToast('Đã lưu vi phạm vào Google Sheets.','success')}catch(_){}
  form.reset();
  const date=findControl(form,['violationDate','date','ngay']);if(date)date.value=today();
  const modal=form.closest('.modal')||document.getElementById('violationModal');if(modal)modal.hidden=true;
  document.body.classList.remove('modal-open');
  return true;
 }catch(e){
  console.error('[LH900 VI_PHAM]',e);
  alert('LƯU THẤT BẠI: '+e.message);
  return false;
 }finally{if(button){button.disabled=false;delete button.dataset.saving}}
}

async function push(){
 const s=snapshot();let saved=0;
 try{
  for(const tab of ['DIEM_DANH','VI_PHAM','KHEN_THUONG'])for(const r of s[tab]){await saveDirect(tab,r);saved++}
  const detail={ok:true,verified:true,saved};
  window.dispatchEvent(new CustomEvent('google-sheet-events-saved',{detail}));
  return detail;
 }catch(e){
  const detail={ok:false,error:e.message,saved};
  window.dispatchEvent(new CustomEvent('google-sheet-events-save-error',{detail}));
  console.error('[LH900 PUSH]',e);return detail;
 }
}

async function pull(){
 try{
  const r=await jsonp('get_events');if(!r||r.ok!==true)throw Error(r&&r.error||'Google Sheets không trả dữ liệu');
  const a=(r.DIEM_DANH||[]).filter(x=>!present(x.status)),v=r.VI_PHAM||[],k=r.KHEN_THUONG||[];
  try{if(Array.isArray(window.attendanceRecords))window.attendanceRecords.splice(0,window.attendanceRecords.length,...a)}catch(_){}
  try{if(Array.isArray(window.violationRecords))window.violationRecords.splice(0,window.violationRecords.length,...v)}catch(_){}
  try{if(Array.isArray(window.rewardRecords))window.rewardRecords.splice(0,window.rewardRecords.length,...k)}catch(_){}
  try{window.APP_DATA&&(window.APP_DATA.attendanceRecords=a,window.APP_DATA.violationRecords=v,window.APP_DATA.rewardRecords=k,window.APP_DATA.attendance=a,window.APP_DATA.violations=v,window.APP_DATA.rewards=k)}catch(_){}
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
  ['renderAttendance','renderViolations','renderRewards','renderDashboard'].forEach(f=>{try{if(typeof window[f]==='function')window[f]()}catch(_){} });
  window.GOOGLE_SHEET_EVENT_DATA={ok:true,loadedAt:now(),tabs:r,counts:{attendance:a.length,violations:v.length,rewards:k.length}};
  window.dispatchEvent(new CustomEvent('google-sheet-events-ready',{detail:window.GOOGLE_SHEET_EVENT_DATA}));
  return r;
 }catch(e){console.error('[LH900 PULL]',e);return null}
}

function install(){
 const f=findViolationForm();
 if(f&&!f.__LH900__){f.__LH900__=true;f.addEventListener('submit',saveViolation,true)}
 const saveButtons=Array.from(document.querySelectorAll('button')).filter(b=>/lưu ghi nhận/i.test(b.textContent||''));
 saveButtons.forEach(b=>{if(!b.__LH900__){b.__LH900__=true;b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();saveViolation(e)},true)}});
 const a=document.getElementById('saveAttendance');if(a&&!a.__LH900__){a.__LH900__=true;a.addEventListener('click',()=>setTimeout(push,1000),true)}
}

window.syncGoogleSheetEvents=push;
window.pushGoogleSheetEvents=push;
window.forceGoogleSheetEventSync=push;
window.pullGoogleSheetEvents=pull;
window.getGoogleSheetEventSnapshot=snapshot;
window.saveViolationToGoogleSheets=saveViolation;

async function boot(){await pull();install();if(window.__LH900_TIMER__)clearInterval(window.__LH900_TIMER__);window.__LH900_TIMER__=setInterval(install,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});else setTimeout(boot,1200);
})();
