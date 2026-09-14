/* STATIC SAVE HARD FIX 2026-09-14 — canonical handler for ev-static-modal #eSave */
(function(){
'use strict';
if(window.__LH_STATIC_SAVE_HARDFIX_20260914__)return;
window.__LH_STATIC_SAVE_HARDFIX_20260914__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const ok=r=>!!(r&&(r.ok===true||r.saved===true||r.stored===true));
const toast=(m,t='info')=>{try{window.showToast?window.showToast(m,t):console.log(m)}catch(_){} };
function jsonp(action,params={}){return new Promise((resolve,reject)=>{const cb='__LHSTATIC_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)};const timer=setTimeout(()=>finish(Error('Google Apps Script không phản hồi sau 20 giây.')),20000);window[cb]=d=>finish(null,d);sc.onerror=()=>finish(Error('Không truy cập được Google Apps Script.'));const q=Object.assign({action,callback:cb,_:Date.now()},params);sc.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(typeof q[k]==='string'?q[k]:JSON.stringify(q[k]))).join('&');document.head.appendChild(sc)})}
function getStudents(){const a=typeof window.getStudentsSafe==='function'?window.getStudentsSafe():window.students;return Array.isArray(a)?a:[]}
function resolve(v){const x=S(v);if(!x)return null;return getStudents().find(s=>S(s.id)===x||S(s.studentCode||s.code)===x||S(s.name)===x)||null}
function selectedStudents(modal){
 const sel=modal.querySelector('#eStudent');
 const checked=[...modal.querySelectorAll('.lh-csp-list input[type="checkbox"]:checked')].map(x=>resolve(x.value)).filter(Boolean);
 if(checked.length)return [...new Map(checked.map(s=>[S(s.id),s])).values()];
 if(!sel)return [];
 const vals=sel.multiple?[...sel.options].filter(o=>o.selected).map(o=>o.value):[sel.value];
 return [...new Map(vals.map(resolve).filter(Boolean).map(s=>[S(s.id),s])).values()];
}
function localMerge(sheet,rec){const map={VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'},name=map[sheet],arr=window[name];if(!Array.isArray(arr))return;const i=arr.findIndex(x=>S(x?.id)===S(rec.id));if(i<0)arr.push(rec);else arr[i]=rec;try{window.syncAppDataReferences?.();window.saveClassData?.()}catch(_){} }
async function saveModal(modal,button){
 if(modal.dataset.lhStaticSaving==='1')return;
 modal.dataset.lhStaticSaving='1';
 const old=button.innerHTML;button.disabled=true;button.innerHTML='Đang lưu...';
 try{
   const isV=!!modal.querySelector('#eLevel');
   const sheet=isV?'VI_PHAM':'KHEN_THUONG';
   const students=selectedStudents(modal);
   const type=S(modal.querySelector('#eType')?.value);
   if(!students.length)throw Error('Vui lòng chọn ít nhất một học sinh.');
   if(!type)throw Error('Vui lòng chọn nội dung.');
   const date=S(modal.querySelector('#eDate')?.value)||(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
   const note=S(modal.querySelector('#eNote')?.value);
   let saved=0;
   for(const student of students){
     const record={studentId:S(student.id),studentName:S(student.name),date,type,note};
     if(isV){record.level=S(modal.querySelector('#eLevel')?.value)||'light';record.status=S(modal.querySelector('#eStatus')?.value)||'monitoring';record.action=S(modal.querySelector('#eAction')?.value)||''}
     else record.formType=S(modal.querySelector('#eForm')?.value)||'praise';
     const r=await jsonp('save_event',{payload:JSON.stringify({sheet,record})});
     if(!ok(r))throw Error(S(r?.error||r?.message||'Google Sheets không xác nhận đã lưu.'));
     record.id=S(r.id)||('EV_'+Date.now()+'_'+Math.random().toString(36).slice(2,8));
     localMerge(sheet,record);
     saved++;
   }
   modal.remove();
   try{window.syncGoogleSheetsNow?.()}catch(_){}
   try{window.LHRefreshViolationsLive?.()}catch(_){}
   try{window.refreshAll?.()}catch(_){}
   toast(`Đã lưu ${saved} học sinh thành công.`,'success');
 }catch(e){toast('Lưu thất bại: '+S(e?.message||e),'error')}
 finally{modal.dataset.lhStaticSaving='';button.disabled=false;button.innerHTML=old}
}
function intercept(e){
 const target=e.target instanceof Element?e.target:null;if(!target)return;
 const button=target.closest('.ev-static-modal #eSave');if(!button)return;
 const modal=button.closest('.ev-static-modal');if(!modal)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();saveModal(modal,button);
}
window.addEventListener('click',intercept,true);
})();
