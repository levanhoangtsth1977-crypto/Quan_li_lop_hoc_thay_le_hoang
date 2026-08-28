/* ĐIỂM DANH — STATUS FINAL FIX 3.0
   Cố định cột Trạng thái điểm danh.
   - Chỉ cho phép: Có mặt / Có phép / Không phép.
   - Quan sát toàn bộ trang Điểm danh, kể cả khi tbody bị thay mới.
   - Tự nhận diện và thay mọi select đang chứa danh sách học sinh trong cột Trạng thái.
   - Không thêm script vá chồng chéo.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX_30__)return;
window.__LH_ATTENDANCE_STATUS_FINAL_FIX_30__=true;
var STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']],cache=window.__LH_ATTENDANCE_STATUS_CACHE__||{};
window.__LH_ATTENDANCE_STATUS_CACHE__=cache;
function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return STATUS.some(function(x){return String(x[0])===String(v)})}
function students(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function rowStudentId(row){var n=row.querySelector('[data-student-id]');if(n&&n.dataset.studentId)return text(n.dataset.studentId);var name=row.cells&&row.cells[1]?text(row.cells[1].textContent):'';var a=students();for(var i=0;i<a.length;i++){var x=a[i];if(text(x.name||x.studentName)===name)return text(x.id||x.studentId||x.studentCode)}return''}
function statusIndex(table){var th=table.querySelectorAll('thead th');for(var i=0;i<th.length;i++)if(text(th[i].textContent).toLowerCase()==='trạng thái')return i;return 2}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';s.setAttribute('aria-label','Trạng thái điểm danh');if(id)s.dataset.studentId=id;STATUS.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){var tb=document.getElementById('attendanceTableBody');if(!tb)return;var table=tb.closest('table'),idx=table?statusIndex(table):2;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<=idx)return;var cell=row.cells[idx],sel=cell.querySelector('select'),id=rowStudentId(row),old=sel&&valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');var good=!!sel&&sel.options&&sel.options.length===3&&Array.from(sel.options).every(function(o,i){return String(o.value)===STATUS[i][0]&&text(o.textContent)===STATUS[i][1]});if(!good){cell.replaceChildren(make(old,id))}else if(id&&!cell.querySelector('select').dataset.studentId)cell.querySelector('select').dataset.studentId=id;if(id)cache[id]=cell.querySelector('select').value;});try{if(typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}}
function scan(){var page=document.getElementById('page-attendance');if(!page)return;var tables=page.querySelectorAll('table');for(var t=0;t<tables.length;t++){var table=tables[t],idx=statusIndex(table),tb=table.tBodies&&table.tBodies[0];if(!tb)continue;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<=idx)return;var cell=row.cells[idx],sel=cell.querySelector('select');if(!sel)return;var opts=Array.from(sel.options||[]).map(function(o){return text(o.textContent)}),isStudentList=opts.length>3||opts.some(function(v){return /^chọn học sinh$/i.test(v)})||opts.some(function(v){return students().some(function(s){return text(s.name||s.studentName)===v})});if(isStudentList||!sel.classList.contains('attendance-status')){var id=rowStudentId(row),old=valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');cell.replaceChildren(make(old,id))}})}}
var busy=false;function run(){if(busy)return;busy=true;try{repair();scan()}finally{busy=false}}
function observe(){var page=document.getElementById('page-attendance');if(!page||page.__lhAttendanceObserved30)return;page.__lhAttendanceObserved30=true;var ob=new MutationObserver(function(){run()});ob.observe(page,{childList:true,subtree:true});page.__lhAttendanceObserver30=ob}
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED_30__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);setTimeout(function(){run();observe()},0);return r};window.__LH_RENDER_ATTENDANCE_WRAPPED_30__=true}
function boot(){run();observe();wrap();[100,300,700,1500,3000,5000].forEach(function(ms){setTimeout(function(){run();observe();wrap()},ms)});window.addEventListener('google-sheets-data-ready',function(){setTimeout(function(){run();observe()},0)});window.addEventListener('load',function(){setTimeout(function(){run();observe()},0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=run;
})();