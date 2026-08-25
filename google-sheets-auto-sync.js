/* GOOGLE SHEETS AUTO SYNC 2.0 — KHÔNG TÁI TẠO BẢN GHI ĐÃ XÓA */
(function(){
'use strict';
if(window.__LH_GOOGLE_AUTO_SYNC_20__)return;
window.__LH_GOOGLE_AUTO_SYNC_20__=true;
const MAP={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'};
const clean=v=>String(v==null?'':v).trim();
const KEY='LH_DELETED_EVENT_IDS_20260825';
function readDeleted(){try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(_){return new Set()}}
function writeDeleted(set){try{localStorage.setItem(KEY,JSON.stringify([...set].slice(-2000)))}catch(_){}
}
function markDeleted(id){const x=clean(id);if(!x)return;const s=readDeleted();s.add(x);writeDeleted(s)}
window.LH_MARK_EVENT_DELETED=markDeleted;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function list(tab){const a=window[MAP[tab]];return Array.isArray(a)?a:[]}
function snapshot(){const out={};Object.keys(MAP).forEach(t=>out[t]=list(t).map(r=>Object.assign({},r)));return out}
function ids(tab){return new Set(list(tab).map(r=>clean(r&&r.id)).filter(Boolean))}
async function syncMissing(before){
 if(typeof window.saveRecordToGoogleSheets!=='function')return;
 const deleted=readDeleted();
 for(const tab of Object.keys(MAP)){
   const remote=ids(tab);
   for(const r of before[tab]||[]){
     const id=clean(r&&r.id),sid=clean(r&&r.studentId);
     if(!id||!sid||remote.has(id)||deleted.has(id))continue;
     try{await window.saveRecordToGoogleSheets(tab,r);remote.add(id)}catch(e){console.error('[LH AUTO SYNC]',tab,id,e)}
   }
 }
}
async function initial(){const before=snapshot();try{if(typeof window.syncGoogleSheetEvents==='function')await window.syncGoogleSheetEvents()}catch(e){console.error('[LH AUTO SYNC] pull',e)}await sleep(500);await syncMissing(before)}
let known={DIEM_DANH:new Set(),VI_PHAM:new Set(),KHEN_THUONG:new Set()};
function seed(){Object.keys(MAP).forEach(t=>known[t]=ids(t))}
async function scan(){
 if(typeof window.saveRecordToGoogleSheets!=='function')return;
 const deleted=readDeleted();
 for(const tab of Object.keys(MAP))for(const r of list(tab)){
   const id=clean(r&&r.id),sid=clean(r&&r.studentId);
   if(!id||!sid||known[tab].has(id)||deleted.has(id))continue;
   known[tab].add(id);
   try{await window.saveRecordToGoogleSheets(tab,r)}catch(e){known[tab].delete(id);console.error('[LH AUTO SYNC]',tab,id,e)}
 }
}
async function start(){for(let i=0;i<20;i++){if(typeof window.saveRecordToGoogleSheets==='function')break;await sleep(500)}await initial();seed();setInterval(scan,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
