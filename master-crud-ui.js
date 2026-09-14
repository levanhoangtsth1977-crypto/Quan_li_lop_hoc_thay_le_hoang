/* MASTER CRUD UI — SINGLE SOURCE OF TRUTH
 * All business-record SAVE/UPDATE/DELETE calls go through the active Master Apps Script API.
 * Supported sheets: DIEM_DANH, VI_PHAM, KHEN_THUONG, HOC_TAP, TIEN_BO, NHAN_XET, LINK_HOC_SINH.
 * Student deletion is intentionally not remapped: Master API forbids deleteRecord on HOC_SINH.
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
    const sc=document.createElement('script');
    let done=false;
    const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),timeout);
    window[cb]=data=>finish(null,data);
    sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});
    sc.src=API()+'?'+q.toString();
    document.head.appendChild(sc);
  });
}
function post(action,payload){
  return new Promise((resolve,reject)=>{
    const iframe=document.createElement('iframe');
    const form=document.createElement('form');
    const target='LH_MASTER_POST_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    iframe.name=target;iframe.hidden=true;
    form.method='POST';form.action=API();form.target=target;form.hidden=true;
    const add=(k,v)=>{const input=document.createElement('input');input.type='hidden';input.name=k;input.value=S(v);form.appendChild(input)};
    add('action',action);
    Object.entries(payload||{}).forEach(([k,v])=>add(k,v));
    document.body.appendChild(iframe);document.body.appendChild(form);
    let done=false;
    const clean=()=>{try{iframe.remove()}catch(_){}try{form.remove()}catch(_){} };
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(Error('Google không xác nhận được yêu cầu POST'))},12000);
    iframe.addEventListener('load',()=>{if(done)return;done=true;clearTimeout(timer);clean();resolve(true)},{once:true});
    try{form.submit()}catch(e){done=true;clearTimeout(timer);clean();reject(e)}
  });
}
function localArray(sheet){
  return sheet==='DIEM_DANH'?(window.attendanceRecords||[]):sheet==='VI_PHAM'?(window.violationRecords||[]):sheet==='KHEN_THUONG'?(window.rewardRecords||[]):sheet==='HOC_TAP'?(window.learningRecords||[]):sheet==='TIEN_BO'?(window.progressRecords||[]):sheet==='NHAN_XET'?(window.commentRecords||[]):[];
}
function localUpsert(sheet,record){
  const arr=localArray(sheet);if(!Array.isArray(arr))return;
  const id=S(record?.id);if(!id)return;
  const i=arr.findIndex(x=>S(x?.id)===id);if(i<0)arr.push(record);else arr[i]=record;
  try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){}
}
function localRemove(sheet,id){
  const arr=localArray(sheet);if(!Array.isArray(arr))return;
  for(let i=arr.length-1;i>=0;i--)if(S(arr[i]?.id)===S(id))arr.splice(i,1);
  try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){}
}
function rerender(sheet){
  try{
    if(sheet==='VI_PHAM')window.renderViolations?.();
    else if(sheet==='KHEN_THUONG')window.renderRewards?.();
    else if(sheet==='DIEM_DANH')window.renderAttendance?.();
    else if(sheet==='HOC_TAP')window.renderLearning?.();
    else if(sheet==='TIEN_BO')window.renderProgress?.();
    else if(sheet==='NHAN_XET')window.renderComments?.();
    window.refreshAll?.();window.renderDashboard?.();window.updateBadges?.();
  }catch(_){}
}
async function saveRemote(sheet,record){
  const action={DIEM_DANH:'saveAttendance',VI_PHAM:'saveViolation',KHEN_THUONG:'saveReward',HOC_TAP:'saveLearning',TIEN_BO:'saveProgress',NHAN_XET:'saveComment'}[sheet];
  if(!action)throw Error('Sheet chưa có action lưu Master: '+sheet);
  await post(action,record);
  const getAction={DIEM_DANH:'getAttendance',VI_PHAM:'getViolations',KHEN_THUONG:'getRewards',HOC_TAP:'getLearning',TIEN_BO:'getProgress',NHAN_XET:'getComments'}[sheet];
  const r=await jsonp(getAction,{studentId:S(record.studentId)});
  const rows=Array.isArray(r?.records)?r.records:[];
  const found=rows.find(x=>S(x?.id)===S(record.id));
  if(!found)throw Error('Google không trả lại đúng recordId để xác minh: '+S(record.id));
  return found;
}
async function deleteRemote(sheet,id){
  const wanted=S(id);if(!wanted)throw Error('Thiếu recordId');
  await post('deleteRecord',{sheet,id:wanted,recordId:wanted});
  const getAction={DIEM_DANH:'getAttendance',VI_PHAM:'getViolations',KHEN_THUONG:'getRewards',HOC_TAP:'getLearning',TIEN_BO:'getProgress',NHAN_XET:'getComments',LINK_HOC_SINH:'getLinks'}[sheet];
  if(getAction){
    const r=await jsonp(getAction,{});
    const rows=Array.isArray(r?.records)?r.records:(Array.isArray(r?.links)?r.links:[]);
    if(rows.some(x=>S(x?.id)===wanted||S(x?.recordId)===wanted))throw Error('Google Sheets vẫn còn recordId '+wanted);
  }
}
function wrapGlobal(name,sheet,builder){
  const install=()=>{
    const original=window[name];if(typeof original!=='function')return false;
    if(original.__lhMasterWrapped)return true;
    const wrapped=function(...args){
      let record;
      try{record=builder(...args)}catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error');return {success:false,message:S(e?.message||e)}}
      if(!record||!S(record.studentId)){return original.apply(this,args)}
      const id=S(record.id)||makeId(sheet==='VI_PHAM'?'VIO':sheet==='KHEN_THUONG'?'REW':sheet==='DIEM_DANH'?'ATT':sheet==='HOC_TAP'?'LRN':sheet==='TIEN_BO'?'PRO':'COM');
      record={...record,id,createdAt:S(record.createdAt)||new Date().toISOString(),updatedAt:new Date().toISOString()};
      localUpsert(sheet,record);rerender(sheet);
      saveRemote(sheet,record).then(remote=>{localUpsert(sheet,remote);rerender(sheet)}).catch(e=>{localRemove(sheet,id);rerender(sheet);toast('Google Sheets không lưu được: '+S(e?.message||e),'error')});
      return {success:true,record};
    };
    wrapped.__lhMasterWrapped=true;wrapped.__lhMasterOriginal=original;window[name]=wrapped;return true;
  };
  let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install();
}
wrapGlobal('saveAttendanceRecord','DIEM_DANH',(studentId,date,status,note='')=>({id:'',studentId,date:date||today(),status,note}));
wrapGlobal('addViolation','VI_PHAM',d=>({...d}));
wrapGlobal('updateViolation','VI_PHAM',(id,c={})=>{const old=(window.violationRecords||[]).find(x=>S(x?.id)===S(id));return {...old,...c,id:S(id)}});
wrapGlobal('addReward','KHEN_THUONG',d=>({...d}));
wrapGlobal('updateReward','KHEN_THUONG',(id,c={})=>{const old=(window.rewardRecords||[]).find(x=>S(x?.id)===S(id));return {...old,...c,id:S(id)}});
wrapGlobal('addLearningRecord','HOC_TAP',d=>({...d}));
wrapGlobal('addProgressRecord','TIEN_BO',d=>({...d}));
wrapGlobal('addComment','NHAN_XET',d=>({...d}));
wrapGlobal('deleteViolation','VI_PHAM',id=>({id}));
wrapGlobal('deleteReward','KHEN_THUONG',id=>({id}));

function installDeleteWrapper(name,sheet){
  const install=()=>{
    const original=window[name];if(typeof original!=='function'||original.__lhMasterWrapped)return !!original;
    const wrapped=function(id,...args){
      const wanted=S(id);if(!wanted)return original.apply(this,[id,...args]);
      const arr=localArray(sheet);const backup=Array.isArray(arr)?arr.filter(x=>S(x?.id)===wanted).map(x=>({...x})):[];
      localRemove(sheet,wanted);rerender(sheet);
      deleteRemote(sheet,wanted).then(()=>toast('Đã xóa bản ghi.','success')).catch(e=>{backup.forEach(x=>localUpsert(sheet,x));rerender(sheet);toast('Xóa thất bại: '+S(e?.message||e),'error')});
      return true;
    };
    wrapped.__lhMasterWrapped=true;wrapped.__lhMasterOriginal=original;window[name]=wrapped;return true;
  };
  let n=0;const timer=setInterval(()=>{if(install()||++n>120)clearInterval(timer)},250);install();
}
/* Remove the ambiguous save wrappers for delete functions and install dedicated delete wrappers. */
installDeleteWrapper('deleteViolation','VI_PHAM');
installDeleteWrapper('deleteReward','KHEN_THUONG');

