/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   GOOGLE API BRIDGE 4.2.0 — VIP PRO MAX
   Safe duplicate-load compatible bridge
   ============================================================ */
"use strict";

var GOOGLE_API_CONFIG = Object.freeze({
  url: "https://script.google.com/macros/s/AKfycbxnqx0824-jI7LzuAaK-Ys5V3_TdYg6uNT9wWkV_O1EfJapW2IrY_HJF-rv_PVsZM71bw/exec",
  timeout: 15000,
  verifyRetries: 5,
  verifyDelay: 1000,
  version: "4.2.0",
  schemaVersion: "students-13-columns-v1",
  storageKey: "QL_LOP_HOC_LE_HOANG_2026_2027",
  masterRosterUrl: "./DANH_SACH_HOC_SINH_5C_2026_2027.json?v=20260818-8",
  masterRosterCount: 42
});

var STUDENT_SCHEMA = Object.freeze([
  "id","studentCode","name","gender","birthDate","status",
  "parentName","phone","address","note","shareEnabled","createdAt","updatedAt"
]);

function bridgeText(v){return String(v ?? "").trim();}

function normalizeStudentForBridge(student,index){
  var s=student&&typeof student==="object"?student:{};
  var fallback="HS"+String(index+1).padStart(2,"0");
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
  return Array.isArray(list)&&list.length===42&&list.every(function(s,i){
    var n=normalizeStudentForBridge(s,i);
    return Boolean(n.id&&n.studentCode&&n.name);
  });
}

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}

function emptyLocalPayload(){
  return {version:"3.1.1",config:{},students:[],attendance:[],violations:[],rewards:[],learning:[],progress:[],comments:[]};
}

function readLocalPayload(){
  try{
    var raw=localStorage.getItem(GOOGLE_API_CONFIG.storageKey);
    if(!raw)return emptyLocalPayload();
    var data=JSON.parse(raw);
    return data&&typeof data==="object"&&!Array.isArray(data)?data:emptyLocalPayload();
  }catch(error){
    console.warn("[GOOGLE BRIDGE] Không đọc được LocalStorage:",error);
    return emptyLocalPayload();
  }
}

