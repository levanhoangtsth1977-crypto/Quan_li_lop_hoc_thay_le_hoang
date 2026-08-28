/* ĐIỂM DANH — STATUS FINAL FIX 2.0
   Bảo vệ tuyệt đối cột Trạng thái:
   - Chỉ 3 giá trị: present / excused / absent.
   - Tự xác định đúng cột theo tiêu đề bảng, không hard-code vị trí.
   - Nếu script khác ghi đè select bằng danh sách học sinh, tự khôi phục.
   - Theo dõi mutation trên tbody nhưng có khóa chống vòng lặp.
*/
(function(){'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX_20__)return;window.__LH_ATTENDANCE_STATUS_FINAL_FIX_20__=true;
var STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']],cache=window.__LH_ATTENDANCE_STATUS_CACHE__||{};
window.__LH_ATTENDANCE_STATUS_CACHE__=cache;
function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
function valid(v){return STATUS.some(function(x){return x[0]===String(v)})}
function getStudents(){try{if(typeof window.getStudentsSafe==='function'){var a=window.getStudentsSafe();if(Array.isArray(a))return a}}catch(e){}return Array.isArray(window.students)?window.students:[]}
function studentIdFromRow(row){
  var nodes=row.querySelectorAll('[data-student-id]');
  for(var i=0;i<nodes.length;i++)if(nodes[i].dataset.studentId)return text(nodes[i].dataset.studentId);
  var name=row.cells&&row.cells[1]?text(row.cells[1].textContent):'';
  var a=getStudents();
  for(var j=0;j<a.length;j++)if(text(a[j].name||a[j].studentName)===name)return text(a[j].id||a[j].studentId||a[j].studentCode);
  return '';
}
function statusIndex(table){var th=table.querySelectorAll('thead th');for(var i=0;i<th.length;i++)if(text(th[i].textContent).toLowerCase().replace(/\s+/g,' ')==='trạng thái'.toLowerCase())return i;return 2}
function makeSelect(v,id){var s=document.createElement('select');s.className='attendance-status';s.setAttribute('aria-label','Trạng thái điểm danh');if(id)s.dataset.studentId=id;STATUS.forEach(function(x){var o=document.createElement('option');o.value=x[0];o.textContent=x[1];o.selected=x[0]===v;s.appendChild(o)});return s}
function repair(){
  var tb=document.getElementById('attendanceTableBody');if(!tb)return;
  var table=tb.closest('table'),idx=table?statusIndex(table):2;
  Array.from(tb.rows).forEach(function(row){
    if(!row.cells||row.cells.length<=idx)return;
    var cell=row.cells[idx],sel=cell.querySelector('select.attendance-status'),id=studentIdFromRow(row),v=(sel&&valid(sel.value)?sel.value:(id&&valid(cache[id])?cache[id]:'present'));
    var good=!!sel && sel.options && sel.options.length===3 && Array.from(sel.options).every(function(o,i){return o.value===STATUS[i][0]&&o.textContent===STATUS[i][1]});
    if(!good){cell.replaceChildren(makeSelect(v,id));sel=cell.querySelector('select.attendance-status')}
    else if(id&&!sel.dataset.studentId)sel.dataset.studentId=id;
    if(id&&valid(sel.value))cache[id]=sel.value;
  });
  try{if(typeof window.updateAttendanceSummary==='function')window.updateAttendanceSummary()}catch(e){}
}
var repairing=false;
function safeRepair(){if(repairing)return;repairing=true;try{repair()}finally{repairing=false}}
document.addEventListener('change',function(e){var el=e.target;if(!el||!el.matches('select.attendance-status'))return;var id=el.dataset.studentId;if(id&&valid(el.value))cache[id]=el.value},true);
function observe(){var tb=document.getElementById('attendanceTableBody');if(!tb||tb.__lhObserved20)return;tb.__lhObserved20=true;var ob=new MutationObserver(function(){safeRepair()});ob.observe(tb,{childList:true,subtree:true});tb.__lhAttendanceObserver20=ob}
function wrap(){if(typeof window.renderAttendance!=='function'||window.__LH_RENDER_ATTENDANCE_WRAPPED_20__)return;var orig=window.renderAttendance;window.renderAttendance=function(){var r=orig.apply(this,arguments);setTimeout(function(){safeRepair();observe()},0);return r};window.__LH_RENDER_ATTENDANCE_WRAPPED_20__=true}
function boot(){wrap();safeRepair();observe();[100,300,700,1500,3000].forEach(function(ms){setTimeout(function(){wrap();safeRepair();observe()},ms)});window.addEventListener('google-sheets-data-ready',function(){setTimeout(function(){safeRepair();observe()},0)});window.addEventListener('load',function(){setTimeout(function(){safeRepair();observe()},0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.LHRepairAttendanceStatusFinal=safeRepair;
})();