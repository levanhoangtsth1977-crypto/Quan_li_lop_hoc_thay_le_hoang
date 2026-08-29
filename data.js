/* ============================================================
   QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG
   DATA.JS - MASTER DATA ENGINE
   VERSION 3.1.1 - MASTER / IMPORT SAFE / SCRIPT.JS 4.0.0 SYNC
   ------------------------------------------------------------
   Đồng bộ với:
   - script.js VERSION 4.0.0
   - HTML quản lý lớp học hiện tại
   - Excel danh sách học sinh
   - LocalStorage
   - Backup / Restore JSON
   - Điểm danh
   - Vi phạm
   - Khen thưởng
   - Học tập
   - Tiến bộ
   - Nhận xét
   - Hồ sơ học sinh
   - Link cá nhân
   ------------------------------------------------------------
   NGUYÊN TẮC:
   - Không tạo học sinh mẫu.
   - Không mặc định lớp có 50 học sinh.
   - 50 chỉ là giới hạn tối đa.
   - Không tự xóa học sinh hợp lệ.
   - Không loại học sinh chỉ vì trùng tên.
   - Không initialize dữ liệu lần thứ hai.
   - students[] là nguồn dữ liệu chính.
   - Không thay reference của students khi thêm/sửa/xóa.
   - Import phải có kiểm tra và rollback.
   - Không lưu dữ liệu không hợp lệ.
   - Không hard-code secret/API key.
   - Tương thích với script.js 4.0.0.
   ============================================================ */

"use strict";

const CLASS_CONFIG = {
    systemName: "QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG",
    teacherName: "Lê Hoàng",
    schoolYear: "2026–2027",
    className: "5A3",
    grade: "5",
    maxStudents: 50,
    dataVersion: "3.1.1",
    storageKey: "QL_LOP_HOC_LE_HOANG_2026_2027"
};

const STUDENT_LINK_CONFIG = {
    enabled: true,
    parameterName: "student",
    showLearning: true,
    showAttendance: true,
    showViolations: true,
    showRewards: true,
    showProgress: true,
    showComments: true,
    showPrivateInformation: false
};

let students = [];
let attendanceRecords = [];
let violationRecords = [];
let rewardRecords = [];
let learningRecords = [];
let progressRecords = [];
let commentRecords = [];

const APP_DATA = {
    config: CLASS_CONFIG,
    students: students,
    attendance: attendanceRecords,
    violations: violationRecords,
    rewards: rewardRecords,
    learning: learningRecords,
    progress: progressRecords,
    comments: commentRecords
};

