/* ============================================================
   ATTENDANCE STATUS FINAL V2
   FIX GỐC: ô Trạng thái Điểm danh không được phép bị module
   chọn học sinh / module cũ ghi đè.
   - Chỉ cho phép 3 trạng thái: Có mặt / Có phép / Không phép.
   - Không render lại bảng khi đổi trạng thái.
   - Tự sửa DOM nếu module cũ chèn select học sinh vào cột trạng thái.
   - CSS z-index/overflow cho bảng điểm danh.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_V2__)return;
window.__LH_ATTENDANCE_STATUS_FINAL_V2__=true;

const OPTIONS=[
  ['present','Có mặt'],
  ['excused','Có phép'],
  ['absent','Không phép']
];
const escapeHtml=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

function installCss(){
  if(document.getElementById('lhAttendanceStatusFinalCss'))return;
  const s=document.createElement('style');
  s.id='lhAttendanceStatusFinalCss';
  s.textContent=`
    #page-attendance .attendance-table{position:relative;z-index:1;overflow:visible}
    #page-attendance .attendance-table tbody,
    #page-attendance .attendance-table tr,
    #page-attendance .attendance-table td{overflow:visible}
    #page-attendance .attendance-table td:nth-child(3){position:relative;z-index:20;min-width:150px}
    #page-attendance .attendance-status{position:relative;z-index:21;display:block;width:100%;min-width:140px;pointer-events:auto;cursor:pointer}
    #page-attendance .attendance-note{position:relative;z-index:5}
    #page-attendance .table-container{overflow-x:auto;overflow-y:visible}
  `;
  document.head.appendChild(s);
}

function validOptions(select){
  if(!select)return false;
  const vals=Array.from(select.options||[]).map(o=>String(o.value||''));
  return vals.length===3 && OPTIONS.every(x=>vals.includes(x[0]));
}

function makeSelect(current,id){
  const sel=document.createElement('select');
  sel.className='attendance-status';
  sel.dataset.studentId=id||'';
  OPTIONS.forEach(([value,label])=>{
    const o=document.createElement('option');
    o.value=value;o.textContent=label;
    if(value===current)o.selected=true;
    sel.appendChild(o);
  });
  return sel;
}

function repairRow(row){
  if(!row)return;
  const cells=row.children;
  if(!cells||cells.length<4)return;
  const cell=cells[2];
  if(!cell)return;
  let select=cell.querySelector('select.attendance-status');
  const studentPicker=cell.querySelector('select:not(.attendance-status)');
  const current=select&&OPTIONS.some(x=>x[0]===select.value)?select.value:'present';
  if(!select||!validOptions(select)||studentPicker){
    if(studentPicker)studentPicker.remove();
    const oldNote=cell.querySelector('[data-student-id]');
    const id=select?.dataset?.studentId||oldNote?.dataset?.studentId||'';
    cell.innerHTML='';
    cell.appendChild(makeSelect(current,id));
  }
}

function repair(){
  const tbody=document.getElementById('attendanceTableBody');
  if(!tbody)return;
  Array.from(tbody.rows||[]).forEach(repairRow);
}

function summary(){
  if(typeof window.updateAttendanceSummary==='function'){
    try{window.updateAttendanceSummary();}catch(e){}
    return;
  }
  let p=0,e=0,a=0;
  document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
    if(s.value==='present')p++;else if(s.value==='excused')e++;else if(s.value==='absent')a++;
  });
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v)};
  set('attendancePresentCount',p);set('attendanceExcusedCount',e);set('attendanceAbsentCount',a);
}

function bind(){
  installCss();
  document.addEventListener('change',e=>{
    if(e.target&&e.target.matches('#attendanceTableBody select.attendance-status')){
      summary();
      /* Tuyệt đối không gọi renderAttendance ở đây. */
    }
  },true);
  document.addEventListener('pointerdown',e=>{
    if(e.target&&e.target.matches('#attendanceTableBody select.attendance-status')){
      e.stopPropagation();
    }
  },true);
  const obs=new MutationObserver(()=>{
    if(window.__LH_ATT_REPAIRING__)return;
    window.__LH_ATT_REPAIRING__=true;
    try{repair()}finally{window.__LH_ATT_REPAIRING__=false}
  });
  const start=()=>{
    const tbody=document.getElementById('attendanceTableBody');
    if(tbody)obs.observe(tbody,{childList:true,subtree:true});
    repair();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('lhAttendanceRendered',repair);
  window.LHAttendanceStatusFinal={repair,summary};
}
bind();
})();
