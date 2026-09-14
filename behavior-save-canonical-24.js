/* BEHAVIOR SAVE CANONICAL 2.4 — single owner for Vi phạm/Khen thưởng */
(function(){
'use strict';
if(window.__LH_BEHAVIOR_SAVE_CANONICAL_24__)return;
window.__LH_BEHAVIOR_SAVE_CANONICAL_24__=true;

const APIS=[
  'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec',
  'https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec'
];
const TIMEOUT=10000;
const S=v=>String(v??'').trim();
const esc=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_) {console.log(m)}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const makeId=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;

function getStudents(){
  const sources=[];
  try{if(typeof window.getGoogleStudentRoster==='function')sources.push(window.getGoogleStudentRoster())}catch(_){}
  try{sources.push(window.GOOGLE_SHEETS_STUDENTS)}catch(_){}
  try{if(typeof window.getStudentsSafe==='function')sources.push(window.getStudentsSafe())}catch(_){}
  sources.push(window.students);
  for(const a of sources)if(Array.isArray(a)&&a.length)return a;
  return [];
}
function resolve(raw){
  const v=S(typeof raw==='object'?(raw?.value??raw?.studentId??raw?.id??raw?.name):raw);
  if(!v)return null;
  return getStudents().find(s=>S(s?.id)===v||S(s?.studentCode||s?.code)===v||S(s?.name)===v)||null;
}
function selectedStudents(form){
  const checked=[...form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>resolve(x.value)).filter(Boolean);
  if(checked.length)return[...new Map(checked.map(s=>[S(s.id),s])).values()];
  const sel=form.querySelector('#violationStudent,#rewardStudent');
  if(!sel)return[];
  const vals=sel.multiple?[...sel.options].filter(o=>o.selected&&S(o.value)).map(o=>o.value):[sel.value];
  return[...new Map(vals.map(resolve).filter(Boolean).map(s=>[S(s.id),s])).values()];
}
function field(form,ids){for(const id of ids){const el=form.querySelector(id);if(el)return el}return null}
function jsonp(url,action,params){
  return new Promise((resolve,reject)=>{
    const cb='LH24_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const sc=document.createElement('script');let done=false;
    const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();err?reject(err):resolve(data)};
    const timer=setTimeout(()=>finish(Error('Google Sheets không phản hồi trong 10 giây.')),TIMEOUT);
    window[cb]=data=>finish(null,data);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script.'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(typeof v==='string'?v:JSON.stringify(v))));
    sc.src=url+'?'+q.toString();document.head.appendChild(sc);
  });
}
function responseOk(r){return !!(r?.ok===true||r?.success===true||r?.saved===true||r?.stored===true)}
async function cloudSave(sheet,record){
  let last='';
  for(const url of APIS){
    try{
      const r=await jsonp(url,'save_event',{payload:JSON.stringify({sheet,record})});
      if(responseOk(r))return r;
      last=S(r?.error||r?.message||'Google Sheets từ chối bản ghi.');
    }catch(e){last=S(e?.message||e)}
  }
  throw Error(last||'Không kết nối được Google Sheets.');
}
function localPush(sheet,record){
  const name=sheet==='VI_PHAM'?'violationRecords':'rewardRecords';
  if(!Array.isArray(window[name]))window[name]=[];
  const arr=window[name];const i=arr.findIndex(x=>S(x?.id)===S(record.id));
  if(i<0)arr.push(record);else arr[i]=record;
  try{window.syncAppDataReferences?.()}catch(_){}
  try{window.saveClassData?.()}catch(_){}
}
function rerender(){
  try{window.LHRefreshViolationsLive?.()}catch(_){}
  try{window.refreshAll?.()}catch(_){}
  try{window.renderViolations?.()}catch(_){}
  try{window.renderRewards?.()}catch(_){}
}
function values(form,isV){
  const type=field(form,isV?['#violationType','select[name="violationType"]']:['#rewardType','select[name="rewardType"]']);
  const date=field(form,isV?['#violationDate','input[name="violationDate"]']:['#rewardDate','input[name="rewardDate"]']);
  const note=field(form,isV?['#violationNote','textarea[name="violationNote"]']:['#rewardNote','textarea[name="rewardNote"]']);
  const out={type:S(type?.value),date:S(date?.value)||today(),note:S(note?.value)};
  if(isV)out.extra={
    level:S(field(form,['#violationLevel','select[name="violationLevel"]'])?.value)||'light',
    status:S(field(form,['#violationStatus','select[name="violationStatus"]'])?.value)||'monitoring',
    action:S(field(form,['#violationAction','select[name="violationAction"]'])?.value)
  };else out.extra={formType:S(field(form,['#rewardFormType','select[name="rewardFormType"]'])?.value)||'praise'};
  return out;
}
async function save(form,isV,button){
  if(!form||form.dataset.lhCanonicalSaving24==='1')return;
  form.dataset.lhCanonicalSaving24='1';
  const old=button?.innerHTML||'Lưu';if(button){button.disabled=true;button.innerHTML='Đang lưu...'}
  try{
    const chosen=selectedStudents(form);if(!chosen.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
    const v=values(form,isV);if(!v.type)throw Error(isV?'Vui lòng chọn nội dung vi phạm.':'Vui lòng chọn nội dung khen thưởng.');
    const sheet=isV?'VI_PHAM':'KHEN_THUONG';
    let cloud=0;
    for(const student of chosen){
      const rec={id:makeId(isV?'VIO':'REW'),studentId:S(student.id),studentName:S(student.name),date:v.date,type:v.type,note:v.note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...v.extra};
      localPush(sheet,rec);cloud=await cloudSave(sheet,rec).then(()=>cloud+1).catch(e=>{console.warn('[LH24] cloud',e);return cloud});
    }
    rerender();
    if(cloud===chosen.length)toast(`Đã lưu ${cloud} học sinh ${isV?'vi phạm':'khen thưởng'}.`,'success');
    else toast(`Đã lưu ${chosen.length} học sinh trên thiết bị; Google Sheets lưu ${cloud}/${chosen.length}.`,'warning');
    try{await window.syncGoogleSheetsNow?.();rerender()}catch(_){}
    try{form.reset()}catch(_){}
    const d=form.querySelector(isV?'#violationDate':'#rewardDate');if(d)d.value=today();
  }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}
  finally{form.dataset.lhCanonicalSaving24='';if(button){button.disabled=false;button.innerHTML=old}}
}
function isSaveButton(button,form){
  if(!button||!form.contains(button))return false;
  const text=S(button.textContent).toLowerCase();return button.type==='submit'||/\blưu\b/.test(text);
}
function onClick(e){
  const target=e.target instanceof Element?e.target:null;if(!target)return;
  const form=target.closest('#violationForm,#rewardForm');if(!form)return;
  const button=target.closest('button');if(!isSaveButton(button,form))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();save(form,form.id==='violationForm',button);
}
function onSubmit(e){const form=e.target instanceof HTMLFormElement?e.target:null;if(!form||!/^((violation)|(reward))Form$/.test(form.id))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const b=form.querySelector('button[type="submit"]')||[...form.querySelectorAll('button')].find(x=>/\blưu\b/i.test(S(x.textContent)));save(form,form.id==='violationForm',b)}
window.addEventListener('click',onClick,true);
window.addEventListener('submit',onSubmit,true);
})();
