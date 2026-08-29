/* ATTENDANCE STATUS FINAL FIX v10
   The attendance status control is a dedicated native <select>.
   It MUST contain only: Có mặt / Có phép / Không phép.
   It must never be hijacked by the generic student picker/router.
*/
(function(){
  'use strict';
  const STATUS = [
    ['present','Có mặt'],
    ['excused','Có phép'],
    ['absent','Không phép']
  ];
  const root = () => document.getElementById('attendanceTableBody');
  const draft = window.__LH_ATTENDANCE_STATUS_DRAFTS__ || (window.__LH_ATTENDANCE_STATUS_DRAFTS__ = Object.create(null));
  function dateKey(){ return (document.getElementById('attendanceDate')||{}).value || 'today'; }
  function rowKey(row, index){
    const id = row.dataset.studentId || row.getAttribute('data-student-id') || '';
    if(id) return String(id);
    const name = row.querySelector('td:nth-child(2) strong, td:nth-child(2)')?.textContent?.trim() || '';
    return name || String(index);
  }
  function looksLikeStudentPicker(select){
    const vals = Array.from(select.options || []).map(o => (o.value+' '+o.textContent).trim());
    if(vals.length > 3) return true;
    return vals.some(v => /Bùi|Nguyễn|Trần|Lê|Phạm|Huỳnh|Võ|Đinh|Đoàn|Lương|Ngô|Tạ|Trịnh/.test(v));
  }
  function rebuild(select, value){
    const old = value || select.value || 'present';
    select.innerHTML = '';
    STATUS.forEach(([v,t])=>{
      const o=document.createElement('option'); o.value=v; o.textContent=t; select.appendChild(o);
    });
    select.value = STATUS.some(x=>x[0]===old) ? old : 'present';
    select.classList.add('lh-attendance-status-select');
    select.removeAttribute('data-student-action');
    select.removeAttribute('data-action');
    select.removeAttribute('name');
    select.setAttribute('name','attendanceStatus');
    select.setAttribute('aria-label','Trạng thái điểm danh');
  }
  function patch(){
    const body=root(); if(!body) return;
    const rows=Array.from(body.querySelectorAll('tr'));
    rows.forEach((row,i)=>{
      const cell=row.querySelector('td:nth-child(3)'); if(!cell) return;
      const select=cell.querySelector('select'); if(!select) return;
      const key=dateKey()+'|'+rowKey(row,i);
      const saved=draft[key];
      if(looksLikeStudentPicker(select)) rebuild(select, saved || 'present');
      else {
        select.classList.add('lh-attendance-status-select');
        select.removeAttribute('data-student-action');
        select.removeAttribute('data-action');
        select.setAttribute('name','attendanceStatus');
        select.setAttribute('aria-label','Trạng thái điểm danh');
      }
      if(saved && select.value!==saved) select.value=saved;
    });
  }
  document.addEventListener('change', function(e){
    const s=e.target;
    if(!(s instanceof HTMLSelectElement) || !s.classList.contains('lh-attendance-status-select')) return;
    const body=root(); const row=s.closest('tr'); if(!body||!row) return;
    const rows=Array.from(body.querySelectorAll('tr')); const idx=rows.indexOf(row);
    draft[dateKey()+'|'+rowKey(row,idx)] = s.value;
    e.stopImmediatePropagation();
  }, true);
  const obs=new MutationObserver(()=>patch());
  function start(){ const body=root(); if(body) obs.observe(body,{childList:true,subtree:true}); patch(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('load',patch,{once:true});
  window.addEventListener('pageshow',patch);
  const d=document.getElementById('attendanceDate'); if(d) d.addEventListener('change',()=>setTimeout(patch,0));
  window.__LH_ATTENDANCE_STATUS_FINAL_FIX_CORE_ONLY__=false;
  window.__LH_ATTENDANCE_STATUS_FINAL_FIX_V10__=true;
})();