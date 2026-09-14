/* MASTER CRUD UI — SINGLE SOURCE OF TRUTH
 * All business-record SAVE/UPDATE/DELETE calls go through the active Master Apps Script API.
 * Supported save sheets: DIEM_DANH, VI_PHAM, KHEN_THUONG, HOC_TAP, TIEN_BO, NHAN_XET.
 * DELETE uses deleteRecord for every business sheet. HOC_SINH deletion stays local because Master explicitly forbids it.
 */
(function(){
'use strict';
if(window.__LH_MASTER_CRUD_UI__)return;
window.__LH_MASTER_CRUD_UI__=true;

const API=()=>window.GOOGLE_API_CONFIG?.url||'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_){console.log(m)}};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const makeId=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;

function jsonp(action,params={},timeout=15000){
  return new Promise((resolve,reject)=>{
    const cb='LHMASTER_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const sc=document.createElement('script');let done=false;
    const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),timeout);
    window[cb]=data=>finish(null,data);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});
    sc.src=API()+'?'+q.toString();document.head.appendChild(sc);
  });
}

/* Apps Script is cross-origin. Use a form-encoded no-cors POST for transport;
 * authoritative confirmation is done by the Master GET API below. */
function post(action,payload){
  const body=new URLSearchParams();body.set('action',action);Object.entries(payload||{}).forEach(([k,v])=>body.set(k,S(v)));
  return fetch(API(),{method:'POST',mode:'no-cors',body,cache:'no-store',keepalive:true}).then(()=>true).catch(e=>{throw Error('Không gửi được yêu cầu tới Google Apps Script: '+S(e?.message||e))});
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

const ARR={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords',HOC_TAP:'learningRecords',TIEN_BO:'progressRecords',NHAN_XET:'commentRecords'};
const GET={DIEM_DANH:'getAttendance',VI_PHAM:'getViolations',KHEN_THUONG:'getRewards',HOC_TAP:'getLearning',TIEN_BO:'getProgress',NHAN_XET:'getComments'};
const SAVE={DIEM_DANH:'saveAttendance',VI_PHAM:'saveViolation',KHEN_THUONG:'saveReward',HOC_TAP:'saveLearning',TIEN_BO:'saveProgress',NHAN_XET:'saveComment'};
function localArr(sheet){const n=ARR[sheet];return n&&Array.isArray(window[n])?window[n]:[]}
function localUpsert(sheet,r){const a=localArr(sheet),id=S(r?.id);if(!id)return;const i=a.findIndex(x=>S(x?.id)===id);if(i<0)a.push(r);else a[i]=r;try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){}
}
function localRemove(sheet,id){const a=localArr(sheet);for(let i=a.length-1;i>=0;i--)if(S(a[i]?.id)===S(id))a.splice(i,1);try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){}
}
function render(sheet){try{if(sheet==='VI_PHAM')window.renderViolations?.();if(sheet==='KHEN_THUONG')window.renderRewards?.();if(sheet==='DIEM_DANH')window.renderAttendance?.();if(sheet==='HOC_TAP')window.renderLearning?.();if(sheet==='TIEN_BO')window.renderProgress?.();if(sheet==='NHAN_XET')window.renderComments?.();window.renderDashboard?.();window.updateBadges?.();window.refreshAll?.()}catch(_){}
}
async function fetchRecords(sheet,studentId){const r=await jsonp(GET[sheet],studentId?{studentId:S(studentId)}:{});if(!r?.ok)throw Error(r?.error||'Google Apps Script trả lỗi khi đọc dữ liệu');return Array.isArray(r.records)?r.records:[]}
function nearMatch(record,row){
  if(S(row?.studentId)!==S(record?.studentId))return false;
  if(S(row?.date)!==S(record?.date))return false;
  if(S(row?.type)!==S(record?.type))return false;
  if(S(record?.note)!==S(row?.note))return false;
  if(S(record?.level)&&S(record?.level)!==S(row?.level))return false;
  if(S(record?.status)&&S(record?.status)!==S(row?.status))return false;
  if(S(record?.action)&&S(record?.action)!==S(row?.action))return false;
  if(S(record?.formType)&&S(record?.formType)!==S(row?.formType))return false;
  const created=S(row?.createdAt);const sent=S(record?.createdAt);if(created&&sent){const a=Date.parse(created),b=Date.parse(sent);if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)>120000)return false}
  return true;
}
async function findSavedRecord(sheet,record,tries=5){
  for(let i=0;i<tries;i++){
    const rows=await fetchRecords(sheet,record.studentId);
    const exact=rows.find(x=>S(x?.id)===S(record.id));
    if(exact)return exact;
    const candidates=rows.filter(x=>nearMatch(record,x));
    if(candidates.length===1)return candidates[0];
    if(i<tries-1)await sleep(1000);
  }
  throw Error('Google chưa xác minh được bản ghi vừa lưu.');
}
async function saveMaster(sheet,record){const action=SAVE[sheet];if(!action)throw Error('Master chưa khai báo action lưu cho '+sheet);await post(action,record);return findSavedRecord(sheet,record)}
async function deleteMaster(sheet,id){const wanted=S(id);if(!wanted)throw Error('Thiếu recordId');await post('deleteRecord',{sheet,id:wanted,recordId:wanted});for(let i=0;i<5;i++){const rows=await fetchRecords(sheet,'');if(!rows.some(x=>S(x?.id)===wanted))return true;if(i<4)await sleep(1000)}throw Error('Google Sheets vẫn còn recordId '+wanted)}
function wrapSave(name,sheet,builder){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterWrapped)return true;const fn=function(...args){let record;try{record=builder(...args)}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error');return{success:false,message:S(e?.message||e)}}if(!record||!S(record.studentId))return old.apply(this,args);record={...record,id:S(record.id)||makeId(sheet==='VI_PHAM'?'VIO':sheet==='KHEN_THUONG'?'REW':sheet==='DIEM_DANH'?'ATT':sheet==='HOC_TAP'?'LRN':sheet==='TIEN_BO'?'PRO':'COM'),createdAt:S(record.createdAt)||new Date().toISOString(),updatedAt:new Date().toISOString()};localUpsert(sheet,record);render(sheet);saveMaster(sheet,record).then(remote=>{localRemove(sheet,record.id);localUpsert(sheet,remote);render(sheet)}).catch(e=>{localRemove(sheet,record.id);render(sheet);toast('Google Sheets không lưu được: '+S(e?.message||e),'error')});return{success:true,record}};fn.__lhMasterWrapped=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
function wrapDelete(name,sheet){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterWrapped)return true;const fn=function(id,...args){const wanted=S(id);if(!wanted)return old.apply(this,[id,...args]);const a=localArr(sheet),backup=a.filter(x=>S(x?.id)===wanted).map(x=>({...x}));localRemove(sheet,wanted);render(sheet);deleteMaster(sheet,wanted).then(()=>toast('Đã xóa bản ghi.','success')).catch(e=>{backup.forEach(x=>localUpsert(sheet,x));render(sheet);toast('Xóa thất bại: '+S(e?.message||e),'error')});return true};fn.__lhMasterWrapped=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
wrapSave('saveAttendanceRecord','DIEM_DANH',(studentId,date,status,note='')=>({studentId,date:date||today(),status,note}));
wrapSave('addViolation','VI_PHAM',d=>({...d}));
wrapSave('updateViolation','VI_PHAM',(id,c={})=>{const o=(window.violationRecords||[]).find(x=>S(x?.id)===S(id));return{...o,...c,id:S(id)}});
wrapSave('addReward','KHEN_THUONG',d=>({...d}));
wrapSave('updateReward','KHEN_THUONG',(id,c={})=>{const o=(window.rewardRecords||[]).find(x=>S(x?.id)===S(id));return{...o,...c,id:S(id)}});
wrapSave('addLearningRecord','HOC_TAP',d=>({...d}));
wrapSave('addProgressRecord','TIEN_BO',d=>({...d}));
wrapSave('addComment','NHAN_XET',d=>({...d}));
wrapDelete('deleteViolation','VI_PHAM');
wrapDelete('deleteReward','KHEN_THUONG');

function readModal(modal,isV){const value=sel=>modal.querySelector(sel)?.value??'';const ids=[...modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>S(x.value)).filter(Boolean);const fallback=S(value('#eStudent')||value('#violationStudent')||value('#rewardStudent'));const students=ids.length?ids:(fallback?[fallback]:[]);const type=S(value('#eType')||value(isV?'#violationType':'#rewardType'));const date=S(value('#eDate')||value(isV?'#violationDate':'#rewardDate'))||today();const note=S(value('#eNote')||value(isV?'#violationNote':'#rewardNote'));if(!students.length)throw Error('Vui lòng chọn ít nhất một học sinh.');if(!type)throw Error('Vui lòng chọn nội dung.');return{students,type,date,note}}
async function saveModal(modal,b,isV){if(modal.dataset.lhMasterSaving==='1')return;modal.dataset.lhMasterSaving='1';b.disabled=true;const old=b.innerHTML;b.innerHTML='Đang lưu...';try{const v=readModal(modal,isV),sheet=isV?'VI_PHAM':'KHEN_THUONG';let ok=0;for(const studentId of v.students){const r={id:makeId(isV?'VIO':'REW'),studentId,studentName:(window.students||[]).find(s=>S(s.id)===studentId)?.name||'',date:v.date,type:v.type,note:v.note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(isV){r.level=S(modal.querySelector('#eLevel,#violationLevel')?.value)||'light';r.status=S(modal.querySelector('#eStatus,#violationStatus')?.value)||'monitoring';r.action=S(modal.querySelector('#eAction,#violationAction')?.value)}else r.formType=S(modal.querySelector('#eForm,#rewardFormType')?.value)||'praise';const remote=await saveMaster(sheet,r);localUpsert(sheet,remote);ok++}render(sheet);modal.remove();toast(`Đã lưu ${ok} học sinh vào Google Sheets.`,'success')}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}finally{modal.dataset.lhMasterSaving='';b.disabled=false;b.innerHTML=old}}
function clickCapture(e){const t=e.target instanceof Element?e.target:null;if(!t)return;const modal=t.closest?.('.ev-static-modal');if(modal){const b=t.closest('#eSave');if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,b,!!modal.querySelector('#eLevel'));return}}const form=t.closest?.('#violationForm,#rewardForm');if(form){const b=t.closest('button');if(b&&(/\blưu\b/i.test(S(b.textContent))||b.type==='submit')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(form,b,form.id==='violationForm')}}}
window.addEventListener('click',clickCapture,true);window.addEventListener('submit',clickCapture,true);
window.LH_MASTER_CRUD={saveMaster,deleteMaster,render};
})();
