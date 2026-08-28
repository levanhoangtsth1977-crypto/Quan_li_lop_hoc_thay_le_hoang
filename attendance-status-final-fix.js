/* ATTENDANCE STATUS FINAL 5.0 — interaction-safe authoritative renderer */
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_50__) return;
  window.__LH_ATTENDANCE_FINAL_50__=true;
  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const text=v=>String(v==null?'':v).trim();
  function students(){
    try{if(typeof window.getStudentsSafe==='function'){const a=window.getStudentsSafe();if(Array.isArray(a))return a.slice();}}catch(e){console.error('[ATTENDANCE 5.0] students',e)}
    if(Array.isArray(window.students))return window.students.slice();
    if(Array.isArray(window.classData?.students))return window.classData.students.slice();
    if(Array.isArray(window.appData?.students))return window.appData.students.slice();
    return [];
  }
  function records(){
    try{if(typeof window.getAttendanceRecords==='function'){const a=window.getAttendanceRecords();return Array.isArray(a)?a:[];}}catch(e){console.error('[ATTENDANCE 5.0] records',e)}
    return [];
  }
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function date(){const e=document.getElementById('attendanceDate');return e?.value||today()}
  function summary(){let p=0,e=0,a=0;document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{if(s.value==='present')p++;else if(s.value==='excused')e++;else if(s.value==='absent')a++});[['attendancePresentCount',p],['attendanceExcusedCount',e],['attendanceAbsentCount',a],['attendancePresent',p],['attendanceExcused',e],['attendanceAbsent',a]].forEach(([id,v])=>{const x=document.getElementById(id);if(x)x.textContent=String(v)})}
  function select(id,current){const s=document.createElement('select');s.className='attendance-status';s.dataset.studentId=text(id);s.setAttribute('aria-label','Trạng thái');STATUS.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;o.selected=v===current;s.appendChild(o)});return s}
  function render(){
    const page=document.getElementById('page-attendance'),body=document.getElementById('attendanceTableBody');
    if(!page||!body)return false;
    const d=date(),list=students(),rs=records(),dateEl=document.getElementById('attendanceDate');if(dateEl&&!dateEl.value)dateEl.value=d;
    const f=document.createDocumentFragment();
    list.forEach((st,i)=>{const id=text(st.id||st.studentId||st.studentCode),r=rs.find(x=>text(x.studentId)===id&&text(x.date).slice(0,10)===d),cur=STATUS.some(x=>x[0]===text(r?.status))?text(r.status):'present';const tr=document.createElement('tr');const n=document.createElement('td');n.textContent=String(i+1);const name=document.createElement('td'),strong=document.createElement('strong');strong.textContent=text(st.name||st.studentName||id);name.appendChild(strong);const status=document.createElement('td');status.appendChild(select(id,cur));const note=document.createElement('td'),input=document.createElement('input');input.type='text';input.className='attendance-note';input.dataset.studentId=id;input.value=text(r?.note);input.placeholder='Ghi chú';note.appendChild(input);tr.append(n,name,status,note);f.appendChild(tr)});
    body.replaceChildren(f);summary();return true;
  }
  function css(){if(document.getElementById('lhAttendance50Css'))return;const s=document.createElement('style');s.id='lhAttendance50Css';s.textContent='#page-attendance .attendance-table{position:relative;z-index:1;overflow:visible}#page-attendance .attendance-table td:nth-child(3){position:relative;z-index:1000;min-width:155px;overflow:visible}#page-attendance select.attendance-status{display:block;position:relative;z-index:1001;width:100%;min-width:145px;pointer-events:auto;touch-action:manipulation}#page-attendance .attendance-note{position:relative;z-index:1;width:100%}';document.head.appendChild(s)}
  function save(){
    const d=date(),nodes=[...document.querySelectorAll('#attendanceTableBody select.attendance-status')];
    if(!nodes.length){window.showToast?.('Chưa có danh sách học sinh để điểm danh.','warning');return}
    let saved=0,failed=0;
    nodes.forEach(s=>{const id=text(s.dataset.studentId);const n=document.querySelector('#attendanceTableBody .attendance-note[data-student-id="'+CSS.escape(id)+'"]');try{const fn=window.saveAttendanceRecord;if(typeof fn!=='function'){failed++;return}const r=fn(id,d,s.value,n?.value||'');if(r===true||(r&&r.success!==false))saved++;else failed++}catch(e){failed++;console.error('[ATTENDANCE 5.0] save',e)}});
    render();
    window.showToast?.(failed?`Đã lưu ${saved}/${nodes.length} học sinh; ${failed} bản ghi lỗi.`:`Đã lưu điểm danh ${saved} học sinh.` ,failed?'warning':'success');
  }
  function navigate(){if(typeof window.navigateToPage==='function'){try{window.navigateToPage('attendance')}catch(e){console.error('[ATTENDANCE 5.0] navigate',e)}}else{document.querySelectorAll('.page-section').forEach(x=>x.classList.remove('active'));document.getElementById('page-attendance')?.classList.add('active');const t=document.getElementById('pageTitle');if(t)t.textContent='Điểm danh'}requestAnimationFrame(render)}
  function guard(){
    if(document.__lhAttendance50Guard)return;document.__lhAttendance50Guard=true;
    document.addEventListener('pointerdown',e=>{if(e.target?.closest?.('#attendanceTableBody select.attendance-status'))e.stopPropagation()},true);
    document.addEventListener('mousedown',e=>{if(e.target?.closest?.('#attendanceTableBody select.attendance-status'))e.stopPropagation()},true);
    document.addEventListener('touchstart',e=>{if(e.target?.closest?.('#attendanceTableBody select.attendance-status'))e.stopPropagation()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#attendanceTableBody select.attendance-status')){e.stopPropagation();e.stopImmediatePropagation()}},true);
    document.addEventListener('change',e=>{const t=e.target;if(t?.matches?.('#attendanceTableBody select.attendance-status')){e.stopPropagation();e.stopImmediatePropagation();summary()}else if(t?.matches?.('#attendanceDate')){e.stopPropagation();e.stopImmediatePropagation();render()}},true);
    document.addEventListener('click',e=>{const saveBtn=e.target?.closest?.('#saveAttendance');if(saveBtn){e.preventDefault();e.stopImmediatePropagation();save();return}const menu=e.target?.closest?.('.menu-item[data-page="attendance"]'),quick=e.target?.closest?.('[data-action="attendance"]');if(menu||quick){e.preventDefault();e.stopImmediatePropagation();navigate()}},true);
  }
  css();guard();window.LHAttendanceFinal={render,save,summary};window.renderAttendance=render;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(render,80),{once:true});else setTimeout(render,80);
})();
