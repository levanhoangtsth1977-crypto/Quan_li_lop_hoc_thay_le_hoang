/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   GOOGLE API BRIDGE 5.0 — SAFE ROSTER SYNC
   ============================================================ */
"use strict";

var GOOGLE_API_CONFIG=Object.freeze({
  url:"https://script.google.com/macros/s/AKfycbxnqx0824-jI7LzuAaK-Ys5V3_TdYg6uNT9wWkV_O1EfJapW2IrY_HJF-rv_PVsZM71bw/exec",
  timeout:15000,
  version:"5.0.0",
  storageKey:"QL_LOP_HOC_LE_HOANG_2026_2027"
});

var STUDENT_SCHEMA=Object.freeze(["id","studentCode","name","gender","birthDate","status","parentName","phone","address","note","shareEnabled","createdAt","updatedAt"]);

function bridgeText(v){return String(v??"").trim();}
function normalizeStudentForBridge(s){
  s=s&&typeof s==="object"?s:{};
  return{
    id:bridgeText(s.id||s.studentId||s.studentCode),
    studentCode:bridgeText(s.studentCode||s.code||s.id),
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
function validStudentList(list){return Array.isArray(list)&&list.length>0&&list.every(function(s){var n=normalizeStudentForBridge(s);return Boolean(n.id&&n.name);});}
function emptyLocalPayload(){return{version:"3.1.1",config:{},students:[],attendance:[],violations:[],rewards:[],learning:[],progress:[],comments:[]};}
function readLocalPayload(){try{var raw=localStorage.getItem(GOOGLE_API_CONFIG.storageKey);if(!raw)return emptyLocalPayload();var d=JSON.parse(raw);return d&&typeof d==="object"&&!Array.isArray(d)?d:emptyLocalPayload();}catch(_){return emptyLocalPayload();}}
function writeStudentsToLocal(list,source){
  if(!validStudentList(list))throw new Error("Google trả về danh sách học sinh rỗng hoặc thiếu ID/tên.");
  var normalized=list.map(normalizeStudentForBridge),current=readLocalPayload();
  var payload={version:current.version||"3.1.1",savedAt:new Date().toISOString(),config:current.config||{},students:normalized,attendance:Array.isArray(current.attendance)?current.attendance:[],violations:Array.isArray(current.violations)?current.violations:[],rewards:Array.isArray(current.rewards)?current.rewards:[],learning:Array.isArray(current.learning)?current.learning:[],progress:Array.isArray(current.progress)?current.progress:[],comments:Array.isArray(current.comments)?current.comments:[]};
  localStorage.setItem(GOOGLE_API_CONFIG.storageKey,JSON.stringify(payload));
  if(typeof window.loadClassData!=="function")throw new Error("Data Engine chưa nạp hàm loadClassData.");
  if(window.loadClassData()!==true)throw new Error("Data Engine từ chối nạp dữ liệu.");
  return{success:true,ok:true,count:normalized.length,source:source};
}
function waitDataEngine(attempt){attempt=attempt||0;if(typeof window.loadClassData==="function")return Promise.resolve(true);if(attempt>=100)return Promise.resolve(false);return new Promise(function(resolve){setTimeout(function(){resolve(waitDataEngine(attempt+1));},100);}).then(function(v){return v;});}
function api(action){
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},GOOGLE_API_CONFIG.timeout);
  return fetch(GOOGLE_API_CONFIG.url+"?action="+encodeURIComponent(action),{cache:"no-store",signal:controller.signal,redirect:"follow"}).then(function(r){if(!r.ok)throw new Error("API HTTP "+r.status);return r.json();}).finally(function(){clearTimeout(timer);});
}
function fetchRemoteRoster(){
  return api("getStudents").then(function(result){
    var raw=Array.isArray(result.students)?result.students:[],list=raw.map(normalizeStudentForBridge).filter(function(s){return s.id&&s.name;});
    if(!list.length)throw new Error("Google HOC_SINH hiện không có bản ghi hợp lệ.");
    return{ok:true,list:list,total:list.length,raw:raw,source:result.source||"HOC_SINH"};
  });
}
function refreshAllAfterSync(){["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks","updateStudentSelects"].forEach(function(name){if(typeof window[name]==="function")try{window[name]();}catch(error){console.warn("[GOOGLE BRIDGE] "+name+":",error);}});}
function syncStudentsVip(){
  return waitDataEngine().then(function(ready){if(!ready)throw new Error("Data Engine chưa sẵn sàng.");return fetchRemoteRoster();}).then(function(remote){
    writeStudentsToLocal(remote.list,"google-sheets-live");
    window.__GOOGLE_CLASS_SYNC__={ok:true,count:remote.list.length,source:"google-sheets-live",fallbackUsed:false,autoRestore:false,at:new Date().toISOString()};
    refreshAllAfterSync();
    return window.__GOOGLE_CLASS_SYNC__;
  }).catch(function(error){
    var local=readLocalPayload(),count=Array.isArray(local.students)?local.students.length:0;
    window.__GOOGLE_CLASS_SYNC__={ok:false,count:count,source:"local-preserved",fallbackUsed:true,autoRestore:false,error:error.message,at:new Date().toISOString()};
    console.warn("[GOOGLE BRIDGE] Google không đọc được; giữ nguyên dữ liệu local, không tự khôi phục Master:",error);
    refreshAllAfterSync();
    return window.__GOOGLE_CLASS_SYNC__;
  });
}
function installReplaceStudentsApi(){
  if(typeof window.replaceStudents==="function")return true;
  window.replaceStudents=function(incoming,options){
    var list=Array.isArray(incoming)?incoming.map(normalizeStudentForBridge).filter(function(s){return s.id&&s.name;}):[];
    if(!validStudentList(list))return{success:false,ok:false,count:0,reason:"student-list-empty-or-invalid"};
    try{var result=writeStudentsToLocal(list,(options&&options.source)||"runtime-safe");refreshAllAfterSync();return result;}catch(error){return{success:false,ok:false,count:0,error:error.message};}
  };
  return true;
}
function initializeGoogleApiBridge(){
  if(window.__GOOGLE_CLASS_BRIDGE_500__)return;
  window.__GOOGLE_CLASS_BRIDGE_500__=true;
  installReplaceStudentsApi();
  syncStudentsVip().then(function(result){if(typeof window.showToast==="function")window.showToast(result.ok?"Đã đọc danh sách học sinh từ Google Sheets: "+result.count+" em.":"Google chưa đọc được; dữ liệu hiện có được giữ nguyên.",result.ok?"success":"warning");});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeGoogleApiBridge,{once:true});else initializeGoogleApiBridge();