function safeString(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}
function normalizeText(value) { return safeString(value).replace(/\s+/g, " ").trim(); }
function normalizeName(value) { return normalizeText(value); }
function normalizeKey(value) { return normalizeText(value).toLocaleLowerCase("vi"); }
function normalizeBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1" || value === 1 || value === "yes" || value === "y") return true;
    if (value === "false" || value === "0" || value === 0 || value === "no" || value === "n") return false;
    return defaultValue;
}
function normalizeArray(value) { return Array.isArray(value) ? value : []; }
function createId(prefix = "ID") { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2,10)}`; }
function getTodayISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getNowISO() { return new Date().toISOString(); }
function isLocalStorageAvailable(){try{const k="__QL_LOP_HOC_TEST__";localStorage.setItem(k,"1");localStorage.removeItem(k);return true;}catch(_){return false;}}
function syncAppDataReferences(){ APP_DATA.config=CLASS_CONFIG; APP_DATA.students=students; APP_DATA.attendance=attendanceRecords; APP_DATA.violations=violationRecords; APP_DATA.rewards=rewardRecords; APP_DATA.learning=learningRecords; APP_DATA.progress=progressRecords; APP_DATA.comments=commentRecords; }
function normalizeStudent(source,index=0){const d=source&&typeof source==="object"?source:{};const now=getNowISO();return{id:normalizeText(d.id)||createId("STU"),name:normalizeName(d.name),gender:normalizeText(d.gender),birthDate:normalizeText(d.birthDate),status:normalizeText(d.status)||"active",parentName:normalizeText(d.parentName),phone:normalizeText(d.phone),address:normalizeText(d.address),note:normalizeText(d.note),studentCode:normalizeText(d.studentCode)||normalizeText(d.code)||(`HS${String(index+1).padStart(2,"0")}`),createdAt:normalizeText(d.createdAt)||now,updatedAt:normalizeText(d.updatedAt)||now,shareEnabled:normalizeBoolean(d.shareEnabled,true)};}
function normalizeAttendanceRecord(source){const d=source&&typeof source==="object"?source:{};const valid=["present","excused","absent"];return{id:normalizeText(d.id)||createId("ATT"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),status:valid.includes(d.status)?d.status:"present",note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeViolationRecord(source){const d=source&&typeof source==="object"?source:{};return{id:normalizeText(d.id)||createId("VIO"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),type:normalizeText(d.type)||"other",level:["light","attention","serious"].includes(d.level)?d.level:"light",status:["monitoring","resolved"].includes(d.status)?d.status:"monitoring",action:normalizeText(d.action),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeRewardRecord(source){const d=source&&typeof source==="object"?source:{};return{id:normalizeText(d.id)||createId("REW"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),type:normalizeText(d.type)||"other",formType:normalizeText(d.formType)||"praise",note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeLearningRecord(source){const d=source&&typeof source==="object"?source:{};return{id:normalizeText(d.id)||createId("LRN"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),subject:normalizeText(d.subject),result:normalizeText(d.result),level:normalizeText(d.level),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeProgressRecord(source){const d=source&&typeof source==="object"?source:{};return{id:normalizeText(d.id)||createId("PRO"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),category:normalizeText(d.category)||"general",before:normalizeText(d.before),after:normalizeText(d.after),result:normalizeText(d.result),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeCommentRecord(source){const d=source&&typeof source==="object"?source:{};return{id:normalizeText(d.id)||createId("COM"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),content:normalizeText(d.content),type:normalizeText(d.type)||"general",visibleToStudent:normalizeBoolean(d.visibleToStudent,true),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function getStudentById(id){const x=normalizeText(id);return x?students.find(s=>s.id===x)||null:null;}
function getStudentByIdSafe(id){return getStudentById(id);}
function getStudentsSafe(){return Array.isArray(students)?students:[];}
function findStudentsByName(keyword){const t=normalizeKey(keyword);return t?students.filter(s=>normalizeKey(s.name).includes(t)):[...students];}
function isDuplicateStudentName(name,excludeId=null){const n=normalizeKey(name);return !!n&&students.some(s=>s.id!==excludeId&&normalizeKey(s.name)===n);}
function filterValidStudentRecords(records){const ids=new Set(students.map(s=>s.id));return normalizeArray(records).filter(r=>r&&ids.has(r.studentId));}
function normalizeAllData(data){const d=data&&typeof data==="object"?data:{};const raw=normalizeArray(d.students);if(raw.length>CLASS_CONFIG.maxStudents)throw new Error(`Số học sinh vượt quá giới hạn ${CLASS_CONFIG.maxStudents}.`);students=raw.map((x,i)=>normalizeStudent(x,i)).filter(x=>x.name);attendanceRecords=filterValidStudentRecords(normalizeArray(d.attendance).map(normalizeAttendanceRecord));violationRecords=filterValidStudentRecords(normalizeArray(d.violations).map(normalizeViolationRecord));rewardRecords=filterValidStudentRecords(normalizeArray(d.rewards).map(normalizeRewardRecord));learningRecords=filterValidStudentRecords(normalizeArray(d.learning).map(normalizeLearningRecord));progressRecords=filterValidStudentRecords(normalizeArray(d.progress).map(normalizeProgressRecord));commentRecords=filterValidStudentRecords(normalizeArray(d.comments).map(normalizeCommentRecord));syncAppDataReferences();return true;}
function saveClassData(){if(!isLocalStorageAvailable())return false;syncAppDataReferences();try{localStorage.setItem(CLASS_CONFIG.storageKey,JSON.stringify({version:CLASS_CONFIG.dataVersion,savedAt:getNowISO(),config:CLASS_CONFIG,students,attendance:attendanceRecords,violations:violationRecords,rewards:rewardRecords,learning:learningRecords,progress:progressRecords,comments:commentRecords}));return true;}catch(_){return false;}}
function validateClassData(){const errors=[];if(!Array.isArray(students))errors.push("Danh sách học sinh không phải Array.");else if(students.length>CLASS_CONFIG.maxStudents)errors.push(`Số học sinh vượt quá ${CLASS_CONFIG.maxStudents}.`);const ids=new Set();students.forEach((s,i)=>{if(!s||!s.id)errors.push(`Học sinh thứ ${i+1} thiếu ID.`);else if(ids.has(s.id))errors.push(`ID học sinh bị trùng: ${s.id}.`);else ids.add(s.id);if(!s||!s.name)errors.push(`Học sinh thứ ${i+1} thiếu họ tên.`);});[["Điểm danh",attendanceRecords],["Vi phạm",violationRecords],["Khen thưởng",rewardRecords],["Học tập",learningRecords],["Tiến bộ",progressRecords],["Nhận xét",commentRecords]].forEach(([n,rs])=>{if(!Array.isArray(rs))errors.push(`${n} không phải danh sách hợp lệ.`);else rs.forEach((r,i)=>{if(!r||!r.studentId)errors.push(`${n}: bản ghi thứ ${i+1} thiếu studentId.`);else if(!ids.has(r.studentId))errors.push(`${n}: studentId '${r.studentId}' không tồn tại.`);});});return{valid:errors.length===0,errors};}
function loadClassData(){if(!isLocalStorageAvailable())return false;try{const raw=localStorage.getItem(CLASS_CONFIG.storageKey);if(!raw)return false;const d=JSON.parse(raw);if(!d||typeof d!=="object"||Array.isArray(d))return false;if(!Array.isArray(d.students))return false;normalizeAllData(d);return validateClassData().valid;}catch(_){return false;}}
function clearClassData(){try{localStorage.removeItem(CLASS_CONFIG.storageKey);}catch(_){}students.splice(0,students.length);attendanceRecords.splice(0,attendanceRecords.length);violationRecords.splice(0,violationRecords.length);rewardRecords.splice(0,rewardRecords.length);learningRecords.splice(0,learningRecords.length);progressRecords.splice(0,progressRecords.length);commentRecords.splice(0,commentRecords.length);syncAppDataReferences();return true;}
function addStudent(data={}){if(students.length>=CLASS_CONFIG.maxStudents)return{success:false,message:`Lớp đã đạt giới hạn ${CLASS_CONFIG.maxStudents} học sinh.`};const s=normalizeStudent({...data,id:normalizeText(data.id)||createId("STU")},students.length);if(!s.name)return{success:false,message:"Họ và tên không được để trống."};students.push(s);syncAppDataReferences();if(!saveClassData()){students.pop();syncAppDataReferences();return{success:false,message:"Không thể lưu học sinh."};}return{success:true,student:s,warning:isDuplicateStudentName(s.name,s.id)?"Tên học sinh trùng với học sinh khác.":""};}
function updateStudent(id,changes={}){const s=getStudentById(id);if(!s)return{success:false,message:"Không tìm thấy học sinh."};const b={...s};Object.keys(changes).forEach(k=>{s[k]=k==='shareEnabled'?normalizeBoolean(changes[k],s[k]):normalizeText(changes[k]);});s.updatedAt=getNowISO();if(!saveClassData()){Object.assign(s,b);syncAppDataReferences();return{success:false,message:"Không thể lưu thay đổi học sinh."};}return{success:true,student:s};}
function deleteStudent(id){const i=students.findIndex(s=>s.id===id);if(i<0)return{success:false,message:"Không tìm thấy học sinh."};const b={students:students.slice(),attendance:attendanceRecords.slice(),violations:violationRecords.slice(),rewards:rewardRecords.slice(),learning:learningRecords.slice(),progress:progressRecords.slice(),comments:commentRecords.slice()};students.splice(i,1);attendanceRecords=attendanceRecords.filter(r=>r.studentId!==id);violationRecords=violationRecords.filter(r=>r.studentId!==id);rewardRecords=rewardRecords.filter(r=>r.studentId!==id);learningRecords=learningRecords.filter(r=>r.studentId!==id);progressRecords=progressRecords.filter(r=>r.studentId!==id);commentRecords=commentRecords.filter(r=>r.studentId!==id);syncAppDataReferences();if(!saveClassData()){students.splice(0,students.length,...b.students);attendanceRecords.splice(0,attendanceRecords.length,...b.attendance);violationRecords.splice(0,violationRecords.length,...b.violations);rewardRecords.splice(0,rewardRecords.length,...b.rewards);learningRecords.splice(0,learningRecords.length,...b.learning);progressRecords.splice(0,progressRecords.length,...b.progress);commentRecords.splice(0,commentRecords.length,...b.comments);syncAppDataReferences();return{success:false,message:"Không thể lưu thao tác xóa."};}return{success:true};}
function replaceStudents(imported){const source=normalizeArray(imported);if(source.length>CLASS_CONFIG.maxStudents)return{success:false,message:`Danh sách vượt ${CLASS_CONFIG.maxStudents} học sinh.`};const prepared=source.map((x,i)=>normalizeStudent(x,i)).filter(x=>x.name);if(!prepared.length)return{success:false,message:"Không tìm thấy học sinh hợp lệ."};const old={students:students.slice(),attendance:attendanceRecords.slice(),violations:violationRecords.slice(),rewards:rewardRecords.slice(),learning:learningRecords.slice(),progress:progressRecords.slice(),comments:commentRecords.slice()};students.splice(0,students.length,...prepared);attendanceRecords.splice(0,attendanceRecords.length,...filterValidStudentRecords(old.attendance));violationRecords.splice(0,violationRecords.length,...filterValidStudentRecords(old.violations));rewardRecords.splice(0,rewardRecords.length,...filterValidStudentRecords(old.rewards));learningRecords.splice(0,learningRecords.length,...filterValidStudentRecords(old.learning));progressRecords.splice(0,progressRecords.length,...filterValidStudentRecords(old.progress));commentRecords.splice(0,commentRecords.length,...filterValidStudentRecords(old.comments));syncAppDataReferences();if(!saveClassData()){students.splice(0,students.length,...old.students);attendanceRecords.splice(0,attendanceRecords.length,...old.attendance);violationRecords.splice(0,violationRecords.length,...old.violations);rewardRecords.splice(0,rewardRecords.length,...old.rewards);learningRecords.splice(0,learningRecords.length,...old.learning);progressRecords.splice(0,progressRecords.length,...old.progress);commentRecords.splice(0,commentRecords.length,...old.comments);syncAppDataReferences();return{success:false,message:"Không thể lưu danh sách nhập."};}return{success:true,message:`Đã nhập ${prepared.length} học sinh.`,students,statistics:{input:source.length,accepted:prepared.length,max:CLASS_CONFIG.maxStudents}};}
function saveAttendanceRecord(studentId,date,status,note=""){if(!getStudentById(studentId))return{success:false,message:"Không tìm thấy học sinh."};if(!["present","excused","absent"].includes(status))return{success:false,message:"Trạng thái không hợp lệ."};const d=normalizeText(date)||getTodayISO();const old=attendanceRecords.find(r=>r.studentId===studentId&&r.date===d);if(old){old.status=status;old.note=normalizeText(note);old.updatedAt=getNowISO();}else attendanceRecords.push({id:createId("ATT"),studentId,date:d,status,note:normalizeText(note),createdAt:getNowISO(),updatedAt:getNowISO()});return saveClassData()?{success:true}:{success:false,message:"Không thể lưu điểm danh."};}
function getAttendanceRecords(){return attendanceRecords;}
function getStudentAttendance(id){return attendanceRecords.filter(r=>r.studentId===id);}
function getStudentViolations(id){return violationRecords.filter(r=>r.studentId===id);}
function getStudentRewards(id){return rewardRecords.filter(r=>r.studentId===id);}
function getStudentLearning(id){return learningRecords.filter(r=>r.studentId===id);}
function getStudentProgress(id){return progressRecords.filter(r=>r.studentId===id);}
function getStudentComments(id){return commentRecords.filter(r=>r.studentId===id);}
function getStudentProfile(id){const s=getStudentById(id);return s?{student:s,attendance:getStudentAttendance(id),violations:getStudentViolations(id),rewards:getStudentRewards(id),learning:getStudentLearning(id),progress:getStudentProgress(id),comments:getStudentComments(id)}:null;}
function addViolation(data={}){if(!getStudentById(data.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeViolationRecord(data);violationRecords.push(r);if(!saveClassData()){violationRecords.pop();return{success:false,message:"Không thể lưu vi phạm."};}return{success:true,record:r};}
function getViolationRecords(){return violationRecords;}
function addReward(data={}){if(!getStudentById(data.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeRewardRecord(data);rewardRecords.push(r);if(!saveClassData()){rewardRecords.pop();return{success:false,message:"Không thể lưu khen thưởng."};}return{success:true,record:r};}
function getRewardRecords(){return rewardRecords;}
function addLearningRecord(data={}){if(!getStudentById(data.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeLearningRecord(data);learningRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu học tập."};}
function getLearningRecords(){return learningRecords;}
function addProgressRecord(data={}){if(!getStudentById(data.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeProgressRecord(data);progressRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu tiến bộ."};}
function getProgressRecords(){return progressRecords;}
function addComment(data={}){if(!getStudentById(data.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeCommentRecord(data);if(!r.content)return{success:false,message:"Nội dung nhận xét không được để trống."};commentRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu nhận xét."};}
function getCommentRecords(){return commentRecords;}
function getClassStatistics(){const today=getTodayISO();const ta=attendanceRecords.filter(r=>r.date===today);return{totalStudents:students.length,activeStudents:students.filter(s=>s.status==="active").length,inactiveStudents:students.filter(s=>s.status!=="active").length,todayAttendance:ta.length,present:ta.filter(r=>r.status==="present").length,excused:ta.filter(r=>r.status==="excused").length,absent:ta.filter(r=>r.status==="absent").length,totalViolations:violationRecords.length,totalRewards:rewardRecords.length,totalLearning:learningRecords.length,totalProgress:progressRecords.length,totalComments:commentRecords.length};}
function getMonitoringViolations(){return violationRecords.filter(r=>r.status==="monitoring");}
function getRecentRewards(limit=10){return [...rewardRecords].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,Math.max(0,Number(limit)||10));}
function getStudentLink(id){const s=getStudentById(id);if(!s)return"";const base=typeof window!=="undefined"?window.location.origin+window.location.pathname:"";return base+"?student="+encodeURIComponent(s.id);}
function getStudentIdFromURL(){try{return new URLSearchParams(window.location.search).get("student");}catch(_){return null;}}
function getStudentPublicProfile(id){const p=getStudentProfile(id);return p?{student:{id:p.student.id,name:p.student.name,gender:p.student.gender,birthDate:p.student.birthDate},learning:STUDENT_LINK_CONFIG.showLearning?p.learning:[],attendance:STUDENT_LINK_CONFIG.showAttendance?p.attendance:[],violations:STUDENT_LINK_CONFIG.showViolations?p.violations:[],rewards:STUDENT_LINK_CONFIG.showRewards?p.rewards:[],progress:STUDENT_LINK_CONFIG.showProgress?p.progress:[],comments:STUDENT_LINK_CONFIG.showComments?p.comments.filter(x=>x.visibleToStudent===true):[]}:null;}
function exportClassData(){syncAppDataReferences();return JSON.stringify({exportedAt:getNowISO(),version:CLASS_CONFIG.dataVersion,config:CLASS_CONFIG,students,attendance:attendanceRecords,violations:violationRecords,rewards:rewardRecords,learning:learningRecords,progress:progressRecords,comments:commentRecords},null,2);}
function downloadClassBackup(){const blob=new Blob([exportClassData()],{type:"application/json;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`QUAN_LY_LOP_HOC_LE_HOANG_${getTodayISO()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}
function validateImportObject(d){const e=[];if(!d||typeof d!=="object"||Array.isArray(d))e.push("Dữ liệu không hợp lệ.");if(!Array.isArray(d?.students))e.push("Thiếu danh sách students.");if(Array.isArray(d?.students)&&d.students.length>CLASS_CONFIG.maxStudents)e.push(`Số học sinh vượt quá ${CLASS_CONFIG.maxStudents}.`);return{valid:e.length===0,errors:e};}
function importClassData(jsonText){try{const d=JSON.parse(String(jsonText||""));const v=validateImportObject(d);if(!v.valid)return{success:false,message:v.errors.join("\n"),errors:v.errors};normalizeAllData(d);if(!validateClassData().valid)throw new Error("Dữ liệu sau nhập không hợp lệ.");if(!saveClassData())throw new Error("Không thể lưu dữ liệu nhập.");return{success:true,message:"Đã nhập dữ liệu thành công.",statistics:getClassStatistics()};}catch(e){return{success:false,message:e.message||"Không thể nhập dữ liệu."};}}
function getDataEngineStatus(){const v=validateClassData();return{system:CLASS_CONFIG.systemName,version:CLASS_CONFIG.dataVersion,schoolYear:CLASS_CONFIG.schoolYear,className:CLASS_CONFIG.className,storageAvailable:isLocalStorageAvailable(),valid:v.valid,errors:v.errors,students:students.length,maxStudents:CLASS_CONFIG.maxStudents,attendance:attendanceRecords.length,violations:violationRecords.length,rewards:rewardRecords.length,learning:learningRecords.length,progress:progressRecords.length,comments:commentRecords.length};}
function repairClassData(){try{syncAppDataReferences();saveClassData();return{before:validateClassData(),after:validateClassData(),repaired:true};}catch(e){return{before:validateClassData(),after:{valid:false,errors:[e.message]},repaired:false};}}

syncAppDataReferences();
console.info("DATA ENGINE:",CLASS_CONFIG.systemName);
console.info("DATA VERSION:",CLASS_CONFIG.dataVersion);
console.info("Năm học:",CLASS_CONFIG.schoolYear);
console.info("Lớp:",CLASS_CONFIG.className);
