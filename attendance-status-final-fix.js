/* ATTENDANCE STATUS CLEAN 9.0
   One compact native status dropdown per student.
   Student column is text only.
   Status column options are always exactly:
   Có mặt / Có phép / Không phép.
   This module owns only attendance status controls.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_CLEAN_90__) return;
  window.__LH_ATTENDANCE_CLEAN_90__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const VALID=new Set(STATUS.map(x=>x[0]));
  const txt=v=>String(v==null?'':v).trim();
  const norm=v=>VALID.has(txt(v))?txt(v):'present';
  const isStatusSelect=el=>!!(el&&el.matches&&el.matches('#attendanceTableBody select.attendance-status'));

  function students(){
    try{
      if(typeof window.getStudentsSafe==='function'){
        const a=window.getStudentsSafe();
        if(Array.isArray(a)) return a;
      }
    }catch(_){ }
    return Array.isArray(window.students)?window.students:[];
  }

  function studentIdByName(name){
    const n=txt(name).replace(/^\d+\.\s*/,'');
    const s=students().find(x=>txt(x?.name||x?.studentName)===n);
    return txt(s?.id||s?.studentId||s?.studentCode);
  }

  function getRecords(){
    if(typeof window.getAttendanceRecords==='function'){
      try{const a=window.getAttendanceRecords();if(Array.isArray(a))return a;}catch(_){ }
    }
    if(Array.isArray(window.attendanceRecords))return window.attendanceRecords;
    if(Array.isArray(window.DIEM_DANH))return window.DIEM_DANH;
    const a=window.GOOGLE_SHEET_DATA?.tabs?.DIEM_DANH;
    return Array.isArray(a)?a:[];
  }

  function recordStatus(id,date){
    const key=txt(id), d=txt(date||document.getElementById('attendanceDate')?.value);
    const a=getRecords();
    for(let i=a.length-1;i>=0;i--){
      const r=a[i]||{};
      const rid=txt(r.studentId||r.id||r.studentCode);
      const rd=txt(r.date||r.ngay).slice(0,10);
      if(rid===key && (!d||rd===d)) return norm(r.status||r.trangThai);
    }
    return 'present';
  }

  function rebuildOptions(select,current){
    const keep=norm(current||select.value);
    select.replaceChildren();
    for(const [value,label] of STATUS){
      const o=document.createElement('option');
      o.value=value;
      o.textContent=label;
      select.appendChild(o);
    }
    select.value=keep;
  }

  function repairSelect(select){
    if(!isStatusSelect(select))return;
    const valid=select.options.length===3 && STATUS.every((x,i)=>
      select.options[i]?.value===x[0] && txt(select.options[i]?.textContent)===x[1]
    );
    if(!valid) rebuildOptions(select,select.value);
  }

  function makeStatusSelect(id,current){
    const s=document.createElement('select');
    s.className='attendance-status';
    s.dataset.studentId=txt(id);
    s.setAttribute('aria-label','Trạng thái điểm danh');
    rebuildOptions(s,current);
    return s;
  }

  function normalizeRow(row,index,date){
    const cells=row?.cells;
    if(!cells||cells.length<3)return;
    const studentCell=cells[1], statusCell=cells[2];

    let name=txt(studentCell.textContent).replace(/^\d+\.\s*/,'');
    const studentPicker=studentCell.querySelector('select:not(.attendance-status)');
    if(studentPicker){
      const option=studentPicker.options[studentPicker.selectedIndex];
      name=txt(option?.textContent||option?.value)||name;
      studentPicker.remove();
    }
    if(!name)name='Học sinh '+(index+1);

    const old=statusCell.querySelector('select.attendance-status, select');
    let id=txt(row.dataset.studentId||studentCell.dataset.studentId||old?.dataset.studentId);
    let current=VALID.has(txt(old?.value))?txt(old.value):'';
    if(!id)id=studentIdByName(name);
    if(!current)current=recordStatus(id,date);

    if(studentCell.querySelector('select')){
      studentCell.querySelectorAll('select').forEach(x=>x.remove());
    }
    studentCell.replaceChildren();
    const strong=document.createElement('strong');
    strong.textContent=name;
    studentCell.appendChild(strong);

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
      repairSelect(s);
      const v=norm(s.value);
      if(v==='present')p++;else if(v==='excused')e++;else a++;
    });
    [['attendancePresent',p],['attendancePresentCount',p],['attendanceExcused',e],['attendanceExcusedCount',e],['attendanceAbsent',a],['attendanceAbsentCount',a]].forEach(([id,v])=>{
      const el=document.getElementById(id);if(el)el.textContent=String(v);
    });
  }

  function bind(){
    if(document.__lhAttendance90Bound)return;
    document.__lhAttendance90Bound=true;

    document.addEventListener('pointerdown',e=>{
      if(isStatusSelect(e.target))repairSelect(e.target);
    },true);
    document.addEventListener('focusin',e=>{
      if(isStatusSelect(e.target))repairSelect(e.target);
    },true);
    document.addEventListener('change',e=>{
      if(isStatusSelect(e.target)){repairSelect(e.target);summary();return;}
      if(e.target?.matches?.('#attendanceDate'))normalize();
    });

    const body=document.getElementById('attendanceTableBody');
    if(body){
      const observer=new MutationObserver(mutations=>{
        let check=false;
        for(const m of mutations){
          if(m.type==='childList'){
            if(m.target.closest?.('#attendanceTableBody')||m.target.id==='attendanceTableBody')check=true;
          }
        }
        if(!check)return;
        document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(repairSelect);
        summary();
      });
      observer.observe(body,{childList:true,subtree:true});
    }

    const save=document.getElementById('saveAttendance');
    if(save&&!save.dataset.lhAttendanceBound90){
      save.dataset.lhAttendanceBound90='1';
      save.addEventListener('click',()=>setTimeout(summary,0),false);
    }
  }

  function css(){
    if(document.getElementById('lhAttendanceClean90Css'))return;
    const s=document.createElement('style');
    s.id='lhAttendanceClean90Css';
    s.textContent=`
      #page-attendance .attendance-table td:nth-child(2){min-width:280px!important;}
      #page-attendance .attendance-table td:nth-child(3){min-width:150px!important;overflow:visible!important;}
      #page-attendance .attendance-table select.attendance-status{display:block!important;width:100%!important;min-width:135px!important;height:40px!important;padding:6px 28px 6px 9px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-size:14px!important;line-height:1.2!important;cursor:pointer!important;pointer-events:auto!important;touch-action:auto!important;}
      @media(max-width:680px){#page-attendance .attendance-table td:nth-child(2){min-width:220px!important;}#page-attendance .attendance-table select.attendance-status{min-width:130px!important;height:42px!important;font-size:15px!important;}}
    `;
    document.head.appendChild(s);
  }

  function boot(){css();bind();normalize();}
  window.LHAttendanceFinal={normalize,summary,boot,repairSelect};
  window.renderAttendanceSummary=summary;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();