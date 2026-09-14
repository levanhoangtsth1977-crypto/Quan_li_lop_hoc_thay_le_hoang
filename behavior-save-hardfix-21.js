/* BEHAVIOR SAVE HARD FIX 2.3 — instant local save + bounded Google sync
 * Fix 2026-09-14:
 * - Không chờ vô hạn Google Sheets bridge.
 * - Lưu Data Engine/localStorage trước để nút Lưu luôn kết thúc.
 * - Đồng bộ Google Sheets trực tiếp bằng JSONP có timeout.
 * - Giữ chọn nhiều học sinh và đầy đủ mức độ/trạng thái/hình thức xử lý.
 * - Không đụng menu, danh sách học sinh hay cấu trúc Data Engine.
 */
(function(){
'use strict';
if(window.__LH_BEHAVIOR_SAVE_HARDFIX_23__)return;
window.__LH_BEHAVIOR_SAVE_HARDFIX_23__=true;

const APIS=[
  'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec',
  'https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec'
];
const JSONP_TIMEOUT=9000;
const S=v=>String(v??'').trim();
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const makeId=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
const toast=(m,t='info')=>{try{if(typeof window.showToast==='function')window.showToast(m,t);else console.log(m)}catch(_){console.log(m)}};

function students(){
  try{
    if(typeof window.getStudentsSafe==='function'){
      const a=window.getStudentsSafe();
      if(Array.isArray(a))return a;
    }
  }catch(_){}
  if(Array.isArray(window.students))return window.students;
  if(Array.isArray(window.classData?.students))return window.classData.students;
  if(Array.isArray(window.appData?.students))return window.appData.students;
  return [];
}

function resolveStudent(raw){
  const value=S(typeof raw==='object'?(raw?.value??raw?.studentId??raw?.id??raw?.name??raw?.studentName):raw);
  if(!value)return null;
  return students().find(s=>
    S(s?.id)===value ||
    S(s?.studentCode||s?.code)===value ||
    S(s?.name)===value
  )||null;
}

function pickerStudents(form,kind){
  const checked=[...form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')]
    .map(x=>resolveStudent(x.value)).filter(Boolean);
  if(checked.length)return[...new Map(checked.map(s=>[S(s.id),s])).values()];

  const sel=form.querySelector(kind==='V'?'#violationStudent':'#rewardStudent');
  if(!sel)return[];
  const raw=sel.multiple
    ? [...sel.options].filter(o=>o.selected).map(o=>o.value)
    : [sel.value];
  const out=raw.map(resolveStudent).filter(Boolean);
  return[...new Map(out.map(s=>[S(s.id),s])).values()];
}

function field(form,selectors,labelNeedle){
  for(const sel of selectors){const e=form.querySelector(sel);if(e)return e}
  const needle=S(labelNeedle).toLowerCase();
  for(const label of form.querySelectorAll('label')){
    if(S(label.textContent).toLowerCase().includes(needle)){
      const e=label.querySelector('select,input,textarea');
      if(e)return e;
    }
  }
  return null;
}

function getValues(form,kind){
  const isV=kind==='V';
  const typeEl=field(form,isV?['#violationType','select[name="violationType"]']:['#rewardType','select[name="rewardType"]'],'nội dung');
  const dateEl=field(form,isV?['#violationDate','input[name="violationDate"]']:['#rewardDate','input[name="rewardDate"]'],'ngày');
  const noteEl=field(form,isV?['#violationNote','textarea[name="violationNote"]']:['#rewardNote','textarea[name="rewardNote"]'],'ghi chú');
  return{
    students:pickerStudents(form,kind),
    type:S(typeEl?.value),
    date:S(dateEl?.value)||today(),
    note:S(noteEl?.value)
  };
}

function meta(form,kind){
  if(kind==='V')return{
    level:S(field(form,['#violationLevel','select[name="violationLevel"]'],'mức độ')?.value)||'light',
    status:S(field(form,['#violationStatus','select[name="violationStatus"]'],'trạng thái')?.value)||'monitoring',
    action:S(field(form,['#violationAction','select[name="violationAction"]'],'hình thức xử lý')?.value)||''
  };
  return{formType:S(field(form,['#rewardFormType','select[name="rewardFormType"]'],'hình thức')?.value)||'praise'};
}

function ok(r){return!!(r&&(r.ok===true||r.success===true||r.saved===true||r.stored===true));}

function persistLocal(kind,record){
  const fn=kind==='V'?window.addViolation:window.addReward;
  if(typeof fn!=='function')throw Error('Data Engine không có hàm lưu dữ liệu.');
  const r=fn(record);
  if(!ok(r))throw Error(S(r?.message||r?.error||'Không thể lưu dữ liệu trên thiết bị.'));
  try{window.syncAppDataReferences?.()}catch(_){}
  try{window.saveClassData?.()}catch(_){}
  return r?.record||record;
}

function jsonp(url,action,params){
  return new Promise((resolve,reject)=>{
    const cb='LH23_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const script=document.createElement('script');
    let done=false;
    const finish=(err,data)=>{
      if(done)return;
      done=true;
      clearTimeout(timer);
      try{delete window[cb]}catch(_){}
      script.remove();
      err?reject(err):resolve(data);
    };
    const timer=setTimeout(()=>finish(Error('Google Sheets không phản hồi trong 9 giây.')),JSONP_TIMEOUT);
    window[cb]=data=>finish(null,data);
    script.onerror=()=>finish(Error('Không truy cập được Google Apps Script.'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(typeof v==='string'?v:JSON.stringify(v))));
    script.src=url+'?'+q.toString();
    document.head.appendChild(script);
  });
}

async function cloudSave(sheet,record){
  let last=null;
  for(const url of APIS){
    try{
      const r=await jsonp(url,'save_event',{payload:JSON.stringify({sheet,record})});
      if(ok(r))return r;
      last=Error(S(r?.error||r?.message||'Google Sheets không xác nhận đã lưu.'));
    }catch(e){last=e}
  }
  throw last||Error('Không kết nối được Google Sheets.');
}

function resetAndClose(form,kind){
  try{form.reset()}catch(_){}
  try{
    const d=form.querySelector(kind==='V'?'#violationDate':'#rewardDate');
    if(d)d.value=today();
  }catch(_){}
  try{
    const modal=form.closest('.modal');
    if(modal){modal.hidden=true;modal.setAttribute('aria-hidden','true');}
    document.body.classList.remove('modal-open');
  }catch(_){}
}

function refreshLocal(){
  try{window.refreshAll?.()}catch(_){}
  try{window.renderViolations?.()}catch(_){}
  try{window.renderRewards?.()}catch(_){}
}

async function save(form,kind,button){
  if(!form||form.dataset.lhSaving23==='1')return;
  form.dataset.lhSaving23='1';
  const old=button?.innerHTML;
  if(button){button.disabled=true;button.innerHTML='Đang lưu...'}
  try{
    const v=getValues(form,kind);
    if(!v.students.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
    if(!v.type)throw Error(kind==='V'?'Vui lòng chọn nội dung vi phạm.':'Vui lòng chọn nội dung khen thưởng.');

    const extra=meta(form,kind);
    const records=v.students.map(student=>({
      id:makeId(kind==='V'?'VIO':'REW'),
      studentId:S(student.id),
      studentName:S(student.name),
      date:v.date,
      type:v.type,
      note:v.note,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      ...extra
    }));

    // 1) Lưu ngay vào Data Engine + localStorage.
    //    Đây là nguồn dự phòng để thao tác không bị treo khi Google chậm.
    records.forEach(record=>persistLocal(kind,record));
    refreshLocal();
    resetAndClose(form,kind);
    if(button){button.disabled=false;button.innerHTML=old||'Lưu'}
    form.dataset.lhSaving23='';

    toast(kind==='V'
      ? `Đã lưu ${records.length} học sinh vi phạm trên thiết bị.`
      : `Đã lưu ${records.length} học sinh khen thưởng trên thiết bị.`,'success');

    // 2) Đồng bộ Google Sheets nền, có giới hạn thời gian.
    let cloudSaved=0;
    for(const record of records){
      try{
        const r=await cloudSave(kind==='V'?'VI_PHAM':'KHEN_THUONG',record);
        if(ok(r))cloudSaved++;
      }catch(e){console.warn('[LH23] Cloud save failed:',e)}
    }

    if(cloudSaved===records.length){
      toast(`Đã đồng bộ ${cloudSaved} bản ghi lên Google Sheets.`,'success');
    }else if(cloudSaved>0){
      toast(`Đã đồng bộ Google Sheets ${cloudSaved}/${records.length} bản ghi; các bản ghi còn lại vẫn được lưu trên thiết bị.`,'warning');
    }else{
      toast('Google Sheets chưa phản hồi. Dữ liệu vẫn an toàn trên thiết bị và không bị mất.','warning');
    }
  }catch(e){
    form.dataset.lhSaving23='';
    if(button){button.disabled=false;button.innerHTML=old||'Lưu'}
    toast('Lưu thất bại: '+S(e?.message||e),'error');
  }
}

function saveButton(target,form){
  const b=target?.closest?.('button');
  if(!b||!form.contains(b))return null;
  const text=S(b.innerText||b.textContent).toLowerCase();
  const isSave=b.type==='submit'||/\blưu\b/.test(text);
  if(!isSave||/\bhủy\b|\bđóng\b/.test(text))return null;
  return b;
}

function interceptSubmit(e){
  const form=e.target instanceof HTMLFormElement?e.target:null;
  if(!form||!/^((violation)|(reward))Form$/.test(form.id))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const button=form.querySelector('button[type="submit"]')||[...form.querySelectorAll('button')].find(b=>/\blưu\b/i.test(S(b.textContent)));
  save(form,form.id==='violationForm'?'V':'R',button);
}

function interceptClick(e){
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  const form=target.closest('#violationForm,#rewardForm');
  if(!form)return;
  const button=saveButton(target,form);
  if(!button)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  save(form,form.id==='violationForm'?'V':'R',button);
}

window.addEventListener('submit',interceptSubmit,true);
window.addEventListener('click',interceptClick,true);
})();
