/* MASTER UI FINAL FIX 2026-08-25
   - ONE navigation item per data-page
   - ONE "HS xuất sắc toàn diện" control in statistics
   - DIRECT Google Apps Script delete for DIEM_DANH / VI_PHAM / KHEN_THUONG
   - Delete from statistics removes the real Google Sheets row, then refreshes UI
   - No delete is considered successful until GAS confirms it
   - Cache-busted runtime, safe event delegation, MutationObserver
*/
(function(){
'use strict';
if(window.__LH_MASTER_UI_FINAL_FIX_20260825__) return;
window.__LH_MASTER_UI_FINAL_FIX_20260825__=true;

const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const norm=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/\s+/g,' ').trim();

function toast(msg,type){try{if(typeof window.showToast==='function'){window.showToast(msg,type);return}}catch(_){} console.log(msg)}
function jsonp(action,params){return new Promise((resolve,reject)=>{
  const cb='LHMASTER_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const sc=document.createElement('script'); let done=false;
  const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);try{delete window[cb]}catch(_){}sc.remove();err?reject(err):resolve(data)};
  const timer=setTimeout(()=>finish(new Error('Google Apps Script không phản hồi sau 20 giây')),20000);
  window[cb]=d=>finish(null,d); sc.onerror=()=>finish(new Error('Không truy cập được Google Apps Script'));
  const q=Object.assign({action,callback:cb,_:Date.now()},params||{});
  sc.src=API+'?'+Object.keys(q).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(S(q[k]))).join('&');
  document.head.appendChild(sc);
})}

function studentByName(name){
  const n=norm(name);
  const list=Array.isArray(window.students)?window.students:[];
  return list.find(x=>norm(x&&x.name)===n)||null;
}
function recordStudentId(r){return S(r&& (r.studentId||r.studentID||r.hsId||r.student_id));}
function recordName(r){return S(r&&(r.studentName||r.name||r.student));}
function recordDate(r){return S(r&&(r.date||r.attendanceDate||r.createdAt||r.timestamp));}

async function remoteDelete(sheet,id){
  const rid=S(id); if(!rid) throw new Error('Thiếu recordId.');
  const r=await jsonp('delete_event',{sheet,id:rid,recordId:rid,eventId:rid});
  if(!r || r.ok!==true || r.deleted!==true) throw new Error((r&&r.error)||('Google Sheets chưa xác nhận xóa '+rid));
  return r;
}

function removeLocal(kind,id){
  const map={attendance:'attendanceRecords',violation:'violationRecords',reward:'rewardRecords'};
  const key=map[kind], list=window[key]; if(!Array.isArray(list))return;
  const rid=S(id);
  for(let i=list.length-1;i>=0;i--) if(S(list[i]&&list[i].id)===rid) list.splice(i,1);
  try{if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences()}catch(_){}
}
function refreshUI(kind){
  try{if(kind==='attendance'&&typeof window.renderAttendance==='function')window.renderAttendance()}catch(_){}
  try{if(kind==='violation'&&typeof window.renderViolations==='function')window.renderViolations()}catch(_){}
  try{if(kind==='reward'&&typeof window.renderRewards==='function')window.renderRewards()}catch(_){}
  try{if(typeof window.renderStatistics==='function')window.renderStatistics()}catch(_){}
  try{if(typeof window.refreshStatistics==='function')window.refreshStatistics()}catch(_){}
  try{if(typeof window.updateBadges==='function')window.updateBadges()}catch(_){}
  try{window.dispatchEvent(new Event('google-sheets-refresh'))}catch(_){}
}

async function deleteRecord(kind,id){
  const cfg={attendance:'DIEM_DANH',violation:'VI_PHAM',reward:'KHEN_THUONG'}[kind];
  if(!cfg)throw new Error('Loại dữ liệu không hợp lệ.');
  if(!confirm('Xóa đúng 1 lượt trên Google Sheets?\nCác lượt khác vẫn được giữ nguyên.'))return false;
  try{
    await remoteDelete(cfg,id);
    removeLocal(kind,id);
    refreshUI(kind);
    toast('Đã xóa và xác nhận trên Google Sheets.','success');
    return true;
  }catch(e){toast('Xóa thất bại: '+e.message,'error');return false}
}

function latestAttendance(studentId,name){
  const list=Array.isArray(window.attendanceRecords)?window.attendanceRecords:[];
  const n=norm(name), sid=S(studentId);
  const rows=list.filter(r=>{
    const rs=recordStudentId(r), rn=norm(recordName(r));
    return (sid&&rs===sid)||(n&&rn===n);
  });
  rows.sort((a,b)=>recordDate(b).localeCompare(recordDate(a)));
  return rows[0]||null;
}

function statsDeleteButton(btn){
  const row=btn.closest('tr'); if(!row)return false;
  const cells=row.querySelectorAll('td'); if(cells.length<2)return false;
  const name=S(cells[1].textContent);
  const st=studentByName(name);
  const rec=latestAttendance(st&&st.id,name);
  if(!rec||!S(rec.id)){toast('Không tìm thấy ID lượt điểm danh thật trên dữ liệu Google Sheets.','error');return true}
  deleteRecord('attendance',rec.id);
  return true;
}

function normalizeMenus(){
  const seen=new Set();
  document.querySelectorAll('.main-menu .menu-item[data-page]').forEach(el=>{
    const p=S(el.getAttribute('data-page')); if(!p)return;
    if(seen.has(p)) el.remove(); else seen.add(p);
  });
  const stats=document.querySelector('#page-statistics,[data-page-section="statistics"]');
  if(!stats)return;
  const seenExcellent=new Set();
  stats.querySelectorAll('button,a,[role="button"],h2,h3,h4').forEach(el=>{
    const t=norm(el.textContent);
    if(t==='hs xuat sac toan dien' || t==='xuat sac toan dien'){
      if(seenExcellent.size){el.remove()}else seenExcellent.add('x');
    }
  });
}

function bindDeleteDelegation(){
  if(window.__LH_MASTER_DELETE_DELEGATE__)return;
  window.__LH_MASTER_DELETE_DELEGATE__=true;
  document.addEventListener('click',function(e){
    const b=e.target.closest&&e.target.closest('[data-lh-delete-id]');
    if(b){
      e.preventDefault();e.stopImmediatePropagation();
      const k=S(b.dataset.lhDeleteKind||'violation');
      const id=S(b.dataset.lhDeleteId);
      if(k==='attendance'||k==='reward'||k==='violation')deleteRecord(k,id);
      return;
    }
    const p=e.target.closest&&e.target.closest('#page-statistics,[data-page-section="statistics"]');
    if(!p)return;
    const btn=e.target.closest('button,a,[role="button"]');
    if(!btn)return;
    const text=norm(btn.textContent);
    if(text!=='xoa'&&text!=='xoa luot'&&!text.includes('xoa'))return;
    e.preventDefault();e.stopImmediatePropagation();
    statsDeleteButton(btn);
  },true);
}

function install(){
  bindDeleteDelegation(); normalizeMenus();
  const mo=new MutationObserver(()=>normalizeMenus());
  mo.observe(document.body,{childList:true,subtree:true});
  window.LH_MASTER_UI_FINAL={deleteRecord,remoteDelete,normalizeMenus};
  console.log('[LH MASTER FINAL] UI/delete bridge active');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
