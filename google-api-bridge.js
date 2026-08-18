/* QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG - GOOGLE API BRIDGE 3.2.0 */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
  url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
  timeout: 15000,
  verifyRetries: 8,
  verifyDelay: 1000,
  version: "3.2.0",
  schemaVersion: "students-13-columns-v1",
  masterRosterUrl: "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-4",
  masterRosterCount: 42
});

const STUDENT_SCHEMA = Object.freeze([
  "id","studentCode","name","gender","birthDate","status",
  "parentName","phone","address","note","shareEnabled","createdAt","updatedAt"
]);

function normalizeStudentForBridge(student,index){
  const s=student&&typeof student==="object"?student:{};
  const fallback=`HS${String(index+1).padStart(2,"0")}`;
  const id=String(s.id||s.studentId||fallback).trim()||fallback;
  const studentCode=String(s.studentCode||s.code||fallback).trim()||fallback;
  return {
    id,
    studentCode,
    name:String(s.name||s.studentName||"").trim(),
    gender:String(s.gender||"").trim(),
    birthDate:String(s.birthDate||s.dateOfBirth||"").trim(),
    status:String(s.status||"active").trim(),
    parentName:String(s.parentName||"").trim(),
    phone:String(s.phone||"").trim(),
    address:String(s.address||"").trim(),
    note:String(s.note||"").trim(),
    shareEnabled:s.shareEnabled!==false,
    createdAt:String(s.createdAt||"").trim(),
    updatedAt:String(s.updatedAt||"").trim()
  };
}

