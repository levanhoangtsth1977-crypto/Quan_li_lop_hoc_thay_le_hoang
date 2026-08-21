/* GOOGLE SHEETS BULK RECONCILE 2.0 — KHÔNG BỎ SÓT NHIỀU HỌC SINH */
(function(){
'use strict';
if(window.__LH_GOOGLE_BULK_RECONCILE_20__)return;
window.__LH_GOOGLE_BULK_RECONCILE_20__=true;
const MAP={DIEM_DANH:'attendanceRecords',VI_PHAM:'violationRecords',KHEN_THUONG:'rewardRecords'};
const STORAGE_KEYS=['QL_LOP_HOC_LE_HOANG_2026_2027','QL_LOP_HOC_LE_HOANG'];
const clean=v=>String(v==null?'':v).trim();
function arr(tab){const a=window[MAP[tab]];return Array.isArray(a)?a:[]}
function localBackup(){for(const key of STORAGE_KEYS){try{const raw=localStorage.getItem(key);if(!raw)continue;const d=JSON.parse(raw);if(!d||typeof d!=='object')continue;const src={DIEM_DANH:d.attendance||d.attendanceRecords,VI_PHAM:d.violations||d.violationRecords,KHEN_THUONG:d.rewards||d.rewardRecords};Object.keys(MAP).forEach(tab=>{const a=src[tab];if(!Array.isArray(a))return;const target=arr(tab);const ids=new Set(target.map(r=>clean(r&&r.id)));a.forEach(r=>{const id=clean(r&&r.id),sid=clean(r&&r.studentId);if(id&&sid&&!ids.has(id)){target.push(Object.assign({},r));ids.add(id)}})});return true}catch(e){console.warn('[LH BULK] localStorage',e)}}return false}
async function pushAll(){if(typeof window.saveRecordToGoogleSheets!=='function')return;localBackup();for(const tab of Object.keys(MAP)){const list=arr(tab).slice();for(const r of list){const id=clean(r&&r.id),sid=clean(r&&r.studentId);if(!id||!sid)continue;try{await window.saveRecordToGoogleSheets(tab,r)}catch(e){console.warn('[LH BULK]',tab,id,e.message)}}}}
async function run(){try{await pushAll();console.log('[LH BULK] Đã quét và đồng bộ toàn bộ record')}catch(e){console.error('[LH BULK]',e)}}
function start(){setTimeout(run,2500);setInterval(run,5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
