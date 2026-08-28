/* ĐIỂM DANH — STATUS FINAL FIX 1.2
   Chỉ sửa cột Trạng thái nếu nó thực sự sai.
   Không dùng MutationObserver liên tục, không tạo observer trùng.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX_12__)return;window.__LH_ATTENDANCE_STATUS_FINAL_FIX_12__=true;
var STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return STATUS.some(function(x){return x[0]===String(v)})}
function students(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function sid(row){var el=row.querySelector('[data-student-id]');if(el&&el.dataset.studentId)return String(el.dataset.studentId);var name=row.cells&&row.cells[1]?text(row.cells[1].textContent):'';var s=students().find(function(x){return text(x.name)===name});return s?String(s.id||s.studentId||''):''}
function make(value,id){var s=document.createElement('select');s.className='attendance-status';if(id)s.dataset.studentId=id;STATUS.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];if(x[0]===value)o.selected=true;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;Array.prototype.forEach.call(tb.querySelectorAll('tr'),function(row){if(!row.cells||row.cells.length<3)return;var cell=row.cells[2],select=cell.querySelector('select.attendance-status'),sidv=sid(row),val=select&&valid(select.value)?select.value:'present';if(select){var opts=Array.prototype.map.call(select.options,function(o){return String(o.value)}),ok=opts.length===3&&opts.every(valid);if(ok){if(sidv&&!select.dataset.studentId)select.dataset.studentId=sidv;return}}var any=cell.querySelector('select');if(any&&valid(any.value))val=any.value;cell.replaceChildren(make(val,sidv))});if(typeof window.updateAttendanceSummary==='function'){try{window.updateAttendanceSummary()}catch(e){}}}
function boot(){repair()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatus=repair;
})();