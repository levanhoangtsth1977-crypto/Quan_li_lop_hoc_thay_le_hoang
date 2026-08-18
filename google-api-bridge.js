/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   GOOGLE API BRIDGE 4.1.0 — VIP PRO MAX
   Google primary + Master Roster fallback + LocalStorage safe sync
   Compatibility API: replaceStudents()
   ============================================================ */
"use strict";

const GOOGLE_API_CONFIG = Object.freeze({
  url: "https://script.google.com/macros/s/AKfycbynklm7SobnkcEZKfAUGdMIBugA4lQ2kA3yOThHVjNoiJzCK7veuwO2vE1tR1QKI-nkIQ/exec",
  timeout: 15000,
  verifyRetries: 5,
  verifyDelay: 1000,
  version: "4.1.0",
  schemaVersion: "students-13-columns-v1",
  storageKey: "QL_LOP_HOC_LE_HOANG_2026_2027",
  masterRosterUrl: "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-7",
  masterRosterCount: 42
});

const STUDENT_SCHEMA = Object.freeze([
  "id","studentCode","name","gender","birthDate","status",
  "parentName","phone","address","note","shareEnabled","createdAt","updatedAt"
]);

function bridgeText(v){return String(v ?? "").trim();}

function normalizeStudentForBridge(student,index){
  const s=student&&typeof student==="object"?student:{};
  const fallback=`HS${String(index+1).padStart(2,"0")}`;
  return {
    id:bridgeText(s.id||s.studentId)||fallback,
    studentCode:bridgeText(s.studentCode||s.code)||fallback,
    name:bridgeText(s.name||s.studentName),
    gender:bridgeText(s.gender),
    birthDate:bridgeText(s.birthDate||s.dateOfBirth),
    status:bridgeText(s.status)||"active",
    parentName:bridgeText(s.parentName),
    phone:bridgeText(s.phone),
    address:bridgeText(s.address),
    note:bridgeText(s.note),
    shareEnabled:s.shareEnabled!==false,
    createdAt:bridgeText(s.createdAt),
    updatedAt:bridgeText(s.updatedAt)
  };
}

function validRoster(list){
  return Array.isArray(list)&&list.length===42&&list.every((s,i)=>{
    const n=normalizeStudentForBridge(s,i);
    return Boolean(n.id&&n.studentCode&&n.name);
  });
}

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

function emptyLocalPayload(){
  return {version:"3.1.1",config:{},students:[],attendance:[],violations:[],rewards:[],learning:[],progress:[],comments:[]};
}

function readLocalPayload(){
  try{
    const raw=localStorage.getItem(GOOGLE_API_CONFIG.storageKey);
    if(!raw)return emptyLocalPayload();
    const data=JSON.parse(raw);
    return data&&typeof data==="object"&&!Array.isArray(data)?data:emptyLocalPayload();
  }catch(error){
    console.warn("[GOOGLE BRIDGE] Không đọc được LocalStorage:",error);
    return emptyLocalPayload();
  }
}

function writeStudentsToLocal(list,source){
  if(!validRoster(list))throw new Error(`Danh sách local không hợp lệ: ${Array.isArray(list)?list.length:0}/42.`);
  const normalized=list.map(normalizeStudentForBridge);
  const current=readLocalPayload();
  const payload={
    version:current.version||"3.1.1",
    savedAt:new Date().toISOString(),
    config:current.config||{},
    students:normalized,
    attendance:Array.isArray(current.attendance)?current.attendance:[],
    violations:Array.isArray(current.violations)?current.violations:[],
    rewards:Array.isArray(current.rewards)?current.rewards:[],
    learning:Array.isArray(current.learning)?current.learning:[],
    progress:Array.isArray(current.progress)?current.progress:[],
    comments:Array.isArray(current.comments)?current.comments:[]
  };
  localStorage.setItem(GOOGLE_API_CONFIG.storageKey,JSON.stringify(payload));
  if(typeof window.loadClassData!=="function")throw new Error("Data Engine chưa nạp hàm loadClassData.");
  if(window.loadClassData()!==true)throw new Error("Data Engine từ chối nạp danh sách vào bộ nhớ.");
  return {success:true,ok:true,count:42,source};
}

function installReplaceStudentsApi(){
  if(typeof window.replaceStudents==="function")return true;
  window.replaceStudents=function(incoming,options={}){
    const list=Array.isArray(incoming)?incoming.map(normalizeStudentForBridge):[];
    if(!validRoster(list)){
      return {success:false,ok:false,count:list.length,expected:42,reason:"roster-must-contain-42-valid-students"};
    }
    try{
      const result=writeStudentsToLocal(list,options.source||"runtime");
      if(typeof window.refreshAll==="function")try{window.refreshAll();}catch(_){ }
      return result;
    }catch(error){
      console.error("[GOOGLE BRIDGE] replaceStudents:",error);
      return {success:false,ok:false,count:0,error:error.message};
    }
  };
  return true;
}

async function waitDataEngine(attempt=0){
  if(typeof window.loadClassData==="function")return true;
  if(attempt>=100)return false;
  await sleep(100);
  return waitDataEngine(attempt+1);
}

