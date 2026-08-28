/* ============================================================
   ATTENDANCE STATUS FINAL 4.0
   Điểm danh là module lõi của website quản lý lớp học.
   Mục tiêu:
   - Dùng chính Data Engine của toàn hệ thống.
   - Giữ nguyên 42 học sinh và luồng menu hiện tại.
   - Một renderer duy nhất cho bảng Điểm danh.
   - Không dùng MutationObserver để thay DOM liên tục.
   - Không cho các router cũ render lại bảng khi chọn Trạng thái.
   - Không tác động tới các menu khác và không tác động game.
   ============================================================ */
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_40__) return;
  window.__LH_ATTENDANCE_FINAL_40__ = true;

  const STATUS = [
    ['present','Có mặt'],
    ['excused','Có phép'],
    ['absent','Không phép']
  ];

  const text = v => String(v == null ? '' : v).trim();
  const esc = v => text(v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  function students(){
    try {
      if(typeof window.getStudentsSafe === 'function'){
        const a = window.getStudentsSafe();
        if(Array.isArray(a)) return a.slice();
      }
    } catch(e) { console.error('[ATTENDANCE 4.0] students',e); }
    if(Array.isArray(window.students)) return window.students.slice();
    if(Array.isArray(window.classData && window.classData.students)) return window.classData.students.slice();
    if(Array.isArray(window.appData && window.appData.students)) return window.appData.students.slice();
    return [];
  }

  function attendanceRecords(){
    try {
      if(typeof window.getAttendanceRecords === 'function'){
        const a = window.getAttendanceRecords();
        return Array.isArray(a) ? a : [];
      }
    } catch(e) { console.error('[ATTENDANCE 4.0] records',e); }
    return [];
  }

  function today(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function getDate(){
    const el = document.getElementById('attendanceDate');
    if(el && el.value) return el.value;
    return today();
  }

  function statusLabel(value){
    const x = STATUS.find(s => s[0] === value);
    return x ? x[1] : 'Có mặt';
  }

  function updateSummary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
      if(s.value==='present') p++;
      else if(s.value==='excused') e++;
      else if(s.value==='absent') a++;
    });
    const set=(id,n)=>{const el=document.getElementById(id);if(el)el.textContent=String(n)};
    set('attendancePresentCount',p);
    set('attendanceExcusedCount',e);
    set('attendanceAbsentCount',a);
    set('attendancePresent',p);
    set('attendanceExcused',e);
    set('attendanceAbsent',a);
  }

  function makeStatusSelect(studentId,current){
    const sel = document.createElement('select');
    sel.className = 'attendance-status';
    sel.dataset.studentId = text(studentId);
    sel.setAttribute('aria-label','Trạng thái');
    STATUS.forEach(([value,label])=>{
      const o=document.createElement('option');
      o.value=value;
      o.textContent=label;
      if(value===current) o.selected=true;
      sel.appendChild(o);
    });
    return sel;
  }

  function render(){
    const page=document.getElementById('page-attendance');
    const body=document.getElementById('attendanceTableBody');
    if(!page || !body) return false;

    const date=getDate();
    const list=students();
    const records=attendanceRecords();

    if(!document.getElementById('attendanceDate').value){
      document.getElementById('attendanceDate').value=date;
    }

    const fragment=document.createDocumentFragment();

    list.forEach((student,index)=>{
      const id=text(student.id || student.studentId || student.studentCode);
      const rec=records.find(r=>
        text(r.studentId)===id && text(r.date).slice(0,10)===date
      );
      const value=STATUS.some(s=>s[0]===text(rec && rec.status))
        ? text(rec.status) : 'present';

      const tr=document.createElement('tr');

      const tdNo=document.createElement('td');
      tdNo.textContent=String(index+1);

      const tdName=document.createElement('td');
      const strong=document.createElement('strong');
      strong.textContent=text(student.name || student.studentName || id);
      tdName.appendChild(strong);

      const tdStatus=document.createElement('td');
      tdStatus.appendChild(makeStatusSelect(id,value));

      const tdNote=document.createElement('td');
      const input=document.createElement('input');
      input.type='text';
      input.className='attendance-note';
      input.dataset.studentId=id;
      input.value=text(rec && rec.note);
      input.placeholder='Ghi chú';
      tdNote.appendChild(input);

      tr.append(tdNo,tdName,tdStatus,tdNote);
      fragment.appendChild(tr);
    });

    body.replaceChildren(fragment);
    updateSummary();
    return true;
  }

  function css(){
    if(document.getElementById('lhAttendance40Css')) return;
    const s=document.createElement('style');
    s.id='lhAttendance40Css';
    s.textContent=`
      #page-attendance .attendance-table{position:relative;z-index:1}
      #page-attendance .attendance-table td:nth-child(3){position:relative;z-index:2;min-width:155px}
      #page-attendance .attendance-status{display:block;width:100%;min-width:145px;position:relative;z-index:3;pointer-events:auto}
      #page-attendance .attendance-note{width:100%;position:relative;z-index:1}
    `;
    document.head.appendChild(s);
  }

  function save(){
    const date=getDate();
    const nodes=Array.from(document.querySelectorAll('#attendanceTableBody select.attendance-status'));
    if(!nodes.length){
      if(typeof window.showToast==='function') window.showToast('Chưa có danh sách học sinh để điểm danh.','warning');
      return;
    }
    let saved=0;
    nodes.forEach(sel=>{
      const id=text(sel.dataset.studentId);
      const note=document.querySelector('#attendanceTableBody .attendance-note[data-student-id="'+CSS.escape(id)+'"]');
      try{
        if(typeof window.saveAttendanceRecord==='function'){
          const result=window.saveAttendanceRecord(id,date,sel.value,note ? note.value : '');
          if(result===true || (result && result.success!==false)) saved++;
        }
      }catch(e){ console.error('[ATTENDANCE 4.0] save',e); }
    });
    render();
    if(typeof window.showToast==='function') window.showToast('Đã lưu điểm danh '+saved+' học sinh.','success');
  }

  function navigateAttendance(){
    const original=window.navigateToPage;
    if(typeof original==='function'){
      try{ original('attendance'); }catch(e){ console.error('[ATTENDANCE 4.0] navigate',e); }
    }else{
      document.querySelectorAll('.page-section').forEach(x=>x.classList.remove('active'));
      const page=document.getElementById('page-attendance');
      if(page) page.classList.add('active');
      const title=document.getElementById('pageTitle');
      if(title) title.textContent='Điểm danh';
    }
    requestAnimationFrame(()=>render());
  }

  function installGuards(){
    /* Chặn router cũ chỉ ở các tương tác Điểm danh, không chặn menu khác. */
    document.addEventListener('click',event=>{
      const target=event.target && event.target.closest ? event.target.closest('#saveAttendance') : null;
      if(target){
        event.preventDefault();
        event.stopImmediatePropagation();
        save();
        return;
      }

      const menu=event.target && event.target.closest ? event.target.closest('.menu-item[data-page="attendance"]') : null;
      const quick=event.target && event.target.closest ? event.target.closest('[data-action="attendance"]') : null;
      if(menu || quick){
        event.preventDefault();
        event.stopImmediatePropagation();
        navigateAttendance();
      }
    },true);

    document.addEventListener('change',event=>{
      const target=event.target;
      if(target && target.matches && target.matches('#attendanceDate')){
        event.preventDefault();
        event.stopImmediatePropagation();
        render();
        return;
      }
      if(target && target.matches && target.matches('#attendanceTableBody select.attendance-status')){
        event.stopPropagation();
        event.stopImmediatePropagation();
        updateSummary();
      }
    },true);

    document.addEventListener('DOMContentLoaded',()=>{
      css();
      setTimeout(render,80);
    },{once:true});

    window.addEventListener('lhAttendanceRendered',()=>render());

    const originalRender=window.renderAttendance;
    window.renderAttendance=render;
    if(window.LopHocApp) window.LopHocApp.renderAttendance=render;
    window.LHAttendanceFinal={render,save,updateSummary};
  }

  css();
  installGuards();
})();
