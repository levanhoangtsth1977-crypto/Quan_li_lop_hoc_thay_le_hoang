/* ĐIỂM DANH — STATUS FINAL FIX 1.3
   Trạng thái ổn định: Có mặt / Có phép / Không phép.
   Không observer liên tục; không thay select hợp lệ; giữ studentId và lựa chọn khi render lại.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX_13__)return;window.__LH_ATTENDANCE_STATUS_FINAL_FIX_13__=true;
var S=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']],cache=window.__LH_ATTENDANCE_STATUS_CACHE__||{};window.__LH_ATTENDANCE_STATUS_CACHE__=cache;
function t(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return S.some(function(x){return x[0]===String(v)})}
function students(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function sid(row){var e=row.querySelector('[data-student-id]');if(e&&e.dataset.studentId)return t(e.dataset.studentId);var n=row.cells&&row.cells[1]?t(row.cells[1].textContent):'';var s=students().find(function(x){return t(x.name||x.studentName)===n});return s?t(s.id||s.studentId||s.studentCode):''}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';s.setAttribute('aria-label','Trạng thái điểm danh');if(id)s.dataset.studentId=id;S.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<3)return;var cell=row.cells[2],sel=cell.querySelector('select'),id=sid(row),v=sel&&valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');if(sel){var vals=Array.from(sel.options).map(function(o){return String(o.value)}),good=vals.length===3&&vals.every(valid);if(good){if(id&&!sel.dataset.studentId)sel.dataset.studentId=id;if(id&&valid(sel.value))cache[id]=sel.value;return}}cell.replaceChildren(make(v,id));if(id)cache[id]=v});try{if(typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}}
document.addEventListener('change',function(e){var el=e.target;if(!el||!el.matches('select.attendance-status'))return;var id=el.dataset.studentId;if(id&&valid(el.value))cache[id]=el.value},true);
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED_V13__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);requestAnimationFrame(repair);return r};window.__LH_RENDER_ATTENDANCE_WRAPPED_V13__=true}
function boot(){wrap();repair();[150,500,1200,2500].forEach(function(ms){setTimeout(function(){wrap();repair()},ms)});window.addEventListener('google-sheets-data-ready',function(){setTimeout(function(){wrap();repair()},0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=repair;
})();
