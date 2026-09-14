/* VI PHẠM DISPLAY LIVE FIX 1.2 — authoritative live renderer
 * - Đọc trực tiếp VI_PHAM từ Google Apps Script.
 * - Không loại bản ghi chỉ vì studentId lệch danh sách HOC_SINH.
 * - Chạy lại sau khi router/render cũ hoàn tất để không bị renderer cũ ghi đè.
 */
(function(){
'use strict';
if(window.__LH_VIOLATION_DISPLAY_LIVE_12__)return;
window.__LH_VIOLATION_DISPLAY_LIVE_12__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const E=v=>S(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
const fmt=v=>{const s=S(v),m=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return m?`${m[3].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[1]}`:s};
function jsonp(params={}){return new Promise((resolve,reject)=>{const cb='__LH_VIO_LIST12_'+Date.now()+'_'+Math.random().toString(36).slice(2),sc=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}sc.remove();e?reject(e):resolve(d)};const t=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi.')),20000);window[cb]=d=>finish(null,d);sc.onerror=()=>finish(new Error('Không thể đọc dữ liệu Google Sheets.'));const q=new URLSearchParams({callback:cb,_:Date.now(),...(params||{}),action:(params&&params.action)||'get_events'});sc.src=API+'?'+q.toString();document.head.appendChild(sc)})}
function rowsFrom(data){return Array.isArray(data?.VI_PHAM)?data.VI_PHAM.filter(r=>S(r?.id)&&(S(r?.studentId)||S(r?.studentName)||S(r?.name))&&(S(r?.type)||S(r?.content)||S(r?.noiDung))):[]}
function nameMap(students){const m=new Map();(Array.isArray(students)?students:[]).forEach(s=>m.set(S(s.id),S(s.name||s.studentName)));return m}
async function refresh(){
 const page=document.getElementById('page-violations'),body=document.getElementById('violationTableBody');
 if(!page||!body)return;
 const r=await jsonp({action:'get_events'});const rows=rowsFrom(r);let students=[];
 try{const sr=await jsonp({action:'get_students'});students=Array.isArray(sr?.students)?sr.students:[]}catch(_){}
 const nm=nameMap(students);const search=S(page.querySelector('.lh-events-search')?.value).toLowerCase();
 const list=rows.filter(r=>{const n=S(r.studentName)||S(r.name)||nm.get(S(r.studentId))||S(r.studentId)||'Học sinh';const q=S(r.type||r.content||r.noiDung);return !search||n.toLowerCase().includes(search)||q.toLowerCase().includes(search)}).sort((a,b)=>S(b.date).localeCompare(S(a.date))||S(b.createdAt).localeCompare(S(a.createdAt)));
 const count=page.querySelector('[data-lh-count]');if(count)count.textContent=`${list.length} bản ghi`;
 const badge=document.getElementById('violationBadge');if(badge)badge.textContent=String(rows.length);
 if(!list.length){body.innerHTML='<tr><td colspan="6"><div class="empty-state"><strong>Chưa có dữ liệu vi phạm</strong></div></td></tr>';return;}
 body.innerHTML=list.map((r,i)=>{const n=S(r.studentName)||S(r.name)||nm.get(S(r.studentId))||S(r.studentId)||'Học sinh';const content=S(r.type||r.content||r.noiDung||'—');const action=S(r.action||r.resolution||r.handling||r.level||'—');return `<tr><td>${i+1}</td><td><strong>${E(n)}</strong></td><td>${E(fmt(r.date))}</td><td>${E(content)}</td><td>${E(action)}</td><td><button type="button" class="icon-button" title="Sửa" data-lh-edit="${E(r.id)}">✎</button><button type="button" class="icon-button danger" title="Xóa" data-lh-delete="${E(r.id)}">🗑</button></td></tr>`}).join('');
 body.querySelectorAll('[data-lh-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Xóa đúng bản ghi này trên Google Sheets?'))return;try{await jsonp({action:'delete_event',sheet:'VI_PHAM',id:b.dataset.lhDelete,eventId:b.dataset.lhDelete,recordId:b.dataset.lhDelete});await refresh()}catch(e){alert('Xóa thất bại: '+S(e.message))}});
}
window.LHRefreshViolationsLive=refresh;
function schedule(){setTimeout(()=>refresh().catch(e=>console.warn('[VI PHẠM DISPLAY 1.2]',e.message)),50);setTimeout(()=>refresh().catch(()=>{}),700);setTimeout(()=>refresh().catch(()=>{}),1800)}
function boot(){
 schedule();
 window.addEventListener('lh-page-change',e=>{if(e?.detail?.page==='violations')schedule()});
 window.addEventListener('google-sheets-data-ready',()=>schedule());
 document.addEventListener('click',e=>{if(e.target?.closest?.('#violationForm button[type="submit"],#eSave'))setTimeout(()=>refresh().catch(()=>{}),1200)},true);
 const page=document.getElementById('page-violations');if(page)page.addEventListener('input',e=>{if(e.target.matches('.lh-events-search'))refresh().catch(()=>{})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
