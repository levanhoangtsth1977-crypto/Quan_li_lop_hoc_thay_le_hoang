/* MASTER CRUD UI — SINGLE SOURCE OF TRUTH v4
 * Dual transport:
 * - Vercel: same-origin /api/google proxy.
 * - GitHub Pages/static: direct Apps Script GET via JSONP + POST via hidden form iframe.
 * All business SAVE/UPDATE/DELETE calls use one transport and verify against Master.
 * HOC_SINH deletion remains local because Master forbids it.
 */
(function(){
'use strict';
if(window.__LH_MASTER_CRUD_UI__)return;
window.__LH_MASTER_CRUD_UI__=true;

const DIRECT_API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const apiBase=()=>String(window.GOOGLE_API_CONFIG?.url||DIRECT_API).trim();
const useProxy=()=>/^([a-z0-9-]+\.)*vercel\.app$/i.test(location.hostname)||/\.vercel\.app$/i.test(location.hostname);
const S=v=>String(v??'').trim();
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_){console.log(m)}};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const makeId=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

async function getJSONProxy(action,params={}){
  const q=new URLSearchParams({action,_:String(Date.now())});
  Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)q.set(k,S(v))});
  const r=await fetch('/api/google?'+q.toString(),{method:'GET',cache:'no-store',credentials:'same-origin'});
  const text=await r.text();let data;
  try{data=JSON.parse(text)}catch(_){throw Error('Google API trả phản hồi không hợp lệ.')}
  if(!r.ok||!data?.ok)throw Error(S(data?.error)||`Google API HTTP ${r.status}`);
  return data;
}

function jsonp(action,params={}){
  return new Promise((resolve,reject)=>{
    const cb='__lhMasterJsonp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)q.set(k,S(v))});
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{try{delete window[cb]}catch(_){};script.remove()};
    const fail=(msg)=>{if(done)return;done=true;cleanup();reject(Error(msg||'Google API không phản hồi.'))};
    const timer=setTimeout(()=>fail('Google API không phản hồi sau 15 giây.'),15000);
    window[cb]=(data)=>{if(done)return;done=true;clearTimeout(timer);cleanup();if(!data||data.ok===false)reject(Error(S(data?.error)||'Google API trả phản hồi không hợp lệ.'));else resolve(data)};
    script.onerror=()=>{clearTimeout(timer);fail('Không kết nối được Google Apps Script.')};
    script.src=apiBase()+'?'+q.toString();
    document.head.appendChild(script);
  });
}

async function getJSON(action,params={}){
  if(useProxy())return getJSONProxy(action,params);
  return jsonp(action,params);
}

