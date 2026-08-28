/* ATTENDANCE STATUS FINAL 5.2 — desktop + mobile touch safe */
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_FINAL_52__) return;
  window.__LH_ATTENDANCE_FINAL_52__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const text=v=>String(v==null?'':v).trim();

  function students(){
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a))return a.slice();
      }
    }catch(e){console.error('[ATTENDANCE 5.2] students',e)}
    if(Array.isArray(window.students))return window.students.slice();
    if(Array.isArray(window.classData?.students))return window.classData.students.slice();
    if(Array.isArray(window.appData?.students))return window.appData.students.slice();
    return [];
  }

  function records(){
    try{
      if(typeof window.getAttendanceRecords==='function'){
        const a=window.getAttendanceRecords();
        if(Array.isArray(a))return a;
      }
    }catch(e){console.error('[ATTENDANCE 5.2] records',e)}
    return [];
  }

  function today(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function getDate(){
    const e=document.getElementById('attendanceDate');
    return e?.value||today();
  }

  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
      if(s.value==='present')p++;
      else if(s.value==='excused')e++;
      else if(s.value==='absent')a++;
    });
    [['attendancePresentCount',p],['attendanceExcusedCount',e],['attendanceAbsentCount',a],['attendancePresent',p],['attendanceExcused',e],['attendanceAbsent',a]].forEach(([id,v])=>{
      const el=document.getElementById(id);
      if(el)el.textContent=String(v);
    });
  }

  function makeSelect(id,current){
    const s=document.createElement('select');
    s.className='attendance-status';
    s.name='attendanceStatus';
    s.dataset.studentId=text(id);
    s.setAttribute('aria-label','Trạng thái');
    s.setAttribute('autocomplete','off');
    STATUS.forEach(([v,label])=>{
      const o=document.createElement('option');
      o.value=v;
      o.textContent=label;
      o.selected=v===current;
      s.appendChild(o);
    });
    return s;
  }

  function render(){
    const page=document.getElementById('page-attendance');
    const body=document.getElementById('attendanceTableBody');
    const dateEl=document.getElementById('attendanceDate');
    if(!page||!body||!dateEl)return false;

    const d=getDate();
    if(!dateEl.value)dateEl.value=d;
    const list=students(),rs=records(),f=document.createDocumentFragment();

    list.forEach((st,i)=>{
      const id=text(st.id||st.studentId||st.studentCode);
      const r=rs.find(x=>text(x.studentId)===id&&text(x.date).slice(0,10)===d);
      const cur=STATUS.some(x=>x[0]===text(r?.status))?text(r.status):'present';
      const tr=document.createElement('tr');
      const no=document.createElement('td');no.textContent=String(i+1);
      const name=document.createElement('td');
      const strong=document.createElement('strong');
      strong.textContent=text(st.name||st.studentName||id);
      name.appendChild(strong);
      const stc=document.createElement('td');
      stc.appendChild(makeSelect(id,cur));
      const note=document.createElement('td');
      const input=document.createElement('input');
      input.type='text';
      input.className='attendance-note';
      input.dataset.studentId=id;
      input.value=text(r?.note);
      input.placeholder='Ghi chú';
      note.appendChild(input);
      tr.append(no,name,stc,note);
      f.appendChild(tr);
    });

    body.replaceChildren(f);
    summary();
    return true;
  }

  function css(){
    if(document.getElementById('lhAttendance52Css'))return;
    const s=document.createElement('style');
    s.id='lhAttendance52Css';
    s.textContent=`
      #page-attendance .attendance-table{position:relative;z-index:1;overflow:visible}
      #page-attendance .attendance-table tbody,
      #page-attendance .attendance-table tr,
      #page-attendance .attendance-table td{overflow:visible}
      #page-attendance .attendance-table td:nth-child(3){position:relative;z-index:30;min-width:155px;overflow:visible}
      #page-attendance select.attendance-status{
        display:block;
        width:100%;
        min-width:145px;
        min-height:44px;
        position:relative;
        z-index:31;
        pointer-events:auto !important;
        touch-action:manipulation;
        cursor:pointer;
        -webkit-appearance:auto;
        appearance:auto;
        -webkit-user-select:none;
        user-select:none;
      }
      #page-attendance .attendance-note{width:100%;position:relative;z-index:5}
      @media (max-width:680px){
        #page-attendance .table-container{overflow-x:auto;overflow-y:visible;-webkit-overflow-scrolling:touch;touch-action:pan-x}
        #page-attendance .attendance-table{min-width:720px}
        #page-attendance .attendance-table td:nth-child(3){min-width:170px}
        #page-attendance select.attendance-status{min-height:46px;font-size:16px;line-height:1.2;padding:8px 34px 8px 10px;touch-action:manipulation}
      }
    `;
    document.head.appendChild(s);
  }

  function save(){
    const d=getDate();
    const nodes=[...document.querySelectorAll('#attendanceTableBody select.attendance-status')];
    if(!nodes.length){window.showToast?.('Chưa có danh sách học sinh để điểm danh.','warning');return}
    let saved=0,failed=0;
    nodes.forEach(s=>{
      const id=text(s.dataset.studentId);
      const note=document.querySelector('#attendanceTableBody .attendance-note[data-student-id="'+CSS.escape(id)+'"]');
      try{
        const fn=window.saveAttendanceRecord;
        if(typeof fn!=='function'){failed++;return}
        const result=fn(id,d,s.value,note?.value||'');
        if(result===true||(result&&result.success!==false))saved++;else failed++;
      }catch(e){failed++;console.error('[ATTENDANCE 5.2] save',e)}
    });
    summary();
    window.showToast?.(failed?`Đã lưu ${saved}/${nodes.length} học sinh; ${failed} bản ghi lỗi.`:`Đã lưu điểm danh ${saved} học sinh.`,failed?'warning':'success');
  }

  function navigate(){
    if(typeof window.navigateToPage==='function'){
      try{window.navigateToPage('attendance')}catch(e){console.error('[ATTENDANCE 5.2] navigate',e)}
    }else{
      document.querySelectorAll('.page-section').forEach(x=>x.classList.remove('active'));
      const page=document.getElementById('page-attendance');
      if(page)page.classList.add('active');
      const title=document.getElementById('pageTitle');
      if(title)title.textContent='Điểm danh';
    }
    requestAnimationFrame(render);
  }

  function bind(){
    if(document.__lhAttendance52Bound)return;
    document.__lhAttendance52Bound=true;

    const saveBtn=document.getElementById('saveAttendance');
    if(saveBtn)saveBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();save()});

    const dateEl=document.getElementById('attendanceDate');
    if(dateEl)dateEl.addEventListener('change',render);

    document.addEventListener('change',e=>{
      const t=e.target;
      if(t?.matches?.('#attendanceTableBody select.attendance-status'))summary();
    },false);

    const menu=document.querySelector('.menu-item[data-page="attendance"]');
    if(menu)menu.addEventListener('click',e=>{e.preventDefault();navigate()});
    const quick=document.querySelector('[data-action="attendance"]');
    if(quick)quick.addEventListener('click',e=>{e.preventDefault();navigate()});
  }

  css();
  bind();
  window.LHAttendanceFinal={render,save,summary};
  window.renderAttendance=render;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(render,80),{once:true});
  else setTimeout(render,80);
})();