function readModal(modal,isV){
  const get=sel=>modal.querySelector(sel)?.value??'';
  const selected=[...modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>S(x.value)).filter(Boolean);
  const fallback=S(get('#eStudent')||get('#violationStudent')||get('#rewardStudent'));
  const students=selected.length?selected:(fallback?[fallback]:[]);
  const type=S(get('#eType')||get(isV?'#violationType':'#rewardType'));
  const date=S(get('#eDate')||get(isV?'#violationDate':'#rewardDate'))||today();
  const note=S(get('#eNote')||get(isV?'#violationNote':'#rewardNote'));
  if(!students.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
  if(!type)throw Error('Vui lòng chọn nội dung.');
  return {students,type,date,note};
}
async function saveModal(modal,button,isV){
  if(modal.dataset.lhMasterSaving==='1')return;
  modal.dataset.lhMasterSaving='1';button.disabled=true;const old=button.innerHTML;button.innerHTML='Đang lưu...';
  try{
    const v=readModal(modal,isV);const sheet=isV?'VI_PHAM':'KHEN_THUONG';let ok=0;
    for(const studentId of v.students){
      const base={id:makeId(isV?'VIO':'REW'),studentId,studentName:(window.students||[]).find(s=>S(s.id)===studentId)?.name||'',date:v.date,type:v.type,note:v.note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      if(isV){base.level=S(modal.querySelector('#eLevel,#violationLevel')?.value)||'light';base.status=S(modal.querySelector('#eStatus,#violationStatus')?.value)||'monitoring';base.action=S(modal.querySelector('#eAction,#violationAction')?.value)}else base.formType=S(modal.querySelector('#eForm,#rewardFormType')?.value)||'praise';
      const remote=await saveRemote(sheet,base);localUpsert(sheet,remote);ok++;
    }
    rerender(sheet);modal.remove();toast(`Đã lưu ${ok} học sinh vào Google Sheets.`,'success');
  }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}
  finally{modal.dataset.lhMasterSaving='';button.disabled=false;button.innerHTML=old}
}
function clickSave(e){
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const modal=t.closest?.('.ev-static-modal');
  if(modal){const b=t.closest('#eSave');if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,b,!!modal.querySelector('#eLevel'));return}}
  const form=t.closest?.('#violationForm,#rewardForm');
  if(form){const b=t.closest('button');if(b&&(/\blưu\b/i.test(S(b.textContent))||b.type==='submit')){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const modalLike=form;saveModal(modalLike,b,form.id==='violationForm');
  }}
}
window.addEventListener('click',clickSave,true);
window.addEventListener('submit',clickSave,true);
window.LH_MASTER_CRUD={saveRemote,deleteRemote,saveModal,rerender};
})();