async function postProxy(action,payload={}){
  const body=new URLSearchParams();body.set('action',action);
  Object.entries(payload||{}).forEach(([k,v])=>{if(v===undefined||v===null)return;body.set(k,typeof v==='object'?JSON.stringify(v):S(v))});
  const r=await fetch('/api/google',{method:'POST',body,cache:'no-store',credentials:'same-origin',headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'}});
  const text=await r.text();let data;
  try{data=JSON.parse(text)}catch(_){throw Error('Google API trả phản hồi không hợp lệ.')}
  if(!r.ok||!data?.ok)throw Error(S(data?.error)||`Google API HTTP ${r.status}`);
  return data;
}

function postDirect(action,payload={}){
  return new Promise((resolve,reject)=>{
    const token='lh_post_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
    const iframe=document.createElement('iframe');iframe.name=token;iframe.style.display='none';iframe.setAttribute('aria-hidden','true');
    const form=document.createElement('form');form.method='POST';form.action=apiBase();form.target=token;form.style.display='none';
    const add=(name,value)=>{const i=document.createElement('input');i.type='hidden';i.name=name;i.value=String(value??'');form.appendChild(i)};
    add('action',action);
    Object.entries(payload||{}).forEach(([k,v])=>{if(v===undefined||v===null)return;add(k,typeof v==='object'?JSON.stringify(v):S(v))});
    document.body.appendChild(iframe);document.body.appendChild(form);
    let settled=false;
    const finish=(err)=>{if(settled)return;settled=true;clearTimeout(timer);setTimeout(()=>{try{form.remove();iframe.remove()}catch(_){ }},100);if(err)reject(err);else resolve({ok:true,transport:'direct-form'})};
    const timer=setTimeout(()=>finish(),8000);
    try{form.submit()}catch(e){finish(Error('Không gửi được yêu cầu tới Google Apps Script.'))}
  });
}

async function post(action,payload={}){
  if(useProxy())return postProxy(action,payload);
  return postDirect(action,payload);
}

const ARR={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords',HOC_TAP:'learningRecords',TIEN_BO:'progressRecords',NHAN_XET:'commentRecords'};
const GET={DIEM_DANH:'getAttendance',VI_PHAM:'getViolations',KHEN_THUONG:'getRewards',HOC_TAP:'getLearning',TIEN_BO:'getProgress',NHAN_XET:'getComments'};
const SAVE={DIEM_DANH:'saveAttendance',VI_PHAM:'saveViolation',KHEN_THUONG:'saveReward',HOC_TAP:'saveLearning',TIEN_BO:'saveProgress',NHAN_XET:'saveComment'};
function localArr(sheet){const n=ARR[sheet];return n&&Array.isArray(window[n])?window[n]:[]}
function localUpsert(sheet,r){const a=localArr(sheet),id=S(r?.id);if(!id)return;const i=a.findIndex(x=>S(x?.id)===id);if(i<0)a.push(r);else a[i]=r;try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){} }
function localRemove(sheet,id){const a=localArr(sheet);for(let i=a.length-1;i>=0;i--)if(S(a[i]?.id)===S(id))a.splice(i,1);try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){} }
function render(sheet){try{if(sheet==='VI_PHAM')window.renderViolations?.();if(sheet==='KHEN_THUONG')window.renderRewards?.();if(sheet==='DIEM_DANH')window.renderAttendance?.();if(sheet==='HOC_TAP')window.renderLearning?.();if(sheet==='TIEN_BO')window.renderProgress?.();if(sheet==='NHAN_XET')window.renderComments?.();window.renderDashboard?.();window.updateBadges?.();window.refreshAll?.()}catch(_){} }
async function fetchRecords(sheet,studentId){const r=await getJSON(GET[sheet],studentId?{studentId:S(studentId)}:{});return Array.isArray(r.records)?r.records:[]}
function nearMatch(record,row){
  if(S(row?.studentId)!==S(record?.studentId))return false;if(S(row?.date)!==S(record?.date))return false;if(S(row?.type)!==S(record?.type))return false;if(S(record?.note)!==S(row?.note))return false;
  if(S(record?.level)&&S(record?.level)!==S(row?.level))return false;if(S(record?.status)&&S(record?.status)!==S(row?.status))return false;if(S(record?.action)&&S(record?.action)!==S(row?.action))return false;if(S(record?.formType)&&S(record?.formType)!==S(row?.formType))return false;
  const created=S(row?.createdAt),sent=S(record?.createdAt);if(created&&sent){const a=Date.parse(created),b=Date.parse(sent);if(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)>120000)return false}return true;
}
async function findSavedRecord(sheet,record,tries=8){for(let i=0;i<tries;i++){const rows=await fetchRecords(sheet,record.studentId);const exact=rows.find(x=>S(x?.id)===S(record.id));if(exact)return exact;const candidates=rows.filter(x=>nearMatch(record,x));if(candidates.length===1)return candidates[0];if(i<tries-1)await sleep(1000)}throw Error('Google chưa xác minh được bản ghi vừa lưu.')}
async function saveMaster(sheet,record){const action=SAVE[sheet];if(!action)throw Error('Master chưa khai báo action lưu cho '+sheet);await post(action,record);return findSavedRecord(sheet,record)}
async function deleteMaster(sheet,id){const wanted=S(id);if(!wanted)throw Error('Thiếu recordId');await post('deleteRecord',{sheet,id:wanted,recordId:wanted});for(let i=0;i<8;i++){const rows=await fetchRecords(sheet,'');if(!rows.some(x=>S(x?.id)===wanted))return true;if(i<7)await sleep(1000)}throw Error('Google Sheets vẫn còn recordId '+wanted)}
function wrapSave(name,sheet,builder){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterWrapped)return true;const fn=function(...args){let record;try{record=builder(...args)}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error');return{success:false,message:S(e?.message||e)}}if(!record||!S(record.studentId))return old.apply(this,args);record={...record,id:S(record.id)||makeId(sheet==='VI_PHAM'?'VIO':sheet==='KHEN_THUONG'?'REW':sheet==='DIEM_DANH'?'ATT':sheet==='HOC_TAP'?'LRN':sheet==='TIEN_BO'?'PRO':'COM'),createdAt:S(record.createdAt)||new Date().toISOString(),updatedAt:new Date().toISOString()};return saveMaster(sheet,record).then(remote=>{localUpsert(sheet,remote);render(sheet);toast('Đã lưu vào Google Sheets.','success');return{success:true,record:remote}}).catch(e=>{toast('Google Sheets không lưu được: '+S(e?.message||e),'error');return{success:false,message:S(e?.message||e)}})};fn.__lhMasterWrapped=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
function wrapDelete(name,sheet){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterWrapped)return true;const fn=async function(id,...args){const wanted=S(id);if(!wanted)return old.apply(this,[id,...args]);const a=localArr(sheet),backup=a.filter(x=>S(x?.id)===wanted).map(x=>({...x}));try{await deleteMaster(sheet,wanted);localRemove(sheet,wanted);render(sheet);toast('Đã xóa bản ghi.','success');return true}catch(e){backup.forEach(x=>localUpsert(sheet,x));render(sheet);toast('Xóa thất bại: '+S(e?.message||e),'error');return false}};fn.__lhMasterWrapped=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
wrapSave('saveAttendanceRecord','DIEM_DANH',(studentId,date,status,note='')=>({studentId,date:date||today(),status,note}));
wrapSave('addViolation','VI_PHAM',d=>({...d}));
wrapSave('updateViolation','VI_PHAM',(id,c={})=>{const o=(window.violationRecords||[]).find(x=>S(x?.id)===S(id));return{...o,...c,id:S(id)}});
wrapSave('addReward','KHEN_THUONG',d=>({...d}));
wrapSave('updateReward','KHEN_THUONG',(id,c={})=>{const o=(window.rewardRecords||[]).find(x=>S(x?.id)===S(id));return{...o,...c,id:S(id)}});
wrapSave('addLearningRecord','HOC_TAP',d=>({...d}));
wrapSave('addProgressRecord','TIEN_BO',d=>({...d}));
wrapSave('addComment','NHAN_XET',d=>({...d}));
wrapDelete('deleteViolation','VI_PHAM');wrapDelete('deleteReward','KHEN_THUONG');

function readModal(modal,isV){const value=sel=>modal.querySelector(sel)?.value??'';const ids=[...modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>S(x.value)).filter(Boolean);const fallback=S(value('#eStudent')||value('#violationStudent')||value('#rewardStudent'));const students=ids.length?ids:(fallback?[fallback]:[]);const type=S(value('#eType')||value(isV?'#violationType':'#rewardType'));const date=S(value('#eDate')||value(isV?'#violationDate':'#rewardDate'))||today();const note=S(value('#eNote')||value(isV?'#violationNote':'#rewardNote'));if(!students.length)throw Error('Vui lòng chọn ít nhất một học sinh.');if(!type)throw Error('Vui lòng chọn nội dung.');return{students,type,date,note}}
async function saveModal(modal,b,isV){if(modal.dataset.lhMasterSaving==='1')return;modal.dataset.lhMasterSaving='1';b.disabled=true;const old=b.innerHTML;b.innerHTML='Đang lưu...';try{const v=readModal(modal,isV),sheet=isV?'VI_PHAM':'KHEN_THUONG';let ok=0;for(const studentId of v.students){const r={id:makeId(isV?'VIO':'REW'),studentId,studentName:(window.students||[]).find(s=>S(s.id)===studentId)?.name||'',date:v.date,type:v.type,note:v.note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(isV){r.level=S(modal.querySelector('#eLevel,#violationLevel')?.value)||'light';r.status=S(modal.querySelector('#eStatus,#violationStatus')?.value)||'monitoring';r.action=S(modal.querySelector('#eAction,#violationAction')?.value)}else r.formType=S(modal.querySelector('#eForm,#rewardFormType')?.value)||'praise';await saveMaster(sheet,r);ok++}render(sheet);modal.remove();toast(`Đã lưu ${ok} học sinh vào Google Sheets.`,'success')}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}finally{modal.dataset.lhMasterSaving='';b.disabled=false;b.innerHTML=old}}
function clickCapture(e){const t=e.target instanceof Element?e.target:null;if(!t)return;const modal=t.closest?.('.ev-static-modal');if(modal){const b=t.closest('#eSave');if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,b,!!modal.querySelector('#eLevel'));return}}const form=t.closest?.('#violationForm,#rewardForm');if(form){const b=t.closest('button');if(b&&(/\blưu\b/i.test(S(b.textContent))||b.type==='submit')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(form,b,form.id==='violationForm')}}}
window.addEventListener('click',clickCapture,true);window.addEventListener('submit',clickCapture,true);
window.LH_MASTER_CRUD={saveMaster,deleteMaster,render};
})();
