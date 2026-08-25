/* EVENT DELETE MASTER 15 — VERIFIED REMOTE-ID RESOLUTION + GOOGLE SHEETS SYNC */
(function(){
'use strict';
if(window.__LH_EVENT_DELETE_MASTER_15__)return;
window.__LH_EVENT_DELETE_MASTER_15__=true;
const API='https://script.google.com/macros/s/AKfycbxTPwf-jhrR8JOoKY5ZLuzlsDgcv3nWILtDPTrYNWZCEPpm2rkpXTn-sPAdFaUyy0z_uw/exec';
const S=v=>String(v??'').trim();
const N=v=>S(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function jsonp(params){return new Promise((resolve,reject)=>{const cb='LHDEL15_'+Date.now()+'_'+Math.random().toString(36).slice(2),s=document.createElement('script');let done=false;const finish=(e,d)=>{if(done)return;done=true;clearTimeout(t);try{delete window[cb]}catch(_){}s.remove();e?reject(e):resolve(d)};window[cb]=d=>finish(null,d);s.onerror=()=>finish(Error('Không truy cập được Google Apps Script'));const t=setTimeout(()=>finish(Error('Google Apps Script không phản hồi')),20000);const q=new URLSearchParams({...params,callback:cb,_:Date.now()});s.src=API+'?'+q;document.head.appendChild(s)})}
async function getAll(){const r=await jsonp({action:'get_all'});if(!r?.ok)throw Error(r?.error||'Không đọc được Google Sheets');return r}
function replaceArrayContents(target,source){if(!Array.isArray(target)||!Array.isArray(source))return;target.splice(0,target.length,...source)}
function localList(kind){try{if(kind==='violation'&&Array.isArray(window.violationRecords))return window.violationRecords; if(kind==='reward'&&Array.isArray(window.rewardRecords))return window.rewardRecords; if(kind==='attendance'&&Array.isArray(window.attendanceRecords))return window.attendanceRecords}catch(_){} return []}
function same(a,b){return S(a)===S(b)}
function resolveRemoteId(kind,wanted,remoteRows){
  const sid=S(wanted);if(!sid)return '';
  const direct=remoteRows.find(x=>same(x?.id,sid));if(direct)return S(direct.id);
  const local=localList(kind).find(x=>same(x?.id,sid));
  if(!local)return '';
  const candidates=remoteRows.filter(x=>same(x?.studentId,local.studentId)&&same(x?.date,local.date));
  const exact=candidates.find(x=>same(x?.type,local.type)&&same(x?.level,local.level)&&same(x?.status,local.status)&&same(x?.action,local.action)&&same(x?.note,local.note));
  if(exact)return S(exact.id);
  const relaxed=candidates.find(x=>same(x?.type,local.type)&&same(x?.note,local.note));
  if(relaxed)return S(relaxed.id);
  const byType=candidates.find(x=>same(x?.type,local.type));
  if(byType)return S(byType.id);
  return '';
}
function syncVerifiedState(sheet,rows){
  if(!Array.isArray(rows))return;
  try{
    if(sheet==='VI_PHAM'){
      if(Array.isArray(window.violationRecords))replaceArrayContents(window.violationRecords,rows);
      if(window.APP_DATA?.violations&&window.APP_DATA.violations!==window.violationRecords)replaceArrayContents(window.APP_DATA.violations,rows);
    }else if(sheet==='KHEN_THUONG'){
      if(Array.isArray(window.rewardRecords))replaceArrayContents(window.rewardRecords,rows);
      if(window.APP_DATA?.rewards&&window.APP_DATA.rewards!==window.rewardRecords)replaceArrayContents(window.APP_DATA.rewards,rows);
    }else if(sheet==='DIEM_DANH'){
      if(Array.isArray(window.attendanceRecords))replaceArrayContents(window.attendanceRecords,rows);
      if(window.APP_DATA?.attendance&&window.APP_DATA.attendance!==window.attendanceRecords)replaceArrayContents(window.APP_DATA.attendance,rows);
    }
  }catch(e){console.warn('[LH DELETE] Không thể đồng bộ state:',e)}
}
function updateVisibleCounts(){
  try{
    const v=Array.isArray(window.violationRecords)?window.violationRecords.length:0;
    const r=Array.isArray(window.rewardRecords)?window.rewardRecords.length:0;
    ['violationBadge','statViolations'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(v)});
    ['rewardBadge','statRewards'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=String(r)});
  }catch(_){}
}
async function remoteDelete(kind,id){
  const wanted=S(id);if(!wanted)throw Error('Thiếu ID bản ghi');
  const sheet=kind==='reward'?'KHEN_THUONG':kind==='violation'?'VI_PHAM':'DIEM_DANH';
  const all=await getAll();
  const rows=Array.isArray(all[sheet])?all[sheet]:[];
  const realId=resolveRemoteId(kind,wanted,rows);
  if(!realId)throw Error('Không xác định được ID bản ghi tương ứng trong '+sheet);
  const action=kind==='reward'?'delete_reward':'delete_event';
  const r=await jsonp({action,sheet,id:realId,recordId:realId,eventId:realId});
  if(!r?.ok||r.deleted!==true||Number(r.deletedCount||0)<1)throw Error(r?.error||'Google Sheets không xác nhận đã xóa');
  const after=await getAll();
  const afterRows=Array.isArray(after[sheet])?after[sheet]:[];
  if(afterRows.some(x=>same(x?.id,realId)))throw Error('Bản ghi vẫn còn trên Google Sheets sau khi xóa');
  return {...r,requestedId:wanted,realId,__verifiedRows:afterRows};
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
window.LH_DELETE_EVENT_MASTER_15={deleteOne,remoteDelete,refresh,syncVerifiedState,resolveRemoteId};
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-violation-delete]');
  if(b){e.preventDefault();e.stopImmediatePropagation();deleteOne('violation',b.dataset.violationDelete);return}
  const r=e.target.closest?.('[data-reward-delete]');
  if(r){e.preventDefault();e.stopImmediatePropagation();deleteOne('reward',r.dataset.rewardDelete);return}
  const d=e.target.closest?.('[data-lh-delete-id]');
  if(d){e.preventDefault();e.stopImmediatePropagation();deleteOne(S(d.dataset.lhDeleteKind)==='reward'?'reward':'violation',d.dataset.lhDeleteId);return}
},true);
})();