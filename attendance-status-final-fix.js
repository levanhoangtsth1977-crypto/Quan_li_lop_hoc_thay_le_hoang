/* ATTENDANCE STATUS CLEAN 8.1
   One compact native status dropdown per student.
   Student column is text only; status column contains only:
   present / excused / absent.
   The status options are revalidated immediately before opening so legacy
   student-picker code can never replace them with student names.
   No observers, no capture interception, no repeated timers.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_CLEAN_81__) return;
  window.__LH_ATTENDANCE_CLEAN_81__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const VALUES=new Set(STATUS.map(x=>x[0]));
  const norm=v=>{v=String(v==null?'':v).trim();return VALUES.has(v)?v:'present'};
  const txt=v=>String(v==null?'':v).trim();
  const isStatusSelect=el=>!!(el&&el.matches&&el.matches('#attendanceTableBody select.attendance-status'));

  function students(){
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe(); if(Array.isArray(a)) return a;
      }
    }catch(e){}
    return Array.isArray(window.students)?window.students:[];
  }

  function studentIdByName(name){
    const n=txt(name).replace(/^\d+\.\s*/,'');
    const a=students();
    const s=a.find(x=>txt(x.name||x.studentName)===n);
    return txt(s&&(s.id||s.studentId||s.studentCode));
  }

  function recordStatus(id,date){
    const key=txt(id),d=txt(date||document.getElementById('attendanceDate')?.value);
    const pools=[];
    if(Array.isArray(window.attendanceRecords)) pools.push(window.attendanceRecords);
    if(Array.isArray(window.DIEM_DANH)) pools.push(window.DIEM_DANH);
    if(window.GOOGLE_SHEET_DATA?.tabs?.DIEM_DANH && Array.isArray(window.GOOGLE_SHEET_DATA.tabs.DIEM_DANH)) pools.push(window.GOOGLE_SHEET_DATA.tabs.DIEM_DANH);
    for(const arr of pools){
      for(let i=arr.length-1;i>=0;i--){
        const r=arr[i]||{};
        const rid=txt(r.studentId||r.id||r.studentCode);
        const rd=txt(r.date||r.ngay);
        const st=norm(r.status||r.trangThai);
        if(rid===key && (!d || rd.slice(0,10)===d)) return st;
      }
    }
    return 'present';
  }

  function fillStatusOptions(select,current){
    if(!select) return;
    const keep=norm(current||select.value);
    select.replaceChildren();
    STATUS.forEach(([value,label])=>{
      const o=document.createElement('option');
      o.value=value;
      o.textContent=label;
      o.selected=value===keep;
      select.appendChild(o);
    });
    select.value=keep;
  }

  function ensureStatusOptions(select){
    if(!isStatusSelect(select)) return;
    const id=txt(select.dataset.studentId);
    const value=norm(select.value);
    const options=[...select.options];
    const valid=options.length===3 && options.every((o,i)=>o.value===STATUS[i][0] && o.textContent===STATUS[i][1]);
    if(!valid) fillStatusOptions(select,value||recordStatus(id));
    else select.value=value;
  }

  function makeStatusSelect(id,current){
    const s=document.createElement('select');
    s.className='attendance-status';
    s.dataset.studentId=txt(id);
    s.setAttribute('aria-label','Trạng thái điểm danh');
    fillStatusOptions(s,norm(current));
    return s;
  }

  function normalizeRow(row,index,date){
    const cells=row.cells; if(!cells||cells.length<3)return;
    const studentCell=cells[1], statusCell=cells[2];
    let studentName='';
    const studentSelect=studentCell.querySelector('select');
    if(studentSelect){
      const selected=studentSelect.options[studentSelect.selectedIndex];
      studentName=txt(selected?.textContent||selected?.value);
      studentSelect.remove();
    }else{
      studentName=txt(studentCell.textContent).replace(/^\d+\.\s*/,'');
    }
    if(!studentName) studentName=txt(studentCell.getAttribute('data-student-name'));
    studentCell.replaceChildren();
    const strong=document.createElement('strong');
    strong.textContent=studentName||('Học sinh '+(index+1));
    studentCell.appendChild(strong);

    const old=statusCell.querySelector('select');
    let current=old&&VALUES.has(txt(old.value))?txt(old.value):'present';
    let id=txt(row.dataset.studentId||studentCell.dataset.studentId||old?.dataset.studentId||'');
    if(!id) id=studentIdByName(studentName);
    if(!VALUES.has(current)) current=recordStatus(id,date);
    statusCell.replaceChildren(makeStatusSelect(id,current));
    row.dataset.studentId=id;
  }

  function normalize(){
    const body=document.getElementById('attendanceTableBody');
    if(!body)return;
    const date=document.getElementById('attendanceDate')?.value||'';
    [...body.rows].forEach((row,i)=>normalizeRow(row,i,date));
    summary();
  }

  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
      const v=norm(s.value);
      if(v==='present')p++; else if(v==='excused')e++; else if(v==='absent')a++;
    });
    [['attendancePresent',p],['attendancePresentCount',p],['attendanceExcused',e],['attendanceExcusedCount',e],['attendanceAbsent',a],['attendanceAbsentCount',a]].forEach(([id,v])=>{
      const el=document.getElementById(id); if(el)el.textContent=String(v);
    });
  }

  function bind(){
    if(document.__lhAttendance81Bound)return;
    document.__lhAttendance81Bound=true;

    document.addEventListener('pointerdown',function(e){
      const t=e.target;
      if(isStatusSelect(t)) ensureStatusOptions(t);
    },true);
    document.addEventListener('mousedown',function(e){
      const t=e.target;
      if(isStatusSelect(t)) ensureStatusOptions(t);
    },true);
    document.addEventListener('focusin',function(e){
      const t=e.target;
      if(isStatusSelect(t)) ensureStatusOptions(t);
    },true);
    document.addEventListener('change',function(e){
      const t=e.target;
      if(isStatusSelect(t)){
        ensureStatusOptions(t);
        summary();
        return;
      }
      if(t?.matches?.('#attendanceDate')) setTimeout(normalize,0);
    },false);

    const b=document.getElementById('saveAttendance');
    if(b&&!b.dataset.lhAttendanceBound81){
      b.dataset.lhAttendanceBound81='1';
      b.addEventListener('click',()=>setTimeout(summary,0),false);
    }
  }

  function css(){
    if(document.getElementById('lhAttendanceClean81Css'))return;
    const s=document.createElement('style');
    s.id='lhAttendanceClean81Css';
    s.textContent=`
      #page-attendance .attendance-table td:nth-child(2){min-width:280px!important;}
      #page-attendance .attendance-table td:nth-child(3){min-width:150px!important;overflow:visible!important;}
      #page-attendance .attendance-table select.attendance-status{display:block!important;width:100%!important;min-width:135px!important;height:40px!important;padding:6px 28px 6px 9px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-size:14px!important;line-height:1.2!important;cursor:pointer!important;pointer-events:auto!important;touch-action:auto!important;}
      @media(max-width:680px){#page-attendance .attendance-table td:nth-child(2){min-width:220px!important;}#page-attendance .attendance-table select.attendance-status{min-width:130px!important;height:42px!important;font-size:15px!important;}}
    `;
    document.head.appendChild(s);
  }

  function boot(){css();bind();setTimeout(normalize,0);}
  window.LHAttendanceFinal={normalize,summary,boot,ensureStatusOptions};
  window.renderAttendanceSummary=summary;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();