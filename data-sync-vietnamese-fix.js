/* ============================================================
   DATA SYNC + VIETNAMESE UI FIX 1.0.0
   - Giữ nguyên schema kỹ thuật/API
   - Khắc phục liên kết studentId <-> id/studentCode
   - Không làm mất các bản ghi hiện có
   - Việt hóa các enum khi hiển thị
   ============================================================ */
(function () {
  "use strict";
  const TEXT = Object.freeze({
    present: "Có mặt", excused: "Có phép", absent: "Vắng", late: "Đi muộn",
    active: "Đang học", inactive: "Không còn học", light: "Nhẹ",
    attention: "Cần chú ý", serious: "Nghiêm trọng", monitoring: "Đang theo dõi",
    resolved: "Đã xử lý", praise: "Tuyên dương", reward: "Khen thưởng",
    other: "Khác", general: "Chung", good: "Tốt", achieved: "Đạt", not_achieved: "Chưa đạt"
  });
  function key(v){return String(v??"").trim().toLocaleLowerCase("vi");}
  function vi(v){const k=key(v);return TEXT[k]||String(v??"");}
  function getStudents(){
    try{if(typeof window.getStudentsSafe==="function"){const s=window.getStudentsSafe();if(Array.isArray(s))return s;}}catch(_){ }
    return Array.isArray(window.students)?window.students:[];
  }
  function sameStudent(student,value){
    const v=String(value??"").trim();
    return !!student&&(String(student.id??"").trim()===v||String(student.studentCode??"").trim()===v||String(student.code??"").trim()===v);
  }
  const originalGetStudentById=window.getStudentById;
  window.getStudentById=function(studentId){
    const found=getStudents().find(s=>sameStudent(s,studentId));
    if(found)return found;
    return typeof originalGetStudentById==="function"?originalGetStudentById(studentId):null;
  };
  window.filterValidStudentRecords=function(records){
    const list=Array.isArray(records)?records:[];
    return list.filter(record=>record&&getStudents().some(s=>sameStudent(s,record.studentId)));
  };
  window.renderAttendance=function(){
    const tbody=document.getElementById("attendanceTableBody");if(!tbody)return;
    const date=(typeof window.getValue==="function"?window.getValue("attendanceDate"):"")||(typeof window.todayISO==="function"?window.todayISO():new Date().toISOString().slice(0,10));
    const dateEl=document.getElementById("attendanceDate");if(dateEl)dateEl.value=date;
    const students=getStudents();
    const records=typeof window.getAttendanceRecords==="function"?(window.getAttendanceRecords()||[]):[];
    const esc=window.escapeHTML||(v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"));
    tbody.innerHTML=students.map((student,index)=>{
      const record=Array.isArray(records)?records.find(r=>sameStudent(student,r.studentId)&&String(r.date)===String(date)):null;
      const status=record?.status||"present";const id=String(student.id??student.studentCode??"");
      return `<tr><td>${index+1}</td><td><strong>${esc(student.name)}</strong></td><td><select class="attendance-status" data-student-id="${esc(id)}"><option value="present" ${status==="present"?"selected":""}>Có mặt</option><option value="excused" ${status==="excused"?"selected":""}>Có phép</option><option value="absent" ${status==="absent"?"selected":""}>Vắng</option></select></td><td><input type="text" class="attendance-note" data-student-id="${esc(id)}" value="${esc(record?.note||"")}" placeholder="Ghi chú"></td></tr>`;
    }).join("");
    if(typeof window.updateAttendanceSummary==="function")window.updateAttendanceSummary();
  };
  function translateVisibleEnumText(){
    const selectors=[".violation-table td",".reward-table td",".learning-table td",".progress-table td",".comments-table td","[data-status]",".status-badge",".badge",".record-status",".record-level"];
    document.querySelectorAll(selectors.join(",")).forEach(el=>{const raw=el.textContent.trim();if(TEXT[key(raw)])el.textContent=vi(raw);});
  }
  window.__QL_VI_SYNC_FIX__={version:"1.0.0",vi,sameStudent};
  function run(){try{if(typeof window.refreshAll==="function")window.refreshAll();}catch(_){}translateVisibleEnumText();setTimeout(translateVisibleEnumText,300);setTimeout(translateVisibleEnumText,1000);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
})();
