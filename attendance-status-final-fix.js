/* ATTENDANCE STATUS CLEAN 7.0
   One native select per student. No MutationObserver, no capture interception,
   no DOM replacement after render. Main script.js remains the source of truth.
*/
(function(){
  'use strict';
  if(window.__LH_ATTENDANCE_CLEAN_70__) return;
  window.__LH_ATTENDANCE_CLEAN_70__ = true;

  function summary(){
    let present=0, excused=0, absent=0;
    document.querySelectorAll('#attendanceTableBody select.attendance-status').forEach(function(s){
      if(s.value==='present') present++;
      else if(s.value==='excused') excused++;
      else if(s.value==='absent') absent++;
    });
    [['attendancePresent',present],['attendancePresentCount',present],['attendanceExcused',excused],['attendanceExcusedCount',excused],['attendanceAbsent',absent],['attendanceAbsentCount',absent]].forEach(function(x){
      var el=document.getElementById(x[0]); if(el) el.textContent=String(x[1]);
    });
  }

  function bind(){
    if(document.__lhAttendanceClean70Bound) return;
    document.__lhAttendanceClean70Bound=true;
    document.addEventListener('change',function(e){
      if(e.target && e.target.matches && e.target.matches('#attendanceTableBody select.attendance-status')) summary();
    },false);
    var save=document.getElementById('saveAttendance');
    if(save){
      save.addEventListener('click',function(){
        setTimeout(summary,0);
      },false);
    }
  }

  function css(){
    if(document.getElementById('lhAttendanceClean70Css')) return;
    var s=document.createElement('style');
    s.id='lhAttendanceClean70Css';
    s.textContent=''
      +'#page-attendance .attendance-table select.attendance-status{'
      +'display:block!important;box-sizing:border-box!important;width:100%!important;'
      +'min-width:150px!important;min-height:42px!important;padding:8px 34px 8px 10px!important;'
      +'border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;'
      +'color:#172033!important;font-size:15px!important;line-height:1.25!important;'
      +'cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important;'
      +'}'
      +'#page-attendance .attendance-table td:nth-child(3){min-width:165px!important;overflow:visible!important;position:relative!important;z-index:2!important;}'
      +'#page-attendance .attendance-table{min-width:680px!important;}';
    document.head.appendChild(s);
  }

  function boot(){css();bind();setTimeout(summary,0);}
  window.LHAttendanceFinal={summary,boot};
  window.renderAttendanceSummary=summary;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