function writeStudentsToLocal(list,source){
  if(!validRoster(list))throw new Error("Danh sách local không hợp lệ: "+(Array.isArray(list)?list.length:0)+"/42.");
  var normalized=list.map(normalizeStudentForBridge);
  var current=readLocalPayload();
  var payload={
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
  return {success:true,ok:true,count:42,source:source};
}

function installReplaceStudentsApi(){
  if(typeof window.replaceStudents==="function")return true;
  window.replaceStudents=function(incoming,options){
    options=options||{};
    var list=Array.isArray(incoming)?incoming.map(normalizeStudentForBridge):[];
    if(!validRoster(list))return {success:false,ok:false,count:list.length,expected:42,reason:"roster-must-contain-42-valid-students"};
    try{
      var result=writeStudentsToLocal(list,options.source||"runtime");
      if(typeof window.refreshAll==="function")try{window.refreshAll();}catch(_){ }
      return result;
    }catch(error){
      console.error("[GOOGLE BRIDGE] replaceStudents:",error);
      return {success:false,ok:false,count:0,error:error.message};
    }
  };
  return true;
}

function waitDataEngine(attempt){
  attempt=attempt||0;
  if(typeof window.loadClassData==="function")return Promise.resolve(true);
  if(attempt>=100)return Promise.resolve(false);
  return sleep(100).then(function(){return waitDataEngine(attempt+1);});
}

function api(action,params){
  params=params||{};
  var controller=new AbortController();
  var timer=setTimeout(function(){controller.abort();},GOOGLE_API_CONFIG.timeout);
  var query=new URLSearchParams(Object.assign({action:action},params));
  return fetch(GOOGLE_API_CONFIG.url+"?"+query.toString(),{cache:"no-store",signal:controller.signal,redirect:"follow"})
    .then(function(response){if(!response.ok)throw new Error("API HTTP "+response.status);return response.json();})
    .finally(function(){clearTimeout(timer);});
}

function loadMasterRoster(){
  return fetch(GOOGLE_API_CONFIG.masterRosterUrl,{cache:"no-store",credentials:"same-origin"})
    .then(function(response){if(!response.ok)throw new Error("Master Roster HTTP "+response.status);return response.json();})
    .then(function(payload){
      var list=(payload&&Array.isArray(payload.students)?payload.students:[]).map(normalizeStudentForBridge);
      if(!validRoster(list))throw new Error("Master Roster không hợp lệ: "+list.length+"/42.");
      return list;
    });
}

function fetchRemoteRoster(){
  return api("getStudents").then(function(result){
    var raw=Array.isArray(result.students)?result.students:[];
    var list=raw.map(normalizeStudentForBridge);
    return {ok:validRoster(list),list:list,total:Number(result.total)||list.length,raw:raw};
  }).catch(function(error){
    console.warn("[GOOGLE BRIDGE] Google API không truy cập được:",error);
    return {ok:false,list:[],total:0,raw:[],error:error.message};
  });
}

function postImport(list){
  if(!validRoster(list))return Promise.reject(new Error("Recovery payload không đủ 42 học sinh."));
  var payload={action:"importStudents",schemaVersion:GOOGLE_API_CONFIG.schemaVersion,headers:STUDENT_SCHEMA,students:list.map(normalizeStudentForBridge)};
  return fetch(GOOGLE_API_CONFIG.url,{method:"POST",mode:"no-cors",cache:"no-store",redirect:"follow",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(payload)})
    .then(function(){return true;})
    .catch(function(error){console.warn("[GOOGLE BRIDGE] Recovery POST thất bại:",error);return false;});
}

function verifyRemote(attempt){
  attempt=attempt||0;
  return fetchRemoteRoster().then(function(remote){
    if(remote.ok)return remote;
    if(attempt>=GOOGLE_API_CONFIG.verifyRetries)return {ok:false,list:[],total:0,raw:[]};
    return sleep(GOOGLE_API_CONFIG.verifyDelay).then(function(){return verifyRemote(attempt+1);});
  });
}

function refreshAllAfterSync(){
  ["renderDashboard","renderStudents","renderAttendance","renderViolations","renderRewards","renderLearningSafe","renderCommentsSafe","renderStatistics","renderStudentLinks","updateStudentSelects"].forEach(function(name){
    if(typeof window[name]==="function")try{window[name]();}catch(error){console.warn("[GOOGLE BRIDGE] "+name+":",error);}
  });
}

function syncStudentsVip(){
  return waitDataEngine().then(function(ready){
    if(!ready)throw new Error("Data Engine chưa sẵn sàng.");
    installReplaceStudentsApi();
    return loadMasterRoster();
  }).then(function(master){
    writeStudentsToLocal(master,"master-roster-safe-baseline");
    refreshAllAfterSync();
    return fetchRemoteRoster().then(function(remote){
      if(remote.ok){
        writeStudentsToLocal(remote.list,"google-sheets-42");
        window.__GOOGLE_CLASS_SYNC__={ok:true,count:42,source:"google-sheets-42",fallbackUsed:false,at:new Date().toISOString()};
        refreshAllAfterSync();
        return window.__GOOGLE_CLASS_SYNC__;
      }
      window.__GOOGLE_CLASS_SYNC__={ok:true,count:42,source:"master-roster-fallback",fallbackUsed:true,googleCount:remote.total||0,at:new Date().toISOString()};
      refreshAllAfterSync();
      postImport(master).then(function(){return verifyRemote();}).then(function(verified){
        if(verified.ok){
          writeStudentsToLocal(verified.list,"google-sheets-recovered");
          refreshAllAfterSync();
          if(typeof window.showToast==="function")window.showToast("Đã khôi phục và xác minh 42/42 học sinh trên Google.","success");
        }
      }).catch(function(error){console.warn("[GOOGLE BRIDGE] Background recovery:",error);});
      return window.__GOOGLE_CLASS_SYNC__;
    });
  });
}

function initializeGoogleApiBridge(){
  if(window.__GOOGLE_CLASS_BRIDGE_420__)return;
  window.__GOOGLE_CLASS_BRIDGE_420__=true;
  syncStudentsVip().then(function(result){
    refreshAllAfterSync();
    if(typeof window.showToast==="function")window.showToast(result.fallbackUsed?"Đang dùng bản an toàn 42 học sinh; Google sẽ tự đồng bộ lại.":"Đã đồng bộ 42/42 học sinh từ Google Sheets.",result.fallbackUsed?"warning":"success");
  }).catch(function(error){
    window.__GOOGLE_CLASS_SYNC__={ok:false,error:error.message,at:new Date().toISOString()};
    console.error("[GOOGLE BRIDGE] FATAL:",error);
    if(typeof window.showToast==="function")window.showToast("Không thể nạp danh sách học sinh.","error");
  });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeGoogleApiBridge,{once:true});
else initializeGoogleApiBridge();

/* ============================================================
   PATCH 4.2.1 — GIỮ LIÊN KẾT STUDENT ID + VIỆT HÓA
   ============================================================ */
(function(){
  if(window.__GOOGLE_CLASS_BRIDGE_421__)return;
  window.__GOOGLE_CLASS_BRIDGE_421__=true;
  var TEXT={present:"Có mặt",excused:"Có phép",absent:"Vắng",late:"Đi muộn",active:"Đang học",inactive:"Không còn học",light:"Nhẹ",attention:"Cần chú ý",serious:"Nghiêm trọng",monitoring:"Đang theo dõi",resolved:"Đã xử lý",praise:"Tuyên dương",reward:"Khen thưởng",other:"Khác",general:"Chung",good:"Tốt",achieved:"Đạt",not_achieved:"Chưa đạt"};
  function students(){try{if(typeof window.getStudentsSafe==="function"){var s=window.getStudentsSafe();if(Array.isArray(s))return s;}}catch(_){}return Array.isArray(window.students)?window.students:[];}
  function same(s,v){v=String(v??"").trim();return !!s&&(String(s.id??"").trim()===v||String(s.studentCode??"").trim()===v||String(s.code??"").trim()===v);}
  var oldGet=window.getStudentById;
  window.getStudentById=function(id){var s=students().find(function(x){return same(x,id);});return s||((typeof oldGet==="function")?oldGet(id):null);};
  window.filterValidStudentRecords=function(records){var list=Array.isArray(records)?records:[];return list.filter(function(r){return r&&students().some(function(s){return same(s,r.studentId);});});};
  window.renderAttendance=function(){
    var tbody=document.getElementById("attendanceTableBody");if(!tbody)return;
    var date=(typeof window.getValue==="function"?window.getValue("attendanceDate"):"")||(typeof window.todayISO==="function"?window.todayISO():new Date().toISOString().slice(0,10));
    var dateEl=document.getElementById("attendanceDate");if(dateEl)dateEl.value=date;
    var list=students(),records=typeof window.getAttendanceRecords==="function"?(window.getAttendanceRecords()||[]):[];
    var esc=window.escapeHTML||function(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");};
    tbody.innerHTML=list.map(function(s,i){var r=Array.isArray(records)?records.find(function(x){return same(s,x.studentId)&&String(x.date)===String(date);}):null;var st=r&&r.status||"present";var id=String(s.id??s.studentCode??"");return '<tr><td>'+String(i+1)+'</td><td><strong>'+esc(s.name)+'</strong></td><td><select class="attendance-status" data-student-id="'+esc(id)+'"><option value="present" '+(st==="present"?"selected":"")+'>Có mặt</option><option value="excused" '+(st==="excused"?"selected":"")+'>Có phép</option><option value="absent" '+(st==="absent"?"selected":"")+'>Vắng</option></select></td><td><input type="text" class="attendance-note" data-student-id="'+esc(id)+'" value="'+esc(r&&r.note||"")+'" placeholder="Ghi chú"></td></tr>';}).join("");
    if(typeof window.updateAttendanceSummary==="function")window.updateAttendanceSummary();
  };
  window.__QL_VI_SYNC_FIX__={version:"4.2.1",translate:function(v){var k=String(v??"").trim().toLocaleLowerCase("vi");return TEXT[k]||String(v??"");}};
})();
