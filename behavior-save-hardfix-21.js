/* BEHAVIOR SAVE HARD FIX 2.2 — canonical save for Vi phạm/Khen thưởng
 * Fix 2026-09-14:
 * - Bắt cả button type="button" có nhãn Lưu, không chỉ type="submit".
 * - Ưu tiên Google Sheets bridge nếu đang hoạt động.
 * - Fallback an toàn về Data Engine localStorage.
 * - Giữ hỗ trợ chọn nhiều học sinh.
 * - Không sửa index.html / data.js / menu.
 */
(function(){
'use strict';
if(window.__LH_BEHAVIOR_SAVE_HARDFIX_22__)return;
window.__LH_BEHAVIOR_SAVE_HARDFIX_22__=true;

const TARGET_CLASS='5A3';
const TARGET_SHEET='1v9H6dReZiC_fCg6T9ISdfWOy1FN1HJQXXrKsABiCLI4';
const APIS=[
  'https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec',
  'https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec'
];

const S=v=>String(v??'').trim();
const today=()=>{
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const toast=(m,t='info')=>{
  try{
    if(typeof window.showToast==='function')window.showToast(m,t);
    else console.log(m);
  }catch(_){console.log(m)}
};

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

function resolveStudentId(raw){
  const value=S(typeof raw==='object'?(raw?.value??raw?.studentId??raw?.id??raw?.name??raw?.studentName):raw);
  if(!value)return '';
  const hit=students().find(st=>
    S(st?.id)===value ||
    S(st?.studentCode||st?.code)===value ||
    S(st?.name)===value
  );
  return S(hit?.id||value);
}

function pickerIds(form,kind){
  const checked=[...form.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')]
    .map(x=>resolveStudentId(x.value)).filter(Boolean);
  if(checked.length)return[...new Set(checked)];

  const sel=form.querySelector(kind==='V'?'#violationStudent':'#rewardStudent');
  if(!sel)return[];
  const raw=sel.multiple
    ? [...sel.options].filter(o=>o.selected).map(o=>o.value)
    : [sel.value];
  return[...new Set(raw.map(resolveStudentId).filter(Boolean))];
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

function values(form,kind){
  const typeEl=field(form,kind==='V'?['#violationType','select[name="violationType"]']:['#rewardType','select[name="rewardType"]'],'nội dung');
  const dateEl=field(form,kind==='V'?['#violationDate','input[name="violationDate"]']:['#rewardDate','input[name="rewardDate"]'],'ngày');
  const noteEl=field(form,kind==='V'?['#violationNote','textarea[name="violationNote"]']:['#rewardNote','textarea[name="rewardNote"]'],'ghi chú');
  return{
    ids:pickerIds(form,kind),
    type:S(typeEl?.value),
    date:S(dateEl?.value)||today(),
    note:S(noteEl?.value)
  };
}

function violationMeta(form){
  return{
    level:S(field(form,['#violationLevel','select[name="violationLevel"]'],'mức độ')?.value)||'light',
    status:S(field(form,['#violationStatus','select[name="violationStatus"]'],'trạng thái')?.value)||'monitoring',
    action:S(field(form,['#violationAction','select[name="violationAction"]'],'hình thức xử lý')?.value)||''
  };
}

function rewardMeta(form){
  return{
    formType:S(field(form,['#rewardFormType','select[name="rewardFormType"]'],'hình thức')?.value)||'praise'
  };
}

function ok(r){
  return !!(r&&(r.ok===true||r.success===true||r.saved===true||r.stored===true));
}

function localPersist(){
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();}catch(_){}
  try{if(typeof window.saveClassData==='function')return !!window.saveClassData();}catch(_){}
  return false;
}

function localSave(kind,record){
  const fn=kind==='V'?window.addViolation:window.addReward;
  if(typeof fn!=='function')throw Error('Data Engine không có hàm lưu dữ liệu.');
  const result=fn(record);
  if(!ok(result))throw Error(S(result?.message||result?.error||'Không thể lưu dữ liệu trên thiết bị.'));
  localPersist();
  return result?.record||record;
}

function jsonp(url,action,params){
  return new Promise((resolve,reject)=>{
    const cb='LH22_'+Date.now()+'_'+Math.random().toString(36).slice(2);
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
    const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi.')),12000);
    window[cb]=data=>finish(null,data);
    script.onerror=()=>finish(Error('Không truy cập được Google Apps Script.'));
    const q=new URLSearchParams({action,callback:cb,_:Date.now()});
    Object.entries(params||{}).forEach(([k,v])=>q.set(k,S(typeof v==='string'?v:JSON.stringify(v))));
    script.src=url+'?'+q.toString();
    document.head.appendChild(script);
  });
}

async function apiSave(sheet,record){
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

async function persistRecord(kind,record){
  // 1) Cầu nối Google Sheets hiện hành: ghi lên bảng rồi đồng bộ localStorage.
  if(window.LH_GOOGLE_SHEETS_V20&&typeof window.LH_GOOGLE_SHEETS_V20.save==='function'){
    try{
      const r=await window.LH_GOOGLE_SHEETS_V20.save(kind==='V'?'VI_PHAM':'KHEN_THUONG',record);
      if(ok(r)){
        localPersist();
        return{cloud:true,record:r.record||record};
      }
    }catch(e){console.warn('[LH22] Google Sheets bridge failed:',e)}
  }

  // 2) API trực tiếp nếu bridge chưa có.
  try{
    const r=await apiSave(kind==='V'?'VI_PHAM':'KHEN_THUONG',record);
    localPersist();
    return{cloud:true,record:{...record,id:S(r?.id)||record.id}};
  }catch(e){console.warn('[LH22] direct Google Sheets failed:',e)}

  // 3) Fallback chắc chắn: Data Engine + localStorage.
  const localRecord=localSave(kind,record);
  return{cloud:false,record:localRecord};
}

function refresh(){
  try{window.initializeData?.()}catch(_){}
  try{window.refreshAll?.()}catch(_){}
  try{window.renderViolations?.()}catch(_){}
  try{window.renderRewards?.()}catch(_){}
  try{window.syncGoogleSheetsNow?.()}catch(_){}
}

function resetAndClose(form,kind){
  try{form.reset()}catch(_){}
  try{
    const d=field(form,kind==='V'?['#violationDate']:['#rewardDate'],'ngày');
    if(d)d.value=today();
  }catch(_){}
  try{form.closest('.modal')?.setAttribute('hidden','true')}catch(_){}
}

async function save(form,kind,button){
  if(!form||form.dataset.lhSaving22==='1')return;
  form.dataset.lhSaving22='1';
  const old=button?.innerHTML;
  if(button){button.disabled=true;button.innerHTML='Đang lưu...'}
  try{
    const v=values(form,kind);
    if(!v.ids.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
    if(!v.type)throw Error(kind==='V'?'Vui lòng chọn nội dung vi phạm.':'Vui lòng chọn nội dung khen thưởng.');

    const base={studentId:'',date:v.date,type:v.type,note:v.note};
    if(kind==='V')Object.assign(base,violationMeta(form));
    else Object.assign(base,rewardMeta(form));

    let saved=0,cloud=0;
    for(const studentId of v.ids){
      const r=await persistRecord(kind,{...base,studentId});
      saved++;
      if(r.cloud)cloud++;
    }

    resetAndClose(form,kind);
    refresh();

    if(cloud===saved){
      toast(kind==='V'
        ? `Đã lưu ${saved} học sinh vi phạm.`
        : `Đã lưu ${saved} học sinh khen thưởng.`,'success');
    }else if(cloud>0){
      toast(`Đã lưu ${saved} học sinh; ${saved-cloud} bản ghi chỉ lưu trên thiết bị do Google Sheets không phản hồi.`,'warning');
    }else{
      toast(`Đã lưu ${saved} học sinh trên thiết bị. Dữ liệu đã được lưu vào bộ nhớ của hệ thống.`,'success');
    }
  }catch(e){
    toast('Lưu thất bại: '+S(e?.message||e),'error');
  }finally{
    form.dataset.lhSaving22='';
    if(button){button.disabled=false;button.innerHTML=old||'Lưu'}
  }
}

function getSaveButton(target,form){
  const b=target?.closest?.('button');
  if(!b||!form.contains(b))return null;
  const text=S(b.innerText||b.textContent).toLowerCase();
  const submitLike=b.type==='submit'||/\blưu\b/.test(text);
  if(!submitLike)return null;
  if(/\bhủy\b|\bđóng\b|\bthu gọn\b/.test(text))return null;
  return b;
}

function interceptClick(e){
  const target=e.target instanceof Element?e.target:null;
  if(!target)return;
  const form=target.closest('#violationForm,#rewardForm');
  if(!form)return;
  const button=getSaveButton(target,form);
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  save(form,form.id==='violationForm'?'V':'R',button);
}

function interceptSubmit(e){
  const form=e.target instanceof HTMLFormElement?e.target:null;
  if(!form||!/^((violation)|(reward))Form$/.test(form.id))return;
  const button=form.querySelector('button[type="submit"]')||[...form.querySelectorAll('button')].find(b=>/\blưu\b/i.test(S(b.textContent)));
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  save(form,form.id==='violationForm'?'V':'R',button);
}

window.addEventListener('click',interceptClick,true);
window.addEventListener('submit',interceptSubmit,true);
})();
