/* ĐIỂM DANH — STATUS FINAL V2
   Không observer liên tục; không thay select hợp lệ; bọc renderAttendance để sửa sau mỗi lần render.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_V2__)return;window.__LH_ATTENDANCE_STATUS_V2__=true;
var S=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
function t(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return S.some(function(x){return x[0]===String(v)})}
function students(){try{if(typeof getStudentsSafe==='function'){var a=getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function sid(row){var e=row.querySelector('[data-student-id]');if(e&&e.dataset.studentId)return t(e.dataset.studentId);var n=row.cells&&row.cells[1]?t(row.cells[1].textContent):'';var s=students().find(function(x){return t(x.name||x.studentName)===n});return s?t(s.id||s.studentId||s.studentCode):''}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';if(id)s.dataset.studentId=id;S.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<3)return;var cell=row.cells[2],sel=cell.querySelector('select'),id=sid(row);if(sel){var good=sel.options.length===3&&Array.from(sel.options).every(function(o){return valid(o.value)});if(good){if(id&&!sel.dataset.studentId)sel.dataset.studentId=id;return}var v=valid(sel.value)?sel.value:'present';cell.replaceChildren(make(v,id));return}var txt=t(cell.textContent).toLowerCase(),v=txt.indexOf('có phép')>=0?'excused':txt.indexOf('không phép')>=0?'absent':'present';cell.replaceChildren(make(v,id))});try{if(typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}}
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);requestAnimationFrame(function(){repair();requestAnimationFrame(repair)});return r};window.__LH_RENDER_ATTENDANCE_WRAPPED__=true}
function boot(){wrap();[0,150,500,1200,2500].forEach(function(ms){setTimeout(function(){wrap();repair()},ms)});window.addEventListener('google-sheets-data-ready',function(){wrap();setTimeout(repair,0)});document.addEventListener('change',function(e){if(e.target&&e.target.matches('#attendanceDate'))setTimeout(repair,0)});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=repair;
})();