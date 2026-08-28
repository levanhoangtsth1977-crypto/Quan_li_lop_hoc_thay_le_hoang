/* ============================================================
   ĐIỂM DANH — STATUS FINAL FIX 1.0
   Mục tiêu: bảo vệ cột Trạng thái khỏi mọi module ghi nhầm
   danh sách học sinh vào select trạng thái.
   Không thay đổi Data Engine hay logic lưu điểm danh.
   ============================================================ */
(function(){
'use strict';
if(window.__LH_ATTENDANCE_STATUS_FINAL_FIX__) return;
window.__LH_ATTENDANCE_STATUS_FINAL_FIX__=true;

var STATUS=[
  {value:'present',label:'Có mặt'},
  {value:'excused',label:'Có phép'},
  {value:'absent',label:'Không phép'}
];

function text(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}

function validStatusValue(v){
  return STATUS.some(function(x){return x.value===String(v)});
}

function makeSelect(oldValue,studentId){
  var select=document.createElement('select');
  select.className='attendance-status';
  if(studentId!=null) select.dataset.studentId=String(studentId);
  STATUS.forEach(function(item){
    var o=document.createElement('option');
    o.value=item.value;
    o.textContent=item.label;
    if(String(oldValue||'present')===item.value)o.selected=true;
    select.appendChild(o);
  });
  select.addEventListener('change',function(){
    if(typeof window.updateAttendanceSummary==='function'){
      try{window.updateAttendanceSummary();}catch(e){}
    }
  });
  return select;
}

function repairRow(row){
  if(!row || !row.cells || row.cells.length<3) return false;
  var cell=row.cells[2];
  if(!cell) return false;
  var select=cell.querySelector('select.attendance-status');
  if(select){
    var values=Array.prototype.map.call(select.options,function(o){return String(o.value)});
    var ok=values.length===3 && values.every(validStatusValue);
    if(ok) return false;
    var old=validStatusValue(select.value)?select.value:'present';
    var sid=select.dataset.studentId || '';
    cell.replaceChildren(makeSelect(old,sid));
    return true;
  }
  var anySelect=cell.querySelector('select');
  if(anySelect){
    var old2=validStatusValue(anySelect.value)?anySelect.value:'present';
    var sid2=anySelect.dataset.studentId || '';
    cell.replaceChildren(makeSelect(old2,sid2));
    return true;
  }
  var existing=text(cell.textContent).toLowerCase();
  var guessed=existing.indexOf('có phép')>=0?'excused':(existing.indexOf('không phép')>=0?'absent':'present');
  cell.replaceChildren(makeSelect(guessed,''));
  return true;
}

function repairTable(){
  var tbody=document.getElementById('attendanceTableBody');
  if(!tbody)return;
  Array.prototype.forEach.call(tbody.querySelectorAll('tr'),repairRow);
}

function install(){
  repairTable();
  var tbody=document.getElementById('attendanceTableBody');
  if(tbody){
    var observer=new MutationObserver(function(){
      clearTimeout(install._raf);
      install._raf=setTimeout(repairTable,0);
    });
    observer.observe(tbody,{childList:true,subtree:true});
  }
  var button=document.getElementById('saveAttendance');
  if(button){button.addEventListener('click',function(){setTimeout(repairTable,0);},false);}
}

function boot(){
  install();
  setTimeout(install,50);
  setTimeout(install,250);
  setTimeout(install,1000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
