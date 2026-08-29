/* ATTENDANCE STATUS CLEAN 9.2
   Native mobile select only.
   No pointer/touch/click interception.
   No MutationObserver.
   No DOM replacement after user opens the dropdown.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_CLEAN_92__) return;
  window.__LH_ATTENDANCE_CLEAN_92__=true;

  const STATUS=[['present','Có mặt'],['excused','Có phép'],['absent','Không phép']];
  const VALID=new Set(STATUS.map(x=>x[0]));
  const txt=v=>String(v==null?'':v).trim();
  const norm=v=>VALID.has(txt(v))?txt(v):'present';

  function students(){
    try{
      const a=typeof window.getStudentsSafe==='function'?window.getStudentsSafe():(Array.isArray(window.APP_DATA?.students)?window.APP_DATA.students:[]);
      return Array.isArray(a)?a:[];
    }catch(_){return []}
  }
  function studentIdByName(name){
    const n=txt(name).replace(/^\d+\.\s*/,'');
    const s=students().find(x=>txt(x?.name||x?.studentName)===n);
    return txt(s?.id||s?.studentId||s?.studentCode);
  }
  function getRecords(){
    try{
      const a=typeof window.getAttendanceRecords==='function'?window.getAttendanceRecords():(Array.isArray(window.APP_DATA?.attendance)?window.APP_DATA.attendance:[]);
      return Array.isArray(a)?a:[];
    }catch(_){return []}
  }
  function recordStatus(id,date){
    const key=txt(id),d=txt(date||document.getElementById('attendanceDate')?.value),a=getRecords();
    for(let i=a.length-1;i>=0;i--){
      const r=a[i]||{},rid=txt(r.studentId||r.id||r.studentCode),rd=txt(r.date||r.ngay).slice(0,10);
      if(rid===key&&(!d||rd===d))return norm(r.status||r.trangThai);
    }
    return 'present';
  }
  function rebuildOptions(select,current){
    const keep=norm(current||select.value);
    const valid=select.options.length===3&&STATUS.every((x,i)=>select.options[i]?.value===x[0]&&txt(select.options[i]?.textContent)===x[1]);
    if(valid){
      if(select.value!==keep)select.value=keep;
      return;
    }
    select.replaceChildren();
    STATUS.forEach(([value,label])=>{
      const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);
    });
    select.value=keep;
  }
  function normalizeRow(row,index,date){
    const cells=row?.cells;if(!cells||cells.length<3)return;
    const studentCell=cells[1],statusCell=cells[2];
    let name=txt(studentCell.textContent).replace(/^\d+\.\s*/,'');
    const old=statusCell.querySelector('select.attendance-status,select');
    if(!name){
      const opt=studentCell.querySelector('option:checked');
      name=txt(opt?.textContent||opt?.value);
    }
    if(!name)name='Học sinh '+(index+1);
    let id=txt(row.dataset.studentId||studentCell.dataset.studentId||old?.dataset.studentId);
    const current=VALID.has(txt(old?.value))?txt(old.value):'';
    if(!id)id=studentIdByName(name);
    const desired=current||recordStatus(id,date);
    studentCell.querySelectorAll('select:not(.attendance-status)').forEach(sel=>sel.remove());
    let select=statusCell.querySelector('select.attendance-status');
    if(!select){
      statusCell.replaceChildren();
      select=document.createElement('select');
      select.className='attendance-status';
      select.dataset.studentId=id;
      select.setAttribute('aria-label','Trạng thái điểm danh');
      statusCell.appendChild(select);
    }
    select.dataset.studentId=id;
    rebuildOptions(select,desired);
    row.dataset.studentId=id;
  }
  function normalize(){
    const body=document.getElementById('attendanceTableBody');if(!body)return;
    const date=document.getElementById('attendanceDate')?.value||'';
    [...body.rows].forEach((row,i)=>normalizeRow(row,i,date));
    summary();
  }
  function summary(){
    let p=0,e=0,a=0;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(s=>{
      const v=norm(s.value);if(v==='present')p++;else if(v==='excused')e++;else a++;
    });
    [['attendancePresent',p],['attendancePresentCount',p],['attendanceExcused',e],['attendanceExcusedCount',e],['attendanceAbsent',a],['attendanceAbsentCount',a]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=String(v);});
  }
  function bind(){
    if(document.__lhAttendance92Bound)return;
    document.__lhAttendance92Bound=true;
    document.addEventListener('change',e=>{
      if(e.target?.matches?.('#attendanceTableBody select.attendance-status')){summary();return;}
      if(e.target?.matches?.('#attendanceDate'))normalize();
    });
    const save=document.getElementById('saveAttendance');
    if(save&&!save.dataset.lhAttendanceBound92){save.dataset.lhAttendanceBound92='1';save.addEventListener('click',()=>setTimeout(summary,0),false);}
    window.addEventListener('google-sheets-data-ready',()=>normalize(),{once:true});
  }
  function css(){
    if(document.getElementById('lhAttendanceClean92Css'))return;
    const s=document.createElement('style');s.id='lhAttendanceClean92Css';s.textContent=`
      #page-attendance .attendance-table td:nth-child(2){min-width:280px!important;}
      #page-attendance .attendance-table td:nth-child(3){min-width:150px!important;overflow:visible!important;}
      #page-attendance .attendance-table select.attendance-status{display:block!important;width:100%!important;min-width:135px!important;height:40px!important;padding:6px 28px 6px 9px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#172033!important;font-size:14px!important;line-height:1.2!important;cursor:pointer!important;pointer-events:auto!important;touch-action:auto!important;transition:none!important;animation:none!important;-webkit-appearance:menulist-button!important;appearance:auto!important;}
      @media(max-width:680px){#page-attendance .attendance-table td:nth-child(2){min-width:220px!important;}#page-attendance .attendance-table select.attendance-status{min-width:130px!important;height:42px!important;font-size:15px!important;}}
    `;document.head.appendChild(s);
  }
  function boot(){css();bind();normalize();}
  window.LHAttendanceFinal={normalize,summary,boot};
  window.renderAttendanceSummary=summary;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
