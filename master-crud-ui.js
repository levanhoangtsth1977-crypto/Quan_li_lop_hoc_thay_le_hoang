/* MASTER CRUD UI — SINGLE SOURCE OF TRUTH v14
 * One canonical Google Sheets CRUD path for all classroom event menus.
 * Native Vi phạm/Khen thưởng forms and the multi-student picker are handled
 * here before the legacy script form handlers can run. This prevents a form
 * selecting several students from collapsing to one student.
 * Successful writes are followed by one authoritative Google Sheets reload.
 */
(function(){
'use strict';
if(window.__LH_MASTER_CRUD_UI_V14__)return;
window.__LH_MASTER_CRUD_UI_V14__=true;
const PROXY_API='https://quan-li-lop-hoc-thay-le-hoang.vercel.app/api/google';
const S=v=>String(v??'').trim();
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_){console.log(m)}};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const makeId=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
async function getJSON(action,params={}){const q=new URLSearchParams({action,_:String(Date.now())});Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null)q.set(k,S(v))});const r=await fetch(PROXY_API+'?'+q.toString(),{method:'GET',cache:'no-store',mode:'cors',credentials:'omit'});const text=await r.text();let data;try{data=JSON.parse(text)}catch(_){throw Error('Google API proxy trả phản hồi không hợp lệ.')};if(!r.ok||!data?.ok)throw Error(S(data?.error)||`Google API proxy HTTP ${r.status}`);return data}
async function post(action,payload={}){if(action==='save_event'){const wrapper=JSON.stringify(payload);return getJSON('save_event',{payload:wrapper,tab:S(payload.sheet),sheet:S(payload.sheet),record:JSON.stringify(payload.record||{})})}if(action==='delete_event')return getJSON('delete_event',{...payload,sheet:S(payload.sheet),tab:S(payload.sheet)});return getJSON(action,payload)}
const ARR={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords',HOC_TAP:'learningRecords',TIEN_BO:'progressRecords',NHAN_XET:'commentRecords'};
function localArr(sheet){const n=ARR[sheet];return n&&Array.isArray(window[n])?window[n]:[]}
function localUpsert(sheet,r){const a=localArr(sheet),id=S(r?.id);if(!id)return;const i=a.findIndex(x=>S(x?.id)===id);if(i<0)a.push(r);else a[i]=r}
function localRemove(sheet,id){const a=localArr(sheet);for(let i=a.length-1;i>=0;i--)if(S(a[i]?.id)===S(id))a.splice(i,1)}
function render(sheet){try{if(sheet==='VI_PHAM')window.renderViolations?.();if(sheet==='KHEN_THUONG')window.renderRewards?.();if(sheet==='DIEM_DANH')window.renderAttendance?.();if(sheet==='HOC_TAP')window.renderLearning?.();if(sheet==='TIEN_BO')window.renderProgress?.();if(sheet==='NHAN_XET')window.renderComments?.();window.renderDashboard?.();window.updateBadges?.();window.refreshAll?.()}catch(_) {}}
async function authoritativeReload(){try{if(typeof window.syncGoogleSheetsNow==='function'){const d=await window.syncGoogleSheetsNow();return !!d}if(typeof window.loadGoogleSheetsMenuData==='function'){const d=await window.loadGoogleSheetsMenuData();return !!d}}catch(e){console.warn('[MASTER CRUD] reload Google thất bại:',e)}return false}
function responseRecord(r,record){if(r?.record&&typeof r.record==='object')return r.record;if(r?.data?.record&&typeof r.data.record==='object')return r.data.record;return{...record,id:S(r?.id)||S(record?.id)}}
function ensureSavedResponse(r){if(!r?.ok||!(r.saved===true||r.stored===true||r.success===true))throw Error(S(r?.error||r?.message||'Google Sheets không xác nhận lưu.'));return r}
async function saveMaster(sheet,record){const r=await post('save_event',{sheet,record});ensureSavedResponse(r);const saved=responseRecord(r,record);localUpsert(sheet,saved);await authoritativeReload();render(sheet);return saved}
async function saveMany(sheet,records){
  const list=Array.isArray(records)?records.filter(r=>r&&S(r.studentId)):[];
  if(!list.length)throw Error('Chưa chọn học sinh để lưu.');
  const saved=[];
  for(const raw of list){
    const record={...raw,id:S(raw.id)||makeId(sheet==='VI_PHAM'?'VIO':sheet==='KHEN_THUONG'?'REW':'REC'),createdAt:S(raw.createdAt)||new Date().toISOString(),updatedAt:new Date().toISOString()};
    const r=await post('save_event',{sheet,record});
    ensureSavedResponse(r);
    const one=responseRecord(r,record);localUpsert(sheet,one);saved.push(one);
  }
  const reloaded=await authoritativeReload();
  render(sheet);
  if(!reloaded)console.warn('[MASTER CRUD] Không tải lại được Google Sheets sau khi lưu');
  return saved;
}
async function deleteMaster(sheet,id){const wanted=S(id);if(!wanted)throw Error('Thiếu mã bản ghi');const r=await post('delete_event',{sheet,id:wanted,recordId:wanted});if(!r?.ok||!(r.deleted===true||r.success===true))throw Error(S(r?.error||r?.message||'Google Sheets không xác nhận xóa.'));localRemove(sheet,wanted);await authoritativeReload();render(sheet);return true}
function wrapSave(name,sheet,builder){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterWrappedV14)return true;const fn=function(...args){let record;try{record=builder(...args)}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error');return Promise.resolve({success:false,message:S(e?.message||e)})}if(!record||!S(record.studentId))return old.apply(this,args);record={...record,id:S(record.id)||makeId(sheet==='VI_PHAM'?'VIO':sheet==='KHEN_THUONG'?'REW':sheet==='DIEM_DANH'?'ATT':sheet==='HOC_TAP'?'LRN':sheet==='TIEN_BO'?'PRO':'COM'),createdAt:S(record.createdAt)||new Date().toISOString(),updatedAt:new Date().toISOString()};return saveMaster(sheet,record).then(remote=>{toast('Đã lưu vào Google Sheets.','success');return{success:true,record:remote}}).catch(e=>{toast('Lưu thất bại: '+S(e?.message||e),'error');return{success:false,message:S(e?.message||e)}})};fn.__lhMasterWrappedV14=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
function wrapDelete(name,sheet){const install=()=>{const old=window[name];if(typeof old!=='function')return false;if(old.__lhMasterDeleteWrappedV14)return true;const fn=async function(id,...args){const wanted=S(id);if(!wanted)return old.apply(this,[id,...args]);try{await deleteMaster(sheet,wanted);toast('Đã xóa bản ghi.','success');return true}catch(e){toast('Xóa thất bại: '+S(e?.message||e),'error');return false}};fn.__lhMasterDeleteWrappedV14=true;fn.__lhMasterOriginal=old;window[name]=fn;return true};let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install()}
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
function readPickerIds(form,selectId){
  const ids=[...form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>S(x.value)).filter(Boolean);
  if(ids.length)return [...new Set(ids)];
  const select=form.querySelector('#'+selectId);
  return [...(select?.selectedOptions||[])].map(x=>S(x.value)).filter(Boolean);
}
function nativeFormRecords(form,isV){
  const ids=readPickerIds(form,isV?'violationStudent':'rewardStudent');
  const type=S(form.querySelector(isV?'#violationType':'#rewardType')?.value);
  const date=S(form.querySelector(isV?'#violationDate':'#rewardDate')?.value)||today();
  const note=S(form.querySelector(isV?'#violationNote':'#rewardNote')?.value||'');
  if(!ids.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
  if(!type)throw Error('Vui lòng chọn nội dung.');
  return ids.map(studentId=>{
    const student=(window.students||[]).find(s=>S(s?.id)===studentId);
    const r={studentId,studentName:S(student?.name),date,type,note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(isV){r.level=S(form.querySelector('#violationLevel')?.value)||'light';r.status=S(form.querySelector('#violationStatus')?.value)||'monitoring';r.action=S(form.querySelector('#violationAction')?.value)}
    else r.formType=S(form.querySelector('#rewardFormType')?.value)||'praise';
    return r;
  });
}
async function saveNativeForm(form,isV,submitter){
  if(form.dataset.lhMasterSavingV14==='1')return;
  form.dataset.lhMasterSavingV14='1';
  if(submitter)submitter.disabled=true;
  const old=submitter?.innerHTML;
  if(submitter)submitter.innerHTML='Đang lưu...';
  try{
    const sheet=isV?'VI_PHAM':'KHEN_THUONG';
    const records=nativeFormRecords(form,isV);
    const saved=await saveMany(sheet,records);
    form.reset();
    const modal=form.closest('.modal');
    if(modal)modal.hidden=true;
    toast(`Đã lưu ${saved.length} học sinh vào Google Sheets.`,'success');
  }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}
  finally{form.dataset.lhMasterSavingV14='';if(submitter)submitter.disabled=false;if(submitter&&old!==undefined)submitter.innerHTML=old;}
}
function nativeSubmitCapture(e){
  const form=e.target instanceof HTMLFormElement?e.target:null;
  if(!form)return;
  if(form.id==='violationForm'||form.id==='rewardForm'){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const isV=form.id==='violationForm';
    saveNativeForm(form,isV,e.submitter||form.querySelector('button[type="submit"]'));
  }
}
function clickCapture(e){const t=e.target instanceof Element?e.target:null;if(!t)return;const modal=t.closest?.('.ev-static-modal');if(modal){const b=t.closest('#eSave');if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,b,!!modal.querySelector('#eLevel'));return}}}
async function saveModal(modal,b,isV){if(modal.dataset.lhMasterSavingV14==='1')return;modal.dataset.lhMasterSavingV14='1';b.disabled=true;const old=b.innerHTML;b.innerHTML='Đang lưu...';try{const v=readModal(modal,isV),sheet=isV?'VI_PHAM':'KHEN_THUONG';const records=v.students.map(studentId=>{const r={id:makeId(isV?'VIO':'REW'),studentId,studentName:(window.students||[]).find(s=>S(s.id)===studentId)?.name||'',date:v.date,type:v.type,note:v.note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};if(isV){r.level=S(modal.querySelector('#eLevel,#violationLevel')?.value)||'light';r.status=S(modal.querySelector('#eStatus,#violationStatus')?.value)||'monitoring';r.action=S(modal.querySelector('#eAction,#violationAction')?.value)}else r.formType=S(modal.querySelector('#eForm,#rewardFormType')?.value)||'praise';return r});const saved=await saveMany(sheet,records);modal.remove();toast(`Đã lưu ${saved.length} học sinh vào Google Sheets.`,'success')}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}finally{modal.dataset.lhMasterSavingV14='';b.disabled=false;b.innerHTML=old}}
window.addEventListener('click',clickCapture,true);
window.addEventListener('submit',nativeSubmitCapture,true);
window.LH_MASTER_CRUD={saveMaster,saveMany,deleteMaster,render,version:'14'};
})();
