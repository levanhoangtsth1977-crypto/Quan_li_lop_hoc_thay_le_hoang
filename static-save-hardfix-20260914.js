/* STATIC SAVE HARD FIX 2026-09-14 v1.1 — mobile-safe canonical handler */
(function(){
'use strict';
if(window.__LH_STATIC_SAVE_HARDFIX_20260914_V11__)return;
window.__LH_STATIC_SAVE_HARDFIX_20260914_V11__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const ok=r=>!!(r&&(r.ok===true||r.saved===true||r.stored===true));
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_){} };
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function jsonp(action,params={}){return new Promise((resolve,reject)=>{const cb='__LHSTATIC11_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)};const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi sau 15 giây.')),15000);window[cb]=d=>finish(null,d);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script.'));const q=Object.assign({action,callback:cb,_:Date.now()},params);sc.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(sc)})}
function getStudents(){try{if(typeof window.getGoogleStudentRoster==='function'){const a=window.getGoogleStudentRoster();if(Array.isArray(a)&&a.length)return a}}catch(_){}try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(_){}return Array.isArray(window.students)?window.students:[]}
function resolve(v){const x=S(typeof v==='object'?(v?.value??v?.studentId??v?.id??v?.name):v);if(!x)return null;return getStudents().find(s=>S(s.id)===x||S(s.studentCode||s.code)===x||S(s.name)===x)||null}
function selectedStudents(modal){
 const checked=[...modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>resolve(x.value)).filter(Boolean);
 if(checked.length)return [...new Map(checked.map(s=>[S(s.id),s])).values()];
 const sel=modal.querySelector('#eStudent');if(!sel)return[];
 const vals=sel.multiple?[...sel.options].filter(o=>o.selected).map(o=>o.value):[sel.value];
 return [...new Map(vals.map(resolve).filter(Boolean).map(s=>[S(s.id),s])).values()];
}
function localMerge(sheet,rec){const map={VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'},name=map[sheet],arr=window[name];if(!Array.isArray(arr))return;const i=arr.findIndex(x=>S(x?.id)===S(rec.id));if(i<0)arr.push(rec);else arr[i]=rec;try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){} }
function localOnly(sheet,rec){try{localMerge(sheet,rec);if(sheet==='VI_PHAM')window.LHRefreshViolationsLive?.();return true}catch(_){return false}}
async function cloudSave(sheet,record){const r=await jsonp('save_event',{payload:JSON.stringify({sheet,record})});if(!ok(r))throw Error(S(r?.error||r?.message||'Google Sheets không xác nhận đã lưu.'));return r}
async function saveModal(modal,button){
 if(modal.dataset.lhStaticSaving==='1')return;
 modal.dataset.lhStaticSaving='1';
 const old=button.innerHTML;button.disabled=true;button.innerHTML='Đang lưu...';
 try{
   const isV=!!modal.querySelector('#eLevel');
   const sheet=isV?'VI_PHAM':'KHEN_THUONG';
   const selected=selectedStudents(modal);
   const type=S(modal.querySelector('#eType')?.value);
   if(!selected.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
   if(!type)throw Error('Vui lòng chọn nội dung.');
   const date=S(modal.querySelector('#eDate')?.value)||today();
   const note=S(modal.querySelector('#eNote')?.value);
   let localSaved=0,cloudSaved=0,failed=[];
   for(const student of selected){
     const record={id:'',studentId:S(student.id),studentName:S(student.name),date,type,note,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
     if(isV){record.level=S(modal.querySelector('#eLevel')?.value)||'light';record.status=S(modal.querySelector('#eStatus')?.value)||'monitoring';record.action=S(modal.querySelector('#eAction')?.value)||''}
     else record.formType=S(modal.querySelector('#eForm')?.value)||'praise';
     // Ghi local trước để thao tác trên điện thoại không bị mất khi mạng/CORS/API lỗi.
     const localId='EV_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
     record.id=localId;
     if(localOnly(sheet,record))localSaved++;
     try{
       const r=await cloudSave(sheet,record);
       record.id=S(r.id)||record.id;
       localMerge(sheet,record);
       cloudSaved++;
     }catch(e){failed.push(S(e?.message||e))}
   }
   // Chỉ đồng bộ từ Google khi cloud thực sự có bản ghi; tránh xóa bản ghi local vừa lưu.
   if(cloudSaved>0){try{await window.syncGoogleSheetsNow?.();}catch(_){} }
   try{window.LHRefreshViolationsLive?.()}catch(_){}
   try{window.refreshAll?.()}catch(_){}
   modal.remove();
   if(cloudSaved===selected.length)toast(`Đã lưu ${cloudSaved} học sinh vào Google Sheets.`,'success');
   else if(localSaved===selected.length)toast(`Đã lưu ${localSaved} học sinh trên điện thoại. Google Sheets chưa phản hồi.`,'warning');
   else toast(`Đã lưu ${localSaved} học sinh; Google Sheets lưu được ${cloudSaved}/${selected.length}.`,'warning');
 }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}
 finally{modal.dataset.lhStaticSaving='';button.disabled=false;button.innerHTML=old}
}
function targetButton(e){const t=e.target instanceof Element?e.target:null;return t?.closest?.('.ev-static-modal #eSave')||null}
function intercept(e){const button=targetButton(e);if(!button)return;const modal=button.closest('.ev-static-modal');if(!modal)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,button)}
window.addEventListener('pointerup',intercept,true);
window.addEventListener('touchend',intercept,true);
window.addEventListener('click',intercept,true);
// Bắt cả trường hợp nút được tạo lại sau khi mở modal trên thiết bị di động.
new MutationObserver(()=>{document.querySelectorAll('.ev-static-modal #eSave').forEach(b=>{if(b.dataset.lhStaticBound==='1')return;b.dataset.lhStaticBound='1';b.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(b.closest('.ev-static-modal'),b)},true)})}).observe(document.documentElement,{childList:true,subtree:true});
})();
