/* LE HOANG EVENT SYNC V21.4 — authoritative student selectors + no flicker + multi-student */
(function(){
'use strict';
if(window.__LH_EVENT_SYNC_V214__) return;
window.__LH_EVENT_SYNC_V214__=true;
const bridge=()=>window.LH_GOOGLE_SHEETS_V20||null;
const clean=v=>String(v??'').trim().replace(/\s+/g,' ');
let rosterSig='';
function students(){
  const g=Array.isArray(window.GOOGLE_SHEETS_STUDENTS)?window.GOOGLE_SHEETS_STUDENTS:[];
  const s=Array.isArray(window.students)?window.students:[];
  if(g.length>=42) return g;
  if(s.length>=42) return s;
  return g.length>s.length?g:s;
}
function sig(){return students().map(s=>clean(s?.id)+'|'+clean(s?.name)).join('||')}
function values(el){
  if(!el) return [];
  if(el.multiple) return Array.from(el.selectedOptions||[]).map(o=>clean(o.value)).filter(Boolean);
  const v=clean(el.value); return v?[v]:[];
}
function rebuildSelect(id,multiple){
  const el=document.getElementById(id);
  if(!el) return;
  const old=values(el), oldSet=new Set(old), list=students();
  if(multiple){el.multiple=true;el.size=Math.min(Math.max(list.length,8),12);el.title='Có thể chọn nhiều học sinh';}
  else {el.multiple=false;el.removeAttribute('size');el.removeAttribute('title');}
  const frag=document.createDocumentFragment();
  const first=document.createElement('option');
  first.value=''; first.textContent='Chọn học sinh';
  first.disabled=!!multiple; first.hidden=!!multiple;
  frag.appendChild(first);
  list.forEach(st=>{
    const o=document.createElement('option');
    o.value=clean(st?.id); o.textContent=clean(st?.name);
    if(oldSet.has(o.value)) o.selected=true;
    frag.appendChild(o);
  });
  el.replaceChildren(frag);
  if(!multiple && old.length && list.some(s=>clean(s?.id)===old[0])) el.value=old[0];
}
function syncSelectors(force){
  const s=sig();
  if(!force && s===rosterSig) return;
  rebuildSelect('attendanceStudent',true);
  rebuildSelect('violationStudent',true);
  rebuildSelect('rewardStudent',true);
  rebuildSelect('learningStudent',false);
  rebuildSelect('progressStudent',false);
  rebuildSelect('commentStudent',false);
  rosterSig=s;
}
function installSelectors(){
  window.updateStudentSelects=function(force=false){syncSelectors(!!force)};
  syncSelectors(true);
  window.addEventListener('google-sheets-data-ready',()=>syncSelectors(true));
}
function selectedIds(id){return values(document.getElementById(id))}
function wrapSave(name,tab){
  const original=window[name];
  if(typeof original!=='function'||original.__lhWrappedV214__) return;
  const wrapped=function(data){
    return Promise.resolve(original.apply(this,arguments)).then(async r=>{
      if(r===false||(r&&r.success===false)||!r) return r;
      const b=bridge(); if(!b?.save) return r;
      try{return {...r,googleSheets:await b.save(tab,r.record||data||{})}}
      catch(e){if(typeof window.showToast==='function')window.showToast('Chưa đồng bộ Google Sheets: '+e.message,'error');return r}
    });
  };
  wrapped.__lhWrappedV214__=true; window[name]=wrapped;
}
function wrapDelete(name,tab,getRecord){
  const original=window[name];
  if(typeof original!=='function'||original.__lhWrappedV214__) return;
  const wrapped=async function(id){
    const b=bridge(),old=getRecord?getRecord(id):null;
    if(b?.delete){try{await b.delete(tab,id,old)}catch(e){if(typeof window.showToast==='function')window.showToast('Google Sheets chưa xóa được bản ghi: '+e.message,'error');return false}}
    const r=original.apply(this,arguments); return r===undefined?true:r;
  };
  wrapped.__lhWrappedV214__=true; window[name]=wrapped;
}
async function saveMany(fn,ids,build){
  if(!ids.length){if(typeof window.showToast==='function')window.showToast('Vui lòng chọn ít nhất một học sinh.','warning');return false}
  let ok=0;
  for(const id of ids){try{const r=await window[fn](build(id));if(r!==false&&!(r&&r.success===false))ok++}catch(e){console.error('[V21.4]',fn,e)}}
  if(typeof window.refreshAll==='function')window.refreshAll();
  if(typeof window.showToast==='function')window.showToast(`Đã lưu ${ok}/${ids.length} học sinh.`,ok===ids.length?'success':'warning');
  return ok===ids.length;
}
document.addEventListener('submit',async function(e){
  const f=e.target;
  if(f?.id==='attendanceForm'){e.preventDefault();e.stopImmediatePropagation();await saveMany('saveAttendanceRecord',selectedIds('attendanceStudent'),id=>({studentId:id,date:document.getElementById('attendanceDate')?.value||new Date().toISOString().slice(0,10),status:document.getElementById('attendanceStatus')?.value||'present',note:document.getElementById('attendanceNote')?.value||''}));return}
  if(f?.id==='violationForm'){e.preventDefault();e.stopImmediatePropagation();await saveMany('addViolation',selectedIds('violationStudent'),id=>({studentId:id,date:document.getElementById('violationDate')?.value||new Date().toISOString().slice(0,10),type:document.getElementById('violationType')?.value||'',level:document.getElementById('violationLevel')?.value||'',note:document.getElementById('violationNote')?.value||document.getElementById('violationDescription')?.value||''}));return}
  if(f?.id==='rewardForm'){e.preventDefault();e.stopImmediatePropagation();await saveMany('addReward',selectedIds('rewardStudent'),id=>({studentId:id,date:document.getElementById('rewardDate')?.value||new Date().toISOString().slice(0,10),type:document.getElementById('rewardType')?.value||'',formType:document.getElementById('rewardFormType')?.value||'',note:document.getElementById('rewardNote')?.value||''}));return}
},true);
window.__LH_V21_INSTALL__=function(){installSelectors();wrapSave('saveAttendanceRecord','DIEM_DANH');wrapSave('addViolation','VI_PHAM');wrapSave('addReward','KHEN_THUONG');wrapDelete('deleteViolation','VI_PHAM',id=>(window.violationRecords||[]).find(x=>clean(x?.id)===clean(id)));wrapDelete('deleteReward','KHEN_THUONG',id=>(window.rewardRecords||[]).find(x=>clean(x?.id)===clean(id)))};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(window.__LH_V21_INSTALL__,0),{once:true});else setTimeout(window.__LH_V21_INSTALL__,0);
})();