/* ============================================================
   PATCH — GIỮ LIÊN KẾT STUDENT ID + VIỆT HÓA
   ============================================================ */
(function(){
  if(window.__GOOGLE_CLASS_BRIDGE_SAFE_PATCH__)return;
  window.__GOOGLE_CLASS_BRIDGE_SAFE_PATCH__=true;
  var TEXT={present:"Có mặt",excused:"Có phép",absent:"Vắng",late:"Đi muộn",active:"Đang học",inactive:"Không còn học",light:"Nhẹ",attention:"Cần chú ý",serious:"Nghiêm trọng",monitoring:"Đang theo dõi",resolved:"Đã xử lý",praise:"Tuyên dương",reward:"Khen thưởng",other:"Khác",general:"Chung",good:"Tốt",achieved:"Đạt",not_achieved:"Chưa đạt"};
  function students(){try{if(typeof window.getStudentsSafe==="function"){var s=window.getStudentsSafe();if(Array.isArray(s))return s;}}catch(_){}return Array.isArray(window.students)?window.students:[];}
  function same(s,v){v=String(v??"").trim();return!!s&&(String(s.id??"").trim()===v||String(s.studentCode??"").trim()===v||String(s.code??"").trim()===v);}
  var oldGet=window.getStudentById;
  window.getStudentById=function(id){var s=students().find(function(x){return same(x,id);});return s||((typeof oldGet==="function")?oldGet(id):null);};
  window.filterValidStudentRecords=function(records){var list=Array.isArray(records)?records:[];return list.filter(function(r){return r&&students().some(function(s){return same(s,r.studentId);});});};
  window.__QL_VI_SYNC_FIX__={version:"5.0.0",translate:function(v){var k=String(v??"").trim().toLocaleLowerCase("vi");return TEXT[k]||String(v??"");}};
})();