function validRoster(list){
  return Array.isArray(list)&&list.length===42&&list.every((s,i)=>{
    const n=normalizeStudentForBridge(s,i);
    return !!n.name&&!!n.id&&!!n.studentCode;
  });
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function api(action,params={}){
  const c=new AbortController();
  const t=setTimeout(()=>c.abort(),GOOGLE_API_CONFIG.timeout);
  try{
    const q=new URLSearchParams({action,...params});
    const r=await fetch(`${GOOGLE_API_CONFIG.url}?${q}`,{cache:"no-store",signal:c.signal});
    if(!r.ok)throw new Error(`API HTTP ${r.status}`);
    return await r.json();
  }finally{clearTimeout(t);}
}

async function loadMasterRoster(){
  const r=await fetch(GOOGLE_API_CONFIG.masterRosterUrl,{cache:"no-store",credentials:"same-origin"});
  if(!r.ok)throw new Error(`Master Roster HTTP ${r.status}`);
  const p=await r.json();
  const list=(p&&Array.isArray(p.students)?p.students:[]).map(normalizeStudentForBridge);
  if(!validRoster(list))throw new Error(`Master Roster không hợp lệ: ${list.length}/42 hoặc thiếu họ tên/id/mã học sinh.`);
  return list;
}

async function waitDataEngine(n=0){
  if(typeof window.replaceStudents==="function")return true;
  if(n>=100)return false;
  await sleep(100);
  return waitDataEngine(n+1);
}

function hasSchemaObject(student){
  if(!student||typeof student!=="object")return false;
  return STUDENT_SCHEMA.every(k=>Object.prototype.hasOwnProperty.call(student,k));
}

function rawRosterHasRequiredSchema(list){
  return Array.isArray(list)&&list.length===42&&list.every(hasSchemaObject);
}

async function verifyRemoteValid(){
  for(let i=0;i<=GOOGLE_API_CONFIG.verifyRetries;i++){
    try{
      const r=await api("getStudents");
      const raw=Array.isArray(r.students)?r.students:[];
      const list=raw.map(normalizeStudentForBridge);
      if(validRoster(list)){
        return {
          ok:true,
          list,
          total:Number(r.total)||list.length,
          version:r.version,
          schemaComplete:rawRosterHasRequiredSchema(raw)
        };
      }
    }catch(e){}
    if(i<GOOGLE_API_CONFIG.verifyRetries)await sleep(GOOGLE_API_CONFIG.verifyDelay);
  }
  throw new Error("Google Sheets chưa xác minh được 42/42 học sinh.");
}

async function postImport(list){
  if(!validRoster(list))throw new Error("Payload recovery không đủ 42 học sinh hợp lệ.");
  const payload={
    action:"importStudents",
    schemaVersion:GOOGLE_API_CONFIG.schemaVersion,
    headers:STUDENT_SCHEMA,
    students:list.map((s,i)=>normalizeStudentForBridge(s,i))
  };
  await fetch(GOOGLE_API_CONFIG.url,{
    method:"POST",
    mode:"no-cors",
    cache:"no-store",
    redirect:"follow",
    headers:{"Content-Type":"text/plain;charset=UTF-8"},
    body:JSON.stringify(payload)
  });
}

function writeLocal(list,source){
  if(typeof window.replaceStudents!=="function")throw new Error("Data Engine chưa sẵn sàng.");
  const r=window.replaceStudents(list,{source,persist:true,allowEmpty:false,preserveRelatedRecords:true});
  if(!r||r.success!==true||r.count!==42)throw new Error(`LocalStorage chỉ nhận ${r?.count||0}/42 học sinh.`);
  return r;
}

async function syncStudents(){
  if(!(await waitDataEngine()))throw new Error("Data Engine chưa sẵn sàng.");
  let remote=[];
  try{
    const r=await api("getStudents");
    remote=(Array.isArray(r.students)?r.students:[]).map(normalizeStudentForBridge);
  }catch(e){console.warn("[SYNC] fetch lỗi",e);}

  if(validRoster(remote)){
    writeLocal(remote,"google-sheets-valid");
    window.__GOOGLE_CLASS_SYNC__={ok:true,recovered:false,count:42,source:"google-sheets-valid",schema:STUDENT_SCHEMA,at:new Date().toISOString()};
    return window.__GOOGLE_CLASS_SYNC__;
  }

  console.warn(`[SYNC] Google dữ liệu không hợp lệ (${remote.length}/42). Không ghi đè LocalStorage bằng dữ liệu thiếu/rỗng.`);
  const master=await loadMasterRoster();
  writeLocal(master,"master-roster-recovery");
  await postImport(master);
  const verified=await verifyRemoteValid();
  if(!validRoster(verified.list))throw new Error("Google response sau recovery vẫn không hợp lệ.");
  writeLocal(verified.list,"google-sheets-verified");
  window.__GOOGLE_CLASS_SYNC__={
    ok:true,
    recovered:true,
    previousRemoteCount:remote.length,
    count:verified.list.length,
    total:verified.total,
    schema:STUDENT_SCHEMA,
    remoteSchemaComplete:verified.schemaComplete,
    source:"master-roster-recovery-verified",
    at:new Date().toISOString()
  };
  return window.__GOOGLE_CLASS_SYNC__;
}

function refreshAllAfterSync(){
  ["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks"].forEach(n=>{if(typeof window[n]==="function")try{window[n]();}catch(e){}});
  if(typeof window.updateStudentSelects==="function")try{window.updateStudentSelects();}catch(e){}
}

function initializeGoogleApiBridge(){
  if(window.__GOOGLE_CLASS_BRIDGE_320__)return;
  window.__GOOGLE_CLASS_BRIDGE_320__=true;
  syncStudents().then(r=>{
    refreshAllAfterSync();
    if(typeof window.showToast==="function")window.showToast(`Đồng bộ ${r.count}/42 học sinh — cấu trúc ${STUDENT_SCHEMA.length} cột.`,"success");
  }).catch(e=>{
    window.__GOOGLE_CLASS_SYNC__={ok:false,error:e.message,at:new Date().toISOString()};
    console.error("[GOOGLE SYNC] FAILED",e);
    if(typeof window.showToast==="function")window.showToast("Chưa đồng bộ: Google chưa xác minh đủ dữ liệu học sinh.","warning");
  });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeGoogleApiBridge,{once:true});
else initializeGoogleApiBridge();
