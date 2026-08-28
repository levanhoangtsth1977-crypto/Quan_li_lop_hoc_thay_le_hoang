/* ĐIỂM DANH — STATUS FINAL FIX 4.0
   Cố định cột Trạng thái điểm danh.
   - Chỉ cho phép: Có mặt / Có phép / Không phép.
   - Quan sát toàn bộ trang Điểm danh, kể cả khi tbody bị thay mới.
   - Tự nhận diện và thay select đang chứa danh sách học sinh trong cột Trạng thái.
   - Không được tự thay DOM khi giáo viên đang mở/chọn dropdown Trạng thái.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX_40__)return;
window.__LH_ATTENDANCE_STATUS_FINAL_FIX_40__=true;
var STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']],cache=window.__LH_ATTENDANCE_STATUS_CACHE__||{};
window.__LH_ATTENDANCE_STATUS_CACHE__=cache;
function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return STATUS.some(function(x){return String(x[0])===String(v)})}
function students(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function rowStudentId(row){var n=row.querySelector('[data-student-id]');if(n&&n.dataset.studentId)return text(n.dataset.studentId);var name=row.cells&&row.cells[1]?text(row.cells[1].textContent):'';var a=students();for(var i=0;i<a.length;i++){var x=a[i];if(text(x.name||x.studentName)===name)return text(x.id||x.studentId||x.studentCode)}return''}
function statusIndex(table){var th=table.querySelectorAll('thead th');for(var i=0;i<th.length;i++)if(text(th[i].textContent).toLowerCase()==='trạng thái')return i;return 2}
function make(v,id){var s=document.createElement('select');s.className='attendance-status';s.setAttribute('aria-label','Trạng thái điểm danh');if(id)s.dataset.studentId=id;STATUS.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function userIsEditingStatus(){var ae=document.activeElement;return !!(ae&&((ae.matches&&ae.matches('select.attendance-status'))||(ae.closest&&ae.closest('select.attendance-status'))))}
function repair(){if(userIsEditingStatus())return;var tb=document.getElementById('attendanceTableBody');if(!tb)return;var table=tb.closest('table'),idx=table?statusIndex(table):2;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<=idx)return;var cell=row.cells[idx],sel=cell.querySelector('select'),id=rowStudentId(row),old=sel&&valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');var good=!!sel&&sel.options&&sel.options.length===3&&Array.from(sel.options).every(function(o,i){return String(o.value)===STATUS[i][0]&&text(o.textContent)===STATUS[i][1]});if(!good&&!userIsEditingStatus()){cell.replaceChildren(make(old,id));sel=cell.querySelector('select')}else if(id&&sel&&!sel.dataset.studentId)sel.dataset.studentId=id;if(id&&sel&&valid(sel.value))cache[id]=sel.value;});try{if(!userIsEditingStatus()&&typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}}
function scan(){if(userIsEditingStatus())return;var page=document.getElementById('page-attendance');if(!page)return;var tables=page.querySelectorAll('table');for(var t=0;t<tables.length;t++){var table=tables[t],idx=statusIndex(table),tb=table.tBodies&&table.tBodies[0];if(!tb)continue;Array.from(tb.rows).forEach(function(row){if(!row.cells||row.cells.length<=idx||userIsEditingStatus())return;var cell=row.cells[idx],sel=cell.querySelector('select');if(!sel)return;var opts=Array.from(sel.options||[]).map(function(o){return text(o.textContent)}),isStudentList=opts.length>3||opts.some(function(v){return /^chọn học sinh$/i.test(v)})||opts.some(function(v){return students().some(function(s){return text(s.name||s.studentName)===v})});if(isStudentList&&!userIsEditingStatus()){var id=rowStudentId(row),old=valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present');cell.replaceChildren(make(old,id))}})}}
var busy=false,editDepth=0,repairTimer=0;
function run(){if(busy||userIsEditingStatus()||editDepth>0)return;busy=true;try{repair();scan()}finally{busy=false}}
function queueRun(){if(userIsEditingStatus()||editDepth>0)return;if(repairTimer)clearTimeout(repairTimer);repairTimer=setTimeout(function(){repairTimer=0;if(!userIsEditingStatus()&&editDepth===0)run()},80)}
function observe(){var page=document.getElementById('page-attendance');if(!page||page.__lhAttendanceObserved40)return;page.__lhAttendanceObserved40=true;var ob=new MutationObserver(function(){queueRun()});ob.observe(page,{childList:true,subtree:true});page.__lhAttendanceObserver40=ob}
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED_40__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);setTimeout(function(){run();observe()},0);return r};window.__LH_RENDER_ATTENDANCE_WRAPPED_40__=true}
document.addEventListener('pointerdown',function(e){var el=e.target;if(el&&el.matches&&el.matches('select.attendance-status'))editDepth++},true);
document.addEventListener('focusin',function(e){var el=e.target;if(el&&el.matches&&el.matches('select.attendance-status'))editDepth++},true);
document.addEventListener('change',function(e){var el=e.target;if(!el||!el.matches||!el.matches('select.attendance-status'))return;var id=el.dataset.studentId;if(id&&valid(el.value))cache[id]=el.value;setTimeout(function(){editDepth=0;queueRun()},120)},true);
document.addEventListener('blur',function(e){var el=e.target;if(el&&el.matches&&el.matches('select.attendance-status')){setTimeout(function(){editDepth=0;queueRun()},120)}},true);
function boot(){run();observe();wrap();[100,300,700,1500,3000,5000].forEach(function(ms){setTimeout(function(){if(!userIsEditingStatus())run();observe();wrap()},ms)});window.addEventListener('google-sheets-data-ready',function(){setTimeout(function(){if(!userIsEditingStatus())run();observe()},0)});window.addEventListener('load',function(){setTimeout(function(){if(!userIsEditingStatus())run();observe()},0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=run;
})();