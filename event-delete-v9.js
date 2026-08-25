/* EVENT DELETE MASTER 13 — GOOGLE SHEETS VERIFIED DELETE + UI STATE SYNC */
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_MASTER_13__)return;
window.__LH_EVENT_DELETE_MASTER_13__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
function jsonp(params){return new Promise((resolve,reject)=>{const cb='LHDEL13_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)};window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));const t=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),20000);const q=new URLSearchParams({...params,callback:cb,_:Date.now()});s.src=API+'?'+q;document.head.appendChild(s)})}
async function getAll(){const r=await jsonp({action:'get_all'});if(!r?.ok)throw Error(r?.error||'Không đọc được Google Sheets');return r}
function replaceArrayContents(target,source){if(!Array.isArray(target)||!Array.isArray(source))return;target.splice(0,target.length,...source)}
function syncVerifiedState(sheet,rows){
  if(!Array.isArray(rows))return;
  try{
    if(sheet==='VI_PHAM'){
      if(typeof violationRecords!=='undefined')replaceArrayContents(violationRecords,rows);
      if(window.APP_DATA?.violations&&window.APP_DATA.violations!==violationRecords)replaceArrayContents(window.APP_DATA.violations,rows);
    }else if(sheet==='KHEN_THUONG'){
      if(typeof rewardRecords!=='undefined')replaceArrayContents(rewardRecords,rows);
      if(window.APP_DATA?.rewards&&window.APP_DATA.rewards!==rewardRecords)replaceArrayContents(window.APP_DATA.rewards,rows);
    }else if(sheet==='DIEM_DANH'){
      if(typeof attendanceRecords!=='undefined')replaceArrayContents(attendanceRecords,rows);
      if(window.APP_DATA?.attendance&&window.APP_DATA.attendance!==attendanceRecords)replaceArrayContents(window.APP_DATA.attendance,rows);
    }
  }catch(e){console.warn('[LH DELETE] Không thể đồng bộ state:',e)}
}
function updateVisibleCounts(){
  try{
    const v=typeof violationRecords!=='undefined'&&Array.isArray(violationRecords)?violationRecords.length:0;
    const r=typeof rewardRecords!=='undefined'&&Array.isArray(rewardRecords)?rewardRecords.length:0;
    ['violationBadge','statViolations'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(v)});
    ['rewardBadge','statRewards'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(r)});
  }catch(e){}
}
async function remoteDelete(kind,id){
  const sid=S(id);if(!sid)throw Error('Thiếu ID bản ghi');
  const sheet=kind==='reward'?'KHEN_THUONG':kind==='violation'?'VI_PHAM':'DIEM_DANH';
  const action=kind==='reward'?'delete_reward':kind==='violation'?'delete_violation':'delete_event';
  const r=await jsonp({action,sheet,id:sid,recordId:sid,eventId:sid});
  if(!r?.ok||r.deleted!==true||Number(r.deletedCount||0)<1)throw Error(r?.error||'Google Sheets không xác nhận đã xóa');
  const after=await getAll();
  if(Array.isArray(after[sheet])&&after[sheet].some(x=>S(x.id)===sid))throw Error('Bản ghi vẫn còn trên Google Sheets sau khi xóa');
  return {...r,__verifiedRows:Array.isArray(after[sheet])?after[sheet]:[]};
}
function refresh(kind,verifiedRows){
  try{
    const sheet=kind==='reward'?'KHEN_THUONG':kind==='violation'?'VI_PHAM':'DIEM_DANH';
    syncVerifiedState(sheet,verifiedRows);
    updateVisibleCounts();
    if(typeof window.syncAppDataReferences==='function')window.syncAppDataReferences();
    if(kind==='reward'&&typeof window.renderRewards==='function')window.renderRewards();
    if(kind==='violation'&&typeof window.renderViolations==='function')window.renderViolations();
    if(kind==='violation'&&window.__LH_VIOLATIONS_MENU_API__?.refresh)window.__LH_VIOLATIONS_MENU_API__.refresh();
    if(kind==='attendance'&&window.__LH_EVENT_SUMMARY_API__)window.__LH_EVENT_SUMMARY_API__.refreshAll();
  }catch(e){console.warn('[LH DELETE] refresh:',e)}
  window.dispatchEvent(new CustomEvent('google-sheets-refresh',{detail:{kind,verified:true}}));
}
async function deleteOne(kind,id){
  if(!S(id))return false;
  if(!confirm('Xóa đúng 1 lượt này khỏi Google Sheets?'))return false;
  try{
    const result=await remoteDelete(kind,id);
    refresh(kind,result.__verifiedRows);
    window.showToast&&window.showToast('Đã xóa và đồng bộ lại giao diện theo Google Sheets.','success');
    return true;
  }catch(e){window.showToast&&window.showToast('Không thể xóa — '+e.message,'error');return false}
}
window.deleteViolation=id=>deleteOne('violation',id);
window.deleteReward=id=>deleteOne('reward',id);
window.deleteAttendance=id=>deleteOne('attendance',id);
window.LH_DELETE_EVENT_MASTER_13={deleteOne,remoteDelete,refresh,syncVerifiedState};
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-violation-delete]');
  if(b){e.preventDefault();e.stopImmediatePropagation();deleteOne('violation',b.dataset.violationDelete);return}
  const r=e.target.closest?.('[data-reward-delete]');
  if(r){e.preventDefault();e.stopImmediatePropagation();deleteOne('reward',r.dataset.rewardDelete);return}
  const d=e.target.closest?.('[data-lh-delete-id]');
  if(d){e.preventDefault();e.stopImmediatePropagation();deleteOne(S(d.dataset.lhDeleteKind)==='reward'?'reward':'violation',d.dataset.lhDeleteId);return}
},true);
})();
