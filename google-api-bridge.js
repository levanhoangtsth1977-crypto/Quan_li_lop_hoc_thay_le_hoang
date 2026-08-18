/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 3.1.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
  url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
  timeout: 15000,
  verifyRetries: 8,
  verifyDelay: 1000,
  version: "3.1.0",
  masterRosterUrl: "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-3",
  masterRosterCount: 42
});

function normalizeStudentForBridge(student,index){
  const s=student&&typeof student==="object"?student:{};
  const fallback=`HS${String(index+1).padStart(2,"0")}`;
  return {id:String(s.id||s.studentId||fallback).trim(),studentCode:String(s.studentCode||s.code||fallback).trim(),name:String(s.name||s.studentName||"").trim(),gender:String(s.gender||"").trim(),birthDate:String(s.birthDate||s.dateOfBirth||"").trim(),status:String(s.status||"active").trim(),parentName:String(s.parentName||"").trim(),phone:String(s.phone||"").trim(),address:String(s.address||"").trim(),note:String(s.note||"").trim(),shareEnabled:s.shareEnabled!==false,createdAt:String(s.createdAt||"").trim(),updatedAt:String(s.updatedAt||"").trim()};
}
function validRoster(list){return Array.isArray(list)&&list.length===42&&list.every((s,i)=>s&&s.name&&String(s.name).trim()&&s.id&&s.studentCode);}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function api(action,params={}){const c=new AbortController();const t=setTimeout(()=>c.abort(),GOOGLE_API_CONFIG.timeout);try{const q=new URLSearchParams({action,...params});const r=await fetch(`${GOOGLE_API_CONFIG.url}?${q}`,{cache:"no-store",signal:c.signal});if(!r.ok)throw new Error(`API HTTP ${r.status}`);return await r.json();}finally{clearTimeout(t);}}
async function loadMasterRoster(){const r=await fetch(GOOGLE_API_CONFIG.masterRosterUrl,{cache:"no-store",credentials:"same-origin"});if(!r.ok)throw new Error(`Master Roster HTTP ${r.status}`);const p=await r.json();const list=(p&&Array.isArray(p.students)?p.students:[]).map(normalizeStudentForBridge);if(!validRoster(list))throw new Error(`Master Roster không hợp lệ: ${list.length}/42 hoặc thiếu họ tên/id.`);return list;}
async function waitDataEngine(n=0){if(typeof window.replaceStudents==="function")return true;if(n>=100)return false;await sleep(100);return waitDataEngine(n+1);}
function installBridge(){if(typeof window.replaceStudents==="function")return true;if(typeof students!=="undefined"&&!Array.isArray(students))return false;return false;}
async function verifyRemoteValid(){for(let i=0;i<=GOOGLE_API_CONFIG.verifyRetries;i++){try{const r=await api("getStudents");const list=(Array.isArray(r.students)?r.students:[]).map(normalizeStudentForBridge);if(validRoster(list))return {ok:true,list,total:Number(r.total)||list.length,version:r.version};}catch(e){}if(i<GOOGLE_API_CONFIG.verifyRetries)await sleep(GOOGLE_API_CONFIG.verifyDelay);}throw new Error("Google Sheets chưa xác minh được 42/42 học sinh có họ tên.");}
async function postImport(list){if(!validRoster(list))throw new Error("Payload recovery không đủ 42 học sinh hợp lệ.");await fetch(GOOGLE_API_CONFIG.url,{method:"POST",mode:"no-cors",cache:"no-store",redirect:"follow",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({action:"importStudents",students:list})});}
function writeLocal(list,source){if(typeof window.replaceStudents!=="function")throw new Error("Data Engine chưa sẵn sàng.");const r=window.replaceStudents(list,{source,persist:true,allowEmpty:false,preserveRelatedRecords:true});if(!r||r.success!==true||r.count!==42)throw new Error(`LocalStorage chỉ nhận ${r?.count||0}/42 học sinh.`);return r;}
async function syncStudents(){if(!(await waitDataEngine()))throw new Error("Data Engine chưa sẵn sàng.");let remote=[];try{const r=await api("getStudents");remote=(Array.isArray(r.students)?r.students:[]).map(normalizeStudentForBridge);}catch(e){console.warn("[SYNC] fetch lỗi",e);}
  if(validRoster(remote)){writeLocal(remote,"google-sheets-valid");window.__GOOGLE_CLASS_SYNC__={ok:true,recovered:false,count:42,source:"google-sheets-valid",at:new Date().toISOString()};return window.__GOOGLE_CLASS_SYNC__;}
  console.warn(`[SYNC] Google dữ liệu không hợp lệ (${remote.length}/42). Không ghi đè LocalStorage bằng dữ liệu thiếu/rỗng.`);
  const master=await loadMasterRoster();
  writeLocal(master,"master-roster-recovery");
  await postImport(master);
  const verified=await verifyRemoteValid();
  if(!validRoster(verified.list))throw new Error("Google response sau recovery vẫn không hợp lệ.");
  writeLocal(verified.list,"google-sheets-verified");
  window.__GOOGLE_CLASS_SYNC__={ok:true,recovered:true,previousRemoteCount:remote.length,count:verified.list.length,total:verified.total,source:"master-roster-recovery-verified",at:new Date().toISOString()};
  return window.__GOOGLE_CLASS_SYNC__;
}
function refreshAllAfterSync(){["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks"].forEach(n=>{if(typeof window[n]==="function")try{window[n]();}catch(e){}});if(typeof window.updateStudentSelects==="function")try{window.updateStudentSelects();}catch(e){}}
function initializeGoogleApiBridge(){if(window.__GOOGLE_CLASS_BRIDGE_310__)return;window.__GOOGLE_CLASS_BRIDGE_310__=true;syncStudents().then(r=>{refreshAllAfterSync();if(typeof window.showToast==="function")window.showToast(`Đồng bộ xác minh ${r.count}/42 học sinh.`,"success");}).catch(e=>{window.__GOOGLE_CLASS_SYNC__={ok:false,error:e.message,at:new Date().toISOString()};console.error("[GOOGLE SYNC] FAILED",e);if(typeof window.showToast==="function")window.showToast("Chưa đồng bộ: Google chưa xác minh đủ 42 học sinh có dữ liệu.","warning");});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeGoogleApiBridge,{once:true});else initializeGoogleApiBridge();