async function api(action,params={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),GOOGLE_API_CONFIG.timeout);
  try{
    const query=new URLSearchParams({action,...params});
    const response=await fetch(`${GOOGLE_API_CONFIG.url}?${query.toString()}`,{cache:"no-store",signal:controller.signal,redirect:"follow"});
    if(!response.ok)throw new Error(`API HTTP ${response.status}`);
    return await response.json();
  }finally{clearTimeout(timer);}
}

async function loadMasterRoster(){
  const response=await fetch(GOOGLE_API_CONFIG.masterRosterUrl,{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw new Error(`Master Roster HTTP ${response.status}`);
  const payload=await response.json();
  const list=(payload&&Array.isArray(payload.students)?payload.students:[]).map(normalizeStudentForBridge);
  if(!validRoster(list))throw new Error(`Master Roster không hợp lệ: ${list.length}/42.`);
  return list;
}

async function fetchRemoteRoster(){
  try{
    const result=await api("getStudents");
    const raw=Array.isArray(result.students)?result.students:[];
    const list=raw.map(normalizeStudentForBridge);
    return {ok:validRoster(list),list,total:Number(result.total)||list.length,raw};
  }catch(error){
    console.warn("[GOOGLE BRIDGE] Google API không truy cập được:",error);
    return {ok:false,list:[],total:0,raw:[],error:error.message};
  }
}

async function postImport(list){
  if(!validRoster(list))throw new Error("Recovery payload không đủ 42 học sinh.");
  const payload={action:"importStudents",schemaVersion:GOOGLE_API_CONFIG.schemaVersion,headers:STUDENT_SCHEMA,students:list.map(normalizeStudentForBridge)};
  try{
    await fetch(GOOGLE_API_CONFIG.url,{method:"POST",mode:"no-cors",cache:"no-store",redirect:"follow",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(payload)});
    return true;
  }catch(error){
    console.warn("[GOOGLE BRIDGE] Recovery POST thất bại:",error);
    return false;
  }
}

async function verifyRemote(){
  for(let attempt=0;attempt<=GOOGLE_API_CONFIG.verifyRetries;attempt++){
    const remote=await fetchRemoteRoster();
    if(remote.ok)return remote;
    if(attempt<GOOGLE_API_CONFIG.verifyRetries)await sleep(GOOGLE_API_CONFIG.verifyDelay);
  }
  return {ok:false,list:[],total:0,raw:[]};
}

async function syncStudentsVip(){
  if(!(await waitDataEngine()))throw new Error("Data Engine chưa sẵn sàng.");
  installReplaceStudentsApi();

  /* MASTER được nạp trước để giao diện không bao giờ rơi về 0 học sinh. */
  const master=await loadMasterRoster();
  writeStudentsToLocal(master,"master-roster-safe-baseline");
  refreshAllAfterSync();

  /* Google là nguồn đồng bộ chính khi trả về đủ 42. */
  const remote=await fetchRemoteRoster();
  if(remote.ok){
    writeStudentsToLocal(remote.list,"google-sheets-42");
    window.__GOOGLE_CLASS_SYNC__={ok:true,count:42,source:"google-sheets-42",fallbackUsed:false,at:new Date().toISOString()};
    refreshAllAfterSync();
    return window.__GOOGLE_CLASS_SYNC__;
  }

  /* Google thiếu/lỗi: giữ Master 42, tuyệt đối không ghi đè bằng rỗng/thiếu. */
  window.__GOOGLE_CLASS_SYNC__={ok:true,count:42,source:"master-roster-fallback",fallbackUsed:true,googleCount:remote.total||0,at:new Date().toISOString()};
  refreshAllAfterSync();

  /* Tự phục hồi Google ở nền; giao diện không bị khóa chờ API. */
  postImport(master)
    .then(()=>verifyRemote())
    .then(verified=>{
      if(verified.ok){
        writeStudentsToLocal(verified.list,"google-sheets-recovered");
        refreshAllAfterSync();
        if(typeof window.showToast==="function")window.showToast("Đã khôi phục và xác minh 42/42 học sinh trên Google.","success");
      }
    })
    .catch(error=>console.warn("[GOOGLE BRIDGE] Background recovery:",error));

  return window.__GOOGLE_CLASS_SYNC__;
}

function refreshAllAfterSync(){
  ["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks","updateStudentSelects"].forEach(name=>{
    if(typeof window[name]==="function")try{window[name]();}catch(error){console.warn(`[GOOGLE BRIDGE] ${name}:`,error);}
  });
}

function initializeGoogleApiBridge(){
  if(window.__GOOGLE_CLASS_BRIDGE_410__)return;
  window.__GOOGLE_CLASS_BRIDGE_410__=true;
  syncStudentsVip()
    .then(result=>{
      refreshAllAfterSync();
      if(typeof window.showToast==="function"){
        window.showToast(result.fallbackUsed?"Đang dùng bản an toàn 42 học sinh; Google sẽ tự đồng bộ lại.":"Đã đồng bộ 42/42 học sinh từ Google Sheets.",result.fallbackUsed?"warning":"success");
      }
    })
    .catch(error=>{
      window.__GOOGLE_CLASS_SYNC__={ok:false,error:error.message,at:new Date().toISOString()};
      console.error("[GOOGLE BRIDGE] FATAL:",error);
      if(typeof window.showToast==="function")window.showToast("Không thể nạp danh sách học sinh.","error");
    });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeGoogleApiBridge,{once:true});
else initializeGoogleApiBridge();
