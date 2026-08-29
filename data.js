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
const CLASS_CONFIG={systemName:"QUẢN LÝ LỚP HỌC THẦY LÊ HOÀNG",teacherName:"Lê Hoàng",schoolYear:"2026–2027",className:"5A3",grade:"5",maxStudents:50,dataVersion:"3.1.1",storageKey:"QL_LOP_HOC_LE_HOANG_2026_2027"};
const STUDENT_LINK_CONFIG={enabled:true,parameterName:"student",showLearning:true,showAttendance:true,showViolations:true,showRewards:true,showProgress:true,showComments:true,showPrivateInformation:false};
let students=[];let attendanceRecords=[];let violationRecords=[];let rewardRecords=[];let learningRecords=[];let progressRecords=[];let commentRecords=[];
const APP_DATA={config:CLASS_CONFIG,students,attendance:attendanceRecords,violations:violationRecords,rewards:rewardRecords,learning:learningRecords,progress:progressRecords,comments:commentRecords};
function safeString(v,fallback=""){return v==null?fallback:String(v).trim();}
function normalizeText(v){return safeString(v).replace(/\s+/g," ").trim();}
function normalizeName(v){return normalizeText(v);}
function normalizeKey(v){return normalizeText(v).toLocaleLowerCase("vi");}
function normalizeBoolean(v,d=false){if(typeof v==="boolean")return v;if(["true","1",1,"yes","y"].includes(v))return true;if(["false","0",0,"no","n"].includes(v))return false;return d;}
function normalizeArray(v){return Array.isArray(v)?v:[];}
function createId(p="ID"){return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2,10)}`;}
function getTodayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getNowISO(){return new Date().toISOString();}
function isLocalStorageAvailable(){try{const k="__QL_LOP_HOC_TEST__";localStorage.setItem(k,"1");localStorage.removeItem(k);return true;}catch(_){return false;}}
function syncAppDataReferences(){APP_DATA.config=CLASS_CONFIG;APP_DATA.students=students;APP_DATA.attendance=attendanceRecords;APP_DATA.violations=violationRecords;APP_DATA.rewards=rewardRecords;APP_DATA.learning=learningRecords;APP_DATA.progress=progressRecords;APP_DATA.comments=commentRecords;}
function normalizeStudent(s,i=0){const d=s&&typeof s==="object"?s:{};const now=getNowISO();return{id:normalizeText(d.id)||createId("STU"),name:normalizeName(d.name),gender:normalizeText(d.gender),birthDate:normalizeText(d.birthDate),status:normalizeText(d.status)||"active",parentName:normalizeText(d.parentName),phone:normalizeText(d.phone),address:normalizeText(d.address),note:normalizeText(d.note),studentCode:normalizeText(d.studentCode)||normalizeText(d.code)||`HS${String(i+1).padStart(2,"0")}`,createdAt:normalizeText(d.createdAt)||now,updatedAt:normalizeText(d.updatedAt)||now,shareEnabled:normalizeBoolean(d.shareEnabled,true)};}
function normalizeAttendanceRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("ATT"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),status:["present","excused","absent"].includes(d.status)?d.status:"present",note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeViolationRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("VIO"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),type:normalizeText(d.type)||"other",level:["light","attention","serious"].includes(d.level)?d.level:"light",status:["monitoring","resolved"].includes(d.status)?d.status:"monitoring",action:normalizeText(d.action),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeRewardRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("REW"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),type:normalizeText(d.type)||"other",formType:normalizeText(d.formType)||"praise",note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeLearningRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("LRN"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),subject:normalizeText(d.subject),result:normalizeText(d.result),level:normalizeText(d.level),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeProgressRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("PRO"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),category:normalizeText(d.category)||"general",before:normalizeText(d.before),after:normalizeText(d.after),result:normalizeText(d.result),note:normalizeText(d.note),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function normalizeCommentRecord(s){const d=s&&typeof s==="object"?s:{};return{id:normalizeText(d.id)||createId("COM"),studentId:normalizeText(d.studentId),date:normalizeText(d.date)||getTodayISO(),content:normalizeText(d.content),type:normalizeText(d.type)||"general",visibleToStudent:normalizeBoolean(d.visibleToStudent,true),createdAt:normalizeText(d.createdAt)||getNowISO(),updatedAt:normalizeText(d.updatedAt)||getNowISO()};}
function getStudentById(id){const x=normalizeText(id);return x?students.find(s=>s.id===x)||null:null;}
function getStudentByIdSafe(id){return getStudentById(id);}
function getStudentsSafe(){return students;}
function findStudentsByName(k){const t=normalizeKey(k);return t?students.filter(s=>normalizeKey(s.name).includes(t)):[...students];}
function isDuplicateStudentName(n,e=null){const t=normalizeKey(n);return !!t&&students.some(s=>s.id!==e&&normalizeKey(s.name)===t);}
function filterValidStudentRecords(records){const ids=new Set(students.map(s=>s.id));return normalizeArray(records).filter(r=>r&&ids.has(r.studentId));}
function normalizeAllData(d){const x=d&&typeof d==="object"?d:{};const raw=normalizeArray(x.students);if(raw.length>CLASS_CONFIG.maxStudents)throw new Error(`Số học sinh vượt quá giới hạn ${CLASS_CONFIG.maxStudents}.`);students.splice(0,students.length,...raw.map((s,i)=>normalizeStudent(s,i)).filter(s=>s.name));attendanceRecords.splice(0,attendanceRecords.length,...filterValidStudentRecords(normalizeArray(x.attendance).map(normalizeAttendanceRecord)));violationRecords.splice(0,violationRecords.length,...filterValidStudentRecords(normalizeArray(x.violations).map(normalizeViolationRecord)));rewardRecords.splice(0,rewardRecords.length,...filterValidStudentRecords(normalizeArray(x.rewards).map(normalizeRewardRecord)));learningRecords.splice(0,learningRecords.length,...filterValidStudentRecords(normalizeArray(x.learning).map(normalizeLearningRecord)));progressRecords.splice(0,progressRecords.length,...filterValidStudentRecords(normalizeArray(x.progress).map(normalizeProgressRecord)));commentRecords.splice(0,commentRecords.length,...filterValidStudentRecords(normalizeArray(x.comments).map(normalizeCommentRecord)));syncAppDataReferences();return true;}
function saveClassData(){if(!isLocalStorageAvailable())return false;syncAppDataReferences();try{localStorage.setItem(CLASS_CONFIG.storageKey,JSON.stringify({version:CLASS_CONFIG.dataVersion,savedAt:getNowISO(),config:CLASS_CONFIG,students,attendance:attendanceRecords,violations:violationRecords,rewards:rewardRecords,learning:learningRecords,progress:progressRecords,comments:commentRecords}));return true;}catch(_){return false;}}
function loadClassData(){if(!isLocalStorageAvailable())return false;try{const raw=localStorage.getItem(CLASS_CONFIG.storageKey);if(!raw)return false;const d=JSON.parse(raw);if(!d||!Array.isArray(d.students))return false;normalizeAllData(d);return validateClassData().valid;}catch(_){return false;}}
function clearClassData(){try{localStorage.removeItem(CLASS_CONFIG.storageKey);}catch(_){}students.splice(0);attendanceRecords.splice(0);violationRecords.splice(0);rewardRecords.splice(0);learningRecords.splice(0);progressRecords.splice(0);commentRecords.splice(0);syncAppDataReferences();return true;}
function addStudent(d={}){if(students.length>=50)return{success:false,message:"Lớp đã đạt giới hạn 50 học sinh."};const s=normalizeStudent({...d,id:normalizeText(d.id)||createId("STU")},students.length);if(!s.name)return{success:false,message:"Họ và tên không được để trống."};students.push(s);syncAppDataReferences();return saveClassData()?{success:true,student:s}:{success:false,message:"Không thể lưu học sinh."};}
function updateStudent(id,changes={}){const s=getStudentById(id);if(!s)return{success:false,message:"Không tìm thấy học sinh."};const b={...s};Object.assign(s,changes);s.updatedAt=getNowISO();if(!saveClassData()){Object.assign(s,b);syncAppDataReferences();return{success:false,message:"Không thể lưu thay đổi học sinh."};}return{success:true,student:s};}
function deleteStudent(id){const i=students.findIndex(s=>s.id===id);if(i<0)return{success:false,message:"Không tìm thấy học sinh."};students.splice(i,1);attendanceRecords=attendanceRecords.filter(r=>r.studentId!==id);violationRecords=violationRecords.filter(r=>r.studentId!==id);rewardRecords=rewardRecords.filter(r=>r.studentId!==id);learningRecords=learningRecords.filter(r=>r.studentId!==id);progressRecords=progressRecords.filter(r=>r.studentId!==id);commentRecords=commentRecords.filter(r=>r.studentId!==id);syncAppDataReferences();return saveClassData()?{success:true}:{success:false,message:"Không thể lưu thao tác xóa."};}
function replaceStudents(list){const src=normalizeArray(list);if(src.length>50)return{success:false,message:"Danh sách vượt 50 học sinh."};const p=src.map((s,i)=>normalizeStudent(s,i)).filter(s=>s.name);if(!p.length)return{success:false,message:"Không tìm thấy học sinh hợp lệ."};students.splice(0,students.length,...p);syncAppDataReferences();return saveClassData()?{success:true,message:`Đã nhập ${p.length} học sinh.`,students}:{success:false,message:"Không thể lưu danh sách nhập."};}
function saveAttendanceRecord(studentId,date,status,note=""){if(!getStudentById(studentId))return{success:false,message:"Không tìm thấy học sinh."};if(!["present","excused","absent"].includes(status))return{success:false,message:"Trạng thái không hợp lệ."};const d=normalizeText(date)||getTodayISO();const e=attendanceRecords.find(r=>r.studentId===studentId&&r.date===d);if(e){e.status=status;e.note=normalizeText(note);e.updatedAt=getNowISO();}else attendanceRecords.push({id:createId("ATT"),studentId,date:d,status,note,createdAt:getNowISO(),updatedAt:getNowISO()});return saveClassData()?{success:true}:{success:false,message:"Không thể lưu điểm danh."};}
function getAttendanceRecords(){return attendanceRecords;}
function addViolation(d={}){if(!getStudentById(d.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeViolationRecord(d);violationRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu vi phạm."};}
function getViolationRecords(){return violationRecords;}
function updateViolation(id,c={}){const r=violationRecords.find(x=>x.id===id);if(!r)return{success:false,message:"Không tìm thấy bản ghi vi phạm."};Object.assign(r,c);r.updatedAt=getNowISO();return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu vi phạm."};}
function deleteViolation(id){const i=violationRecords.findIndex(x=>x.id===id);if(i<0)return false;violationRecords.splice(i,1);return saveClassData();}
function addReward(d={}){if(!getStudentById(d.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeRewardRecord(d);rewardRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu khen thưởng."};}
function getRewardRecords(){return rewardRecords;}
function updateReward(id,c={}){const r=rewardRecords.find(x=>x.id===id);if(!r)return{success:false,message:"Không tìm thấy bản ghi khen thưởng."};Object.assign(r,c);r.updatedAt=getNowISO();return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu khen thưởng."};}
function deleteReward(id){const i=rewardRecords.findIndex(x=>x.id===id);if(i<0)return false;rewardRecords.splice(i,1);return saveClassData();}
function addLearningRecord(d={}){if(!getStudentById(d.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeLearningRecord(d);learningRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu học tập."};}
function getLearningRecords(){return learningRecords;}
function addProgressRecord(d={}){if(!getStudentById(d.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeProgressRecord(d);progressRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu tiến bộ."};}
function getProgressRecords(){return progressRecords;}
function addComment(d={}){if(!getStudentById(d.studentId))return{success:false,message:"Không tìm thấy học sinh."};const r=normalizeCommentRecord(d);if(!r.content)return{success:false,message:"Nội dung nhận xét không được để trống."};commentRecords.push(r);return saveClassData()?{success:true,record:r}:{success:false,message:"Không thể lưu nhận xét."};}
function getCommentRecords(){return commentRecords;}
function getStudentAttendance(id){return attendanceRecords.filter(r=>r.studentId===id);}
function getStudentViolations(id){return violationRecords.filter(r=>r.studentId===id);}
function getStudentRewards(id){return rewardRecords.filter(r=>r.studentId===id);}
function getStudentLearning(id){return learningRecords.filter(r=>r.studentId===id);}
function getStudentProgress(id){return progressRecords.filter(r=>r.studentId===id);}
function getStudentComments(id){return commentRecords.filter(r=>r.studentId===id);}
function getStudentProfile(id){const student=getStudentById(id);return student?{student,attendance:getStudentAttendance(id),violations:getStudentViolations(id),rewards:getStudentRewards(id),learning:getStudentLearning(id),progress:getStudentProgress(id),comments:getStudentComments(id)}:null;}
function getClassStatistics(){const today=getTodayISO();const t=attendanceRecords.filter(r=>r.date===today);return{totalStudents:students.length,activeStudents:students.filter(s=>s.status==="active").length,inactiveStudents:students.filter(s=>s.status!=="active").length,todayAttendance:t.length,present:t.filter(r=>r.status==="present").length,excused:t.filter(r=>r.status==="excused").length,absent:t.filter(r=>r.status==="absent").length,totalViolations:violationRecords.length,monitoringViolations:violationRecords.filter(r=>r.status==="monitoring").length,resolvedViolations:violationRecords.filter(r=>r.status==="resolved").length,totalRewards:rewardRecords.length,totalLearning:learningRecords.length,totalProgress:progressRecords.length,totalComments:commentRecords.length};}
function getMonitoringViolations(){return violationRecords.filter(r=>r.status==="monitoring");}
function getRecentRewards(limit=10){return[...rewardRecords].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,limit);}
function getStudentLink(id){const s=getStudentById(id);return s?window.location.origin+window.location.pathname+"?student="+encodeURIComponent(s.id):"";}
function getStudentIdFromURL(){try{return new URLSearchParams(window.location.search).get("student");}catch(_){return null;}}
function getStudentPublicProfile(id){const p=getStudentProfile(id);return p?{student:{id:p.student.id,name:p.student.name,gender:p.student.gender,birthDate:p.student.birthDate},learning:p.learning,attendance:p.attendance,violations:p.violations,rewards:p.rewards,progress:p.progress,comments:p.comments.filter(x=>x.visibleToStudent===true)}:null;}
function exportClassData(){return JSON.stringify({exportedAt:getNowISO(),version:CLASS_CONFIG.dataVersion,config:CLASS_CONFIG,students,attendance:attendanceRecords,violations:violationRecords,rewards:rewardRecords,learning:learningRecords,progress:progressRecords,comments:commentRecords},null,2);}
function downloadClassBackup(){const blob=new Blob([exportClassData()],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`QUAN_LY_LOP_HOC_LE_HOANG_${getTodayISO()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}
function validateImportObject(d){const e=[];if(!d||typeof d!=="object"||Array.isArray(d))e.push("Dữ liệu không hợp lệ.");if(!Array.isArray(d?.students))e.push("Thiếu danh sách students.");return{valid:e.length===0,errors:e};}
function importClassData(j){try{const d=JSON.parse(String(j||""));const v=validateImportObject(d);if(!v.valid)return{success:false,message:v.errors.join("\n")};normalizeAllData(d);return saveClassData()?{success:true,message:"Đã nhập dữ liệu thành công.",statistics:getClassStatistics()}:{success:false,message:"Không thể lưu dữ liệu nhập."};}catch(e){return{success:false,message:e.message||"Không thể nhập dữ liệu."};}}
function repairClassData(){syncAppDataReferences();return{before:validateClassData(),after:validateClassData(),repaired:true};}
function getDataEngineStatus(){const v=validateClassData();return{system:CLASS_CONFIG.systemName,version:CLASS_CONFIG.dataVersion,schoolYear:CLASS_CONFIG.schoolYear,className:CLASS_CONFIG.className,storageAvailable:isLocalStorageAvailable(),valid:v.valid,errors:v.errors,students:students.length,maxStudents:CLASS_CONFIG.maxStudents,attendance:attendanceRecords.length,violations:violationRecords.length,rewards:rewardRecords.length,learning:learningRecords.length,progress:progressRecords.length,comments:commentRecords.length};}
function validateClassData(){const errors=[];if(!Array.isArray(students))errors.push("Danh sách học sinh không phải Array.");if(students.length>CLASS_CONFIG.maxStudents)errors.push(`Số học sinh vượt quá ${CLASS_CONFIG.maxStudents}.`);const ids=new Set();students.forEach((s,i)=>{if(!s?.id)errors.push(`Học sinh thứ ${i+1} thiếu ID.`);else if(ids.has(s.id))errors.push(`ID học sinh bị trùng: ${s.id}.`);else ids.add(s.id);if(!s?.name)errors.push(`Học sinh thứ ${i+1} thiếu họ tên.`);});return{valid:errors.length===0,errors};}
syncAppDataReferences();
console.info("DATA ENGINE:",CLASS_CONFIG.systemName);console.info("DATA VERSION:",CLASS_CONFIG.dataVersion);console.info("Năm học:",CLASS_CONFIG.schoolYear);console.info("Lớp:",CLASS_CONFIG.className);console.info("Giới hạn tối đa:",CLASS_CONFIG.maxStudents);