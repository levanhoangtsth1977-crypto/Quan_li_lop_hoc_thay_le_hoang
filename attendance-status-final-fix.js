/* ATTENDANCE STATUS FINAL FIX v10.1
   Dedicated native attendance-status select only.
   Options: Có mặt / Có phép / Không phép.
*/
(function(){
  'use strict';
  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const root=()=>document.getElementById('attendanceTableBody');
  const draft=window.__LH_ATTENDANCE_STATUS_DRAFTS__||(window.__LH_ATTENDANCE_STATUS_DRAFTS__=Object.create(null));
  let observer=null;
  function dateKey(){return (document.getElementById('attendanceDate')||{}).value||'today';}
  function rowKey(row,index){
    const id=row.dataset.studentId||row.getAttribute('data-student-id')||'';
    if(id)return String(id);
    const name=row.querySelector('td:nth-child(2) strong, td:nth-child(2)')?.textContent?.trim()||'';
    return name||String(index);
  }
  function looksLikeStudentPicker(select){
    const vals=Array.from(select.options||[]).map(o=>(o.value+' '+o.textContent).trim());
    if(vals.length>3)return true;
    return vals.some(v=>/Bùi|Nguyễn|Trần|Lê|Phạm|Huỳnh|Võ|Đinh|Đoàn|Lương|Ngô|Tạ|Trịnh/.test(v));
  }
  function setAttrIfNeeded(el,name,value){if(el.getAttribute(name)!==value)el.setAttribute(name,value);}
  function rebuild(select,value){
    const old=value||select.value||'present';
    select.replaceChildren();
    STATUS.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;select.appendChild(o);});
    select.value=STATUS.some(x=>x[0]===old)?old:'present';
    select.classList.add('lh-attendance-status-select');
    select.removeAttribute('data-student-action');
    select.removeAttribute('data-action');
    select.removeAttribute('name');
    select.setAttribute('name','attendanceStatus');
    select.setAttribute('aria-label','Trạng thái điểm danh');
  }
  function patch(){
    const body=root();if(!body)return;
    if(observer)observer.disconnect();
    try{
      Array.from(body.querySelectorAll('tr')).forEach((row,i)=>{
        const cell=row.querySelector('td:nth-child(3)');if(!cell)return;
        const select=cell.querySelector('select');if(!select)return;
        const key=dateKey()+'|'+rowKey(row,i),saved=draft[key];
        if(looksLikeStudentPicker(select))rebuild(select,saved||'present');
        else{
          select.classList.add('lh-attendance-status-select');
          select.removeAttribute('data-student-action');
          select.removeAttribute('data-action');
          setAttrIfNeeded(select,'name','attendanceStatus');
          setAttrIfNeeded(select,'aria-label','Trạng thái điểm danh');
        }
        if(saved&&select.value!==saved)select.value=saved;
      });
    }finally{
      if(observer)observer.observe(body,{childList:true,subtree:true});
    }
  }
  document.addEventListener('change',function(e){
    const s=e.target;
    if(!(s instanceof HTMLSelectElement)||!s.classList.contains('lh-attendance-status-select'))return;
    const body=root(),row=s.closest('tr');if(!body||!row)return;
    const idx=Array.from(body.querySelectorAll('tr')).indexOf(row);
    draft[dateKey()+'|'+rowKey(row,idx)]=s.value;
    e.stopImmediatePropagation();
  },true);
  function start(){
    const body=root();if(!body)return;
    observer=new MutationObserver(()=>patch());
    observer.observe(body,{childList:true,subtree:true});
    patch();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',patch,{once:true});
  window.addEventListener('pageshow',patch);
  const d=document.getElementById('attendanceDate');if(d)d.addEventListener('change',()=>setTimeout(patch,0));
  window.__LH_ATTENDANCE_STATUS_FINAL_FIX_CORE_ONLY__=false;
  window.__LH_ATTENDANCE_STATUS_FINAL_FIX_V10__=true;
  window.__LH_ATTENDANCE_STATUS_FINAL_FIX_V10_1__=true;
})();