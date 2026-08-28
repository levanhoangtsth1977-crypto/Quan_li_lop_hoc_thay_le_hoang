/* ĐIỂM DANH — STATUS FINAL V3
   Trạng thái ổn định: Có mặt / Có phép / Không phép.
   Không tự thay select hợp lệ; lưu lựa chọn tạm thời theo studentId để chống nháy khi bảng render lại.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_V3__)return;window.__LH_ATTENDANCE_STATUS_V3__=true;
var S=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
var cache=window.__LH_ATTENDANCE_STATUS_CACHE__=window.__LH_ATTENDANCE_STATUS_CACHE__||{};
function t(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return S.some(function(x){return x[0]===String(v)})}
function students(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function sid(row){var e=row.querySelector('[data-student-id]');if(e&&e.dataset.studentId)return t(e.dataset.studentId);var n=row.cells&&row.cells[1]?t(row.cells[1].textContent):'';var s=students().find(function(x){return t(x.name||x.studentName)===n});return s?t(s.id||s.studentId||s.studentCode):''}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';s.setAttribute('aria-label','Trạng thái điểm danh');if(id)s.dataset.studentId=id;S.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<3)return;var cell=row.cells[2],sel=cell.querySelector('select.attendance-status'),id=sid(row),v=sel&&valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');if(sel){if(id&&!sel.dataset.studentId)sel.dataset.studentId=id;return}cell.replaceChildren(make(v,id))});try{if(typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}}
document.addEventListener('change',function(e){var el=e.target;if(!el||!el.matches('select.attendance-status'))return;var id=el.dataset.studentId;if(id&&valid(el.value))cache[id]=el.value;},true);
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED_V3__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);requestAnimationFrame(function(){repair()});return r};window.__LH_RENDER_ATTENDANCE_WRAPPED_V3__=true}
function boot(){wrap();repair();[150,500,1200,2500].forEach(function(ms){setTimeout(function(){wrap();repair()},ms)});window.addEventListener('google-sheets-data-ready',function(){setTimeout(function(){wrap();repair()},0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=repair;
})();
